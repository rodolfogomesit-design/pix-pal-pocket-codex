
CREATE OR REPLACE FUNCTION public.kid_deposit_savings(_kid_id uuid, _pin text, _valor numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != _pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _kid.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF _valor <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _kid.saldo < _valor THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;
  UPDATE kids_profiles SET saldo = saldo - _valor, saldo_poupanca = saldo_poupanca + _valor WHERE id = _kid_id;
  RETURN json_build_object('success', true, 'novo_saldo', _kid.saldo - _valor, 'novo_poupanca', _kid.saldo_poupanca + _valor);
END;
$$;

CREATE OR REPLACE FUNCTION public.kid_withdraw_savings(_kid_id uuid, _pin text, _valor numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != _pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _kid.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF _valor <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _kid.saldo_poupanca < _valor THEN
    RETURN json_build_object('success', false, 'error', 'Saldo na poupança insuficiente');
  END IF;
  UPDATE kids_profiles SET saldo = saldo + _valor, saldo_poupanca = saldo_poupanca - _valor WHERE id = _kid_id;
  RETURN json_build_object('success', true, 'novo_saldo', _kid.saldo + _valor, 'novo_poupanca', _kid.saldo_poupanca - _valor);
END;
$$;
