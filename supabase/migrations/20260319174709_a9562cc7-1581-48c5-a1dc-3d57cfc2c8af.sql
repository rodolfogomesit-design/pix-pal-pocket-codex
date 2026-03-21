
-- Drop old overload of kid_transfer_with_pin with different arg order
DROP FUNCTION IF EXISTS public.kid_transfer_with_pin(uuid, text, text, numeric, text);

-- Recreate with extensions.crypt
CREATE OR REPLACE FUNCTION public.kid_transfer_with_pin(_from_kid_id uuid, _pin text, _to_codigo text, _valor numeric, _descricao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _from kids_profiles%ROWTYPE;
  _to kids_profiles%ROWTYPE;
  _to_profile profiles%ROWTYPE;
  _today_spent numeric;
  _tx_id uuid;
BEGIN
  SELECT * INTO _from FROM kids_profiles WHERE id = _from_kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;

  IF _from.pin != extensions.crypt(_pin, _from.pin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  IF _from.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta congelada');
  END IF;
  IF _from.bloqueio_envio THEN
    RETURN jsonb_build_object('success', false, 'error', 'Envio bloqueado pelos seus pais');
  END IF;
  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _valor > _from.saldo THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  IF _from.limite_diario IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_spent
    FROM transactions WHERE from_kid = _from_kid_id AND tipo IN ('transferencia', 'pagamento') AND status = 'aprovado' AND created_at >= date_trunc('day', now());
    IF (_today_spent + _valor) > _from.limite_diario THEN
      RETURN jsonb_build_object('success', false, 'error', format('Limite diário excedido (R$ %s/%s)', _today_spent::text, _from.limite_diario::text));
    END IF;
  END IF;

  IF _from.limite_transferencia IS NOT NULL AND _valor > _from.limite_transferencia THEN
    RETURN jsonb_build_object('success', false, 'error', format('Valor excede limite por transferência (R$ %s)', _from.limite_transferencia::text));
  END IF;

  SELECT * INTO _to FROM kids_profiles WHERE codigo_publico = _to_codigo;
  IF FOUND THEN
    IF _to.id = _from_kid_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Você não pode transferir para si mesmo');
    END IF;
    IF _from.aprovacao_transferencias THEN
      INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to.id, _valor, COALESCE(_descricao, 'Pagamento'), 'pendente');
      RETURN jsonb_build_object('success', true, 'needs_approval', true, 'to_name', COALESCE(_to.apelido, _to.nome));
    ELSE
      UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid_id;
      UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _to.id;
      INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to.id, _valor, COALESCE(_descricao, 'Pagamento'), 'aprovado');
      RETURN jsonb_build_object('success', true, 'needs_approval', false, 'to_name', COALESCE(_to.apelido, _to.nome));
    END IF;
  END IF;

  SELECT * INTO _to_profile FROM profiles WHERE codigo_usuario = _to_codigo;
  IF FOUND THEN
    IF _from.aprovacao_transferencias THEN
      INSERT INTO transactions (tipo, from_kid, to_user, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to_profile.user_id, _valor, COALESCE(_descricao, 'Pagamento'), 'pendente');
      RETURN jsonb_build_object('success', true, 'needs_approval', true, 'to_name', _to_profile.nome);
    ELSE
      UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid_id;
      UPDATE profiles SET saldo = saldo + _valor WHERE user_id = _to_profile.user_id;
      INSERT INTO transactions (tipo, from_kid, to_user, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to_profile.user_id, _valor, COALESCE(_descricao, 'Pagamento'), 'aprovado');
      RETURN jsonb_build_object('success', true, 'needs_approval', false, 'to_name', _to_profile.nome);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Código não encontrado');
END;
$function$;
