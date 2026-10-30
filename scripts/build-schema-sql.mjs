// Bundles every migration, in order, plus the storage bucket the admin uploads use, into
// one file for a brand-new Supabase project:
//
//   node scripts/build-schema-sql.mjs   ->  supabase/export/schema.sql
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

const parts = [
  `-- C Imperium: full database setup for a NEW Supabase project (${new Date().toISOString().slice(0, 10)}).\n-- ${files.length} migrations in order, then the storage bucket. Run once, on an empty project.\n`,
  ...files.map((f) => `-- ---- ${f} ----\n${readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n").trim()}\n`),
  storage,
];
mkdirSync(new URL("../supabase/export/", import.meta.url), { recursive: true });
writeFileSync(new URL("../supabase/export/schema.sql", import.meta.url), parts.join("\n"));
console.log(`schema.sql: ${files.length} migrations + storage bucket`);
