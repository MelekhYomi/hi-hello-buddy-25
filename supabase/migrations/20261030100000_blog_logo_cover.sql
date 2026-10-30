-- Posts without their own image show the C Imperium logo card (default cover). Undo the
-- generated title card on the Jos article so it uses the logo like every other post.
UPDATE public.blog_posts
SET cover_image = NULL,
    updated_at = now()
WHERE slug = 'branding-agency-in-jos-nigeria'
  AND cover_image = '/blog/branding-agency-in-jos.jpg';
