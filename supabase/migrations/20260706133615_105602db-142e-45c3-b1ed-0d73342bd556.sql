-- 1. Orders INSERT: enforce user_id matches caller (or is null for guest)
DROP POLICY IF EXISTS "Anyone places order" ON public.orders;
CREATE POLICY "Place own order"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR user_id = auth.uid()
  );

-- 2. Order_items INSERT: only against an order the caller just placed / owns
DROP POLICY IF EXISTS "Anyone inserts order_items" ON public.order_items;
CREATE POLICY "Insert items on own order"
  ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          (auth.uid() IS NULL AND o.user_id IS NULL)
          OR o.user_id = auth.uid()
        )
    )
  );

-- 3. site_settings: restrict public SELECT to non-sensitive keys
DROP POLICY IF EXISTS "Anyone reads settings" ON public.site_settings;
CREATE POLICY "Public reads safe settings"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (
    key NOT IN ('paystack', 'termii', 'payment_mode', 'payment_provider')
  );

-- Staff/admin already have full access via existing "Admins/staff write settings" policy (FOR ALL)
