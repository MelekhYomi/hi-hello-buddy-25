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
