
-- Add limit columns to profiles (responsável)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS limite_diario numeric DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS limite_deposito numeric DEFAULT NULL;

-- Admin update responsável limits
CREATE OR REPLACE FUNCTION public.admin_update_user_limits(
  _user_id uuid,
  _limite_diario numeric DEFAULT NULL,
  _limite_deposito numeric DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE profiles SET
    limite_diario = _limite_diario,
    limite_deposito = _limite_deposito
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update send_allowance_from_balance to check parent daily limit
CREATE OR REPLACE FUNCTION public.send_allowance_from_balance(_kid_id uuid, _valor numeric, _descricao text DEFAULT 'Mesada'::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _parent_id uuid;
  _parent profiles%ROWTYPE;
  _kid kids_profiles%ROWTYPE;
  _today_spent numeric;
BEGIN
  _parent_id := auth.uid();

  SELECT * INTO _parent FROM profiles WHERE user_id = _parent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;

  IF _parent.saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente. Deposite mais fundos.');
  END IF;

  -- Check parent daily limit
  IF _parent.limite_diario IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_spent
    FROM transactions
    WHERE from_user = _parent_id
      AND status = 'aprovado'
      AND created_at >= date_trunc('day', now());
    IF (_today_spent + _valor) > _parent.limite_diario THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Limite diário do responsável excedido (R$ %s/%s)', (_today_spent)::text, (_parent.limite_diario)::text));
    END IF;
  END IF;

  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = _parent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  IF _kid.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'A conta do filho está congelada');
  END IF;

  UPDATE profiles SET saldo = saldo - _valor WHERE user_id = _parent_id;
  UPDATE kids_profiles SET saldo = saldo + _valor WHERE id = _kid_id;

  INSERT INTO transactions (tipo, from_user, to_kid, valor, descricao, status)
  VALUES ('mesada', _parent_id, _kid_id, _valor, _descricao, 'aprovado');

  PERFORM process_referral_commission(null, _parent_id, _valor);

  RETURN jsonb_build_object('success', true, 'new_parent_balance', _parent.saldo - _valor);
END;
$$;

-- Update confirm_deposit to check deposit limit
CREATE OR REPLACE FUNCTION public.confirm_deposit_by_external_id(p_external_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _deposit deposits%ROWTYPE;
  _parent profiles%ROWTYPE;
  _today_deposits numeric;
BEGIN
  SELECT * INTO _deposit FROM deposits WHERE external_id = p_external_id AND status = 'pendente';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check deposit limit
  SELECT * INTO _parent FROM profiles WHERE user_id = _deposit.user_id;
  IF _parent.limite_deposito IS NOT NULL THEN
    SELECT COALESCE(SUM(valor), 0) INTO _today_deposits
    FROM deposits
    WHERE user_id = _deposit.user_id
      AND status = 'confirmado'
      AND created_at >= date_trunc('day', now());
    IF (_today_deposits + _deposit.valor) > _parent.limite_deposito THEN
      UPDATE deposits SET status = 'limite_excedido', updated_at = now() WHERE id = _deposit.id;
      RETURN;
    END IF;
  END IF;

  UPDATE deposits SET status = 'confirmado', updated_at = now() WHERE id = _deposit.id;
  UPDATE profiles SET saldo = saldo + _deposit.valor WHERE user_id = _deposit.user_id;
  PERFORM process_referral_commission(_deposit.id, _deposit.user_id, _deposit.valor);
END;
$$;
