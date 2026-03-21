
-- Update kid_withdraw_savings to use crypt comparison
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
  IF _kid.pin != crypt(_pin, _kid.pin) THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _kid.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF _valor <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _kid.saldo_poupanca < _valor THEN
    RETURN json_build_object('success', false, 'error', 'Saldo de poupança insuficiente');
  END IF;
  UPDATE kids_profiles SET saldo = saldo + _valor, saldo_poupanca = saldo_poupanca - _valor WHERE id = _kid_id;
  RETURN json_build_object('success', true, 'novo_saldo', _kid.saldo + _valor, 'novo_poupanca', _kid.saldo_poupanca - _valor);
END;
$$;

-- Update kid_withdraw_commission to use crypt comparison
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
  IF _kid.pin != crypt(_pin, _kid.pin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _valor <= 0 OR _valor > _kid.saldo_comissao THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido ou insuficiente');
  END IF;
  UPDATE kids_profiles SET saldo_comissao = saldo_comissao - _valor, saldo = saldo + _valor WHERE id = _kid_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update kid_transfer_with_pin to use crypt comparison
CREATE OR REPLACE FUNCTION public.kid_transfer_with_pin(_from_kid_id uuid, _pin text, _to_codigo text, _valor numeric, _descricao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _from_kid kids_profiles%ROWTYPE;
  _to_kid kids_profiles%ROWTYPE;
  _today_spent numeric;
  _today_transfer numeric;
BEGIN
  SELECT * INTO _from_kid FROM kids_profiles WHERE id = _from_kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _from_kid.pin != crypt(_pin, _from_kid.pin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _from_kid.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF _from_kid.bloqueio_envio THEN
    RETURN jsonb_build_object('success', false, 'error', 'Envio bloqueado pelos seus pais');
  END IF;
  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;

  SELECT * INTO _to_kid FROM kids_profiles WHERE codigo_publico = _to_codigo;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destinatário não encontrado');
  END IF;
  IF _to_kid.id = _from_kid.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não é possível transferir para si mesmo');
  END IF;

  IF _from_kid.limite_diario IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_spent
    FROM transactions
    WHERE from_kid = _from_kid_id
      AND tipo IN ('transferencia', 'pagamento')
      AND status = 'aprovado'
      AND created_at >= date_trunc('day', now());
    IF (_today_spent + _valor) > _from_kid.limite_diario THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Limite diário excedido (R$ %s/%s)', (_today_spent)::text, (_from_kid.limite_diario)::text));
    END IF;
  END IF;

  IF _from_kid.limite_transferencia IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_transfer
    FROM transactions
    WHERE from_kid = _from_kid_id
      AND tipo = 'transferencia'
      AND status = 'aprovado'
      AND created_at >= date_trunc('day', now());
    IF (_today_transfer + _valor) > _from_kid.limite_transferencia THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Limite de transferência excedido (R$ %s/%s)', (_today_transfer)::text, (_from_kid.limite_transferencia)::text));
    END IF;
  END IF;

  IF _from_kid.saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  IF _from_kid.aprovacao_transferencias THEN
    INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status)
    VALUES ('transferencia', _from_kid.id, _to_kid.id, _valor, COALESCE(_descricao, 'Transferência'), 'pendente');
    RETURN jsonb_build_object('success', true, 'pending', true, 'message', 'Transferência enviada para aprovação dos pais');
  ELSE
    UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid.id;
    UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _to_kid.id;
    INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status)
    VALUES ('transferencia', _from_kid.id, _to_kid.id, _valor, COALESCE(_descricao, 'Transferência'), 'aprovado');
    RETURN jsonb_build_object('success', true, 'pending', false);
  END IF;
END;
$$;

-- Update kid_save_pix_contact to use crypt comparison
CREATE OR REPLACE FUNCTION public.kid_save_pix_contact(_kid_id uuid, _pin text, _nome text, _chave_pix text, _tipo_chave text DEFAULT 'outro'::text)
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
  IF _kid.pin != crypt(_pin, _kid.pin) THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  INSERT INTO kid_pix_contacts (kid_id, nome, chave_pix, tipo_chave)
  VALUES (_kid_id, _nome, _chave_pix, _tipo_chave);

  RETURN json_build_object('success', true);
END;
$$;
