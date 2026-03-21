
-- Update toggle_mini_gerente to use pix+kid_id format
CREATE OR REPLACE FUNCTION public.toggle_mini_gerente(_kid_id uuid, _enable boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _code text;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  IF _enable THEN
    _code := 'pix' || replace(_kid_id::text, '-', '');
    UPDATE kids_profiles SET is_mini_gerente = true, referral_code = _code WHERE id = _kid_id;
    RETURN jsonb_build_object('success', true, 'referral_code', _code);
  ELSE
    UPDATE kids_profiles SET is_mini_gerente = false WHERE id = _kid_id;
    RETURN jsonb_build_object('success', true);
  END IF;
END;
$function$;

-- Update admin version too
CREATE OR REPLACE FUNCTION public.admin_toggle_mini_gerente(_kid_id uuid, _enable boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _code text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  IF _enable THEN
    _code := 'pix' || replace(_kid_id::text, '-', '');
    UPDATE kids_profiles SET is_mini_gerente = true, referral_code = _code WHERE id = _kid_id;
  ELSE
    UPDATE kids_profiles SET is_mini_gerente = false WHERE id = _kid_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Update register_referral to handle new format
CREATE OR REPLACE FUNCTION public.register_referral(_referral_code text, _referred_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE referral_code = _referral_code AND is_mini_gerente = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;

  SELECT * INTO _profile FROM profiles WHERE user_id = _referred_user_id;

  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = _referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário já foi indicado');
  END IF;

  INSERT INTO referrals (referrer_kid_id, referred_user_id, referred_name, referred_codigo)
  VALUES (_kid.id, _referred_user_id, COALESCE(_profile.nome, ''), COALESCE(_profile.codigo_usuario, ''));

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Update existing mini gerentes to new code format
UPDATE kids_profiles 
SET referral_code = 'pix' || replace(id::text, '-', '')
WHERE is_mini_gerente = true;
