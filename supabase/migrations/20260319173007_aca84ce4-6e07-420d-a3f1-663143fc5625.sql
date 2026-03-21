
-- Fix 1: kid_register_referral - add ownership check
CREATE OR REPLACE FUNCTION public.kid_register_referral(_kid_id uuid, _pin text, _referral_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _referrer kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;

  -- Ownership check: only the kid's guardian can register a referral
  IF _kid.user_responsavel != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT * INTO _referrer FROM kids_profiles WHERE codigo_publico = _referral_code AND is_mini_gerente = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;

  IF _referrer.id = _kid.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode se auto-indicar');
  END IF;

  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = _kid.user_responsavel) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seu responsável já foi indicado por um Mini Gerente');
  END IF;

  INSERT INTO referrals (referrer_kid_id, referred_user_id, referred_name, referred_codigo)
  VALUES (_referrer.id, _kid.user_responsavel, _kid.nome, _kid.codigo_publico);

  RETURN jsonb_build_object('success', true, 'referrer_name', COALESCE(_referrer.apelido, _referrer.nome));
END;
$function$;

-- Fix 2: Restrict kids_profiles UPDATE to non-financial columns only
-- Revoke general UPDATE and grant only safe columns
REVOKE UPDATE ON public.kids_profiles FROM authenticated;
GRANT UPDATE (nome, apelido, idade, aprovacao_transferencias, bloqueio_envio, limite_diario, pin, limite_pix, limite_transferencia) ON public.kids_profiles TO authenticated;
