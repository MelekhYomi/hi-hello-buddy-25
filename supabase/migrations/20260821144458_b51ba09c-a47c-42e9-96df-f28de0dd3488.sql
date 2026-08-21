-- =====================================================
-- Quote -> Invoice -> Payment -> Receipt workflow
-- =====================================================

-- Document numbering (collision-free)
CREATE TABLE public.document_counters (
  scope TEXT PRIMARY KEY,
  counter BIGINT NOT NULL DEFAULT 0
);
GRANT ALL ON public.document_counters TO service_role;
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_document_number(_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _scope TEXT;
  _n BIGINT;
BEGIN
  _scope := _prefix || '-' || to_char(now(), 'YYYY');
  INSERT INTO public.document_counters (scope, counter)
  VALUES (_scope, 1)
  ON CONFLICT (scope) DO UPDATE SET counter = public.document_counters.counter + 1
  RETURNING counter INTO _n;
  RETURN 'CI-' || _prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(_n::TEXT, 4, '0');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.next_document_number(TEXT) FROM anon, authenticated;

-- ============ QUOTES ============
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  public_token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  notes TEXT,
  preferred_contact TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'new',
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  has_custom_items BOOLEAN NOT NULL DEFAULT false,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_select_own_or_admin" ON public.quotes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'staff'));

CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'service',
  ref_id UUID,
  title_snapshot TEXT NOT NULL,
  description_snapshot TEXT,
  unit_price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_on_request BOOLEAN NOT NULL DEFAULT false,
  line_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_items_select_own_or_admin" ON public.quote_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (q.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'staff'))));

-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  public_token TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  notes TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  deposit_percent INTEGER NOT NULL DEFAULT 50,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT 'deposit',
  status TEXT NOT NULL DEFAULT 'sent',
  fulfilment_status TEXT NOT NULL DEFAULT 'awaiting_payment',
  delivery_choice TEXT,
  delivery_address TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_select_own_or_admin" ON public.invoices FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'staff'));

CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'service',
  ref_id UUID,
  title_snapshot TEXT NOT NULL,
  description_snapshot TEXT,
  unit_price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_on_request BOOLEAN NOT NULL DEFAULT false,
  line_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_items_select_own_or_admin" ON public.invoice_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'staff'))));

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'paystack',
  kind TEXT NOT NULL DEFAULT 'deposit',
  reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own_or_admin" ON public.payments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'staff'))));

-- ============ RECEIPTS ============
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  public_token TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'paystack',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts_select_own_or_admin" ON public.receipts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'staff'))));

-- ============ OUTBOUND MESSAGES (email / whatsapp log) ============
CREATE TABLE public.outbound_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'email',
  template TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  related_type TEXT,
  related_id UUID,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.outbound_messages TO service_role;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outbound_messages_admin_read" ON public.outbound_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- updated_at triggers
CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX quotes_email_idx ON public.quotes(email);
CREATE INDEX invoices_email_idx ON public.invoices(email);
CREATE INDEX quote_items_quote_idx ON public.quote_items(quote_id);
CREATE INDEX invoice_items_invoice_idx ON public.invoice_items(invoice_id);
CREATE INDEX payments_invoice_idx ON public.payments(invoice_id);

-- Billing defaults
INSERT INTO public.site_settings (key, value) VALUES
  ('billing', '{"deposit_percent":50,"quote_validity_days":14,"bank_name":"","account_name":"C Imperium Branding","account_number":"","invoice_footer":"Thank you for choosing C Imperium Branding.","terms":"Work commences after the agreed downpayment is confirmed. Balance is due on delivery."}'::jsonb)
ON CONFLICT (key) DO NOTHING;