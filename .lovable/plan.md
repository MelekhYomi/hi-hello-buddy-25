# Build Plan — C Imperium: Paystack, Full Admin CMS, Client Portal, Deploy Hardening

This is a large multi-phase build. I'll execute in order, ship each phase, and confirm before moving on.

---

## Phase A — Deploy hardening (Netlify + Vercel + GitHub)

Goal: zero deploy errors from either host. Project is built for Cloudflare Workers (SSR + server functions); Netlify/Vercel will run as **SPA fallback** (server functions won't execute there — only Lovable Cloud / Workers does). I'll make that explicit and safe.

- Verify `netlify.toml` (already exists, SPA redirect set) — add `[build.environment] NODE_VERSION = "20"`.
- Replace `vercel.json` with a clean SPA rewrite config + Node 20.
- Add `public/_redirects` fallback (already present — verify `/* /index.html 200`).
- Add `DEPLOYMENT.md` at repo root explaining: Lovable Publish = full SSR; Netlify/Vercel = SPA only (server fns, sitemap, /api/* routes won't run there). Lists env vars needed.
- Add `.nvmrc` (`20`) so GitHub-driven deploys pin Node.
- Confirm `package.json` build command works headless.

---

## Phase B — Paystack integration (test + live, admin-controlled)

- DB migration: extend `site_settings` seeds — `paystack` key with `{ public_key_test, public_key_live, mode: 'test'|'live' }`. **Secret keys NEVER in DB** — kept in Lovable Cloud secrets.
- Add secrets: `PAYSTACK_SECRET_KEY_TEST`, `PAYSTACK_SECRET_KEY_LIVE`, `PAYSTACK_WEBHOOK_SECRET` via `secrets--add_secret` (user enters values).
- Server fn `initPaystackTransaction` (`src/lib/paystack.functions.ts`) — creates Paystack transaction, returns `authorization_url`. Reads mode from `site_settings`, picks the right secret key.
- Server fn `verifyPaystackTransaction` — verifies ref, updates `orders.payment_status='paid'`, decrements stock.
- Public webhook route `src/routes/api/public/paystack-webhook.ts` — HMAC-SHA512 signature verify, idempotent order update.
- Wire `checkout-pay.tsx` to call `initPaystackTransaction` → redirect to `authorization_url`.
- `order-success.tsx` calls `verifyPaystackTransaction` with `?reference=...` from Paystack callback.

---

## Phase C — Full Admin CMS expansion

Extend `src/routes/_authenticated/_admin/admin.tsx` with tabs (each = CRUD form backed by existing tables):

1. **Services** — title, description, icon, price_min/max, features[], display_order, is_active.
2. **Products** — title, slug, description, price, compare_at_price, images[] (upload to `site-media`), stock, category, is_featured, is_active.
3. **Categories** — name, slug, order.
4. **Case Studies / Projects** — client, industry, title, slug, cover, challenge, solution, results, gallery[], is_featured.
5. **Testimonials** — name, role, company, quote, rating, avatar, order.
6. **Studio Images** — upload + reorder + toggle active (powers About section gallery).
7. **Delivery Zones** — name, fee, eta, free_above, is_active.
8. **Blog** — (already done — keep).
9. **Settings expansion**:
   - WhatsApp number + bot link template
   - Paystack: mode toggle (test/live) + public keys (writeable). Secret keys: read-only status indicator ("configured ✓" / "missing — add in Cloud Secrets").
   - Contact email, socials JSON
   - Hero copy JSON
   - Process steps (editable array)
   - Why-us reasons (editable array)
   - About copy + values list
   - Footer copy
10. **Orders** tab — view all orders, update `status` / `delivery_status` / mark paid.
11. **Bookings** tab — view consultation bookings, status update.
12. **Contacts / Leads** — read inbox, mark read.

Storage: create public `site-media` bucket with RLS (anyone read, admin/staff write). Image picker component reused everywhere.

Frontend sections (Hero, Process, Why, About, Footer) rewired to read from `site_settings` with sensible fallbacks so nothing breaks if a key is missing.

---

## Phase D — Auth: admin & client portal

- **Admin login hardening**: existing `/staff-login` works. Add password-reset flow (already have `/reset-password` route — wire "Forgot password?" link).
- **Email OTP** for admin: enable Supabase magic-link as backup admin sign-in (`/staff-login` adds "Email me a sign-in link"). SMS/WhatsApp OTP requires a paid Twilio/Termii setup — I'll **note** this and leave a config slot in admin → settings, but won't wire third-party SMS until you supply credentials.
- **Client portal** (new routes under `_authenticated/`):
  - `/account` — profile (display name, phone, address)
  - `/account/orders` — order history (already partly via `orders` RLS scoped to `user_id`)
  - `/account/bookings` — past consultations
  - Header: when logged-in customer, show "My Account" instead of "Sign in"
- **Signup flow** at `/signup` already exists — add email verification copy + Google OAuth button (uses Lovable broker).
- Configure Google social auth via `supabase--configure_social_auth` once you confirm.

---

## Phase E — End-to-end QA

- Run security scan + Supabase linter, fix any new warnings from migrations.
- Click-test: cart → checkout → Paystack test card → success page → order in admin.
- WhatsApp checkout path still works (reads number from settings).
- Mobile nav + PWA install verified.
- Blog nav verified.
- Cursor visible everywhere including admin.

---

## What I need from you (blocking items)

1. **Paystack keys** — when I reach Phase B, I'll trigger the secrets dialog for `PAYSTACK_SECRET_KEY_TEST`, `PAYSTACK_SECRET_KEY_LIVE`, `PAYSTACK_WEBHOOK_SECRET`. Public keys (`pk_test_…`, `pk_live_…`) you can paste into Admin → Settings after deploy.
2. **Google OAuth** — confirm you want it enabled for customer signup (recommended).
3. **SMS/WhatsApp OTP** — confirm you want this; if yes I'll add a Termii or Twilio connector slot. Otherwise email-link OTP only for now.
4. **Studio gallery photos** — you said you'd upload yourself; the new admin Studio Images tab will let you do that.

---

## Execution order

I'll ship in this sequence, posting one update per phase so you can sanity-check:

1. **Phase A** (deploy hardening) — small, fast.
2. **Phase C migrations + storage bucket** (no breaking changes; everything reads with fallbacks).
3. **Phase C admin UI** (tabs added incrementally).
4. **Phase B** (Paystack — needs you to confirm + secrets).
5. **Phase D** (client portal + Google OAuth).
6. **Phase E** (QA pass + deploy smoke test).

Reply **"approve"** to start with Phase A, or call out anything to change first.