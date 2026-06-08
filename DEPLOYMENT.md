# Deployment Guide — C Imperium

## TL;DR

| Host                       | Status   | What works                                  | What doesn't                                          |
| -------------------------- | -------- | ------------------------------------------- | ----------------------------------------------------- |
| **Lovable Publish** (recommended) | Full SSR | Everything: pages, server fns, /api/*, sitemap | —                                                     |
| **Netlify** (from GitHub)  | SPA only | All pages, client-side data, Supabase reads | Server functions, /api/* routes, /sitemap.xml         |
| **Vercel** (from GitHub)   | SPA only | All pages, client-side data, Supabase reads | Server functions, /api/* routes, /sitemap.xml         |

This project is built for **Cloudflare Workers** (the Lovable Publish target).
Netlify and Vercel are supported as a static SPA fallback — useful for previews
or staging, but the Paystack webhook and other server-side endpoints will only
work on the Lovable-published URL.

## Required environment variables (Netlify / Vercel)

Set these in the host's dashboard before building. Use the **same values** that
are in `.env` (these are the publishable / non-secret variables only):

```
VITE_SUPABASE_URL=https://qskyzzlnhrzcoldnsxjq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<copy from .env>
VITE_SUPABASE_PROJECT_ID=qskyzzlnhrzcoldnsxjq
```

**Never** put `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY_*`, or any
other secret in the host. Secrets stay in **Lovable Cloud → Secrets**.

## Node version

Pinned to **Node 20** via `.nvmrc`, `netlify.toml`, and `package.json` engines.
If a deploy fails with a Node version error, confirm the host honors `.nvmrc`.

## Build command

`bun run build` — works headlessly. Output: `dist/`.

## GitHub → Netlify / Vercel

1. Connect the GitHub repo in the host dashboard.
2. Build command: `bun run build` (or `npm run build` if the host doesn't have bun).
3. Output dir: `dist`.
4. Add the env vars above.
5. Deploy. SPA redirects are handled by `netlify.toml` / `vercel.json` /
   `public/_redirects` — page refresh on any route returns `index.html`.

## Webhooks & Paystack callbacks

Configure Paystack webhook URL to the **Lovable-published domain** only:

```
https://<your-domain>.lovable.app/api/public/paystack-webhook
```

The Netlify/Vercel URL won't receive webhooks (those routes are server-side
only on Workers).
