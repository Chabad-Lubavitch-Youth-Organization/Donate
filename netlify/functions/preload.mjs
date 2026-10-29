// Starts a Moneris Checkout session.
// The browser sends { amount, project, lang }; this function adds the secret
// Moneris credentials (stored in Netlify environment variables, never in the page)
// and asks Moneris for a one-time "ticket" that opens the card form.

import projects from "../../public/projects.js";
import { monerisConfig, callMoneris, json } from "../lib/moneris.mjs";

const MIN_AMOUNT = 5;

const DEDICATIONS = {
  MEM: "In memory of",
  HON: "In honour of",
  MER: "In the merit of",
  REC: "For the recovery of",
};

// Moneris accepts only plain characters in these fields.
const plain = (text, max) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 _\-:.@]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const MAX_AMOUNT = 50000;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let cfg;
  try {
    cfg = monerisConfig();
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

  // Amount: a number between the limits, rounded to cents
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return json({ error: `Amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}.` }, 400);
  }

  // Project: one of the codes in projects.js, or OTHER with the donor's own description
  let project = projects.find((p) => p.code === String(body.project || ""));
  if (body.project === "OTHER") {
    const text = plain(body.otherText, 40);
    if (!/[A-Za-z]/.test(text)) return json({ error: "Please describe the purpose." }, 400);
    project = { code: "OTHER", en: `Other - ${text}` };
  }
  if (!project) return json({ error: "Please choose a project." }, 400);

  const lang = body.lang === "fr" ? "fr" : "en";

  // Optional dedication, e.g. "In memory of Sarah bat Moshe"
  let dedication = "";
  if (DEDICATIONS[body.dedType]) {
    const name = plain(body.dedName, 80);
    if (!name) return json({ error: "Please enter the name for the dedication." }, 400);
    dedication = `${DEDICATIONS[body.dedType]} ${name}`;
  }
  const projectName = plain(project.en, 50) || project.code;

  // Order number: PROJECT-YYYYMMDD-RANDOM, e.g. CHAN-20261128-K7Q2ZX
  // The project code at the front makes it easy to filter Moneris reports.
  // (date in Montreal time, so evening donations get the right day)
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" })
    .format(new Date())
    .replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
  const orderNo = `${project.code}-${ymd}-${rand}`;

  const payload = {
    store_id: cfg.storeId,
    api_token: cfg.apiToken,
    checkout_id: cfg.checkoutId,
    txn_total: amount.toFixed(2),
    environment: cfg.env,
    action: "preload",
    order_no: orderNo,
    // Cust ID shows on the Moneris receipt and reports: the project's English name.
    cust_id: projectName,
    language: lang,
    // One "cart" line describing the gift, shown in the Moneris order summary,
    // e.g. "Donation - Chanukah - In memory of Sarah bat Moshe"
    cart: {
      items: [
        {
          description: ["Donation", projectName, dedication].filter(Boolean).join(" - ").slice(0, 200),
          product_code: project.code,
          unit_cost: amount.toFixed(2),
          quantity: "1",
        },
      ],
      subtotal: amount.toFixed(2),
    },
  };

  try {
    const data = await callMoneris(cfg, payload);
    const r = data && data.response;
    if (r && String(r.success) === "true" && r.ticket) {
      console.log(`STARTED order=${orderNo} amount=${amount.toFixed(2)} project=${projectName}${dedication ? " dedication=" + dedication : ""}`);
      return json({ ticket: r.ticket, orderNo, mode: cfg.env });
    }
    console.error("Moneris preload failed:", JSON.stringify(r && r.error));
    return json({ error: "The payment page could not be opened. Please try again." }, 502);
  } catch (e) {
    console.error("Moneris preload error:", e.message);
    return json({ error: "The payment service is not responding. Please try again." }, 502);
  }
};

export const config = { path: "/api/preload" };
