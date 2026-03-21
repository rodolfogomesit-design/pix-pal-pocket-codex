
-- Security definer function for kid login (code + PIN)
-- Returns kid profile without requiring parent auth
CREATE OR REPLACE FUNCTION public.kid_login(_codigo TEXT, _pin TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  apelido TEXT,
  idade INTEGER,
  codigo_publico TEXT,
  saldo NUMERIC,
  is_frozen BOOLEAN,
  limite_diario NUMERIC,
  aprovacao_transferencias BOOLEAN,
  bloqueio_envio BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kp.id, kp.nome, kp.apelido, kp.idade,
    kp.codigo_publico, kp.saldo, kp.is_frozen,
    kp.limite_diario, kp.aprovacao_transferencias,
    kp.bloqueio_envio
  FROM public.kids_profiles kp
  WHERE kp.codigo_publico = _codigo AND kp.pin = _pin;
END;
$$;

-- Function to get kid transactions (security definer)
CREATE OR REPLACE FUNCTION public.get_kid_transactions(_kid_id UUID)
RETURNS TABLE (
  id UUID,
  tipo transaction_type,
  valor NUMERIC,
  descricao TEXT,
  status transaction_status,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.tipo, t.valor, t.descricao, t.status, t.created_at
  FROM public.transactions t
  WHERE t.to_kid = _kid_id OR t.from_kid = _kid_id
  ORDER BY t.created_at DESC
  LIMIT 30;
END;
$$;

-- Savings goals table
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_id UUID NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎯',
  valor_alvo NUMERIC(10,2) NOT NULL CHECK (valor_alvo > 0),
  valor_atual NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_atual >= 0),
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Parents can manage their kids' goals
CREATE POLICY "Parents can view kids goals"
  ON public.savings_goals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = kid_id AND user_responsavel = auth.uid())
  );

CREATE POLICY "Parents can create kids goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = kid_id AND user_responsavel = auth.uid())
  );

CREATE POLICY "Parents can update kids goals"
  ON public.savings_goals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = kid_id AND user_responsavel = auth.uid())
  );

CREATE POLICY "Parents can delete kids goals"
  ON public.savings_goals FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = kid_id AND user_responsavel = auth.uid())
  );

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer to get goals for a kid (used in kid dashboard)
CREATE OR REPLACE FUNCTION public.get_kid_goals(_kid_id UUID)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  emoji TEXT,
  valor_alvo NUMERIC,
  valor_atual NUMERIC,
  concluido BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sg.id, sg.titulo, sg.emoji, sg.valor_alvo, sg.valor_atual, sg.concluido
  FROM public.savings_goals sg
  WHERE sg.kid_id = _kid_id
  ORDER BY sg.concluido ASC, sg.created_at DESC;
END;
$$;
