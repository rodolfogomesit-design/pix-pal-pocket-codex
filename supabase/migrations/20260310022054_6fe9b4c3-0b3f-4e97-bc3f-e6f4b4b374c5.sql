
-- RPC for kid-to-kid transfer via public code
-- Handles: balance check, daily limit, frozen check, send block, approval mode
CREATE OR REPLACE FUNCTION public.kid_transfer(
  _from_kid_id uuid,
  _to_codigo text,
  _valor numeric,
  _descricao text DEFAULT 'Transferência'
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
  -- Get sender
  SELECT * INTO _from_kid FROM kids_profiles WHERE id = _from_kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Remetente não encontrado');
  END IF;

  -- Check frozen
  IF _from_kid.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sua conta está congelada');
  END IF;

  -- Check send block
  IF _from_kid.bloqueio_envio THEN
    RETURN jsonb_build_object('success', false, 'error', 'Envio bloqueado pelos seus pais');
  END IF;

  -- Get receiver by public code
  SELECT * INTO _to_kid FROM kids_profiles WHERE codigo_publico = _to_codigo;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código não encontrado');
  END IF;

  -- Can't send to self
  IF _from_kid.id = _to_kid.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode enviar para si mesmo');
  END IF;

  -- Check balance
  IF _from_kid.saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  -- Check daily limit
  IF _from_kid.limite_diario IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_spent
    FROM transactions
    WHERE from_kid = _from_kid_id
      AND tipo = 'transferencia'
      AND status IN ('aprovado', 'pendente')
      AND created_at >= date_trunc('day', now());

    IF (_today_spent + _valor) > _from_kid.limite_diario THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Limite diário excedido (R$ %s/%s)', (_today_spent)::text, (_from_kid.limite_diario)::text));
    END IF;
  END IF;

  -- Determine status based on approval mode
  IF _from_kid.aprovacao_transferencias THEN
    _tx_status := 'pendente';
  ELSE
    _tx_status := 'aprovado';
  END IF;

  -- Create transaction
  INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status)
  VALUES ('transferencia', _from_kid.id, _to_kid.id, _valor, _descricao, _tx_status)
  RETURNING id INTO _tx_id;

  -- If approved immediately, update balances
  IF _tx_status = 'aprovado' THEN
    UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid.id;
    UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _to_kid.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', _tx_status::text,
    'tx_id', _tx_id::text,
    'to_name', COALESCE(_to_kid.apelido, _to_kid.nome),
    'needs_approval', _from_kid.aprovacao_transferencias
  );
END;
$$;

-- RPC for parent to approve/reject a pending transfer
CREATE OR REPLACE FUNCTION public.approve_transfer(
  _tx_id uuid,
  _approved boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tx transactions%ROWTYPE;
  _from_kid kids_profiles%ROWTYPE;
  _parent_id uuid;
BEGIN
  _parent_id := auth.uid();

  -- Get transaction
  SELECT * INTO _tx FROM transactions WHERE id = _tx_id AND status = 'pendente' AND tipo = 'transferencia';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transação não encontrada ou já processada');
  END IF;

  -- Check parent owns the sender kid
  SELECT * INTO _from_kid FROM kids_profiles WHERE id = _tx.from_kid AND user_responsavel = _parent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  IF _approved THEN
    -- Check balance again
    IF _from_kid.saldo < _tx.valor THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;

    UPDATE transactions SET status = 'aprovado' WHERE id = _tx_id;
    UPDATE kids_profiles SET saldo = saldo - _tx.valor WHERE id = _tx.from_kid;
    UPDATE kids_profiles SET saldo = saldo + _tx.valor WHERE id = _tx.to_kid;
  ELSE
    UPDATE transactions SET status = 'recusado' WHERE id = _tx_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
