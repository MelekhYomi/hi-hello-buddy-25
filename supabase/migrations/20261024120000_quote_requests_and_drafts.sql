-- =====================================================
-- Request-a-quote flow
-- =====================================================
-- Services no longer carry a fixed price. A client requests a quote; the
-- unfinished selection is recorded as a quote row with status 'draft'
-- (quote_number 'DRAFT-<browser key>') and promoted to a real CI-Q- number
-- when they submit it. An admin then prices the individual lines.

ALTER TABLE public.quotes
  -- Set when an admin has priced the lines and is ready to reply.
  ADD COLUMN IF NOT EXISTS priced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priced_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Internal note from the admin, shown to the client on their quote.
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

ALTER TABLE public.quote_items
  -- e.g. "per unit", "includes 2 revisions", "delivery extra".
  ADD COLUMN IF NOT EXISTS price_note TEXT;

CREATE INDEX IF NOT EXISTS quotes_user_created_idx
  ON public.quotes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS quotes_status_created_idx
  ON public.quotes (status, created_at DESC);

COMMENT ON COLUMN public.quotes.status IS
  'draft | new | discussing | priced | converted | declined';
COMMENT ON COLUMN public.quotes.quote_number IS
  'CI-Q-YYYY-NNNN once submitted; DRAFT-<browser key> while it is still an unfinished selection.';
