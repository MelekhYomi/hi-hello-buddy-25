-- =====================================================
-- On-site service briefs (replaces the Google Forms)
-- =====================================================
-- After paying on /order/<slug> (or, for Print & Packaging, straight from the
-- page), the customer fills the project brief on the site instead of being
-- sent to Google. Both forms share one table: the answers land as JSON so
-- each form can keep its own questions, and reference files go to the
-- private `service-briefs` bucket.

CREATE TABLE public.service_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'brand-identity' | 'print-packaging'
  service_slug TEXT NOT NULL,
  -- Package bought with this brief when it followed a payment (e.g. 'Basic').
  package_name TEXT,
  -- Paystack reference when the brief came after a payment.
  order_reference TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- [{ "field": <question label>, "name": <file name>, "path": <storage path> }]
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.service_briefs IS
  'Project briefs submitted through the on-site forms (Brand Identity System brief and Client Purchase Order).';
COMMENT ON COLUMN public.service_briefs.status IS
  'new | in_progress | done | archived';

CREATE INDEX service_briefs_created_idx ON public.service_briefs (created_at DESC);
CREATE INDEX service_briefs_service_created_idx ON public.service_briefs (service_slug, created_at DESC);

ALTER TABLE public.service_briefs ENABLE ROW LEVEL SECURITY;

-- Anyone (signed in or not) can submit a brief; only staff can read/manage them.
CREATE POLICY "Anyone submits a service brief" ON public.service_briefs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff read service briefs" ON public.service_briefs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff'));

CREATE POLICY "Staff update service briefs" ON public.service_briefs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff'));

CREATE POLICY "Staff delete service briefs" ON public.service_briefs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff'));

-- Private bucket for brief uploads (existing brand assets, logos, artwork).
-- 100 MB cap to match the Google Forms' limit.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('service-briefs', 'service-briefs', false, 104857600)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "service-briefs anyone upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'service-briefs');

CREATE POLICY "service-briefs staff read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'service-briefs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff')));

CREATE POLICY "service-briefs staff delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'service-briefs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff')));
