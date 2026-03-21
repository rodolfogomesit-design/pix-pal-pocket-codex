
-- Update confirm_deposit to also process referral commission
CREATE OR REPLACE FUNCTION public.confirm_deposit_by_external_id(p_external_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Credit parent's balance
  UPDATE profiles SET saldo = saldo + _deposit.valor WHERE user_id = _deposit.user_id;

  -- Process referral commission if applicable
  PERFORM process_referral_commission(_deposit.id, _deposit.user_id, _deposit.valor);
END;
$$;

-- Also process commission when parent sends allowance (mesada)
CREATE OR REPLACE FUNCTION public.send_allowance_from_balance(_kid_id uuid, _valor numeric, _descricao text DEFAULT 'Mesada'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _parent_id uuid;
  _parent_saldo numeric;
  _kid kids_profiles%ROWTYPE;
BEGIN
  _parent_id := auth.uid();

  SELECT saldo INTO _parent_saldo FROM profiles WHERE user_id = _parent_id;
  IF _parent_saldo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;

  IF _parent_saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente. Deposite mais fundos.');
  END IF;

  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = _parent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  IF _kid.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'A conta do filho está congelada');
  END IF;

  UPDATE profiles SET saldo = saldo - _valor WHERE user_id = _parent_id;
  UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _kid_id;

  INSERT INTO transactions (tipo, from_user, to_kid, valor, descricao, status)
  VALUES ('mesada', _parent_id, _kid_id, _valor, _descricao, 'aprovado');

  -- Process referral commission on deposits/mesadas
  PERFORM process_referral_commission(null, _parent_id, _valor);

  RETURN jsonb_build_object('success', true, 'new_parent_balance', _parent_saldo - _valor);
END;
$$;
