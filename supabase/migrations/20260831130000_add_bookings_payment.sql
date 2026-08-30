-- Support paid consultations: track the fee, chosen payment method, and
-- payment status on each booking.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_ref TEXT;
