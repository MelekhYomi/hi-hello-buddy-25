REVOKE EXECUTE ON FUNCTION public.next_document_number(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_document_number(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_document_number(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.next_document_number(TEXT) TO service_role;

-- Explicit deny-all policy so the counters table is documented as server-only
CREATE POLICY "document_counters_no_client_access" ON public.document_counters FOR SELECT TO authenticated USING (false);