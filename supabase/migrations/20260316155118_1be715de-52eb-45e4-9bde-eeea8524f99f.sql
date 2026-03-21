
-- Add mini_gerente column to kids_profiles
ALTER TABLE public.kids_profiles ADD COLUMN IF NOT EXISTS is_mini_gerente boolean NOT NULL DEFAULT false;
ALTER TABLE public.kids_profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Table for referrals (who referred whom)
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_kid_id uuid NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  referred_name text NOT NULL DEFAULT '',
  referred_codigo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for commissions earned
CREATE TABLE public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_kid_id uuid NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  deposit_id uuid REFERENCES public.deposits(id),
  valor_deposito numeric NOT NULL,
  taxa_percentual numeric NOT NULL,
  valor_comissao numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saldo de comissões acumulado na criança
ALTER TABLE public.kids_profiles ADD COLUMN IF NOT EXISTS saldo_comissao numeric NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Parents can see referrals of their kids
CREATE POLICY "Parents can view referrals of their kids" ON public.referrals
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kids_profiles WHERE kids_profiles.id = referrals.referrer_kid_id AND kids_profiles.user_responsavel = auth.uid()
  ));

-- RLS: Admins can view all referrals (via RPC)
CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Parents can view commissions of their kids
CREATE POLICY "Parents can view commissions of their kids" ON public.referral_commissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kids_profiles WHERE kids_profiles.id = referral_commissions.referrer_kid_id AND kids_profiles.user_responsavel = auth.uid()
  ));

CREATE POLICY "Admins can view all commissions" ON public.referral_commissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Generate unique referral code for a kid
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'PIX' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM kids_profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Toggle mini gerente status
CREATE OR REPLACE FUNCTION public.toggle_mini_gerente(_kid_id uuid, _enable boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _code text;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  IF _enable THEN
    IF _kid.referral_code IS NULL THEN
      _code := generate_referral_code();
    ELSE
      _code := _kid.referral_code;
    END IF;
    UPDATE kids_profiles SET is_mini_gerente = true, referral_code = _code WHERE id = _kid_id;
    RETURN jsonb_build_object('success', true, 'referral_code', _code);
  ELSE
    UPDATE kids_profiles SET is_mini_gerente = false WHERE id = _kid_id;
    RETURN jsonb_build_object('success', true);
  END IF;
END;
$$;

-- Register a referral when a new user signs up with a referral code
CREATE OR REPLACE FUNCTION public.register_referral(_referral_code text, _referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
  _profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE referral_code = _referral_code AND is_mini_gerente = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;

  -- Get referred user info
  SELECT * INTO _profile FROM profiles WHERE user_id = _referred_user_id;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = _referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário já foi indicado');
  END IF;

  INSERT INTO referrals (referrer_kid_id, referred_user_id, referred_name, referred_codigo)
  VALUES (_kid.id, _referred_user_id, COALESCE(_profile.nome, ''), COALESCE(_profile.codigo_usuario, ''));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Process commission when a deposit is confirmed
CREATE OR REPLACE FUNCTION public.process_referral_commission(_deposit_id uuid, _user_id uuid, _valor numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referral referrals%ROWTYPE;
  _taxa numeric;
  _comissao numeric;
  _setting_val text;
BEGIN
  -- Check if this user was referred by someone
  SELECT * INTO _referral FROM referrals WHERE referred_user_id = _user_id AND status = 'ativo';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get commission rate from platform settings
  SELECT value INTO _setting_val FROM platform_settings WHERE key = 'mini_gerente_taxa';
  _taxa := COALESCE(_setting_val::numeric, 1);

  _comissao := ROUND((_valor * _taxa / 100), 2);
  IF _comissao <= 0 THEN
    RETURN;
  END IF;

  -- Record commission
  INSERT INTO referral_commissions (referral_id, referrer_kid_id, deposit_id, valor_deposito, taxa_percentual, valor_comissao, status)
  VALUES (_referral.id, _referral.referrer_kid_id, _deposit_id, _valor, _taxa, _comissao, 'aprovado');

  -- Credit kid's commission balance
  UPDATE kids_profiles SET saldo_comissao = saldo_comissao + _comissao WHERE id = _referral.referrer_kid_id;
END;
$$;

-- Kid withdraw commission to main balance
CREATE OR REPLACE FUNCTION public.kid_withdraw_commission(_kid_id uuid, _pin text, _valor numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  IF _kid.pin != _pin THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN incorreto');
  END IF;
  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  IF _kid.saldo_comissao < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo de comissão insuficiente');
  END IF;

  UPDATE kids_profiles SET saldo_comissao = saldo_comissao - _valor, saldo = saldo + _valor WHERE id = _kid_id;

  RETURN jsonb_build_object('success', true, 'novo_saldo', _kid.saldo + _valor, 'novo_comissao', _kid.saldo_comissao - _valor);
END;
$$;

-- Get kid referral stats
CREATE OR REPLACE FUNCTION public.get_kid_referral_stats(_kid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_referrals integer;
  _total_earned numeric;
  _saldo_comissao numeric;
BEGIN
  SELECT COUNT(*) INTO _total_referrals FROM referrals WHERE referrer_kid_id = _kid_id;
  SELECT COALESCE(SUM(valor_comissao), 0) INTO _total_earned FROM referral_commissions WHERE referrer_kid_id = _kid_id AND status = 'aprovado';
  SELECT COALESCE(saldo_comissao, 0) INTO _saldo_comissao FROM kids_profiles WHERE id = _kid_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_referrals', _total_referrals,
    'total_earned', _total_earned,
    'saldo_comissao', _saldo_comissao,
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
$$;

-- Admin: get all mini gerentes with stats
CREATE OR REPLACE FUNCTION public.admin_get_mini_gerentes()
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
    'gerentes', (
      SELECT COALESCE(jsonb_agg(row_to_json(g)), '[]'::jsonb)
      FROM (
        SELECT k.id, k.nome, k.apelido, k.codigo_publico, k.referral_code, k.saldo_comissao, k.is_mini_gerente,
          (SELECT COUNT(*) FROM referrals r WHERE r.referrer_kid_id = k.id) as total_indicacoes,
          (SELECT COALESCE(SUM(rc.valor_comissao), 0) FROM referral_commissions rc WHERE rc.referrer_kid_id = k.id AND rc.status = 'aprovado') as total_ganho
        FROM kids_profiles k
        WHERE k.is_mini_gerente = true
        ORDER BY k.created_at DESC
      ) g
    )
  );
END;
$$;

-- Admin: toggle mini gerente for any kid
CREATE OR REPLACE FUNCTION public.admin_toggle_mini_gerente(_kid_id uuid, _enable boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  IF _enable THEN
    SELECT referral_code INTO _code FROM kids_profiles WHERE id = _kid_id;
    IF _code IS NULL THEN
      _code := generate_referral_code();
    END IF;
    UPDATE kids_profiles SET is_mini_gerente = true, referral_code = _code WHERE id = _kid_id;
  ELSE
    UPDATE kids_profiles SET is_mini_gerente = false WHERE id = _kid_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Insert default platform setting for mini gerente commission rate
INSERT INTO platform_settings (key, value, label) VALUES ('mini_gerente_taxa', '1', 'Taxa Mini Gerente (%)')
ON CONFLICT DO NOTHING;

-- Also insert mini gerente enabled setting
INSERT INTO platform_settings (key, value, label) VALUES ('mini_gerente_enabled', 'true', 'Mini Gerente ativado')
ON CONFLICT DO NOTHING;

-- Enable realtime for referral_commissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_commissions;
