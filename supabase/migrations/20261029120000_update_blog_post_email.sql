-- Point the Branding Insights post at the public contact email.
UPDATE public.blog_posts
SET body = REPLACE(body, 'ceaserimperium@gmail.com', 'info@cimperiumbrand.com'),
    updated_at = now()
WHERE body LIKE '%ceaserimperium@gmail.com%';
