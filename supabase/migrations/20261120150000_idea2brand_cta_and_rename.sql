-- Idea 2 Brand 2027: the top "Reserve my seat" buttons come back (the reservation
-- form keeps its own "Pay" button), and the brand string is renamed from
-- "Idea to Brand 2027" to "Idea 2 Brand 2027" everywhere it appears in the page.
-- Safe to run more than once — everything is matched by slug/label.

DO $$
DECLARE
  p jsonb;
BEGIN
  SELECT page INTO p FROM public.promotions WHERE slug = 'idea-to-brand-2027';

  IF p IS NULL THEN
    RAISE NOTICE 'idea-to-brand-2027 not found — nothing to update.';
    RETURN;
  END IF;

  -- Top menu pill and hero button read cta_primary; the Pay form has its own
  -- hardcoded "Pay ₦50,000" button, so it is unaffected.
  p := jsonb_set(p, '{cta_primary}', '"Reserve my seat"'::jsonb);

  -- Brand rename (headline keeps the *asterisk* yellow highlight on "Brand").
  p := jsonb_set(p, '{seo_title}', '"Idea 2 Brand 2027 | C Imperium Masterclass in Jos"'::jsonb);
  p := jsonb_set(p, '{headline}', '"Idea 2 *Brand* 2027"'::jsonb);
  p := jsonb_set(p, '{whatsapp_message}',
    '"Hi C Imperium, I just paid for Idea 2 Brand 2027 — how do I join the cohort?"'::jsonb);

  UPDATE public.promotions
  SET title = 'Idea 2 Brand 2027',
      nav_label = 'Idea 2 Brand',
      page = p
  WHERE slug = 'idea-to-brand-2027';

  RAISE NOTICE 'idea-to-brand-2027: CTA set to "Reserve my seat", renamed to Idea 2 Brand 2027.';
END $$;
