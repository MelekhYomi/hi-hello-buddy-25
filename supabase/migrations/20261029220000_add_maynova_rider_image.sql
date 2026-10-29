-- Add the Maynova dispatch rider image to the Maynova Global case study.
UPDATE public.case_studies
SET gallery_images = array_append(gallery_images, '/portfolio/maynova-6-rider.jpg'),
    updated_at = now()
WHERE slug = 'maynova-global-brand-identity'
  AND NOT ('/portfolio/maynova-6-rider.jpg' = ANY (gallery_images));
