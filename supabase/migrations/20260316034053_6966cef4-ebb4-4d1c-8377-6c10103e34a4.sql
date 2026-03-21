
-- Table for kid saved Pix keys
CREATE TABLE public.kid_pix_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo_chave TEXT NOT NULL DEFAULT 'outro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kid_id, chave_pix)
);

ALTER TABLE public.kid_pix_contacts ENABLE ROW LEVEL SECURITY;

-- Table for pix payment requests (kid requests, parent approves)
CREATE TABLE public.kid_pix_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  nome_destinatario TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo_chave TEXT NOT NULL DEFAULT 'outro',
  valor NUMERIC NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kid_pix_requests ENABLE ROW LEVEL SECURITY;

-- RLS: kids can read their own pix contacts (via RPC, but adding policy for safety)
CREATE POLICY "Kids pix contacts are accessible by parent" ON public.kid_pix_contacts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kids_profiles kp
      WHERE kp.id = kid_pix_contacts.kid_id AND kp.user_responsavel = auth.uid()
    )
  );

-- RLS: pix requests accessible by parent
CREATE POLICY "Kid pix requests accessible by parent" ON public.kid_pix_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kids_profiles kp
      WHERE kp.id = kid_pix_requests.kid_id AND kp.user_responsavel = auth.uid()
    )
  );

-- RPC: kid saves a pix contact
CREATE OR REPLACE FUNCTION public.kid_save_pix_contact(
  _kid_id UUID,
  _pin TEXT,
  _nome TEXT,
  _chave_pix TEXT,
  _tipo_chave TEXT DEFAULT 'outro'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin TEXT;
BEGIN
  SELECT pin INTO v_pin FROM kids_profiles WHERE id = _kid_id;
  IF v_pin IS NULL OR v_pin != _pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  INSERT INTO kid_pix_contacts (kid_id, nome, chave_pix, tipo_chave)
  VALUES (_kid_id, _nome, _chave_pix, _tipo_chave)
  ON CONFLICT (kid_id, chave_pix) DO UPDATE SET nome = EXCLUDED.nome, tipo_chave = EXCLUDED.tipo_chave;

  RETURN json_build_object('success', true);
END;
$$;

-- RPC: kid gets saved pix contacts
CREATE OR REPLACE FUNCTION public.kid_get_pix_contacts(_kid_id UUID)
RETURNS TABLE(id UUID, nome TEXT, chave_pix TEXT, tipo_chave TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, chave_pix, tipo_chave
  FROM kid_pix_contacts
  WHERE kid_id = _kid_id
  ORDER BY created_at DESC;
$$;

-- RPC: kid deletes a pix contact
CREATE OR REPLACE FUNCTION public.kid_delete_pix_contact(_kid_id UUID, _contact_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM kid_pix_contacts WHERE id = _contact_id AND kid_id = _kid_id;
  RETURN json_build_object('success', true);
END;
$$;

-- RPC: kid requests a pix payment (parent will approve)
CREATE OR REPLACE FUNCTION public.kid_request_pix_payment(
  _kid_id UUID,
  _pin TEXT,
  _nome_destinatario TEXT,
  _chave_pix TEXT,
  _tipo_chave TEXT,
  _valor NUMERIC,
  _descricao TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kid RECORD;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id;
  
  IF v_kid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;

  IF v_kid.pin != _pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  IF v_kid.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Conta congelada');
  END IF;

  IF _valor > v_kid.saldo THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  IF v_kid.limite_diario IS NOT NULL AND _valor > v_kid.limite_diario THEN
    RETURN json_build_object('success', false, 'error', 'Valor acima do limite diário');
  END IF;

  INSERT INTO kid_pix_requests (kid_id, nome_destinatario, chave_pix, tipo_chave, valor, descricao)
  VALUES (_kid_id, _nome_destinatario, _chave_pix, _tipo_chave, _valor, _descricao);

  RETURN json_build_object('success', true, 'message', 'Solicitação enviada para aprovação dos pais');
END;
$$;
