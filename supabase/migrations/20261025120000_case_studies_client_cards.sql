-- =====================================================
-- Our Work / portfolio case studies: client cards
-- =====================================================
-- Add optional fields so each case study card can list the
-- services delivered and the physical/digital items produced,
-- making the "Our Work" section a client-led portfolio rather
-- than a service-by-service gallery.
--
-- These columns are optional: the frontend degrades gracefully
-- when they are absent (empty arrays fall back to industry).

ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS services_delivered TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS items_delivered TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.case_studies.services_delivered IS
  'Services delivered for this client, e.g. {branding, print, apparel}';
COMMENT ON COLUMN public.case_studies.items_delivered IS
  'Physical/digital items produced, e.g. {t-shirts, flex banners, business cards}';

-- ------------------------------------------------------------------
-- Real client case studies from the studio archive.
-- Images live in /public/portfolio/ (copied from attachments/).
-- ------------------------------------------------------------------

-- NCC Jos — branded t-shirts
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, services_delivered, items_delivered, challenge, solution, results, is_featured, display_order)
VALUES
  (
    'ncc-jos-branded-apparel',
    'NCC Jos Branded Apparel',
    'NCC Jos',
    'Print & Apparel',
    '/portfolio/ncc-jos-tshirt.jpg',
    ARRAY['/portfolio/ncc-jos-tshirt.jpg'],
    ARRAY['Branding', 'Print', 'Apparel'],
    ARRAY['T-shirts', 'Branded apparel'],
    'NCC Jos needed branded t-shirts for its team and event staff — a clean, wearable mark that reads well in the field.',
    'We designed a bold, single-colour chest mark and applied it across a run of quality cotton t-shirts, with screen-printed backs for event staff.',
    'NCC Jos staff now wear consistent, on-brand apparel at events and in the office.',
    false,
    10
  );

-- Umane Global Ventures — event branding
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, services_delivered, items_delivered, challenge, solution, results, is_featured, display_order)
VALUES
  (
    'umane-global-ventures-event-branding',
    'Umane Global Ventures Event Branding',
    'Umane Global Ventures',
    'Event Branding',
    '/portfolio/umane-1.jpg',
    ARRAY[
      '/portfolio/umane-1.jpg',
      '/portfolio/umane-5.jpg',
      '/portfolio/umane-9.jpg',
      '/portfolio/umane-13.jpg'
    ],
    ARRAY['Branding', 'Print', 'Event Design'],
    ARRAY['Flex banners', 'Backdrops', 'Flyers', 'ID cards'],
    'Umane Global Ventures needed a complete visual identity for a corporate event — signage, collateral and staff materials that looked unified from the gate to the stage.',
    'We built an event brand system around a clean mark and applied it across flex banners, stage backdrops, flyers and staff ID cards, keeping every touchpoint consistent.',
    'The event ran with a cohesive, professional look across all printed and branded materials.',
    true,
    11
  );

-- Vivers — social media ads
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, services_delivered, items_delivered, challenge, solution, results, is_featured, display_order)
VALUES
  (
    'vivers-social-media-ads',
    'Vivers Social Media Ads',
    'Vivers',
    'Digital / Social Media',
    '/portfolio/vivers-ads-1.jpg',
    ARRAY[
      '/portfolio/vivers-ads-1.jpg',
      '/portfolio/vivers-ads-2.jpg',
      '/portfolio/vivers-ads-3.jpg'
    ],
    ARRAY['Digital', 'Social Media', 'Branding'],
    ARRAY['E-flyers', 'Social media ads', 'Digital artwork'],
    'Vivers needed eye-catching social media artwork to promote its products online — scroll-stopping visuals that carried the brand.',
    'We designed a series of e-flyers and social ads built around Vivers’ colours and product photography, optimised for Instagram and Facebook feeds.',
    'Vivers now has a repeatable ad template system for ongoing social campaigns.',
    false,
    12
  );

-- City Boy Movement / Renewed Hope — campaign branding
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, services_delivered, items_delivered, challenge, solution, results, is_featured, display_order)
VALUES
  (
    'cityboy-movement-campaign-branding',
    'City Boy Movement Campaign Branding',
    'City Boy Movement',
    'Campaign / Print',
    '/portfolio/cityboy-1.jpg',
    ARRAY['/portfolio/cityboy-1.jpg', '/portfolio/cityboy-2.jpg'],
    ARRAY['Branding', 'Print', 'Campaign Design'],
    ARRAY['Flex banners', 'Shirts', 'Campaign materials'],
    'The City Boy Movement campaign needed a strong visual identity for its Jos-based outreach — banners, shirts and campaign collateral that carried the message.',
    'We created a campaign mark and applied it across flex banners, branded shirts and printed materials, giving the movement a unified street presence.',
    'The campaign materials gave the movement a consistent, recognisable identity across Jos.',
    false,
    13
  );

-- Custom-made shirts — apparel client
INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, services_delivered, items_delivered, challenge, solution, results, is_featured, display_order)
VALUES
  (
    'custom-made-shirts-apparel',
    'Custom-Made Shirts',
    'Apparel Client',
    'Print & Apparel',
    '/portfolio/shirts-1.jpg',
    ARRAY['/portfolio/shirts-1.jpg', '/portfolio/shirts-3.jpg', '/portfolio/shirts-5.jpg'],
    ARRAY['Print', 'Apparel', 'Branding'],
    ARRAY['Custom shirts', 'Branded apparel'],
    'A client needed custom-made shirts with personalised, text-based and scriptural designs applied across a small run.',
    'We applied the text-based and scriptural designs to quality shirts, keeping the finish clean and premium.',
    'The client received a cohesive set of branded shirts ready to wear.',
    false,
    14
  );
