
-- Allow anon/authenticated to call has_role used inside RLS policies (fixes 401s on public read)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Add gallery for case study modal carousel
ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

-- Seed gallery images per case study
UPDATE public.case_studies SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
  'https://images.unsplash.com/photo-1551776235-dde6d4829808?w=1600&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=80'
] WHERE slug = 'kano-grand-hotel';

UPDATE public.case_studies SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80'
] WHERE slug = 'jos-tech-hub';

UPDATE public.case_studies SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1600&q=80',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1600&q=80',
  'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1600&q=80',
  'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1600&q=80'
] WHERE slug = 'payswift-nigeria';

UPDATE public.case_studies SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'
] WHERE slug = 'adeola-couture';

UPDATE public.case_studies SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1600&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80'
] WHERE slug = 'savanna-harvest';

UPDATE public.case_studies SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1600&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&q=80'
] WHERE slug = 'afrovibe-festival';
