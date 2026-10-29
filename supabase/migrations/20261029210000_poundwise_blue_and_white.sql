-- Poundwise identity is blue and white, not blue and silver.
UPDATE public.case_studies
SET solution = REPLACE(solution, 'blue-and-silver', 'blue-and-white'),
    updated_at = now()
WHERE solution LIKE '%blue-and-silver%';
