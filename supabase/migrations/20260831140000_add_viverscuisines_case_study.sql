-- Add a 4th real case study: Viverscuisines' fresh juice packaging labels
-- (rendered from the studio's original print-ready PDF label designs).
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, challenge, solution, results, is_featured, display_order)
VALUES
(
  'viverscuisines-juice-packaging',
  'Viverscuisines Juice Packaging',
  'Viverscuisines',
  'Print & Packaging',
  '/portfolio/viverscuisines-1-orange.jpg',
  ARRAY[
    '/portfolio/viverscuisines-1-orange.jpg',
    '/portfolio/viverscuisines-2-pineapple.jpg',
    '/portfolio/viverscuisines-3-hibiscus.jpg',
    '/portfolio/viverscuisines-4-pineapple-watermelon.jpg',
    '/portfolio/viverscuisines-5-pineapple-orange.jpg'
  ],
  'Viverscuisines needed bottle labels for its fresh juice line that would stand out on a shelf and clearly distinguish each flavor at a glance.',
  'We designed a set of oval bottle labels built around bold, hand-lettered flavor names, real fruit photography, and a consistent "no preservatives, no additives" badge — one label per flavor: orange, pineapple, hibiscus, pineapple & watermelon, and pineapple & orange.',
  'Viverscuisines now has a cohesive, shelf-ready label system across its full juice range.',
  false,
  4
);
