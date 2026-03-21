
-- Fix remaining 7 functions to use extensions.crypt() and extensions.gen_salt()

-- 1. hash_kid_pin
CREATE OR REPLACE FUNCTION public.hash_kid_pin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.pin IS NOT NULL AND NEW.pin NOT LIKE '$2a$%' AND NEW.pin NOT LIKE '$2b$%' THEN
    NEW.pin := extensions.crypt(NEW.pin, extensions.gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. kid_login
CREATE OR REPLACE FUNCTION public.kid_login(_codigo text, _pin text)
 RETURNS TABLE(id uuid, nome text, apelido text, idade integer, codigo_publico text, saldo numeric, saldo_poupanca numeric, is_frozen boolean, limite_diario numeric, aprovacao_transferencias boolean, bloqueio_envio boolean, is_mini_gerente boolean, referral_code text, saldo_comissao numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT k.id, k.nome, k.apelido, k.idade, k.codigo_publico,
         k.saldo, k.saldo_poupanca, k.is_frozen,
         k.limite_diario, k.aprovacao_transferencias, k.bloqueio_envio,
         k.is_mini_gerente, k.referral_code, k.saldo_comissao
  FROM kids_profiles k
  WHERE (k.codigo_publico = _codigo OR LOWER(k.nome) = LOWER(_codigo))
    AND k.pin = extensions.crypt(_pin, k.pin);
END;
$function$;

-- 3. kid_transfer_with_pin
CREATE OR REPLACE FUNCTION public.kid_transfer_with_pin(_from_kid_id uuid, _to_codigo text, _valor numeric, _pin text, _descricao text DEFAULT 'Pagamento'::text)
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
      INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to.id, _valor, _descricao, 'pendente') RETURNING id INTO _tx_id;
      RETURN jsonb_build_object('success', true, 'needs_approval', true, 'to_name', COALESCE(_to.apelido, _to.nome));
    ELSE
      UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid_id;
      UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _to.id;
      INSERT INTO transactions (tipo, from_kid, to_kid, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to.id, _valor, _descricao, 'aprovado');
      RETURN jsonb_build_object('success', true, 'needs_approval', false, 'to_name', COALESCE(_to.apelido, _to.nome));
    END IF;
  END IF;

  SELECT * INTO _to_profile FROM profiles WHERE codigo_usuario = _to_codigo;
  IF FOUND THEN
    IF _from.aprovacao_transferencias THEN
      INSERT INTO transactions (tipo, from_kid, to_user, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to_profile.user_id, _valor, _descricao, 'pendente');
      RETURN jsonb_build_object('success', true, 'needs_approval', true, 'to_name', _to_profile.nome);
    ELSE
      UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _from_kid_id;
      UPDATE profiles SET saldo = saldo + _valor WHERE user_id = _to_profile.user_id;
      INSERT INTO transactions (tipo, from_kid, to_user, valor, descricao, status) VALUES ('transferencia', _from_kid_id, _to_profile.user_id, _valor, _descricao, 'aprovado');
      RETURN jsonb_build_object('success', true, 'needs_approval', false, 'to_name', _to_profile.nome);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Código não encontrado');
END;
$function$;

-- 4. kid_request_pix_payment
CREATE OR REPLACE FUNCTION public.kid_request_pix_payment(_kid_id uuid, _pin text, _nome_destinatario text, _chave_pix text, _tipo_chave text, _valor numeric, _descricao text DEFAULT NULL::text)
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
  IF v_kid.pin != extensions.crypt(_pin, v_kid.pin) THEN
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

-- 5. kid_save_contact
CREATE OR REPLACE FUNCTION public.kid_save_contact(_kid_id uuid, _pin text, _contact_codigo text, _contact_nome text, _contact_type text DEFAULT 'kid'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != extensions.crypt(_pin, _kid.pin) THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  INSERT INTO kid_contacts (kid_id, contact_codigo, contact_nome, contact_type) VALUES (_kid_id, _contact_codigo, _contact_nome, _contact_type) ON CONFLICT (kid_id, contact_codigo) DO UPDATE SET contact_nome = EXCLUDED.contact_nome;
  RETURN json_build_object('success', true);
END;
$function$;

-- 6. kid_save_pix_contact
CREATE OR REPLACE FUNCTION public.kid_save_pix_contact(_kid_id uuid, _pin text, _nome text, _chave_pix text, _tipo_chave text DEFAULT 'outro'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != extensions.crypt(_pin, _kid.pin) THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  INSERT INTO kid_pix_contacts (kid_id, nome, chave_pix, tipo_chave) VALUES (_kid_id, _nome, _chave_pix, _tipo_chave);
  RETURN json_build_object('success', true);
END;
$function$;

-- 7. kid_withdraw_commission
CREATE OR REPLACE FUNCTION public.kid_withdraw_commission(_kid_id uuid, _pin text, _valor numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != extensions.crypt(_pin, _kid.pin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _valor > _kid.saldo_comissao THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo de comissão insuficiente');
  END IF;
  UPDATE kids_profiles SET saldo = saldo + _valor, saldo_comissao = saldo_comissao - _valor WHERE id = _kid_id;
  RETURN jsonb_build_object('success', true);
END;
$function$;
