// Canonical production domain used for SEO meta, canonicals, the sitemap and
// the web manifest. Override with VITE_SITE_URL at build time if it ever
// changes — otherwise this falls back to the official domain.
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") || "https://www.cimperiumbrand.com";
