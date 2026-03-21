CREATE TABLE public.kid_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  contact_codigo text NOT NULL,
  contact_nome text NOT NULL,
  contact_type text NOT NULL DEFAULT 'kid',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kid_id, contact_codigo)
);

ALTER TABLE public.kid_contacts ENABLE ROW LEVEL SECURITY;

-- No authenticated user for kid operations, so we use permissive policies
-- Kids interact via RPC functions, so we create a security definer function
CREATE OR REPLACE FUNCTION public.kid_save_contact(
  _kid_id uuid,
  _pin text,
  _contact_codigo text,
  _contact_nome text,
  _contact_type text DEFAULT 'kid'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kid kids_profiles;
BEGIN
  SELECT * INTO _kid FROM kids_profiles WHERE id = _kid_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  
  IF _kid.pin != _pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorreto');
  END IF;

  INSERT INTO kid_contacts (kid_id, contact_codigo, contact_nome, contact_type)
  VALUES (_kid_id, _contact_codigo, _contact_nome, _contact_type)
  ON CONFLICT (kid_id, contact_codigo) DO UPDATE SET contact_nome = EXCLUDED.contact_nome;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.kid_get_contacts(_kid_id uuid)
RETURNS TABLE(id uuid, contact_codigo text, contact_nome text, contact_type text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, contact_codigo, contact_nome, contact_type
  FROM kid_contacts
  WHERE kid_id = _kid_id
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.kid_delete_contact(_kid_id uuid, _contact_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM kid_contacts WHERE id = _contact_id AND kid_id = _kid_id;
  RETURN json_build_object('success', true);
END;
$$;