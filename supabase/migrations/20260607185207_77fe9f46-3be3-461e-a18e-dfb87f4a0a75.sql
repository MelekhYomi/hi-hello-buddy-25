
-- 1. site_settings: single-row key/value store editable from admin
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins/staff write settings" ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. blog_posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  cover_image text,
  body text NOT NULL DEFAULT '',
  author text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  is_published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published posts" ON public.blog_posts FOR SELECT
  USING (is_published = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE POLICY "Admins/staff write posts" ON public.blog_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER blog_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. studio_images (gallery shown on About)
CREATE TABLE public.studio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  alt text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.studio_images TO anon, authenticated;
GRANT ALL ON public.studio_images TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.studio_images TO authenticated;
ALTER TABLE public.studio_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active studio images" ON public.studio_images FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE POLICY "Admins/staff write studio images" ON public.studio_images FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));

-- Seed default site_settings rows
INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_number', '"+2348038577654"'::jsonb),
  ('payment_provider', '"paystack"'::jsonb),
  ('payment_mode', '"test"'::jsonb),
  ('contact_email', '"hello@cimperium.com"'::jsonb),
  ('socials', '{"instagram":"","linkedin":"","behance":""}'::jsonb),
  ('hero', '{"eyebrow":"Brand Transformation Agency · Abuja, Nigeria","headline_line1":"STAND","headline_line2":"OUT.","headline_line3":"DOMINATE.","subline":"We help businesses, ministries, and organizations build premium visual identities and brand experiences that are impossible to ignore."}'::jsonb)
ON CONFLICT (key) DO NOTHING;
