// Stripe calls this address after every donation (a "webhook").
// This is the dependable place to record a donation: it runs even if the
// donor closes the browser right after paying.
//
// Set up in Stripe → Developers → Webhooks → Add destination:
//   URL:    https://<your site>/api/stripe-webhook
//   Events: checkout.session.completed
//           checkout.session.async_payment_succeeded
//           checkout.session.async_payment_failed
// Then copy the signing secret (whsec_…) into Netlify as STRIPE_WEBHOOK_SECRET.

import { stripeClient, json } from "../lib/stripe.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  let stripe;
  try {
    stripe = stripeClient();
    if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  } catch (e) {
    console.error(e.message);
    return json({ error: "Not configured" }, 500);
  }

  // Check the signature, so only Stripe can call this.
  let event;
  try {
    const raw = await req.text();
    event = await stripe.webhooks.constructEventAsync(raw, req.headers.get("stripe-signature") || "", secret);
  } catch (e) {
    console.error("Webhook signature check failed:", e.message);
    return json({ error: "Bad signature" }, 400);
  }

  const s = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      // "completed" can arrive while a bank payment is still pending; record only paid ones.
      if (s.payment_status === "paid") recordDonation(event, s);
      else console.log(`PENDING order=${s.client_reference_id} session=${s.id}`);
      break;
    case "checkout.session.async_payment_failed":
      console.log(`FAILED order=${s.client_reference_id} session=${s.id}`);
      break;
    default:
      break;
  }

  // Answer quickly so Stripe knows it was received (it retries otherwise).
  return json({ received: true });
};

// One donation, paid. Stripe may send the same event more than once,
// so anything that stores it must ignore a repeat of the same order_no.
function recordDonation(event, s) {
  const md = s.metadata || {};
  const amount = ((s.amount_total || 0) / 100).toFixed(2);
  console.log(
    `DONATION PAID order=${md.order_no || s.client_reference_id} amount=${amount} ${String(s.currency).toUpperCase()}` +
      ` project=${md.project_code || ""} event=${event.id} payment=${s.payment_intent}`
  );
  // NEXT STEP: send this donation to the Access database here
  // (donor name, email and address are in s.customer_details).
}

export const config = { path: "/api/stripe-webhook" };
