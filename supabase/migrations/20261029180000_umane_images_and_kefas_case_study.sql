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
