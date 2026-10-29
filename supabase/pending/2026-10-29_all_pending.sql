-- ============================================================================
-- C Imperium: ALL PENDING DATABASE CHANGES (bundle generated 2026-10-29)
-- Safe to run once, in one go, in the Lovable Cloud SQL editor. Every statement
-- is idempotent or guarded, so re-running does no harm.
-- Superseded and intentionally omitted: 20261029150000_rename_vivers_case_study.sql
-- (the merge below replaces it).
-- ============================================================================
BEGIN;

-- ---- 20261025140000_update_contact_email.sql ----
-- Update the public contact email shown in the footer, contact section and
-- quote replies. Stored as a JSON string in site_settings.
UPDATE site_settings
SET value = '"info@cimperiumbrand.com"'::jsonb,
    updated_at = now()
WHERE key = 'contact_email';

-- ---- 20261029120000_update_blog_post_email.sql ----
-- Point the Branding Insights post at the public contact email.
UPDATE public.blog_posts
SET body = REPLACE(body, 'ceaserimperium@gmail.com', 'info@cimperiumbrand.com'),
    updated_at = now()
WHERE body LIKE '%ceaserimperium@gmail.com%';

-- ---- 20261029130000_google_reviews.sql ----
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

-- ---- 20261029140000_update_custom_shirts_case_study.sql ----
-- Custom-Made Shirts carries personalised text-based and scriptural designs,
-- not a brand mark. Only rewrites the original seeded wording, so anything
-- already edited from the admin panel is left alone.
UPDATE public.case_studies
SET challenge = 'A client needed custom-made shirts with personalised, text-based and scriptural designs applied across a small run.',
    updated_at = now()
WHERE slug = 'custom-made-shirts-apparel'
  AND challenge = 'A client needed custom-made shirts with a clean, personalised brand mark applied across a small run.';

UPDATE public.case_studies
SET solution = 'We designed subtle DTF prints on quality T-shirts, keeping the branding minimal but premium.',
    updated_at = now()
WHERE slug = 'custom-made-shirts-apparel'
  AND solution IN (
    'We placed a subtle embroidered/printed mark on quality shirts, keeping the branding minimal and premium.',
    'We applied the text-based and scriptural designs to quality shirts, keeping the finish clean and premium.'
  );

-- ---- 20261029160000_merge_viverscuisines_case_study.sql ----
-- One Viverscuisines card containing both jobs (juice packaging + social media ads).
-- case_studies.jobs holds the per-job stories rendered inside the case study modal.
ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS jobs jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.case_studies
SET slug = 'viverscuisines',
    title = 'Viverscuisines',
    client = 'Viverscuisines',
    industry = 'Packaging, Digital & Social Media',
    cover_image = '/portfolio/viverscuisines-1-orange.jpg',
    gallery_images = ARRAY[
      '/portfolio/viverscuisines-1-orange.jpg',
      '/portfolio/vivers-ads-1.jpg',
      '/portfolio/viverscuisines-2-pineapple.jpg',
      '/portfolio/vivers-ads-2.jpg',
      '/portfolio/viverscuisines-3-hibiscus.jpg',
      '/portfolio/vivers-ads-3.jpg',
      '/portfolio/viverscuisines-4-pineapple-watermelon.jpg',
      '/portfolio/viverscuisines-5-pineapple-orange.jpg'
    ],
    services_delivered = ARRAY['Print', 'Packaging', 'Digital', 'Social Media'],
    items_delivered = ARRAY['Bottle labels', 'E-flyers', 'Social media ads', 'Digital artwork'],
    challenge = 'Viverscuisines needed its fresh juice and food brand to look consistent and premium in two places at once: on the shelf, where each flavour has to be told apart at a glance, and online, where the ads have to stop the scroll.',
    solution = 'We treated the two jobs as one system. The bottle labels and the social ads share the same colours, product photography and bold lettering, so a customer who sees the ad recognises the bottle on the shelf.',
    results = 'One cohesive brand across product and promotion: a shelf-ready label range for the full juice line, and a repeatable ad template system for ongoing social campaigns.',
    jobs = $jobs$[
      {
        "title": "Juice Packaging",
        "tag": "Print & Packaging",
        "images": [
          "/portfolio/viverscuisines-1-orange.jpg",
          "/portfolio/viverscuisines-2-pineapple.jpg",
          "/portfolio/viverscuisines-3-hibiscus.jpg",
          "/portfolio/viverscuisines-4-pineapple-watermelon.jpg",
          "/portfolio/viverscuisines-5-pineapple-orange.jpg"
        ],
        "challenge": "Bottle labels for the fresh juice line that stand out on a shelf and clearly distinguish each flavour at a glance.",
        "solution": "A set of oval bottle labels built around bold, hand-lettered flavour names, real fruit photography and a consistent \"no preservatives, no additives\" badge: one label per flavour (orange, pineapple, hibiscus, pineapple & watermelon, and pineapple & orange).",
        "results": "A cohesive, shelf-ready label system across the full juice range."
      },
      {
        "title": "Social Media Ads",
        "tag": "Digital / Social Media",
        "images": [
          "/portfolio/vivers-ads-1.jpg",
          "/portfolio/vivers-ads-2.jpg",
          "/portfolio/vivers-ads-3.jpg"
        ],
        "challenge": "Eye-catching social media artwork to promote the products online: scroll-stopping visuals that carry the brand.",
        "solution": "A series of e-flyers and social ads built around Viverscuisines’ colours and product photography, optimised for Instagram and Facebook feeds.",
        "results": "A repeatable ad template system for ongoing social campaigns."
      }
    ]$jobs$::jsonb,
    updated_at = now()
