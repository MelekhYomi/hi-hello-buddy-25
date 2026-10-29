-- Use the client's full name, Viverscuisines, on the social media ads case study.
UPDATE public.case_studies
SET title = 'Viverscuisines Social Media Ads',
    client = 'Viverscuisines',
    challenge = REPLACE(challenge, 'Vivers needed', 'Viverscuisines needed'),
    solution = REPLACE(solution, 'Vivers’ colours', 'Viverscuisines’ colours'),
    results = REPLACE(results, 'Vivers now has', 'Viverscuisines now has'),
    updated_at = now()
WHERE slug = 'vivers-social-media-ads';
