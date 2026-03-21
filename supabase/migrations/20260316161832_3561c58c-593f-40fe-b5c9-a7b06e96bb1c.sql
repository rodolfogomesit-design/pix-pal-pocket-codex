
-- Update toggle_mini_gerente to use just codigo_publico
CREATE OR REPLACE FUNCTION public.toggle_mini_gerente(_kid_id uuid, _enable boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  IF _enable THEN
    UPDATE kids_profiles SET is_mini_gerente = true, referral_code = _kid.codigo_publico WHERE id = _kid_id;
    RETURN jsonb_build_object('success', true, 'referral_code', _kid.codigo_publico);
  ELSE
    UPDATE kids_profiles SET is_mini_gerente = false WHERE id = _kid_id;
    RETURN jsonb_build_object('success', true);
  END IF;
END;
$function$;

-- Update admin version
CREATE OR REPLACE FUNCTION public.admin_toggle_mini_gerente(_kid_id uuid, _enable boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  IF _enable THEN
    SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
    UPDATE kids_profiles SET is_mini_gerente = true, referral_code = _kid.codigo_publico WHERE id = _kid_id;
  ELSE
    UPDATE kids_profiles SET is_mini_gerente = false WHERE id = _kid_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Update existing mini gerentes
UPDATE kids_profiles 
SET referral_code = codigo_publico
WHERE is_mini_gerente = true;
