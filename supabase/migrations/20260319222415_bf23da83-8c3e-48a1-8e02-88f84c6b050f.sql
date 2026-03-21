
-- Pix payment without PIN (kid already authenticated via login)
CREATE OR REPLACE FUNCTION public.kid_request_pix_payment_no_pin(
  _kid_id uuid, _nome_destinatario text, _chave_pix text, _tipo_chave text, _valor numeric, _descricao text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_kid RECORD;
  _today_spent numeric;
  _today_pix numeric;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id;
  IF v_kid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Criança não encontrada');
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

  IF v_kid.limite_diario IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_spent FROM transactions WHERE from_kid = _kid_id AND tipo IN ('transferencia', 'pagamento') AND status = 'aprovado' AND created_at >= date_trunc('day', now());
    IF (_today_spent + _valor) > v_kid.limite_diario THEN
      RETURN json_build_object('success', false, 'error', format('Limite diário excedido (R$ %s/%s)', _today_spent::text, v_kid.limite_diario::text));
    END IF;
  END IF;

  IF v_kid.limite_pix IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_pix FROM kid_pix_requests WHERE kid_id = _kid_id AND status = 'aprovado' AND created_at >= date_trunc('day', now());
    IF (_today_pix + _valor) > v_kid.limite_pix THEN
      RETURN json_build_object('success', false, 'error', format('Limite Pix excedido (R$ %s/%s)', _today_pix::text, v_kid.limite_pix::text));
    END IF;
  END IF;

  UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _kid_id;
  INSERT INTO kid_pix_requests (kid_id, nome_destinatario, chave_pix, tipo_chave, valor, descricao, status) VALUES (_kid_id, _nome_destinatario, _chave_pix, _tipo_chave, _valor, _descricao, 'aprovado');
  INSERT INTO transactions (tipo, from_kid, valor, descricao, status) VALUES ('pagamento', _kid_id, _valor, COALESCE(_descricao, 'Pagamento Pix para ' || _nome_destinatario), 'aprovado');

  RETURN json_build_object('success', true, 'message', 'Pagamento Pix realizado com sucesso!');
END;
$function$;
