
-- Update kid_transfer_with_pin to respect limite_transferencia
CREATE OR REPLACE FUNCTION public.kid_transfer_with_pin(_from_kid_id uuid, _to_codigo text, _valor numeric, _pin text, _descricao text DEFAULT 'Pagamento'::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _from_kid kids_profiles%ROWTYPE;
  _to_kid kids_profiles%ROWTYPE;
  _today_spent numeric;
  _today_transf numeric;
  _tx_id uuid;
BEGIN
  SELECT * INTO _from_kid FROM kids_profiles WHERE id = _from_kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Remetente não encontrado');
  END IF;
  IF _from_kid.pin != _pin THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _from_kid.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sua conta está congelada');
  END IF;
  IF _from_kid.bloqueio_envio THEN
    RETURN jsonb_build_object('success', false, 'error', 'Envio bloqueado pelos seus pais');
  END IF;
  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _from_kid.saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  -- Check daily limit
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

  -- Check transfer limit
  IF _from_kid.limite_transferencia IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_transf
    FROM transactions
    WHERE from_kid = _from_kid_id
      AND tipo IN ('transferencia', 'pagamento')
      AND status = 'aprovado'
      AND created_at >= date_trunc('day', now());
    IF (_today_transf + _valor) > _from_kid.limite_transferencia THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Limite de transferência excedido (R$ %s/%s)', (_today_transf)::text, (_from_kid.limite_transferencia)::text));
    END IF;
  END IF;

  -- Find recipient kid
  SELECT * INTO _to_kid FROM kids_profiles WHERE codigo_publico = _to_codigo;
  IF FOUND THEN
    IF _from_kid.id = _to_kid.id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Você não pode enviar para si mesmo');
    END IF;
    INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status)
    VALUES ('pagamento', _from_kid.id, _to_kid.id, _valor, _descricao, 'aprovado')
    RETURNING id INTO _tx_id;
    UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid.id;
    UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _to_kid.id;
    RETURN jsonb_build_object(
      'success', true, 'status', 'aprovado',
      'to_name', COALESCE(_to_kid.apelido, _to_kid.nome), 'needs_approval', false
    );
  END IF;
  RETURN jsonb_build_object('success', false, 'error', 'Destinatário não encontrado');
END;
$$;

-- Update kid_request_pix_payment to respect limite_pix
CREATE OR REPLACE FUNCTION public.kid_request_pix_payment(_kid_id uuid, _pin text, _nome_destinatario text, _chave_pix text, _tipo_chave text, _valor numeric, _descricao text DEFAULT NULL::text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_kid RECORD;
  _today_spent numeric;
  _today_pix numeric;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id;
  IF v_kid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;
  IF v_kid.pin != _pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF v_kid.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF v_kid.bloqueio_envio THEN
    RETURN json_build_object('success', false, 'error', 'Envio bloqueado pelos seus pais');
  END IF;
  IF _valor <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _valor > v_kid.saldo THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  -- Check daily limit
  IF v_kid.limite_diario IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_spent
    FROM transactions
    WHERE from_kid = _kid_id
      AND tipo IN ('transferencia', 'pagamento')
      AND status = 'aprovado'
      AND created_at >= date_trunc('day', now());
    IF (_today_spent + _valor) > v_kid.limite_diario THEN
      RETURN json_build_object('success', false, 'error',
        format('Limite diário excedido (R$ %s/%s)', (_today_spent)::text, (v_kid.limite_diario)::text));
    END IF;
  END IF;

  -- Check Pix limit
  IF v_kid.limite_pix IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_pix
    FROM kid_pix_requests
    WHERE kid_id = _kid_id
      AND status = 'aprovado'
      AND created_at >= date_trunc('day', now());
    IF (_today_pix + _valor) > v_kid.limite_pix THEN
      RETURN json_build_object('success', false, 'error',
        format('Limite Pix excedido (R$ %s/%s)', (_today_pix)::text, (v_kid.limite_pix)::text));
    END IF;
  END IF;

  -- Deduct balance
  UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _kid_id;
  -- Record pix request
  INSERT INTO kid_pix_requests (kid_id, nome_destinatario, chave_pix, tipo_chave, valor, descricao, status)
  VALUES (_kid_id, _nome_destinatario, _chave_pix, _tipo_chave, _valor, _descricao, 'aprovado');
  -- Record transaction
  INSERT INTO transactions (tipo, from_kid, valor, descricao, status)
  VALUES ('pagamento', _kid_id, _valor, COALESCE(_descricao, 'Pagamento Pix para ' || _nome_destinatario), 'aprovado');

  RETURN json_build_object('success', true, 'message', 'Pagamento Pix realizado com sucesso!');
END;
$$;
