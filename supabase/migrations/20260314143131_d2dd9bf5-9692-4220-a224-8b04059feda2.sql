
-- Create deposits table for tracking Pix deposits
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kid_id uuid REFERENCES public.kids_profiles(id) ON DELETE SET NULL,
  valor numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  external_id text UNIQUE,
  gateway_transaction_id text,
  pix_copy_paste text,
  pix_qrcode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view their own deposits"
ON public.deposits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own deposits
CREATE POLICY "Users can insert their own deposits"
ON public.deposits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create confirm_deposit function (called by webhook)
CREATE OR REPLACE FUNCTION public.confirm_deposit_by_external_id(p_external_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deposit deposits%ROWTYPE;
BEGIN
  SELECT * INTO _deposit FROM deposits WHERE external_id = p_external_id AND status = 'pendente';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Update deposit status
  UPDATE deposits SET status = 'confirmado', updated_at = now() WHERE id = _deposit.id;

  -- If kid_id is set, add to kid's balance
  IF _deposit.kid_id IS NOT NULL THEN
    UPDATE kids_profiles SET saldo = saldo + _deposit.valor WHERE id = _deposit.kid_id;

    -- Create transaction record
    INSERT INTO transactions (tipo, from_user, to_kid, valor, descricao, status)
    VALUES ('mesada', _deposit.user_id, _deposit.kid_id, _deposit.valor, 'Depósito via Pix', 'aprovado');
  END IF;
END;
$$;

-- Enable realtime for deposits
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
