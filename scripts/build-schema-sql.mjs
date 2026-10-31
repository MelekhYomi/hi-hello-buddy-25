// Bundles every migration, in order, plus the storage bucket the admin uploads use, into
// one file for a brand-new Supabase project:
//
//   node scripts/build-schema-sql.mjs   ->  supabase/export/schema.sql  (+ small parts/)
//
// Paste it into the new project's SQL editor and run it once, then run content.sql
// (from scripts/export-content.mjs). Both are safe only on an empty project.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const storage = `
-- Image/document uploads from the admin panel (bucket was created by hand on the old host).
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff manage site media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')))
  WITH CHECK (bucket_id = 'site-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')));
`;

const NL = String.fromCharCode(10);
const body = (f) => readFileSync(new URL(f, dir), "utf8").split(String.fromCharCode(13)).join("").trim();
const blocks = [...files.map((f) => `-- ---- ${f} ----${NL}${body(f)}${NL}`), storage];

const header = `-- C Imperium: full database setup for a NEW Supabase project (${new Date().toISOString().slice(0, 10)}).${NL}-- ${files.length} migrations in order, then the storage bucket. Run once, on an empty project.${NL}`;
mkdirSync(new URL("../supabase/export/", import.meta.url), { recursive: true });
writeFileSync(new URL("../supabase/export/schema.sql", import.meta.url), [header, ...blocks].join(NL));
console.log(`schema.sql: ${files.length} migrations + storage bucket`);

// Also write small numbered parts (about 10 KB each, never splitting a migration) for slow or
// unreliable connections where one big paste into the SQL editor fails. Run them in order.
const partsDir = new URL("../supabase/export/parts/", import.meta.url);
mkdirSync(partsDir, { recursive: true });
let n = 0;
let cur = "";
const flush = () => {
  if (!cur) return;
  n++;
  writeFileSync(new URL(`part-${String(n).padStart(2, "0")}.sql`, partsDir), cur);
  cur = "";
};
for (const b of blocks) {
  if (cur && cur.length + b.length > 10_000) flush();
  cur += b + NL;
}
flush();
console.log(`parts: ${n} files in supabase/export/parts/`);
