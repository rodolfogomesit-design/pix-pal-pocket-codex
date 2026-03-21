
CREATE OR REPLACE FUNCTION public.admin_get_recent_transactions(_limit integer DEFAULT 20)
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
    'transactions', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT 
          tx.id,
          tx.tipo,
          tx.valor,
          tx.descricao,
          tx.status,
          tx.created_at,
          tx.from_user,
          tx.from_kid,
          tx.to_kid,
          COALESCE(p.nome, '') as from_user_nome,
          COALESCE(fk.nome, '') as from_kid_nome,
          COALESCE(tk.nome, '') as to_kid_nome
        FROM transactions tx
        LEFT JOIN profiles p ON p.user_id = tx.from_user
        LEFT JOIN kids_profiles fk ON fk.id = tx.from_kid
        LEFT JOIN kids_profiles tk ON tk.id = tx.to_kid
        ORDER BY tx.created_at DESC
        LIMIT _limit
      ) t
    )
  );
END;
$$;
