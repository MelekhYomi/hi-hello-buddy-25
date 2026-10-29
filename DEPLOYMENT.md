# Deployment Guide — C Imperium

This project is built using TanStack Start and Nitro, supporting full SSR. Production runs on **Hostinger** (`www.cimperiumbrand.com`) as a Node.js Web App (Nitro `node-server`); Lovable Publish (Cloudflare Workers) and Vercel remain supported alternatives. All pages, server functions, dynamic `/api/*` endpoints (e.g. Paystack webhook), and metadata are fully functional.

## TL;DR Deployment Table

| Host | Architecture | What Works | Configuration Requirements |
| :--- | :--- | :--- | :--- |
| **Hostinger** (production — `www.cimperiumbrand.com`) | Full SSR (Nitro `node-server`) | **Everything**: pages, server functions, `/api/*` webhooks, `/sitemap.xml` | Node.js Web App (Business Web Hosting or Cloud plan). See the Hostinger section below. |
| **Lovable Publish** | Full SSR (Workers) | **Everything**: pages, server functions, `/api/*` webhooks, `/sitemap.xml` | Managed automatically via Lovable. Configure secret keys in Lovable Cloud. Setting an explicit `DEPLOY_TARGET=cloudflare-module` build env forces this build. |
| **Vercel** (GitHub hook) | Full SSR (Serverless) | **Everything**: pages, server functions, `/api/*` webhooks, `/sitemap.xml` | Set build to automatic/blank (do **NOT** use `dist` as output directory). |
| **Netlify** (GitHub hook) | SPA Static | Pages, client-side data, client Supabase reads | Traditional static/SPA. Server functions and server `/api/*` webhooks are unavailable. |

---

## Lovable Publish (Cloudflare Workers)

This is the primary and recommended production target.
- **Environment**: V8 Isolate (Cloudflare Workers).
- **Environment Variables**: Managed under **Lovable Cloud → Secrets** or **Cloudflare dashboard**. Since Workers do not have `process.env`, they receive variables inside the request context, which are captured on `globalThis._cf_env` during boot.

---

## Vercel Deployment (Full SSR)

Our Nitro-backed compiler dynamically outputs Vercel's Serverless Build Output API structure (`.vercel/output`) when building on Vercel.

### Vercel Project Setup:
1. **Connect Repo**: Import your GitHub repository into Vercel.
2. **Build Settings**:
   - **Framework Preset**: Choose **Other** or **TanStack Start / Nitro** (if detected).
   - **Build Command**: `npm run build` or `bun run build`.
   - **Output Directory**: **Leave BLANK / DEFAULT** (Do **NOT** set to `dist`). Vercel will automatically discover the `.vercel/output` directory compiled by Nitro.
3. **Environment Variables**:
   Under **Project Settings → Environment Variables**, add the following credentials:
   - `VITE_SUPABASE_URL` — Public Supabase URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — Public Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — (Server-side/Secret) Admin bypass key
   - `PAYSTACK_SECRET_KEY_TEST` — Paystack test secret key
   - `PAYSTACK_SECRET_KEY_LIVE` — Paystack live secret key
   - `PAYSTACK_WEBHOOK_SECRET` — (Optional) For secure Paystack webhook timing verification

---

## Hostinger — Production (www.cimperiumbrand.com)

The app ships as a Nitro **node-server** build (default when `NODE_ENV=production`
in `vite.config.ts`), which is what Hostinger's Node.js Web App feature runs.

### Prerequisites
- A Hostinger plan that supports **Node.js web apps**: Business Web Hosting,
  Cloud Startup / Professional / Enterprise / Enterprise Plus (Premium/shared
  does NOT support Node.js apps).
- The domains `www.cimperiumbrand.com` and `cimperiumbrand.com` added to the plan.

### hPanel Setup
1. **Websites -> Add Website -> Node.js web app**, connect the GitHub repo
   (`MelekhYomi/hi-hello-buddy-25`, branch `main`). Pushes to `main` auto-deploy.
2. **Build settings** — Hostinger won't auto-detect TanStack Start; if it classifies
   the project as "Other", set these manually:

   | Setting | Value |
   | --- | --- |
   | Application type | `nitro` |
   | Node version | `22` (default / LTS) |
   | Build script | `build` |
   | Output directory | `.output` |
   | Entry file | `server/index.mjs` |
   | Package manager | `npm` |

   Nitro's node-server preset binds `0.0.0.0` and takes its port from
   `process.env.PORT` (supplied by Hostinger) — nothing else to configure.
   Note: dependency install and build each have a 15-minute limit; a clean
   install plus `npm run build` takes ~5-6 min here.

3. **Environment variables** (hPanel -> website dashboard -> Environment variables;
   they are injected into **both** the build and the runtime, so set them before
   the first build):

   | Variable | Needed for |
   | --- | --- |
   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Client bundle (baked at build) + SSR fallbacks (same values as the committed `.env`) |
   | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Server-side Supabase reads |
   | `SUPABASE_SERVICE_ROLE_KEY` | Admin / billing server functions (service-role bypass) |
   | `VITE_SITE_URL` | `https://www.cimperiumbrand.com` (already committed in `.env`; set here anyway for safety) |
   | `PAYSTACK_SECRET_KEY_TEST` / `PAYSTACK_SECRET_KEY_LIVE` | Checkout + admin payment tools |
   | `PAYSTACK_WEBHOOK_SECRET` | Webhook signature verification |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Booking-form availability + calendar events (falls back to fixed slots if missing) |
   | `TERMII_API_KEY` | OTP / SMS flows (optional) |

