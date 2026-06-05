
# C Imperium — Pre-deployment Build Plan

A lot of moving parts. I'll group the work into 5 phases so you can see (and stop) anything before we commit.

---

## Phase 1 — Content updates you can see immediately
(No backend changes; pure copy + image swaps so the site reflects the new agency-profile content.)

1. **Logo swap (top-left)** — use the new transparent PNG you just uploaded (`CIMPERIUM_jpg_1_-_Copy-removebg-preview.png`). Replace the existing mark, drop `mix-blend-mode`, no background, no rounding.
2. **Process section** — extend from 2 → 5 steps:
   `01 Discovery · 02 Proposal · 03 Agreement · 04 Execution · 05 Delivery` with your exact copy.
3. **Who We Are / About** — replace with the new "Brand Transformation company…" copy + brand promise: *"We help brands become impossible to ignore."*
4. **Core Values** — add "Character · Competence · Capacity" tagline + 7 values list.
5. **Services** — 6 cards: Brand Identity, Print & Packaging, Social Media, Web Development, Brand Strategy, Outdoor & Campaign.
6. **Pricing strip** — show the price overview block + the rush-job disclaimer.
7. **Partnership Terms** — new small section: Payment Structure, No-Refund, Revisions, Timelines & Rush Fees.
8. **Why C Imperium** — 5 numbered reasons.
9. **Testimonials** — seed with the Zenith Bank quote.
10. **Studio photo placeholder** — generate a Nigerian branding/print studio image and drop it where "Insert brand / studio photo here" currently sits.

---

## Phase 2 — Backend-managed content (the big one)

Make the following editable from the **Admin panel** (`/admin`), so non-devs can change copy/images without redeploying:

| Section | Model |
|---|---|
| Site settings (logo, nav labels, footer, socials, hero headline/sub/CTA, brand promise) | `site_settings` (single row, key/value JSON) |
| Who We Are / About | `about_content` |
| Studio gallery (slideshow under "Insert studio photo") | `studio_images` (ordered, image URLs) |
| Services (already in DB — extend admin CRUD) | `services` |
| Products / Collections (already in DB — extend admin CRUD) | `products` |
| Projects / Portfolio | `projects` (already exists — extend admin) |
| Client stories / Testimonials | `testimonials` (extend admin CRUD) |
| Branding insights (Blog) | `blog_posts` (new: title, slug, cover, body, published_at) |
| Process steps | `process_steps` |
| Core values | `core_values` |
| Pricing rows | `pricing_items` |
| Partnership terms | `partnership_terms` |
| Why-us reasons | `why_reasons` |
| Cart/payment/delivery config (Stripe keys, WhatsApp number, delivery zones & fees, COD toggle) | `commerce_settings` (admin-only read/write) |

Storage bucket `site-media` for image uploads from admin.

Each table: RLS — public read for published rows, admin/staff write via `has_role(auth.uid(),'admin'|'staff')`.

---

## Phase 3 — Cart, checkout & payments

1. Fix the RLS "new row violates row-level security policy for table orders" — ensure anon/auth insert policy matches the actual `user_id` column (null-friendly for guest checkout).
2. **Delivery methods** read from `commerce_settings.delivery_zones` (Lagos / Abuja / Jos / Nationwide with fees). Admin-editable.
3. **WhatsApp checkout** — compose order summary message → `https://wa.me/<configured number>?text=…`. Number editable from admin.
4. **Online payment** — wire real Stripe (test mode). Server route `/api/public/stripe-webhook` confirms `payment_status=paid`. Keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, mode toggle test/live) stored as secrets — admin toggles mode in `commerce_settings`; rotating actual keys still happens through the Secrets UI (keys can never be exposed to the browser).
5. Order confirmation email/WhatsApp link on success.

> Note: Lovable's seamless Stripe Payments integration is the recommended path here. Want me to enable that (no Stripe account/keys needed, test mode immediately) instead of BYOK? I'll ask before flipping the switch.

---

## Phase 4 — PWA, mobile nav, deployment

1. **Mobile nav** — current header collapses but has no menu. Add a flexbox hamburger drawer (anchors + cart + Book CTA + sign-in/dashboard).
2. **PWA install validation** — verify `manifest.webmanifest`, icons (192/512), `theme-color`, `apple-touch-icon`, `display:standalone`, `start_url=/`. Test "Add to Home Screen" on iOS/Android.
3. **Blog nav** — currently scrolls to `#blog` anchor. Verify the section exists and the in-page link works; add a `/blog` route only if you want full posts (Phase 2 builds the data model).
4. **Cursor** — already global; quick sanity pass on `/admin`, `/checkout`, `/login`.
5. **Netlify deployment smoke test** — build, check `_redirects`, manifest headers, run `vite build`, browse preview to verify no 404s on refresh, no SSR-only crashes.

---

## Phase 5 — Open questions before I start

1. **Stripe path** — seamless Lovable Payments (recommended, no account needed) OR your own Stripe keys (BYOK)?
2. **Blog** — full `/blog` + `/blog/:slug` routes now, or just an editable in-page section for this release?
3. **Studio gallery image** — should I AI-generate a Nigerian print-studio photo as the placeholder, or do you have real photos to upload?
4. **WhatsApp number** — what's the destination number for orders?

---

## Suggested execution order
Phase 1 (today) → Phase 5 answers → Phase 2 migrations + admin UI → Phase 3 cart/payments → Phase 4 PWA + deploy smoke test.

Approve to start with Phase 1 + the 4 questions above, or tell me to re-shape any phase.
