CREATE OR REPLACE FUNCTION public.kid_register_referral(_kid_id uuid, _pin text, _referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _referrer kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;

  IF _kid.pin != _pin THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  -- Find the referrer mini gerente
  SELECT * INTO _referrer FROM kids_profiles WHERE referral_code = _referral_code AND is_mini_gerente = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;

  -- Can't refer yourself
  IF _referrer.id = _kid.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode se auto-indicar');
  END IF;

  -- Check if parent already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = _kid.user_responsavel) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seu responsável já foi indicado por um Mini Gerente');
  END IF;

  -- Register referral using the parent's user_id
  INSERT INTO referrals (referrer_kid_id, referred_user_id, referred_name, referred_codigo)
  VALUES (_referrer.id, _kid.user_responsavel, _kid.nome, _kid.codigo_publico);

  RETURN jsonb_build_object('success', true, 'referrer_name', COALESCE(_referrer.apelido, _referrer.nome));
END;
$$;