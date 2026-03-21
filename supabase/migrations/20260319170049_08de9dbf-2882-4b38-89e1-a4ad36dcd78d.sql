
-- =============================================
-- 1. FIX: kids_profiles - change {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Guardians can create kids" ON public.kids_profiles;
CREATE POLICY "Guardians can create kids" ON public.kids_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_responsavel) OR (EXISTS (
      SELECT 1 FROM secondary_guardians
      WHERE secondary_guardians.primary_user_id = kids_profiles.user_responsavel
        AND secondary_guardians.secondary_user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Guardians can delete kids" ON public.kids_profiles;
CREATE POLICY "Guardians can delete kids" ON public.kids_profiles
  FOR DELETE TO authenticated
  USING (
    (auth.uid() = user_responsavel) OR (EXISTS (
      SELECT 1 FROM secondary_guardians
      WHERE secondary_guardians.primary_user_id = kids_profiles.user_responsavel
        AND secondary_guardians.secondary_user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Guardians can update kids" ON public.kids_profiles;
CREATE POLICY "Guardians can update kids" ON public.kids_profiles
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_responsavel) OR (EXISTS (
      SELECT 1 FROM secondary_guardians
      WHERE secondary_guardians.primary_user_id = kids_profiles.user_responsavel
        AND secondary_guardians.secondary_user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Guardians can view kids" ON public.kids_profiles;
CREATE POLICY "Guardians can view kids" ON public.kids_profiles
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_responsavel) OR (EXISTS (
      SELECT 1 FROM secondary_guardians
      WHERE secondary_guardians.primary_user_id = kids_profiles.user_responsavel
        AND secondary_guardians.secondary_user_id = auth.uid()
    ))
  );

-- =============================================
-- 2. FIX: transactions - change {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Guardians can update transaction status" ON public.transactions;
CREATE POLICY "Guardians can update transaction status" ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = transactions.to_kid AND is_guardian(auth.uid(), kids_profiles.id)))
    OR (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = transactions.from_kid AND is_guardian(auth.uid(), kids_profiles.id)))
  );

DROP POLICY IF EXISTS "Guardians can view transactions of their kids" ON public.transactions;
CREATE POLICY "Guardians can view transactions of their kids" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = from_user) OR (auth.uid() = to_user)
    OR (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = transactions.from_kid AND is_guardian(auth.uid(), kids_profiles.id)))
    OR (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = transactions.to_kid AND is_guardian(auth.uid(), kids_profiles.id)))
  );

DROP POLICY IF EXISTS "Parents can create transactions" ON public.transactions;
CREATE POLICY "Parents can create transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user);

-- =============================================
-- 3. FIX: savings_goals - change {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Guardians can create kids goals" ON public.savings_goals;
CREATE POLICY "Guardians can create kids goals" ON public.savings_goals
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = savings_goals.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));

DROP POLICY IF EXISTS "Guardians can delete kids goals" ON public.savings_goals;
CREATE POLICY "Guardians can delete kids goals" ON public.savings_goals
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = savings_goals.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));

DROP POLICY IF EXISTS "Guardians can update kids goals" ON public.savings_goals;
CREATE POLICY "Guardians can update kids goals" ON public.savings_goals
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = savings_goals.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));

DROP POLICY IF EXISTS "Guardians can view kids goals" ON public.savings_goals;
CREATE POLICY "Guardians can view kids goals" ON public.savings_goals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = savings_goals.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));

-- =============================================
-- 4. FIX: profiles - change {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 5. ADD: secondary_guardians UPDATE policy
-- =============================================
CREATE POLICY "Primary can update secondary guardians" ON public.secondary_guardians
  FOR UPDATE TO authenticated
  USING (primary_user_id = auth.uid());

-- =============================================
-- 6. ADD: kid_contacts missing INSERT/UPDATE/DELETE policies
-- =============================================
CREATE POLICY "Guardians can insert kid contacts" ON public.kid_contacts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = kid_contacts.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));

CREATE POLICY "Guardians can update kid contacts" ON public.kid_contacts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = kid_contacts.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));

CREATE POLICY "Guardians can delete kid contacts" ON public.kid_contacts
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM kids_profiles WHERE kids_profiles.id = kid_contacts.kid_id AND is_guardian(auth.uid(), kids_profiles.id)));
