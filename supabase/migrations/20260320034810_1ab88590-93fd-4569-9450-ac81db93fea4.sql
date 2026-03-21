
CREATE OR REPLACE FUNCTION public.kid_withdraw_commission_no_pin(_kid_id uuid, _valor numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF v_kid.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF _valor <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _valor > v_kid.saldo_comissao THEN
    RETURN json_build_object('success', false, 'error', 'Saldo de comissão insuficiente');
  END IF;

  UPDATE kids_profiles SET saldo_comissao = saldo_comissao - _valor, saldo = saldo + _valor WHERE id = _kid_id;

  RETURN json_build_object('success', true, 'novo_saldo', (SELECT saldo FROM kids_profiles WHERE id = _kid_id), 'novo_comissao', (SELECT saldo_comissao FROM kids_profiles WHERE id = _kid_id));
END;
$$;
