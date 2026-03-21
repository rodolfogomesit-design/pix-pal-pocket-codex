
CREATE OR REPLACE FUNCTION public.update_referral(_referred_user_id uuid, _new_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_kid kids_profiles%ROWTYPE;
  _old_referral referrals%ROWTYPE;
BEGIN
  IF auth.uid() != _referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT * INTO _new_kid FROM kids_profiles WHERE codigo_publico = _new_referral_code AND is_mini_gerente = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de Mini Gerente inválido');
  END IF;

  SELECT * INTO _old_referral FROM referrals WHERE referred_user_id = _referred_user_id;
  
  IF FOUND THEN
    IF _old_referral.referrer_kid_id = _new_kid.id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este Mini Gerente já está cadastrado');
    END IF;
    UPDATE referrals 
    SET referrer_kid_id = _new_kid.id, 
        referred_name = COALESCE((SELECT nome FROM profiles WHERE user_id = _referred_user_id), ''),
        referred_codigo = COALESCE((SELECT codigo_usuario FROM profiles WHERE user_id = _referred_user_id), '')
    WHERE referred_user_id = _referred_user_id;
  ELSE
    INSERT INTO referrals (referrer_kid_id, referred_user_id, referred_name, referred_codigo)
    VALUES (_new_kid.id, _referred_user_id, 
      COALESCE((SELECT nome FROM profiles WHERE user_id = _referred_user_id), ''),
      COALESCE((SELECT codigo_usuario FROM profiles WHERE user_id = _referred_user_id), ''));
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
