-- Idea to Brand 2027: the content edits agreed for the masterclass page.
-- The page lives at the short address /idea2brand (see src/routes/idea2brand.tsx).
-- Safe to run more than once — values are matched by their labels/questions, not by position.

DO $$
DECLARE
  p jsonb;
  new_details jsonb;
  new_faq jsonb;
BEGIN
  SELECT page INTO p FROM public.promotions WHERE slug = 'idea-to-brand-2027';

  IF p IS NULL THEN
    RAISE NOTICE 'idea-to-brand-2027 not found — nothing to update.';
    RETURN;
  END IF;

  -- Hero details card: date, venue, time, length and what the seat includes.
  SELECT COALESCE(jsonb_agg(
    d - 'value' || jsonb_build_object('value', CASE d->>'label'
      WHEN 'Date'     THEN '5 January 2027'
      WHEN 'Venue'    THEN 'Undisclosed'
      WHEN 'Time'     THEN '10am – 1pm'
      WHEN 'Length'   THEN '3 hours'
      WHEN 'Includes' THEN 'Gift pack, lunch, printed workbook'
      ELSE d->>'value'
    END)
    ORDER BY ord), '[]'::jsonb)
  INTO new_details
  FROM jsonb_array_elements(COALESCE(p->'details', '[]'::jsonb)) WITH ORDINALITY AS t(d, ord);

  -- FAQ: CAC question answered "Yes.", plus the real pricing.
  SELECT COALESCE(jsonb_agg(
    f || jsonb_build_object('a', CASE f->>'q'
      WHEN 'Will you help me register my business?' THEN 'Yes.'
      WHEN 'How much is it?' THEN
        '₦50,000 per participant. ₦200,000 for a team of 5 and ₦400,000 for a team of 10. ' ||
        'Pay online — your seat is confirmed the moment payment succeeds, and every seat ' ||
        'includes a gift pack, lunch and a printed workbook.'
      ELSE f->>'a'
    END)
    ORDER BY ord), '[]'::jsonb)
  INTO new_faq
  FROM jsonb_array_elements(COALESCE(p->'faq', '[]'::jsonb)) WITH ORDINALITY AS t(f, ord);

  p := jsonb_set(p, '{details}', new_details);
  p := jsonb_set(p, '{faq}', new_faq);

  -- The WhatsApp reserve button is replaced by the Pay flow.
  p := jsonb_set(p, '{cta_primary}', '"Pay"'::jsonb);
  p := jsonb_set(p, '{button_label}', '"Pay"'::jsonb);
  p := jsonb_set(p, '{whatsapp_message}',
    '"Hi C Imperium, I just paid for Idea to Brand 2027 — how do I join the cohort?"'::jsonb);

  -- Post-payment join screen. Replace this placeholder with the real chat.whatsapp.com
  -- invite (Admin > Promotions > Idea to Brand > page JSON, or re-run this with the link).
  p := jsonb_set(p, '{whatsapp_group}', '"[WhatsApp cohort group link]"'::jsonb, true);

  UPDATE public.promotions SET page = p WHERE slug = 'idea-to-brand-2027';

  RAISE NOTICE 'idea-to-brand-2027 page updated.';
END $$;
