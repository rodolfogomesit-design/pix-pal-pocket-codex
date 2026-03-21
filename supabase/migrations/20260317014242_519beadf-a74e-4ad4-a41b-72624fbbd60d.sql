
CREATE OR REPLACE FUNCTION public.admin_get_user_full_history(_user_id uuid, _limit integer DEFAULT 30)
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
    'deposits', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM (
        SELECT dep.id, dep.valor, dep.status, dep.created_at, dep.external_id,
          COALESCE(k.nome, '') as kid_nome
        FROM deposits dep
        LEFT JOIN kids_profiles k ON k.id = dep.kid_id
        WHERE dep.user_id = _user_id
        ORDER BY dep.created_at DESC
        LIMIT _limit
      ) d
    ),
    'withdrawals', (
      SELECT COALESCE(jsonb_agg(row_to_json(w)), '[]'::jsonb)
      FROM (
        SELECT w.id, w.valor, w.status, w.chave_pix, w.created_at
        FROM withdrawals w
        WHERE w.user_id = _user_id
        ORDER BY w.created_at DESC
        LIMIT _limit
      ) w
    ),
    'transfers', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT tx.id, tx.tipo, tx.valor, tx.descricao, tx.status, tx.created_at,
          COALESCE(p.nome, '') as from_user_nome,
          COALESCE(fk.nome, '') as from_kid_nome,
          COALESCE(tk.nome, '') as to_kid_nome
        FROM transactions tx
        LEFT JOIN profiles p ON p.user_id = tx.from_user
        LEFT JOIN kids_profiles fk ON fk.id = tx.from_kid
        LEFT JOIN kids_profiles tk ON tk.id = tx.to_kid
        WHERE tx.tipo IN ('transferencia', 'mesada')
          AND (tx.from_user = _user_id OR tx.to_user = _user_id
            OR tx.from_kid IN (SELECT id FROM kids_profiles WHERE user_responsavel = _user_id)
            OR tx.to_kid IN (SELECT id FROM kids_profiles WHERE user_responsavel = _user_id))
        ORDER BY tx.created_at DESC
        LIMIT _limit
      ) t
    ),
    'payments', (
      SELECT COALESCE(jsonb_agg(row_to_json(px)), '[]'::jsonb)
      FROM (
        SELECT pr.id, pr.valor, pr.status, pr.nome_destinatario, pr.chave_pix, pr.tipo_chave, pr.descricao, pr.created_at,
          COALESCE(k.nome, '') as kid_nome
        FROM kid_pix_requests pr
        JOIN kids_profiles k ON k.id = pr.kid_id
        WHERE k.user_responsavel = _user_id
        ORDER BY pr.created_at DESC
        LIMIT _limit
      ) px
    ),
    'commissions', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT rc.id, rc.valor_comissao, rc.valor_deposito, rc.taxa_percentual, rc.status, rc.created_at,
          COALESCE(k.nome, '') as kid_nome
        FROM referral_commissions rc
        JOIN kids_profiles k ON k.id = rc.referrer_kid_id
        WHERE k.user_responsavel = _user_id
        ORDER BY rc.created_at DESC
        LIMIT _limit
      ) c
    )
  );
END;
$$;
