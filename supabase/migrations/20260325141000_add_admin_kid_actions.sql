CREATE OR REPLACE FUNCTION public.admin_get_kid_transactions(_kid_id uuid, _limit integer DEFAULT 50)
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
          COALESCE(p.nome, '') AS from_user_nome,
          COALESCE(fk.nome, '') AS from_kid_nome,
          COALESCE(tk.nome, '') AS to_kid_nome
        FROM public.transactions tx
        LEFT JOIN public.profiles p ON p.user_id = tx.from_user
        LEFT JOIN public.kids_profiles fk ON fk.id = tx.from_kid
        LEFT JOIN public.kids_profiles tk ON tk.id = tx.to_kid
        WHERE tx.from_kid = _kid_id OR tx.to_kid = _kid_id
        ORDER BY tx.created_at DESC
        LIMIT _limit
      ) t
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_kid_balance(_kid_id uuid, _valor numeric, _descricao text DEFAULT 'Ajuste administrativo')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_saldo numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE public.kids_profiles
  SET saldo = saldo + _valor
  WHERE id = _kid_id
  RETURNING saldo INTO _new_saldo;

  IF _new_saldo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;

  INSERT INTO public.transactions (tipo, from_kid, to_kid, valor, descricao, status)
  VALUES (
    'transferencia',
    CASE WHEN _valor < 0 THEN _kid_id ELSE NULL END,
    CASE WHEN _valor > 0 THEN _kid_id ELSE NULL END,
    ABS(_valor),
    _descricao,
    'aprovado'
  );

  RETURN jsonb_build_object('success', true, 'new_balance', _new_saldo);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_kid_profile(
  _kid_id uuid,
  _nome text DEFAULT NULL,
  _apelido text DEFAULT NULL,
  _idade integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE public.kids_profiles
  SET
    nome = COALESCE(_nome, nome),
    apelido = _apelido,
    idade = COALESCE(_idade, idade)
  WHERE id = _kid_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_kid(_kid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kid public.kids_profiles%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  SELECT * INTO v_kid FROM public.kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;

  IF COALESCE(v_kid.saldo, 0) > 0 OR COALESCE(v_kid.saldo_poupanca, 0) > 0 OR COALESCE(v_kid.saldo_comissao, 0) > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A criança ainda possui saldo. Zere os saldos antes de excluir.');
  END IF;

  DELETE FROM public.referral_commissions WHERE referrer_kid_id = _kid_id;
  DELETE FROM public.referrals WHERE referrer_kid_id = _kid_id;
  DELETE FROM public.chat_messages WHERE kid_id = _kid_id;
  DELETE FROM public.chat_read_status WHERE kid_id = _kid_id;
  DELETE FROM public.savings_goals WHERE kid_id = _kid_id;
  DELETE FROM public.deposits WHERE kid_id = _kid_id;
  DELETE FROM public.transactions WHERE from_kid = _kid_id OR to_kid = _kid_id;
  DELETE FROM public.kids_profiles WHERE id = _kid_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
