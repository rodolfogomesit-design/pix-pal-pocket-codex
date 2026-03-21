
CREATE OR REPLACE FUNCTION public.admin_get_detailed_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_responsaveis integer;
  _total_criancas integer;
  _responsaveis_hoje integer;
  _criancas_hoje integer;
  _responsaveis_mes integer;
  _criancas_mes integer;
  _responsaveis_ativos_24h integer;
  _responsaveis_ativos_30d integer;
  _total_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  -- Total counts
  SELECT COUNT(*) INTO _total_responsaveis FROM profiles;
  SELECT COUNT(*) INTO _total_criancas FROM kids_profiles;

  -- Registered today
  SELECT COUNT(*) INTO _responsaveis_hoje FROM profiles WHERE created_at >= date_trunc('day', now());
  SELECT COUNT(*) INTO _criancas_hoje FROM kids_profiles WHERE created_at >= date_trunc('day', now());

  -- Registered this month
  SELECT COUNT(*) INTO _responsaveis_mes FROM profiles WHERE created_at >= date_trunc('month', now());
  SELECT COUNT(*) INTO _criancas_mes FROM kids_profiles WHERE created_at >= date_trunc('month', now());

  -- Active in last 24h (users who made transactions)
  SELECT COUNT(DISTINCT COALESCE(t.from_user, kp.user_responsavel)) INTO _responsaveis_ativos_24h
  FROM transactions t
  LEFT JOIN kids_profiles kp ON kp.id = t.from_kid OR kp.id = t.to_kid
  WHERE t.created_at >= now() - interval '24 hours';

  -- Active in last 30 days
  SELECT COUNT(DISTINCT COALESCE(t.from_user, kp.user_responsavel)) INTO _responsaveis_ativos_30d
  FROM transactions t
  LEFT JOIN kids_profiles kp ON kp.id = t.from_kid OR kp.id = t.to_kid
  WHERE t.created_at >= now() - interval '30 days';

  -- Total balance
  SELECT COALESCE(SUM(saldo), 0) INTO _total_balance FROM kids_profiles;

  RETURN jsonb_build_object(
    'success', true,
    'total_responsaveis', _total_responsaveis,
    'total_criancas', _total_criancas,
    'responsaveis_hoje', _responsaveis_hoje,
    'criancas_hoje', _criancas_hoje,
    'responsaveis_mes', _responsaveis_mes,
    'criancas_mes', _criancas_mes,
    'ativos_24h', _responsaveis_ativos_24h,
    'ativos_30d', _responsaveis_ativos_30d,
    'total_balance', _total_balance
  );
END;
$$;