4. **Domain**: assign `www.cimperiumbrand.com` to the web app in hPanel, enable
   the free SSL, and force HTTPS.

### Post-deploy checklist
- [ ] `https://www.cimperiumbrand.com/sitemap.xml` lists `www.cimperiumbrand.com`
      URLs (driven by `VITE_SITE_URL` / the committed default).
- [ ] Set the Paystack webhook URL on **both** live and test dashboards:
      `https://www.cimperiumbrand.com/api/public/paystack-webhook`
- [ ] Supabase -> Authentication -> URL Configuration: Site URL set to
      `https://www.cimperiumbrand.com` and `https://www.cimperiumbrand.com/**`
      added to the redirect allow-list.
- [ ] Retire / redirect the old Vercel domain to avoid duplicate-content SEO.
- [ ] Hostinger stops Node apps when they idle — first request after idle has a
      multi-second cold start. If that matters, add a keep-alive ping (e.g. a
      Hostinger cron hitting the homepage every ~5 minutes).

---

## Google Calendar Sync (Booking Form)

The consultation booking form (`#book`) checks real availability and creates
an actual event on the admin's Google Calendar when someone books — Google's
own Calendar app then handles notifying the admin on every signed-in device.
This **requires full SSR** (Lovable Publish or Vercel — not Netlify).

### One-time setup (do this once, as the admin whose calendar should receive bookings):
1. Go to the [Google Cloud Console](https://console.cloud.google.com/), create (or pick) a project.
2. **APIs & Services → Library**: enable the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**: set User Type to **External**, fill in the required fields, and add your own Google account under **Test users** (no verification/review needed for personal use like this).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**: choose **Desktop app** as the type. Note the **Client ID** and **Client Secret**.
5. Get a refresh token for the `https://www.googleapis.com/auth/calendar` scope using your own Client ID/Secret — the easiest way is [Google's OAuth Playground](https://developers.google.com/oauthplayground):
   - Click the gear icon (top right) → check **"Use your own OAuth credentials"** → paste your Client ID and Client Secret.
   - In Step 1, find and select **Calendar API v3** → `https://www.googleapis.com/auth/calendar` → **Authorize APIs** → sign in with the admin Google account → allow access.
   - In Step 2, click **Exchange authorization code for tokens** → copy the **Refresh token** shown.
6. Set these environment variables on your hosting platform (Lovable Cloud → Secrets, or Vercel → Project Settings → Environment Variables):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_CALENDAR_ID` — usually `primary`, or a specific calendar's email/ID if bookings should go to a shared calendar instead of the admin's main one

Until these are set, the booking form still works normally — it just falls
back to showing the full fixed time-slot list without checking real
availability, and skips creating a calendar event (this is logged server-side,
not shown to visitors).

---

## Webhooks & Paystack Callbacks

Configure your Paystack Dashboard's Webhook URL to point to the active production URL:
```
https://<your-production-domain>/api/public/paystack-webhook
```
Because full SSR is enabled on both Vercel and Cloudflare, both environments will process incoming webhook signals flawlessly to update order tables in real-time.

---

## Google reviews sync

Client reviews are pulled from the Google Business listing (Place ID `ChIJpYDYfYpzUxARKEg_uG6FovM`)
into the `testimonials` table, and shown in the "Client Stories" section with the overall Google rating.

1. **Run the migration** `supabase/migrations/20261029130000_google_reviews.sql` (adds `source`, `external_id`,
   `review_url`, `review_time`; tags the four sample testimonials as `placeholder`).
2. **Google Cloud**: create/choose a project, enable **Places API (New)**, create an API key and restrict it to
   that API. Billing must be enabled on the project (one lookup a day is well inside the free usage).
3. **Environment variables** (Vercel / Hostinger / Lovable Cloud secrets):

   | Variable | Purpose |
   | --- | --- |
   | `GOOGLE_PLACES_API_KEY` | Places API (New) key |
   | `CRON_SECRET` | Long random string protecting the scheduled sync endpoint |
   | `GOOGLE_PLACE_ID` | Optional override; defaults to the Place ID above |

4. **Keeping it fresh**: Google returns at most 5 reviews per call, so the sync runs on a schedule and
   accumulates new ones (matched by Google's review id, never duplicated).
   - Vercel: `vercel.json` already schedules `/api/public/sync-google-reviews` daily; Vercel sends
     `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.
   - Hostinger: add a daily cron job in hPanel:
     `curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://www.cimperiumbrand.com/api/public/sync-google-reviews`
   - Any time: Admin -> Testimonials -> **Sync from Google**.
5. 4-5 star reviews with text are published automatically; lower ratings are imported unpublished for review.
   Publishing, ordering and deleting still work from the admin Testimonials tab, and a sync never overrides them.
   The sample testimonials are hidden automatically once a real review exists.
