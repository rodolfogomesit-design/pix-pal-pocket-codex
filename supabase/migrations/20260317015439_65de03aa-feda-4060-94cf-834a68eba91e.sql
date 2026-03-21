
CREATE OR REPLACE FUNCTION public.admin_get_kid_referrals(_kid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referrals', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      FROM (
        SELECT ref.id, ref.referred_name, ref.referred_codigo, ref.status, ref.created_at,
          (SELECT COALESCE(SUM(rc.valor_comissao), 0) FROM referral_commissions rc WHERE rc.referral_id = ref.id AND rc.status = 'aprovado') as total_comissao
        FROM referrals ref
        WHERE ref.referrer_kid_id = _kid_id
        ORDER BY ref.created_at DESC
      ) r
    )
  );
END;
$$;
