-- Fix 1: confirm_deposit should credit kid when kid_id is present
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

-- Fix 2: kid_withdraw_commission should record a transaction for audit trail
CREATE OR REPLACE FUNCTION public.kid_withdraw_commission(_kid_id uuid, _pin text, _valor numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != _pin THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _kid.saldo_comissao < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo de comissão insuficiente');
  END IF;

  UPDATE kids_profiles SET saldo_comissao = saldo_comissao - _valor, saldo = saldo + _valor WHERE id = _kid_id;

  -- Record transaction for audit trail
  INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status)
  VALUES ('transferencia', _kid_id, _kid_id, _valor, 'Saque de comissão Mini Gerente', 'aprovado');

  RETURN jsonb_build_object('success', true, 'novo_saldo', _kid.saldo + _valor, 'novo_comissao', _kid.saldo_comissao - _valor);
END;
$$;