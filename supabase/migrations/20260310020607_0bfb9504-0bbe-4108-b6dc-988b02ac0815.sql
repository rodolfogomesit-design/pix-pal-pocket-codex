
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  chave_pix TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- KIDS PROFILES TABLE
CREATE TABLE public.kids_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_responsavel UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  apelido TEXT,
  idade INTEGER NOT NULL CHECK (idade >= 0 AND idade <= 18),
  codigo_publico TEXT NOT NULL UNIQUE,
  saldo NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (saldo >= 0),
  pin TEXT NOT NULL,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  limite_diario NUMERIC(10,2) DEFAULT 50.00,
  aprovacao_transferencias BOOLEAN NOT NULL DEFAULT false,
  bloqueio_envio BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kids_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their kids"
  ON public.kids_profiles FOR SELECT
  USING (auth.uid() = user_responsavel);

CREATE POLICY "Parents can create kids"
  ON public.kids_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_responsavel);

CREATE POLICY "Parents can update their kids"
  ON public.kids_profiles FOR UPDATE
  USING (auth.uid() = user_responsavel);

CREATE POLICY "Parents can delete their kids"
  ON public.kids_profiles FOR DELETE
  USING (auth.uid() = user_responsavel);

CREATE TRIGGER update_kids_profiles_updated_at
  BEFORE UPDATE ON public.kids_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_codigo_publico()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.kids_profiles WHERE codigo_publico = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- TRANSACTIONS TABLE
CREATE TYPE public.transaction_type AS ENUM ('mesada', 'transferencia', 'pagamento');
CREATE TYPE public.transaction_status AS ENUM ('pendente', 'aprovado', 'recusado');

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo public.transaction_type NOT NULL,
  from_user UUID,
  to_user UUID,
  from_kid UUID REFERENCES public.kids_profiles(id),
  to_kid UUID REFERENCES public.kids_profiles(id),
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  descricao TEXT,
  status public.transaction_status NOT NULL DEFAULT 'aprovado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view transactions of their kids"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() = from_user
    OR auth.uid() = to_user
    OR EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = from_kid AND user_responsavel = auth.uid())
    OR EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = to_kid AND user_responsavel = auth.uid())
  );

CREATE POLICY "Parents can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Parents can update transaction status"
  ON public.transactions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = to_kid AND user_responsavel = auth.uid())
    OR EXISTS (SELECT 1 FROM public.kids_profiles WHERE id = from_kid AND user_responsavel = auth.uid())
  );

-- Indexes
CREATE INDEX idx_kids_profiles_responsavel ON public.kids_profiles(user_responsavel);
CREATE INDEX idx_kids_profiles_codigo ON public.kids_profiles(codigo_publico);
CREATE INDEX idx_transactions_from_user ON public.transactions(from_user);
CREATE INDEX idx_transactions_to_user ON public.transactions(to_user);
CREATE INDEX idx_transactions_from_kid ON public.transactions(from_kid);
CREATE INDEX idx_transactions_to_kid ON public.transactions(to_kid);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
