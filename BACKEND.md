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
- [x] Phase 3: Booking form (public + signed-in) + email/password auth (signup/login/reset) + customer dashboard
- [ ] Phase 4: Admin dashboard + Contact form

## Changelog

- **2026-05-10**: Initial schema (5 content tables + profiles + roles), RLS, seed data, auth configured (email/pass auto-confirm + HIBP).
