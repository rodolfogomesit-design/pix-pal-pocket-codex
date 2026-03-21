
CREATE OR REPLACE FUNCTION public.get_kid_referral_stats(_kid_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _total_referrals integer;
  _total_earned numeric;
  _saldo_comissao numeric;
  _kid kids_profiles%ROWTYPE;
  _existing_referrer jsonb;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kid não encontrado');
  END IF;

  SELECT COUNT(*) INTO _total_referrals FROM referrals WHERE referrer_kid_id = _kid_id;
  SELECT COALESCE(SUM(valor_comissao), 0) INTO _total_earned FROM referral_commissions WHERE referrer_kid_id = _kid_id AND status = 'aprovado';
  SELECT COALESCE(saldo_comissao, 0) INTO _saldo_comissao FROM kids_profiles WHERE id = _kid_id;

  -- Check if the parent already has a referrer registered (by any kid)
  SELECT jsonb_build_object(
    'referrer_name', COALESCE(rk.apelido, rk.nome),
    'referrer_codigo', rk.codigo_publico
  ) INTO _existing_referrer
  FROM referrals r
  JOIN kids_profiles rk ON rk.id = r.referrer_kid_id
  WHERE r.referred_user_id = _kid.user_responsavel
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'total_referrals', _total_referrals,
    'total_earned', _total_earned,
    'saldo_comissao', _saldo_comissao,
    'existing_referrer', _existing_referrer,
    'referrals', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      FROM (
        SELECT ref.id, ref.referred_name, ref.referred_codigo, ref.status, ref.created_at,
          (SELECT COALESCE(SUM(rc.valor_comissao), 0) FROM referral_commissions rc WHERE rc.referral_id = ref.id AND rc.status = 'aprovado') as total_comissao
        FROM referrals ref
        WHERE ref.referrer_kid_id = _kid_id
        ORDER BY ref.created_at DESC
      ) r
    ),
    'commissions', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT rc.id, rc.valor_deposito, rc.taxa_percentual, rc.valor_comissao, rc.status, rc.created_at
        FROM referral_commissions rc
        WHERE rc.referrer_kid_id = _kid_id
        ORDER BY rc.created_at DESC
        LIMIT 30
      ) c
    )
  );
END;
$function$;
