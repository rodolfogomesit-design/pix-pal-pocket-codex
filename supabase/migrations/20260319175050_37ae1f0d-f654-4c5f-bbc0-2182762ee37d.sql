
-- Fix 1: Transactions INSERT policy - restrict from_kid to guardian's kids
DROP POLICY IF EXISTS "Parents can create transactions" ON public.transactions;
CREATE POLICY "Parents can create transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = from_user
  AND (
    from_kid IS NULL
    OR is_guardian(auth.uid(), from_kid)
  )
);

-- Fix 2: Deposits INSERT policy - enforce status = 'pendente' on insert
DROP POLICY IF EXISTS "Users can insert their own deposits" ON public.deposits;
CREATE POLICY "Users can insert their own deposits"
ON public.deposits
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pendente'
);
