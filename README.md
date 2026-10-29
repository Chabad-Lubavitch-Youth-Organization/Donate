# Chabad Lubavitch Youth Organization – Donation page

Online donation page with a project choice and an English/French toggle.
Cards are processed by **Moneris Checkout**; this site never sees card numbers.

## What's in here

| File / folder | What it is |
|---|---|
| `public/index.html` | The donation page |
| `public/app.js` | Page behaviour and **all the wording in English and French** |
| `public/projects.js` | **The project list – edit this to add or rename projects** |
| `public/styles.css` | Colours and layout |
| `public/logo.png` | Logo |
| `netlify/functions/preload.mjs` | Secure server step that opens the Moneris card form |
| `netlify/functions/receipt.mjs` | Secure server step that confirms the payment with Moneris |
| `netlify/lib/moneris.mjs` | Shared Moneris settings |
| `netlify.toml` | Netlify settings |

## Moneris settings (Netlify → Site configuration → Environment variables)

| Name | Value |
|---|---|
| `MONERIS_STORE_ID` | Store ID (Moneris → Admin → Store Settings) |
| `MONERIS_API_TOKEN` | API token (Moneris → Admin → Store Settings) – **secret** |
| `MONERIS_CHECKOUT_ID` | Checkout ID (Moneris → Admin → Moneris Checkout Config) |
| `MONERIS_ENV` | `qa` for a Moneris test store, `prod` for real donations |

After adding or changing these, go to **Deploys → Trigger deploy** so the site picks them up.
The secret values live only in Netlify, never in these files.

## Editing projects

1. On GitHub, open `public/projects.js` and click the pencil icon.
2. Copy a line, change the code and names, keep the comma at the end.
3. Click **Commit changes**. The live page updates in about a minute.

Keep the same `code` for a project from year to year (for example `CHAN`). Each donation's
reference looks like `CHAN-20261128-K7Q2ZX`: project code, date, random letters.
That reference appears as the order number in Moneris reports.

A link with `?project=CHAN` opens the page with that project pre-selected,
and `?lang=fr` opens it in French – useful for project-specific QR codes.

## Where to see donations

- **Moneris** → Reports → Transactions (order number starts with the project code).
- **Netlify** → Logs → Functions → `receipt` shows one line per donation (no card details).
