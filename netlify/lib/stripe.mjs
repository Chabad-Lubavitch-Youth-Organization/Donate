// Shared helpers for talking to Stripe.
// The key comes from a Netlify environment variable (Site configuration → Environment variables):
//   STRIPE_SECRET_KEY      a restricted key (rk_test_… / rk_live_…) – secret!
//   STRIPE_WEBHOOK_SECRET  the signing secret of the webhook (whsec_…) – secret!
// Test keys (rk_test_…) take test donations only; live keys (rk_live_…) take real ones.

import Stripe from "stripe";

export const API_VERSION = "2026-10-28.endive";

let client = null;

export function stripeClient() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  if (!client) client = new Stripe(key, { apiVersion: API_VERSION, maxNetworkRetries: 2, timeout: 20000 });
  return client;
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
