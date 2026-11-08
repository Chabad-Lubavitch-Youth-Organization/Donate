# Chabad Lubavitch Youth Organization – Donation page

Online donation page with a project choice and English / French / Hebrew (עב) language buttons.
Payments are processed on **Stripe's secure payment page (Stripe Checkout)**; this site never sees card numbers.

## What's in here

| File / folder | What it is |
|---|---|
| `public/index.html` | The donation page |
| `public/app.js` | Page behaviour and **all the wording in English and French** |
| `public/projects.js` | **The project list – edit this to add or rename projects** |
| `public/styles.css` | Colours and layout |
| `public/logo.png` | Logo |
| `netlify/functions/checkout.mjs` | Secure server step that opens Stripe's payment page |
| `netlify/functions/session.mjs` | Shows the donor the result when they come back from Stripe |
| `netlify/functions/stripe-webhook.mjs` | Stripe calls this after each donation – where donations get recorded |
| `netlify/lib/stripe.mjs` | Shared Stripe settings |
| `package.json` | Tells Netlify to install Stripe's library |
| `netlify.toml` | Netlify settings |

## Stripe settings (Netlify → Site configuration → Environment variables)

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | A **restricted key** (`rk_test_…` while testing, `rk_live_…` for real donations) – **secret** |
| `STRIPE_WEBHOOK_SECRET` | The webhook's signing secret (`whsec_…`) – **secret** |

**Creating the restricted key** (Stripe → Developers → API keys → Create restricted key):
give it **Write** on *Checkout Sessions* and *Customers*, everything else *None*.

**Creating the webhook** (Stripe → Developers → Webhooks → Add destination):
URL `https://<your site>/api/stripe-webhook`, events `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.

Test keys and the test webhook only take test donations. For real donations, create a
live restricted key and a live webhook and replace both values.

After adding or changing these, go to **Deploys → Trigger deploy** so the site picks them up.
The secret values live only in Netlify, never in these files.

## Editing projects

1. On GitHub, open `public/projects.js` and click the pencil icon.
2. Copy a line, change the code and the English (`en`), French (`fr`) and Hebrew (`he`) names, keep the comma at the end.
3. Click **Commit changes**. The live page updates in about a minute.

**Order of the list:** at the top of `projects.js`, `SORT = "year"` shows the projects in the order they're
written (the Jewish year). Change it to `SORT = "alphabet"` to sort them alphabetically in each language.
The first project (General Donation) always stays on top and "Other" at the bottom.

Keep the same `code` for a project from year to year (for example `CHAN`). Each donation's
reference looks like `CHAN-20261128-K7Q2ZX`: project code, date, random letters.
That reference is saved on the payment in Stripe (`order_no`), together with the project,
dedication and language.

A link with `?project=CHAN` opens the page with that project pre-selected,
`?lang=fr` opens it in French and `?lang=he` in Hebrew – useful for project-specific QR codes.

## Where to see donations

- **Stripe** → Payments. Each payment's description reads like `Donation - Chanukah - In memory of …`,
  and its details show the donor's name, email, address and the `order_no` / `project_code`.
- **Stripe** → Payments → Export gives a spreadsheet (include the metadata columns) for Access.
- **Netlify** → Logs → Functions → `stripe-webhook` shows one `DONATION PAID` line per donation.

## Testing

With test keys, pay with card `4242 4242 4242 4242`, any future date, any CVC.
`4000 0000 0000 0002` shows a declined card.
