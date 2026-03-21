CREATE POLICY "Anyone can read settings publicly"
ON public.platform_settings FOR SELECT
TO anon
USING (true);