-- Idea to Brand 2027 FAQ tidy-up: "What should I bring?" should read exactly
--   "Your business idea and a pen. We provide the printed workbook."
-- (drop the leftover [Add any extras] placeholder).
-- Safe to run more than once — the answer is matched by its question.

DO $$
DECLARE
  p jsonb;
  new_faq jsonb;
BEGIN
  SELECT page INTO p FROM public.promotions WHERE slug = 'idea-to-brand-2027';

  IF p IS NULL THEN
    RAISE NOTICE 'idea-to-brand-2027 not found — nothing to update.';
    RETURN;
  END IF;

  SELECT COALESCE(jsonb_agg(
    f || jsonb_build_object('a', CASE f->>'q'
      WHEN 'What should I bring?' THEN 'Your business idea and a pen. We provide the printed workbook.'
      ELSE f->>'a'
    END)
    ORDER BY ord), '[]'::jsonb)
  INTO new_faq
  FROM jsonb_array_elements(COALESCE(p->'faq', '[]'::jsonb)) WITH ORDINALITY AS t(f, ord);

  UPDATE public.promotions SET page = jsonb_set(p, '{faq}', new_faq) WHERE slug = 'idea-to-brand-2027';

  RAISE NOTICE 'idea-to-brand-2027 FAQ updated.';
END $$;
