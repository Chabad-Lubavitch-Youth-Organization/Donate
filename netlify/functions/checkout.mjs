// Starts a Stripe Checkout session for one donation.
// The browser sends { amount, project, otherText, lang, dedType, dedName };
// this function checks everything again, adds the secret Stripe key
// (stored in Netlify, never in the page) and returns the address of
// Stripe's secure payment page. The browser then goes there.

import { randomInt } from "node:crypto";
import projects from "../../public/projects.js";
import { stripeClient, json } from "../lib/stripe.mjs";

const MIN_AMOUNT = 5;
const MAX_AMOUNT = 50000;

// Labels this page's sessions in the Stripe Dashboard.
const INTEGRATION_ID = "clyo-donate-page-QXRMBTKA";

const DEDICATIONS = {
  MEM: { en: "In memory of", fr: "À la mémoire de", he: "לעילוי נשמת" },
  HON: { en: "In honour of", fr: "En l'honneur de", he: "לכבוד" },
  MER: { en: "In the merit of", fr: "Au mérite de", he: "לזכות" },
  REC: { en: "For the recovery of", fr: "Pour la guérison de", he: "לרפואת" },
};

// Plain, tidy text for names and descriptions.
const clean = (text, max) =>
  String(text || "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

// Order number: PROJECT-YYYYMMDD-RANDOM, e.g. CHAN-20261128-K7Q2ZX
// (date in Montreal time, so evening donations get the right day)
function orderNumber(code) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" })
    .format(new Date())
    .replace(/-/g, "");
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += letters[randomInt(letters.length)];
  return `${code}-${ymd}-${rand}`;
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let stripe;
  try {
    stripe = stripeClient();
  } catch (e) {
    console.error(e.message);
    return json({ error: "Donations are not configured yet." }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Amount: a number between the limits, in cents
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return json({ error: `Amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}.` }, 400);
  }
  const cents = Math.round(amount * 100);

  const lang = ["fr", "he"].includes(body.lang) ? body.lang : "en";

  // Project: one of the codes in projects.js, or OTHER with the donor's own description
  let project = projects.find((p) => p.code === String(body.project || ""));
  let otherText = "";
  if (body.project === "OTHER") {
    otherText = clean(body.otherText, 60);
    if (!/\p{L}/u.test(otherText)) return json({ error: "Please describe the purpose." }, 400);
    project = { code: "OTHER", en: `Other - ${otherText}`, fr: `Autre - ${otherText}`, he: `אחר - ${otherText}` };
  }
  if (!project) return json({ error: "Please choose a project." }, 400);

  // Optional dedication, e.g. "In memory of Sarah bat Moshe"
  let dedication = "";
  let dedicationShown = "";
  const ded = DEDICATIONS[body.dedType];
  if (ded) {
    const name = clean(body.dedName, 80);
    if (!name) return json({ error: "Please enter the name for the dedication." }, 400);
    dedication = `${ded.en} ${name}`;
    dedicationShown = `${ded[lang]} ${name}`;
  }

  const orderNo = orderNumber(project.code);
  const projectEn = clean(project.en, 100) || project.code;
  const description = ["Donation", projectEn, dedication].filter(Boolean).join(" - ").slice(0, 300);

  // Saved with the donation in Stripe, for reports and the Access import.
  const metadata = {
    order_no: orderNo,
    project_code: project.code,
    project: projectEn,
    other_text: otherText,
    dedication,
    lang,
  };

  // Where Stripe sends the donor back to (this same site).
  const site = new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      origin_context: "web",
      integration_identifier: INTEGRATION_ID,
      locale: lang,
      client_reference_id: orderNo,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: cents,
            product_data: {
              name: {
                fr: `Don – ${project.fr || projectEn}`,
                he: `תרומה – ${project.he || projectEn}`,
              }[lang] || `Donation – ${projectEn}`,
              ...(dedicationShown ? { description: dedicationShown } : {}),
            },
          },
        },
      ],
      // Name and address are needed for the tax receipt.
      name_collection: { individual: { enabled: true, optional: false } },
      billing_address_collection: "required",
      customer_creation: "always",
      // Keep the gift in Canadian dollars: tax receipts are issued in CAD.
      adaptive_pricing: { enabled: false },
      metadata,
      payment_intent_data: { description, metadata },
      success_url: `${site}/?lang=${lang}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?lang=${lang}&project=${encodeURIComponent(project.code)}&cancelled=1`,
    }, {
      idempotencyKey: `checkout-${orderNo}`,
    });

    console.log(`STARTED order=${orderNo} amount=${amount.toFixed(2)} project=${projectEn}`);
    return json({ url: session.url, orderNo });
  } catch (e) {
    console.error("Stripe checkout error:", e.type || "", e.code || "", e.message);
    return json({ error: "The payment page could not be opened. Please try again." }, 502);
  }
};

export const config = { path: "/api/checkout" };
