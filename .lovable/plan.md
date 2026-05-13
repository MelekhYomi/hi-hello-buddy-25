# Build Plan

## Phase A — Quick fixes (immediate)
1. **Book button bug**: hash links from `<Link to="/" hash="book">` don't scroll when already on `/`. Add a click handler that scrolls to `#book`. Apply to header nav + hero CTAs.
2. **Logo brightness**: brighten the header logo with a subtle drop-shadow + slight bg pill so it pops on the dark blur header.
3. **Footer logo clickable**: wrap the C Imperium footer mark in a `<Link to="/">`.
4. **Trim tagline**: change `Branding Agency · Jos, Nigeria` → `Branding Agency`.

## Phase B — Staff vs customer auth split
- Move admin/staff entry to `/staff-login` (not in public nav, not linked anywhere visible).
- `/login` and `/signup` remain for customers.
- Both use the same Supabase auth; the `user_roles` table already differentiates `admin` / `customer`.
- `/staff-login` shows a clean "Staff Access" UI; on success, if not admin → sign out + error.
- Add `staff` as a new role in the `app_role` enum so non-admin staff (order managers, content) can also log in to `/admin`. Update RLS / `has_role` checks accordingly where appropriate.

## Phase C — Products section + e-commerce
**Position:** between Hero and Services.

**Database (new tables):**
- `products` (id, slug, title, description, price, compare_at_price, currency='NGN', images[], category, stock, is_active, is_featured, display_order)
- `product_categories` (id, name, slug, display_order)
- `orders` (id, user_id nullable, status, subtotal, shipping_fee, total, currency, payment_provider, payment_status, payment_ref, delivery_method, delivery_status, customer_name, customer_email, customer_phone, delivery_address, city, state, country, notes, created_at)
- `order_items` (id, order_id, product_id, title_snapshot, price_snapshot, quantity)
- `delivery_zones` (id, name, fee, free_above_amount, eta_days)
- RLS: anyone reads active products; anyone inserts orders; users view own orders; admins/staff manage all.

**Frontend:**
- `ProductsSection` on home (carousel of featured products).
- `/shop` route — full grid with category filters.
- `/shop/$slug` — product detail page.
- `CartContext` (localStorage-persisted) + cart drawer.
- `/checkout` — address form, delivery method selector (free / paid → pay before vs pay on delivery), order summary.
- Payment: enable Paddle or Stripe via Lovable Payments (see Phase E).

**Admin:**
- New tabs in `/admin`: Products (CRUD), Orders (view + update status, mark paid/delivered), Categories, Delivery Zones.

## Phase D — Visitor tracking + lead capture
**Anonymous analytics (no PII):**
- `visitor_events` table: id, anon_id (cookie/localStorage uuid), session_id, event_type (pageview/click/scroll/section_view), path, target, metadata jsonb, user_agent, referrer, created_at.
- Tiny client tracker hooked to router + IntersectionObserver for section views.
- RLS: only admins/staff read; anyone inserts.

**Lead capture popup:**
- `leads` table: id, name, email, phone, source ('exit_intent'/'scroll'/'offer'), interest, anon_id, created_at.
- Popup triggers: exit-intent (mouse leaves top) OR 60% scroll OR 30s timer — whichever first, once per 7 days.
- Offer copy: "Get 10% off your first project — drop your details."
- Admin sees leads in `/admin → Leads` with export to CSV.

## Phase E — Payments enablement
- Run `recommend_payment_provider` to check Paddle eligibility for physical-goods / branding products.
- If physical goods → Shopify; if mixed/digital-leaning → Stripe; otherwise Paddle.
- Confirm choice with you, then enable. Requires **Pro plan**.
- Wire checkout to provider after enable.

## Order of execution
1. Phase A (10 min, no DB)
2. Phase B (1 migration: add `staff` role + `/staff-login` route)
3. Phase D (1 migration: visitor_events + leads + tracker + popup)
4. Phase C structural (1 large migration: products/orders/cart/checkout UI without payment)
5. Phase E (recommend → enable → wire checkout)
6. Phase C admin panels

## Notes
- Phase E (payments) needs Pro plan + your confirmation of provider before I can run `enable_*_payments`.
- All RLS policies use `has_role(auth.uid(), 'admin')` or `has_role(auth.uid(), 'staff')`.
- Cart persists to localStorage so guests can shop without account; checkout creates order with `user_id = null` if guest.
