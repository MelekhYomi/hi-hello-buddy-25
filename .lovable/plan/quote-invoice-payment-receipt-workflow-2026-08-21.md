# Quote → Invoice → Payment → Receipt workflow

Yes, I've got the journey. Here's how I'd build it.

## The user journey on the site

1. **Build a quote** — On the services (and shop) sections, each item gets an "Add to quote" action. A floating **Quote Builder** panel shows every selected service/product, quantity, per-item price (or "on request" for custom scoping), and a live running total. Adding, editing or removing items instantly re-totals — no page reload.
2. **See the quote** — Clicking *Get my quote* asks for name, email, WhatsApp number, company, project notes, and **preferred contact method** (call / WhatsApp / email). It then shows a formatted quote document on screen with a quote number (e.g. `CI-Q-2026-0042`), validity date, itemised lines, subtotal, and total.
3. **Proceed** — From the quote screen the user clicks *Proceed to discuss*. This locks the quote, records the request, and triggers:
   - an **invoice** generated from the quote (invoice number, due date, deposit amount, bank/Paystack payment options),
   - a message to the user with the invoice plus how to reach the office and a note that an admin will contact them via their chosen channel.
4. **Pay** — The invoice screen and message both link to a hosted payment page where the user pays either the **deposit** (default 50%, admin-configurable per invoice) or the **full amount** via Paystack. Bank-transfer / manual payment is also supported: the user marks it as paid and an admin confirms.
5. **Receipt** — Every confirmed payment (Paystack webhook or admin confirmation) creates a **receipt** with its own number, sent to the user's email and available as a WhatsApp-ready message and printable page. Partial payments produce a deposit receipt and show the outstanding balance.
6. **Job complete → delivery** — Invoices carry a fulfilment status (`awaiting payment → in production → ready → delivered`). When an admin marks a job *ready*, the user is contacted for delivery/pickup. The full delivery flow comes in the next round, as you said.

## Admin side

A new **Quotes & Invoices** area in the admin dashboard:
- Quote requests list (new / discussing / converted / declined), with the itemised quote and the customer's preferred contact channel.
- One-click **convert quote → invoice**, with editable line items, discount, deposit %, due date.
- Invoice list with payment status, amount paid, balance, and "record manual payment" (creates a receipt).
- Receipts list, printable/PDF-ready view.
- Settings: deposit default %, quote validity days, bank transfer details, invoice/receipt footer note, terms text.

## Customer portal

`/account/quotes` and `/account/invoices` — a signed-in customer sees their quotes, invoices, balances, and receipts. Guests get a secure link (token in the URL) so they can view and pay without an account.

## Emails and WhatsApp

- **WhatsApp** works immediately: pre-filled message with the quote/invoice/receipt link to your office number, same mechanism as the existing WhatsApp order flow.
- **Email** needs a verified sender domain for the project before invoices/receipts can be sent from a C Imperium address. I'll build the email templates and the send hooks now; they stay queued/disabled until the domain is set up, and I'll prompt you to complete that step so nothing silently fails.

## Technical notes

- New tables: `quotes`, `quote_items`, `invoices`, `invoice_items`, `payments`, `receipts`, plus `public_token` columns for guest access. RLS: owner-or-admin read, admin write, anon insert only for quote requests; grants issued per table.
- Numbering via a Postgres sequence-backed function so quote/invoice/receipt numbers never collide.
- Money stored in kobo as integers; all display uses the existing `formatNaira` helper.
- Server functions in `src/lib/quotes.functions.ts` and `src/lib/invoices.functions.ts` handle conversion, totals recalculation, and payment recording; totals are always recomputed server-side, never trusted from the client.
- Paystack reuses the existing init/verify functions and webhook; the webhook additionally settles invoices and creates receipts idempotently.
- Quote selection state lives in a `QuoteProvider` (localStorage-backed, same pattern as the cart) so a visitor never loses their selections.
- New routes: `/quote` (builder + preview), `/quote/$number`, `/invoice/$number`, `/receipt/$number`, all with `noindex`.

## Build order

1. Schema + RLS + numbering + settings keys.
2. Quote builder UI (services + shop) with live totals and quote preview.
3. Quote submission, guest tokens, WhatsApp handoff.
4. Invoice generation, payment page (deposit / full), Paystack + manual payment.
5. Receipts, portal pages, admin Quotes & Invoices tabs.
6. Email templates wired behind the sender-domain setup.
