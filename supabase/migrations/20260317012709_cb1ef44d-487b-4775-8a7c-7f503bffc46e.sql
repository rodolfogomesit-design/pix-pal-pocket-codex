
-- Helper function to get effective fee for a user (checks custom first, then global)
CREATE OR REPLACE FUNCTION public.get_user_fee(_user_id uuid, _fee_key text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _custom_val text;
  _global_val text;
BEGIN
  -- Check custom fee first
  SELECT fee_value INTO _custom_val
  FROM user_custom_fees
  WHERE user_id = _user_id AND fee_key = _fee_key;

  IF _custom_val IS NOT NULL THEN
    RETURN _custom_val::numeric;
  END IF;

  -- Fall back to global
  SELECT value INTO _global_val
  FROM platform_settings
  WHERE key = _fee_key;

  RETURN COALESCE(_global_val::numeric, 0);
END;
$$;

-- Update process_referral_commission to use per-user custom fees
CREATE OR REPLACE FUNCTION public.process_referral_commission(_deposit_id uuid, _user_id uuid, _valor numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referral referrals%ROWTYPE;
  _taxa numeric;
  _comissao numeric;
BEGIN
  -- Check if this user was referred by someone
  SELECT * INTO _referral FROM referrals WHERE referred_user_id = _user_id AND status = 'ativo';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get commission rate: check user custom fee first, then global
  _taxa := public.get_user_fee(_user_id, 'mini_gerente_taxa');

  _comissao := ROUND((_valor * _taxa / 100), 2);
  IF _comissao <= 0 THEN
    RETURN;
  END IF;

  -- Record commission
  INSERT INTO referral_commissions (referral_id, referrer_kid_id, deposit_id, valor_deposito, taxa_percentual, valor_comissao, status)
  VALUES (_referral.id, _referral.referrer_kid_id, _deposit_id, _valor, _taxa, _comissao, 'aprovado');

  -- Credit kid's commission balance
  UPDATE kids_profiles SET saldo_comissao = saldo_comissao + _comissao WHERE id = _referral.referrer_kid_id;
END;
$$;
