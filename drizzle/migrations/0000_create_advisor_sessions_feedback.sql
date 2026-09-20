CREATE TABLE public.advisor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  anon_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  brief text NOT NULL,
  budget text,
  advice jsonb NOT NULL,
  rating text CHECK (rating IN ('up','down')),
  comment text,
  rated_at timestamptz,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL
);

CREATE INDEX advisor_sessions_created_idx ON public.advisor_sessions (created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.advisor_sessions TO authenticated;
GRANT ALL ON public.advisor_sessions TO service_role;

ALTER TABLE public.advisor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read advisor sessions"
  ON public.advisor_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Staff manage advisor sessions"
  ON public.advisor_sessions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'super_admin'));
