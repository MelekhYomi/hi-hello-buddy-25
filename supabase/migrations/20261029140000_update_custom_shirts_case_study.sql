-- Custom-Made Shirts carries personalised text-based and scriptural designs,
-- not a brand mark. Only rewrites the original seeded wording, so anything
-- already edited from the admin panel is left alone.
UPDATE public.case_studies
SET challenge = 'A client needed custom-made shirts with personalised, text-based and scriptural designs applied across a small run.',
    updated_at = now()
WHERE slug = 'custom-made-shirts-apparel'
  AND challenge = 'A client needed custom-made shirts with a clean, personalised brand mark applied across a small run.';

UPDATE public.case_studies
SET solution = 'We applied the text-based and scriptural designs to quality shirts, keeping the finish clean and premium.',
    updated_at = now()
WHERE slug = 'custom-made-shirts-apparel'
  AND solution = 'We placed a subtle embroidered/printed mark on quality shirts, keeping the branding minimal and premium.';