WHERE slug = 'viverscuisines-juice-packaging';

-- The social ads now live inside the merged card; drop the standalone duplicate,
-- but only once the merged row exists.
DELETE FROM public.case_studies
WHERE slug = 'vivers-social-media-ads'
  AND EXISTS (SELECT 1 FROM public.case_studies WHERE slug = 'viverscuisines');

-- ---- 20261029170000_remove_id_cards_from_umane.sql ----
-- Staff ID cards were not part of the Umane Global Ventures job. Only rewrites the
-- original seeded wording so anything edited from the admin panel is left alone.
UPDATE public.case_studies
SET items_delivered = array_remove(items_delivered, 'ID cards'),
    updated_at = now()
WHERE slug = 'umane-global-ventures-event-branding'
  AND 'ID cards' = ANY (items_delivered);

UPDATE public.case_studies
SET challenge = REPLACE(challenge, 'signage, collateral and staff materials that', 'signage and collateral that'),
    solution = REPLACE(solution, 'stage backdrops, flyers and staff ID cards, keeping', 'stage backdrops and flyers, keeping'),
    updated_at = now()
WHERE slug = 'umane-global-ventures-event-branding';

-- ---- 20261029180000_umane_images_and_kefas_case_study.sql ----
-- 1. Umane Global Ventures: the gallery wrongly included three Governor Kefas
--    mockups (umane-5/9/13). Use the four real Umane images instead
--    (two roll-up banners, two T-shirt mockups).
UPDATE public.case_studies
SET cover_image = '/portfolio/umane-1.jpg',
    gallery_images = ARRAY[
      '/portfolio/umane-1.jpg',
      '/portfolio/umane-2.jpg',
      '/portfolio/umane-3.jpg',
      '/portfolio/umane-4.jpg'
    ],
    updated_at = now()
WHERE slug = 'umane-global-ventures-event-branding';

-- 2. The Kefas mockups get their own card.
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, services_delivered, items_delivered, challenge, solution, results, is_featured, display_order)
VALUES
  (
    'governor-kefas-taraba-campaign-rollout-mockups',
    'Governor Kefas, Taraba State Campaign Rollout Mockups',
    'Governor Kefas, Taraba State',
    'Campaign / Print',
    '/portfolio/kefas-1.jpg',
    ARRAY[
      '/portfolio/kefas-1.jpg',
      '/portfolio/kefas-9.jpg',
      '/portfolio/kefas-7.jpg',
      '/portfolio/kefas-8.jpg',
      '/portfolio/kefas-4.jpg',
      '/portfolio/kefas-5.jpg',
      '/portfolio/kefas-2.jpg',
      '/portfolio/kefas-3.jpg',
      '/portfolio/kefas-6.jpg'
    ],
    ARRAY['Branding', 'Print', 'Apparel', 'Campaign Design'],
    ARRAY['Caps', 'Campaign badges', 'T-shirts', 'Vehicle branding'],
    'The Taraba State campaign needed one recognisable look across everything supporters wear and see: headwear, badges, shirts and campaign vehicles.',
    'We built the "Vote" campaign artwork once and rolled it out as production-ready mockups across caps, badges, T-shirts and a branded vehicle, keeping every item consistent.',
    'A complete rollout mockup set, from headwear to vehicle branding, ready for approval and production.',
    false,
    15
  )
ON CONFLICT (slug) DO NOTHING;

-- ---- 20261029190000_rename_custom_shirts_card.sql ----
-- The custom shirts card is shown under the name "Custom Made T-Shirts".
UPDATE public.case_studies
SET title = 'Custom Made T-Shirts',
    client = 'Custom Made T-Shirts',
    updated_at = now()
WHERE slug = 'custom-made-shirts-apparel';

-- ---- 20261029200000_rename_ncc_jos_to_new_covenant_church.sql ----
-- NCC Jos is shown under its full name, New Covenant Church Jos, with updated copy.
UPDATE public.case_studies
SET title = 'New Covenant Church Jos Branded Apparel',
    client = 'New Covenant Church Jos',
    challenge = 'New Covenant Church Jos needed branded T-shirts for evangelism and outreach.',
    solution = 'We created something that communicated the message even before they spoke.',
    results = 'T-shirts that carry the church’s message wherever the outreach team goes, and start conversations before a word is said.',
    updated_at = now()
WHERE slug = 'ncc-jos-branded-apparel';

-- ---- 20261029210000_poundwise_blue_and_white.sql ----
-- Poundwise identity is blue and white, not blue and silver.
UPDATE public.case_studies
SET solution = REPLACE(solution, 'blue-and-silver', 'blue-and-white'),
    updated_at = now()
WHERE solution LIKE '%blue-and-silver%';

-- ---- 20261029220000_add_maynova_rider_image.sql ----
-- Add the Maynova dispatch rider image to the Maynova Global case study.
UPDATE public.case_studies
SET gallery_images = array_append(gallery_images, '/portfolio/maynova-6-rider.jpg'),
    updated_at = now()
WHERE slug = 'maynova-global-brand-identity'
  AND NOT ('/portfolio/maynova-6-rider.jpg' = ANY (gallery_images));

COMMIT;
