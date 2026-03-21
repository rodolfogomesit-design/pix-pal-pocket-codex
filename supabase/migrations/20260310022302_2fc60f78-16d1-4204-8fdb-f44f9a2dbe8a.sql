
-- Edge function-based admin queries via security definer functions
-- Admin: get platform metrics
CREATE OR REPLACE FUNCTION public.admin_get_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_users integer;
  _total_kids integer;
  _total_transactions integer;
  _total_balance numeric;
  _total_volume numeric;
  _pending_approvals integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT COUNT(*) INTO _total_users FROM public.profiles;
  SELECT COUNT(*) INTO _total_kids FROM public.kids_profiles;
  SELECT COUNT(*) INTO _total_transactions FROM public.transactions;
  SELECT COALESCE(SUM(saldo), 0) INTO _total_balance FROM public.kids_profiles;
  SELECT COALESCE(SUM(valor), 0) INTO _total_volume FROM public.transactions WHERE status = 'aprovado';
  SELECT COUNT(*) INTO _pending_approvals FROM public.transactions WHERE status = 'pendente';

  RETURN jsonb_build_object(
    'success', true,
    'total_users', _total_users,
    'total_kids', _total_kids,
    'total_transactions', _total_transactions,
    'total_balance', _total_balance,
    'total_volume', _total_volume,
    'pending_approvals', _pending_approvals
  );
END;
$$;

-- Admin: search users
CREATE OR REPLACE FUNCTION public.admin_search_users(_query text DEFAULT '')
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
    'users', (
      SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb)
      FROM (
        SELECT p.id, p.user_id, p.nome, p.email, p.telefone, p.cpf, p.created_at,
          (SELECT COUNT(*) FROM kids_profiles k WHERE k.user_responsavel = p.user_id) as kids_count,
          (SELECT COALESCE(SUM(k.saldo), 0) FROM kids_profiles k WHERE k.user_responsavel = p.user_id) as total_balance
        FROM profiles p
        WHERE _query = '' OR p.nome ILIKE '%' || _query || '%' OR p.email ILIKE '%' || _query || '%'
        ORDER BY p.created_at DESC
        LIMIT 50
      ) u
    )
  );
END;
$$;

-- Admin: get user details with their kids
CREATE OR REPLACE FUNCTION public.admin_get_user_kids(_user_id uuid)
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
    'kids', (
      SELECT COALESCE(jsonb_agg(row_to_json(k)), '[]'::jsonb)
      FROM (
        SELECT id, nome, apelido, idade, codigo_publico, saldo, is_frozen,
               limite_diario, aprovacao_transferencias, bloqueio_envio, created_at
        FROM kids_profiles
        WHERE user_responsavel = _user_id
        ORDER BY created_at
      ) k
    )
  );
END;
$$;

-- Admin: toggle freeze on a kid account
CREATE OR REPLACE FUNCTION public.admin_toggle_freeze(_kid_id uuid, _freeze boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE kids_profiles SET is_frozen = _freeze WHERE id = _kid_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
