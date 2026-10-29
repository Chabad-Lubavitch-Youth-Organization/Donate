// Checks the result of a donation with Moneris after the donor finishes.
// The browser sends { ticket }; this function asks Moneris directly whether the
// payment was approved, so the page never has to trust what the browser says.

import { monerisConfig, callMoneris, json } from "../lib/moneris.mjs";

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
  const ticket = String(body.ticket || "");
  if (!/^[A-Za-z0-9]{10,80}$/.test(ticket)) return json({ error: "Invalid ticket." }, 400);

  try {
    const data = await callMoneris(cfg, {
      store_id: cfg.storeId,
      api_token: cfg.apiToken,
      checkout_id: cfg.checkoutId,
      ticket,
      environment: cfg.env,
      action: "receipt",
    });

    const r = (data && data.response) || {};
    const receipt = r.receipt || {};
    const cc = receipt.cc || {};
    const cust = (r.request && r.request.cust_info) || {};
    const approved =
      String(r.success) === "true" &&
      (String(receipt.result).toLowerCase() === "a" || String(cc.result).toLowerCase() === "a");

    const result = {
      approved,
      orderNo: cc.order_no || "",
      amount: cc.amount || "",
      reference: cc.reference_no || "",
      approvalCode: cc.approval_code || "",
      date: cc.transaction_date_time || "",
      firstName: cust.first_name || "",
    };

    // One line per donation in the Netlify function log (no card details).
    console.log(
      `DONATION ${approved ? "APPROVED" : "NOT APPROVED"} order=${result.orderNo} amount=${result.amount} ref=${result.reference}`
    );

    return json(result);
  } catch (e) {
    console.error("Moneris receipt error:", e.message);
    return json({ error: "Could not confirm the payment." }, 502);
  }
};

export const config = { path: "/api/receipt" };
