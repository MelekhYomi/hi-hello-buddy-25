-- Where each promotion shows besides its own page: the top menu ("nav"), a card in Services ("service"), or nowhere else.
-- "Coming soon" puts a stamp on its Services card (the card still opens the page).
-- Admin changes these in Admin > Promotions. Safe to run more than once.

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS nav_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_placement_check;
ALTER TABLE public.promotions ADD CONSTRAINT promotions_placement_check CHECK (placement IN ('nav', 'service', 'none'));

UPDATE public.promotions SET placement = 'nav', nav_label = 'Idea to Brand', coming_soon = false
WHERE slug = 'idea-to-brand-2027' AND placement = 'none';

UPDATE public.promotions SET placement = 'service', coming_soon = true
WHERE slug = 'logistics-delivery' AND placement = 'none';
