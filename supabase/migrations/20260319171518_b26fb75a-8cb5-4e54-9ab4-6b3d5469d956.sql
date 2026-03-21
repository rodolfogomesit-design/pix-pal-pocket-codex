
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Trigger to auto-hash PIN on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.hash_kid_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only hash if pin is being set and is not already a bcrypt hash
  IF NEW.pin IS NOT NULL AND NEW.pin NOT LIKE '$2a$%' AND NEW.pin NOT LIKE '$2b$%' THEN
    NEW.pin := crypt(NEW.pin, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hash_kid_pin ON public.kids_profiles;
CREATE TRIGGER trg_hash_kid_pin
  BEFORE INSERT OR UPDATE OF pin ON public.kids_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_kid_pin();

-- Hash all existing plain-text PINs
UPDATE public.kids_profiles
SET pin = crypt(pin, gen_salt('bf'))
WHERE pin NOT LIKE '$2a$%' AND pin NOT LIKE '$2b$%';

-- Update kid_login to use crypt comparison
CREATE OR REPLACE FUNCTION public.kid_login(_codigo text, _pin text)
 RETURNS TABLE(id uuid, nome text, apelido text, idade integer, codigo_publico text, saldo numeric, saldo_poupanca numeric, is_frozen boolean, limite_diario numeric, aprovacao_transferencias boolean, bloqueio_envio boolean, is_mini_gerente boolean, referral_code text, saldo_comissao numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.nome, k.apelido, k.idade, k.codigo_publico,
         k.saldo, k.saldo_poupanca, k.is_frozen,
         k.limite_diario, k.aprovacao_transferencias, k.bloqueio_envio,
         k.is_mini_gerente, k.referral_code, k.saldo_comissao
  FROM kids_profiles k
  WHERE (k.codigo_publico = _codigo OR LOWER(k.nome) = LOWER(_codigo))
    AND k.pin = crypt(_pin, k.pin);
END;
$$;

-- Update kid_save_contact to use crypt comparison
CREATE OR REPLACE FUNCTION public.kid_save_contact(_kid_id uuid, _pin text, _contact_codigo text, _contact_nome text, _contact_type text DEFAULT 'kid'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  
  IF _kid.pin != crypt(_pin, _kid.pin) THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  INSERT INTO kid_contacts (kid_id, contact_codigo, contact_nome, contact_type)
  VALUES (_kid_id, _contact_codigo, _contact_nome, _contact_type)
  ON CONFLICT (kid_id, contact_codigo) DO UPDATE SET contact_nome = EXCLUDED.contact_nome;

  RETURN json_build_object('success', true);
END;
$$;

-- Update kid_deposit_savings to use crypt comparison
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
  IF _kid.pin != crypt(_pin, _kid.pin) THEN
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

-- Update kid_request_pix_payment to use crypt comparison
CREATE OR REPLACE FUNCTION public.kid_request_pix_payment(_kid_id uuid, _pin text, _nome_destinatario text, _chave_pix text, _tipo_chave text, _valor numeric, _descricao text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_kid RECORD;
  _today_spent numeric;
  _today_pix numeric;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id;
  IF v_kid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;
  IF v_kid.pin != crypt(_pin, v_kid.pin) THEN
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

  UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _kid_id;
  INSERT INTO kid_pix_requests (kid_id, nome_destinatario, chave_pix, tipo_chave, valor, descricao, status)
  VALUES (_kid_id, _nome_destinatario, _chave_pix, _tipo_chave, _valor, _descricao, 'aprovado');
  INSERT INTO transactions (tipo, from_kid, valor, descricao, status)
  VALUES ('pagamento', _kid_id, _valor, COALESCE(_descricao, 'Pagamento Pix para ' || _nome_destinatario), 'aprovado');

  RETURN json_build_object('success', true, 'message', 'Pagamento Pix realizado com sucesso!');
END;
$$;
