
-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  valor numeric NOT NULL,
  chave_pix text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function to request withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(_valor numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _profile profiles%ROWTYPE;
  _withdrawal_id uuid;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _profile FROM profiles WHERE user_id = _user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;

  IF _profile.chave_pix IS NULL OR _profile.chave_pix = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chave Pix não cadastrada. Atualize seu perfil.');
  END IF;

  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;

  IF _profile.saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  -- Deduct balance
  UPDATE profiles SET saldo = saldo - _valor WHERE user_id = _user_id;

  -- Create withdrawal record
  INSERT INTO withdrawals (user_id, valor, chave_pix, status)
  VALUES (_user_id, _valor, _profile.chave_pix, 'solicitado')
  RETURNING id INTO _withdrawal_id;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', _withdrawal_id::text,
    'chave_pix', _profile.chave_pix,
    'valor', _valor
  );
END;
$$;
