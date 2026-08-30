-- Replace placeholder/fictional case studies (Kano Grand Hotel, Jos Tech Hub,
-- PaySwift, etc. — never real clients) with actual completed brand identity
-- projects, sourced from the studio's project archive.
DELETE FROM public.case_studies;

INSERT INTO public.case_studies
  (slug, title, client, industry, cover_image, gallery_images, challenge, solution, results, is_featured, display_order)
VALUES
(
  'maynova-global-brand-identity',
  'Maynova Global Brand Identity',
  'Maynova Global',
  'Brand Identity',
  '/portfolio/maynova-1-letterhead.jpg',
  ARRAY[
    '/portfolio/maynova-1-letterhead.jpg',
    '/portfolio/maynova-2-shirt.jpg',
    '/portfolio/maynova-3-van.jpg',
    '/portfolio/maynova-4-appicon.jpg',
    '/portfolio/maynova-5-palette.jpg'
  ],
  'Maynova Global needed a distinct visual identity for its dispatch and logistics operations — something that reads as fast, trustworthy, and easy to recognize across vehicles, uniforms, and paperwork.',
  'We built a full identity system around a green dispatch mark, extending it across letterheads, business cards, staff shirts, an app icon, and vehicle livery for the delivery fleet.',
  'Maynova now has a consistent, road-ready brand presence — from the paperwork in the office to the vans and riders on the street.',
  true,
  1
),
(
  'poundwise-capital-advisory-identity',
  'Poundwise Capital Advisory Brand Identity',
  'Poundwise Capital Advisory Ltd',
  'Brand Identity',
  '/portfolio/poundwise-1-card.jpg',
  ARRAY[
    '/portfolio/poundwise-1-card.jpg',
    '/portfolio/poundwise-2-banner.jpg',
    '/portfolio/poundwise-3-shirt.jpg',
    '/portfolio/poundwise-4-bottle.jpg',
    '/portfolio/poundwise-5-stationeries.jpg'
  ],
  'As a capital advisory firm, Poundwise needed a brand that projected financial credibility and trust from the very first handshake.',
  'We designed a premium blue-and-silver identity system — business cards, banners, branded apparel, and stationery — anchored by a coin-inspired mark.',
  'The finished system gives Poundwise''s team polished, client-ready materials across print and merchandise.',
  true,
  2
),
(
  'value-forge-consult-identity',
  'Value Forge Consult Brand Identity',
  'Value Forge Consult',
  'Brand Identity',
  '/portfolio/value-forge-1-tote.jpg',
  ARRAY[
    '/portfolio/value-forge-1-tote.jpg',
    '/portfolio/value-forge-2-logosheet.jpg',
    '/portfolio/value-forge-3.jpg',
    '/portfolio/value-forge-4.jpg',
    '/portfolio/value-forge-5.jpg'
  ],
  'Value Forge Consult needed a sharp, modern mark that could work across a consultancy''s full range of touchpoints — from app icons to branded merchandise.',
  'We developed a geometric "VF" mark with a flexible light/dark/app-icon color system and applied it consistently across totes and branded materials.',
  'Value Forge now has a cohesive, adaptable identity ready for both digital and physical brand touchpoints.',
  false,
  3
);
