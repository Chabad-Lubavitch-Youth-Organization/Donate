// Tells the thank-you page how a donation went.
// The browser sends ?id=cs_…; this function asks Stripe directly,
// so the page never has to trust what the browser says.
// (Recording the donation is done by stripe-webhook.mjs, not here:
// a donor may close the browser before this page loads.)

import { stripeClient, json } from "../lib/stripe.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return json({ error: "Invalid session." }, 400);

  let stripe;
  try {
    stripe = stripeClient();
  } catch (e) {
    console.error(e.message);
    return json({ error: "Donations are not configured yet." }, 500);
  }

  try {
    const s = await stripe.checkout.sessions.retrieve(id);
    const cd = s.customer_details || {};
    const fullName = cd.individual_name || cd.name || "";
    const md = s.metadata || {};

    // paid = money received; processing = a bank payment still on its way
    const status =
      s.payment_status === "paid" ? "paid" : s.status === "complete" ? "processing" : "unpaid";

    return json({
      status,
      orderNo: md.order_no || s.client_reference_id || "",
      amount: (s.amount_total || 0) / 100,
      projectCode: md.project_code || "",
      otherText: md.other_text || "",
      firstName: fullName.split(" ")[0] || "",
    });
  } catch (e) {
    console.error("Stripe session error:", e.type || "", e.message);
    return json({ error: "Could not confirm the payment." }, 502);
  }
};

export const config = { path: "/api/session" };
