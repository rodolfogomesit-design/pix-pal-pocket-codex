CREATE POLICY "Parents can view kid contacts" ON public.kid_contacts
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM kids_profiles WHERE kids_profiles.id = kid_contacts.kid_id AND kids_profiles.user_responsavel = auth.uid()
));