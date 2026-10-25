# C Imperium Branding — Backend Reference

This file is the single source of truth for everything backend on this project. Update it whenever you change the schema, RLS, auth, or env vars.

## Stack

- **Lovable Cloud** (Supabase under the hood) for Postgres, Auth, Storage.
- Client SDK: `@/integrations/supabase/client` (auto-generated, never edit).
- Types: `@/integrations/supabase/types` (auto-generated, never edit).
- Env vars (auto-managed via `.env`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`

## Auth

- **Email + password** signup is enabled with **auto-confirm ON** (no email verification needed for now).
- **HIBP** leaked-password check is ON.
- Google OAuth available via `lovable.auth.signInWithOAuth("google", ...)` (optional, not wired into UI in Phase 1).
- On signup, a database trigger creates a `profiles` row and assigns the `customer` role automatically.
- To make the first admin: run in the SQL editor
  ```sql
  INSERT INTO public.user_roles (user_id, role) VALUES ('<user-uuid>', 'admin');
  ```

## Tables

| Table | Purpose | Public read? | Public write? |
|---|---|---|---|
| `profiles` | Display name + phone, FK → `auth.users` | Own row only | Own row only |
| `user_roles` | `admin` / `customer` enum, separate from profiles | Own role only | Admin only |
| `services` | Agency offerings | Yes (active only) | Admin only |
| `case_studies` | Portfolio items | Yes | Admin only |
| `testimonials` | Client reviews | Yes (published only) | Admin only |
| `bookings` | Consultation requests | Own + admin | Anyone INSERT |
| `contacts` | Contact-form messages | Admin only | Anyone INSERT |

### Request-a-quote tables (billing)
| Table | Purpose | Access |
|---|---|---|
| `quotes` | Quote requests and their status/total | SELECT own or admin (RLS); server functions write with the service role |
| `quote_items` | One row per requested line (title snapshot, qty, price) | SELECT own or admin; service role writes |
| `invoices` / `payments` / `receipts` | Post-approval billing documents | Same pattern |
| `outbound_messages` | Every email/WhatsApp the backend tries to send (status `sent` or `queued`) | Admin only |

### Quote lifecycle
- Services are **never pre-priced**. `priceItems()` always writes `unit_price: 0`,
  `is_on_request: true` for `item_type = 'service'`. Products keep their fixed price.
- `draft` — the visitor added at least one item but has not submitted. The row is
  created immediately by `syncQuoteDraft` (public) and its `quote_number` is
  `DRAFT-<browser key>` (the key lives in `localStorage.ci_quote_draft_key`).
  Drafts are refreshed on every add/remove/quantity change, so an abandoned
  request is still recorded.
- `new` — submitted via `submitQuote` (requires auth). The draft row is promoted
  in place, gets a real `CI-Q-YYYY-NNNN` number, and the studio is notified.
- `priced` — an admin set per-line prices (`adminPriceQuote`) and optionally left
  an `admin_note`.
- `discussing` / `converted` / `declined` — reply sent / invoice raised / closed.
- Quote submission requires an account: `/quote` redirects to
  `/login?redirect=/quote`, and `claimQuoteDraft` links the browser draft to the
  user as soon as they sign in so the request appears immediately.

### Quote notifications
- On submit, `notifyQuoteRequest` messages the studio's WhatsApp number
  (`site_settings.whatsapp_number`, or `quote_notifications.whatsapp_numbers[]`
  when set) and the contact email (`quote_notifications.emails[]` fallback
  `site_settings.contact_email`). The client gets a `quote_received` email.
- On send-back, `adminSendQuote` emails and WhatsApps the itemised quote.
- WhatsApp sends through Termii only when `site_settings.termii` has
  `enabled` + `whatsapp` and `TERMII_API_KEY` is present; otherwise the message
  is stored as `queued` so it can be sent manually. Every attempt is logged in
  `outbound_messages`.
- `site_settings` key `quote_notifications` (optional):
  `{ "whatsapp_numbers": ["+234..."], "emails": ["..."] }`.

### Enum
- `app_role`: `'admin' | 'customer'`

### Booking status values (text)
- `pending` (default), `confirmed`, `cancelled`, `completed`

## RLS Policies (summary)

All tables have RLS **enabled**. Key policies:

- **profiles**: select/update own; admins select all.
- **user_roles**: select own; admins manage.
- **services / case_studies / testimonials**: anyone can read; only admins write. Inactive/unpublished rows hidden from non-admins.
- **bookings**: anyone can INSERT (public booking form). SELECT limited to row owner (`user_id = auth.uid()`) or admins. UPDATE/DELETE admin-only.
- **contacts**: anyone can INSERT. SELECT/UPDATE/DELETE admin-only.

### Security helper
`public.has_role(user_id, role)` — `SECURITY DEFINER`, used inside RLS to avoid recursion. EXECUTE is revoked from `anon` / `authenticated`; only RLS internals call it.

### Intentional permissive policies (DO NOT "fix")
- `bookings INSERT` and `contacts INSERT` use `WITH CHECK (true)` because public visitors must be able to submit. Spam/rate-limit at the application layer if needed.

## Triggers / Functions

- `handle_new_user()` — auto-creates profile + customer role on signup.
- `set_updated_at()` — refreshes `updated_at` on profiles, services, case_studies, bookings.

## Common queries (frontend cheat sheet)

```ts
import { supabase } from "@/integrations/supabase/client";

// Public reads
const { data: services } = await supabase.from("services").select("*").eq("is_active", true).order("display_order");
const { data: caseStudies } = await supabase.from("case_studies").select("*").order("display_order");
const { data: testimonials } = await supabase.from("testimonials").select("*").eq("is_published", true).order("display_order");

// Submit booking (works for anon and signed-in)
await supabase.from("bookings").insert({
  user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
  full_name, email, phone, company, service_id,
  preferred_date, preferred_time, project_details,
});

// Submit contact
await supabase.from("contacts").insert({ name, email, phone, subject, message });

// Check if current user is admin
const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
const isAdmin = roles?.some(r => r.role === "admin");
```

## Phased build status

- [x] Phase 1: Cloud + schema + seed data + landing shell + animated hero
- [x] Phase 2: Services + Portfolio + Testimonials wired to DB
- [x] Phase 3: Booking form + email/password auth + customer dashboard
- [x] Phase 4: Public contact form + admin dashboard at `/admin` (bookings status mgmt + contact inbox, role-gated via `_admin` layout)

## Changelog

- **2026-10-24**: Services moved to a request-a-quote flow. "Add to quote" → "Get a Quote"; services carry no price (`priceItems` always marks them on request). Unfinished selections are recorded as `draft` quotes under `DRAFT-<browser key>`; submitting requires sign-in and promotes the draft to a real quote number. Admins price individual lines (`adminPriceQuote`) and send the itemised quote back by email + WhatsApp (`adminSendQuote`). Studio notification on every request. Migration `20261024120000_quote_requests_and_drafts.sql` adds `quotes.priced_at/priced_by/admin_note`, `quote_items.price_note` and indexes; the code degrades gracefully if it has not been applied yet.
- **2026-05-10**: Initial schema (5 content tables + profiles + roles), RLS, seed data, auth configured (email/pass auto-confirm + HIBP).
