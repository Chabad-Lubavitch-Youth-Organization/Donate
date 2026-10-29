// Shared helpers for talking to Moneris Checkout.
// Credentials come from Netlify environment variables (Site settings → Environment variables):
//   MONERIS_STORE_ID     your Store ID
//   MONERIS_API_TOKEN    your API token (secret!)
//   MONERIS_CHECKOUT_ID  the Checkout ID from Admin → Moneris Checkout Config
//   MONERIS_ENV          "qa" for testing, "prod" for real donations

const URLS = {
  qa: "https://gatewayt.moneris.com/chktv2/request/request.php",
  prod: "https://gateway.moneris.com/chktv2/request/request.php",
};

export function monerisConfig() {
  const env = (process.env.MONERIS_ENV || "qa").trim().toLowerCase();
  const cfg = {
    env: env === "prod" ? "prod" : "qa",
    storeId: (process.env.MONERIS_STORE_ID || "").trim(),
    apiToken: (process.env.MONERIS_API_TOKEN || "").trim(),
    checkoutId: (process.env.MONERIS_CHECKOUT_ID || "").trim(),
  };
  if (!cfg.storeId || !cfg.apiToken || !cfg.checkoutId) {
    throw new Error("Missing MONERIS_STORE_ID, MONERIS_API_TOKEN or MONERIS_CHECKOUT_ID");
  }
  return cfg;
}

export async function callMoneris(cfg, payload) {
  const res = await fetch(URLS[cfg.env], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Moneris HTTP ${res.status}`);
  return res.json();
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
