
CREATE OR REPLACE FUNCTION public.admin_get_deposit_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _hoje_count integer;
  _hoje_valor numeric;
  _hoje_confirmado integer;
  _mes_count integer;
  _mes_valor numeric;
  _mes_confirmado integer;
  _total_count integer;
  _total_valor numeric;
  _total_confirmado integer;
  _recent jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  -- Hoje
  SELECT COUNT(*), COALESCE(SUM(valor), 0), COUNT(*) FILTER (WHERE status = 'confirmado')
  INTO _hoje_count, _hoje_valor, _hoje_confirmado
  FROM deposits WHERE created_at >= date_trunc('day', now());

  -- Mês
  SELECT COUNT(*), COALESCE(SUM(valor), 0), COUNT(*) FILTER (WHERE status = 'confirmado')
  INTO _mes_count, _mes_valor, _mes_confirmado
  FROM deposits WHERE created_at >= date_trunc('month', now());

  -- Total
  SELECT COUNT(*), COALESCE(SUM(valor), 0), COUNT(*) FILTER (WHERE status = 'confirmado')
  INTO _total_count, _total_valor, _total_confirmado
  FROM deposits;

  -- Recent deposits
  SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb) INTO _recent
  FROM (
    SELECT dep.id, dep.valor, dep.status, dep.created_at, dep.external_id,
      COALESCE(p.nome, '') as user_nome,
      COALESCE(k.nome, '') as kid_nome
    FROM deposits dep
    LEFT JOIN profiles p ON p.user_id = dep.user_id
    LEFT JOIN kids_profiles k ON k.id = dep.kid_id
    ORDER BY dep.created_at DESC
    LIMIT 30
  ) d;

  RETURN jsonb_build_object(
    'success', true,
    'hoje_count', _hoje_count,
    'hoje_valor', _hoje_valor,
    'hoje_confirmado', _hoje_confirmado,
    'mes_count', _mes_count,
    'mes_valor', _mes_valor,
    'mes_confirmado', _mes_confirmado,
    'total_count', _total_count,
    'total_valor', _total_valor,
    'total_confirmado', _total_confirmado,
    'recent', _recent
  );
END;
$$;
