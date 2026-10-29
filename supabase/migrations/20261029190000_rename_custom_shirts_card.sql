-- The custom shirts card is shown under the name "Custom Made T-Shirts".
UPDATE public.case_studies
SET title = 'Custom Made T-Shirts',
    client = 'Custom Made T-Shirts',
    updated_at = now()
WHERE slug = 'custom-made-shirts-apparel';
