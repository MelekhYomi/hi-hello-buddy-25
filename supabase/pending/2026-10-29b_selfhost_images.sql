-- Run in Lovable Cloud -> SQL editor. Idempotent.
BEGIN;

-- Serve product, blog and testimonial images from the site itself instead of
-- third-party hosts (images.unsplash.com, i.pravatar.cc): faster, and they cannot
-- disappear (the pen set photo already had).

UPDATE public.products SET images = ARRAY['/products/imperium-tee-black-1.jpg', '/products/imperium-tee-black-2.jpg'], updated_at = now() WHERE slug = 'imperium-tee-black';
UPDATE public.products SET images = ARRAY['/products/imperium-hoodie-1.jpg', '/products/imperium-hoodie-2.jpg'], updated_at = now() WHERE slug = 'imperium-hoodie';
UPDATE public.products SET images = ARRAY['/products/imperium-notebook-1.jpg'], updated_at = now() WHERE slug = 'imperium-notebook';
-- Placeholder ("Photo coming soon") until a real photo is uploaded.
UPDATE public.products SET images = ARRAY['/products/imperium-pen-set-1.jpg'], updated_at = now() WHERE slug = 'imperium-pen-set';
UPDATE public.products SET images = ARRAY['/products/imperium-business-cards-1.jpg'], updated_at = now() WHERE slug = 'imperium-business-cards';
UPDATE public.products SET images = ARRAY['/products/imperium-tote-1.jpg'], updated_at = now() WHERE slug = 'imperium-tote';

-- Cover image for the Jos article (posts without one now get a branded default).
UPDATE public.blog_posts
SET cover_image = '/blog/branding-agency-in-jos.jpg',
    updated_at = now()
WHERE slug = 'branding-agency-in-jos-nigeria'
  AND cover_image IS NULL;

-- Sample testimonials used random stock faces from pravatar.cc.
UPDATE public.testimonials
SET avatar_url = NULL
WHERE source = 'placeholder'
  AND avatar_url LIKE 'https://i.pravatar.cc/%';

COMMIT;
