
-- Function to look up a recipient by 5-digit code (kid or parent)
CREATE OR REPLACE FUNCTION public.lookup_by_code(_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _profile profiles%ROWTYPE;
BEGIN
  -- First check kids
  SELECT * INTO _kid FROM kids_profiles WHERE codigo_publico = _codigo;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'type', 'kid',
      'id', _kid.id::text,
      'nome', COALESCE(_kid.apelido, _kid.nome)
    );
  END IF;

  -- Then check parents
  SELECT * INTO _profile FROM profiles WHERE codigo_usuario = _codigo;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'type', 'responsavel',
      'id', _profile.user_id::text,
      'nome', _profile.nome
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Código não encontrado');
END;
$$;

-- Transfer with PIN validation
CREATE OR REPLACE FUNCTION public.kid_transfer_with_pin(
  _from_kid_id uuid,
  _to_codigo text,
  _valor numeric,
  _pin text,
  _descricao text DEFAULT 'Pagamento'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _from_kid kids_profiles%ROWTYPE;
  _to_kid kids_profiles%ROWTYPE;
  _today_spent numeric;
  _tx_status transaction_status;
  _tx_id uuid;
BEGIN
  -- Get sender and validate PIN
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
      AND status IN ('aprovado', 'pendente')
      AND created_at >= date_trunc('day', now());

    IF (_today_spent + _valor) > _from_kid.limite_diario THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Limite diário excedido (R$ %s/%s)', (_today_spent)::text, (_from_kid.limite_diario)::text));
    END IF;
  END IF;

  -- Determine status
  IF _from_kid.aprovacao_transferencias THEN
    _tx_status := 'pendente';
  ELSE
    _tx_status := 'aprovado';
  END IF;

  -- Try to find recipient as kid
  SELECT * INTO _to_kid FROM kids_profiles WHERE codigo_publico = _to_codigo;
  IF FOUND THEN
    IF _from_kid.id = _to_kid.id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Você não pode enviar para si mesmo');
    END IF;

    INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status)
    VALUES ('pagamento', _from_kid.id, _to_kid.id, _valor, _descricao, _tx_status)
    RETURNING id INTO _tx_id;

    IF _tx_status = 'aprovado' THEN
      UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid.id;
      UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _to_kid.id;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'status', _tx_status::text,
      'to_name', COALESCE(_to_kid.apelido, _to_kid.nome),
      'needs_approval', _from_kid.aprovacao_transferencias
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Destinatário não encontrado');
END;
$$;
