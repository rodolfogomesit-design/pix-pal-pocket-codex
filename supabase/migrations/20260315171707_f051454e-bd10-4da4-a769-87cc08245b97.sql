
CREATE OR REPLACE FUNCTION public.admin_search_users(_query text DEFAULT ''::text, _limit integer DEFAULT 10, _offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _total integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT COUNT(*) INTO _total
  FROM profiles p
  WHERE _query = '' OR p.nome ILIKE '%' || _query || '%' OR p.email ILIKE '%' || _query || '%';

  RETURN jsonb_build_object(
    'success', true,
    'total', _total,
    'users', (
      SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb)
      FROM (
        SELECT p.id, p.user_id, p.nome, p.email, p.telefone, p.cpf, p.created_at,
          (SELECT COUNT(*) FROM kids_profiles k WHERE k.user_responsavel = p.user_id) as kids_count,
          (SELECT COALESCE(SUM(k.saldo), 0) FROM kids_profiles k WHERE k.user_responsavel = p.user_id) as total_balance
        FROM profiles p
        WHERE _query = '' OR p.nome ILIKE '%' || _query || '%' OR p.email ILIKE '%' || _query || '%'
        ORDER BY p.created_at DESC
        LIMIT _limit OFFSET _offset
      ) u
    )
  );
END;
$function$;
