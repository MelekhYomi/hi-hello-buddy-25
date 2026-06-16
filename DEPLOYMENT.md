# Deployment Guide — C Imperium

This project is built using TanStack Start and Nitro, supporting **Full Server-Side Rendering (SSR)** on both **Lovable Publish (Cloudflare Workers)** and **Vercel**. All pages, server functions, dynamic `/api/*` endpoints (e.g. Paystack webhook), and metadata are fully functional.

## TL;DR Deployment Table

| Host | Architecture | What Works | Configuration Requirements |
| :--- | :--- | :--- | :--- |
| **Lovable Publish** | Full SSR (Workers) | **Everything**: pages, server functions, `/api/*` webhooks, `/sitemap.xml` | Managed automatically via Lovable. Configure secret keys in Lovable Cloud. |
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

## Webhooks & Paystack Callbacks

Configure your Paystack Dashboard's Webhook URL to point to the active production URL:
```
https://<your-production-domain>/api/public/paystack-webhook
```
Because full SSR is enabled on both Vercel and Cloudflare, both environments will process incoming webhook signals flawlessly to update order tables in real-time.
