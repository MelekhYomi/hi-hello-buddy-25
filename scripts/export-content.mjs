// Snapshots the website's public content (services, products, portfolio, blog, testimonials,
// settings...) from the live database into one SQL file, so it can be loaded into a new
// Supabase project after the migrations have run.
//
//   node scripts/export-content.mjs            -> supabase/export/content.sql
//
// It only reads what the public website is already allowed to read (the publishable key),
// so it needs no secrets. Private data (orders, bookings, quotes, invoices, payments,
// customers) is NOT included: export that from Admin -> Exports.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Order matters: parents before children.
const TABLES = [
  "site_settings",
  "services",
  "product_categories",
  "products",
  "delivery_zones",
  "case_studies",
  "blog_posts",
  "testimonials",
  "studio_images",
];

// Columns stored as jsonb / text[] (the REST API returns both as JSON, so name them here).
const JSONB = { site_settings: ["value"], case_studies: ["jobs"] };
const TEXT_ARRAY = {
  services: ["features"],
  products: ["images"],
  case_studies: ["gallery_images", "services_delivered", "items_delivered"],
  blog_posts: ["tags"],
};

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

function literal(table, col, v) {
  if (v === null || v === undefined) return "NULL";
  if (JSONB[table]?.includes(col)) return `${q(JSON.stringify(v))}::jsonb`;
  if (TEXT_ARRAY[table]?.includes(col)) {
    return v.length ? `ARRAY[${v.map(q).join(", ")}]::text[]` : "ARRAY[]::text[]";
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return q(v);
}

const out = [];
const summary = [];
for (const table of TABLES) {
  const res = await fetch(`${URL_}/rest/v1/${table}?select=*&limit=1000`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const rows = await res.json();
  if (!res.ok || !Array.isArray(rows)) {
    summary.push(`${table}: SKIPPED (${rows?.message ?? res.status})`);
    continue;
  }
  summary.push(`${table}: ${rows.length} rows`);
  if (!rows.length) continue;
  out.push(`-- ${table} (${rows.length})`);
  out.push(`DELETE FROM public.${table};`);
  for (const r of rows) {
    const cols = Object.keys(r);
    out.push(
      `INSERT INTO public.${table} (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols
        .map((c) => literal(table, c, r[c]))
        .join(", ")});`,
    );
  }
  out.push("");
}

const header = `-- C Imperium: live website content snapshot (${new Date().toISOString().slice(0, 10)})
-- Run ONCE, in the SQL editor of the NEW Supabase project, right AFTER all migrations.
-- It replaces the sample content the migrations seed with what is live today.
-- Only published posts/testimonials are included (that is all the public site can read).
BEGIN;

-- Safety: refuse to run anywhere that already has real orders.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.orders LIMIT 1) THEN
    RAISE EXCEPTION 'orders exist: this script is only for a brand-new project';
  END IF;
END $$;

`;
mkdirSync(new URL("../supabase/export/", import.meta.url), { recursive: true });
writeFileSync(new URL("../supabase/export/content.sql", import.meta.url), header + out.join("\n") + "\nCOMMIT;\n");
console.log(summary.join("\n"));
