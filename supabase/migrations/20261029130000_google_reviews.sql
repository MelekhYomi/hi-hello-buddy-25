-- Google Business reviews are synced into public.testimonials.
-- external_id holds Google's review resource name, so repeat syncs update in
-- place instead of duplicating, and accumulate reviews beyond the 5 the
-- Places API returns on any single call.
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS review_url text,
  ADD COLUMN IF NOT EXISTS review_time timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS testimonials_external_id_key
  ON public.testimonials (external_id)
  WHERE external_id IS NOT NULL;

-- The four seeded testimonials are sample copy with invented names. Tag them so
-- the site can hide them as soon as real reviews exist (they are not deleted).
UPDATE public.testimonials
SET source = 'placeholder'
WHERE id IN (
  'bd8f27c2-b015-44d4-b41f-502eaa3977cb',
  'c64d3d19-d6a1-4758-95ac-e54164fbe1e0',
  '7672f75b-4ada-415f-8fe8-64fc20380d39',
  'ec562c52-98ed-4f7f-9880-95f4b956e79c'
);

-- Google listing details used by the sync and the "Rated on Google" badge.
INSERT INTO public.site_settings (key, value)
VALUES (
  'google_reviews',
  '{"place_id": "ChIJpYDYfYpzUxARKEg_uG6FovM", "review_url": "https://g.page/r/CShIP7huhaLzEAE/review"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
