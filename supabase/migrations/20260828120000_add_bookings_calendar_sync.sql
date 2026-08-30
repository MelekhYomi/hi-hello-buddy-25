-- Track the synced Google Calendar event for each booking so it can be
-- looked up, updated, or cancelled later, and so we can tell which
-- bookings still need a calendar event created.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT;
