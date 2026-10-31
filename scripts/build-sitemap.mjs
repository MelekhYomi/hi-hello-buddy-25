// Writes dist/client/sitemap.xml for the static site (the live /sitemap.xml route needs a server).
// Reads the public tables through Supabase's REST API with the publishable key, like the website does.
//   node scripts/build-sitemap.mjs        (runs automatically at the end of `npm run build:static`)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SITE_URL = "https://www.cimperiumbrand.com";

// Environment variables win; otherwise read .env then .env.local (same order Vite uses).
for (const f of [".env", ".env.local"]) {
  const p = resolve(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && (process.env[m[1]] === undefined || f === ".env.local")) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("sitemap: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing");
  process.exit(1);
}

// One failing table must not take the whole sitemap down.
async function rows(table, select, filter = "", onError = []) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}${filter}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`sitemap: could not read ${table} (${e.message})`);
    return onError;
  }
}

const [products, posts, services, cases, promos] = await Promise.all([
  rows("products", "slug,updated_at", "&is_active=eq.true"),
  rows("blog_posts", "slug,updated_at,published_at", "&is_published=eq.true"),
  rows("services", "slug,updated_at", "&is_active=eq.true"),
  rows("case_studies", "slug,updated_at"),
  // Until the promotions table exists, list the two launch promotions the site ships with.
  rows("promotions", "slug,updated_at", "&is_published=eq.true", [{ slug: "idea-to-brand-2027" }, { slug: "logistics-delivery" }]),
]);

const day = (d) => (d ? String(d).slice(0, 10) : undefined);
const entries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  ...promos.map((p) => ({ path: `/promo/${p.slug}`, lastmod: day(p.updated_at), changefreq: "monthly", priority: "0.7" })),
  ...services.map((s) => ({ path: `/services/${s.slug}`, lastmod: day(s.updated_at), changefreq: "monthly", priority: "0.8" })),
  ...cases.map((c) => ({ path: `/work/${c.slug}`, lastmod: day(c.updated_at), changefreq: "monthly", priority: "0.7" })),
  ...products.map((p) => ({ path: `/shop/${p.slug}`, lastmod: day(p.updated_at), changefreq: "weekly", priority: "0.7" })),
  ...posts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: day(p.published_at ?? p.updated_at), changefreq: "monthly", priority: "0.6" })),
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      "  <url>",
      `    <loc>${esc(SITE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  ),
  `</urlset>`,
  "",
].join("\n");

writeFileSync(resolve(root, "dist/client/sitemap.xml"), xml);
console.log(`sitemap: ${entries.length} addresses written to dist/client/sitemap.xml`);
