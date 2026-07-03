
CREATE POLICY "site-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "site-media admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff')));
CREATE POLICY "site-media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff')));
CREATE POLICY "site-media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'staff')));
