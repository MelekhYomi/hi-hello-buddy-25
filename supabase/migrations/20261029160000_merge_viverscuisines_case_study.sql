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
