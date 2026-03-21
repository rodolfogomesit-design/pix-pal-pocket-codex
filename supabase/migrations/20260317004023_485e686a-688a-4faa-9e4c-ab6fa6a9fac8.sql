
-- Add is_blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Admin block/unblock user
CREATE OR REPLACE FUNCTION public.admin_block_user(_user_id uuid, _block boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  UPDATE profiles SET is_blocked = _block WHERE user_id = _user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Admin toggle admin role
CREATE OR REPLACE FUNCTION public.admin_toggle_admin(_user_id uuid, _enable boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  IF _enable THEN
    INSERT INTO user_roles (user_id, role) VALUES (_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Admin delete user (full cascade)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _kid RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  FOR _kid IN SELECT id FROM kids_profiles WHERE user_responsavel = _user_id LOOP
    DELETE FROM chat_messages WHERE kid_id = _kid.id;
    DELETE FROM chat_read_status WHERE kid_id = _kid.id;
    DELETE FROM savings_goals WHERE kid_id = _kid.id;
    DELETE FROM kid_contacts WHERE kid_id = _kid.id;
    DELETE FROM kid_pix_contacts WHERE kid_id = _kid.id;
    DELETE FROM kid_pix_requests WHERE kid_id = _kid.id;
    DELETE FROM referral_commissions WHERE referrer_kid_id = _kid.id;
    DELETE FROM referrals WHERE referrer_kid_id = _kid.id;
    DELETE FROM transactions WHERE from_kid = _kid.id OR to_kid = _kid.id;
    DELETE FROM deposits WHERE kid_id = _kid.id;
  END LOOP;
  DELETE FROM kids_profiles WHERE user_responsavel = _user_id;
  DELETE FROM deposits WHERE user_id = _user_id;
  DELETE FROM withdrawals WHERE user_id = _user_id;
  DELETE FROM transactions WHERE from_user = _user_id OR to_user = _user_id;
  DELETE FROM referrals WHERE referred_user_id = _user_id;
  DELETE FROM user_roles WHERE user_id = _user_id;
  DELETE FROM chat_read_status WHERE user_id = _user_id;
  DELETE FROM profiles WHERE user_id = _user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Admin get user transactions
CREATE OR REPLACE FUNCTION public.admin_get_user_transactions(_user_id uuid, _limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  RETURN jsonb_build_object(
    'success', true,
    'transactions', (
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
        WHERE tx.from_user = _user_id OR tx.to_user = _user_id
          OR tx.from_kid IN (SELECT id FROM kids_profiles WHERE user_responsavel = _user_id)
          OR tx.to_kid IN (SELECT id FROM kids_profiles WHERE user_responsavel = _user_id)
        ORDER BY tx.created_at DESC
        LIMIT _limit
      ) t
    )
  );
END;
$$;

-- Admin adjust user balance
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(_user_id uuid, _valor numeric, _descricao text DEFAULT 'Ajuste administrativo')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _new_saldo numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  UPDATE profiles SET saldo = saldo + _valor WHERE user_id = _user_id
  RETURNING saldo INTO _new_saldo;
  IF _new_saldo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  RETURN jsonb_build_object('success', true, 'new_balance', _new_saldo);
END;
$$;

-- Admin update user profile
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(_user_id uuid, _nome text DEFAULT NULL, _telefone text DEFAULT NULL, _email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;
  UPDATE profiles SET
    nome = COALESCE(_nome, nome),
    telefone = COALESCE(_telefone, telefone),
    email = COALESCE(_email, email)
  WHERE user_id = _user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
