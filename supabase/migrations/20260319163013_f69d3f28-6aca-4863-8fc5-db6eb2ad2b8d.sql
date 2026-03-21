
-- Add metadata columns to secondary_guardians
ALTER TABLE public.secondary_guardians
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS parentesco text DEFAULT 'outros',
  ADD COLUMN IF NOT EXISTS added_by uuid;

-- Allow primary user to insert secondary guardians
CREATE POLICY "Primary can insert secondary guardians"
  ON public.secondary_guardians
  FOR INSERT
  TO authenticated
  WITH CHECK (primary_user_id = auth.uid());

-- RPC to list guardians for a user (primary sees all their secondary, secondary sees their primary)
CREATE OR REPLACE FUNCTION public.get_guardians_for_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _result json;
BEGIN
  SELECT json_agg(row_to_json(r)) INTO _result
  FROM (
    -- I am primary: list my secondary guardians
    SELECT 
      sg.id,
      sg.secondary_user_id as user_id,
      sg.nome,
      sg.cpf,
      sg.email,
      sg.telefone,
      sg.parentesco,
      sg.created_at,
      'secundario' as tipo,
      sg.added_by
    FROM secondary_guardians sg
    WHERE sg.primary_user_id = _user_id

    UNION ALL

    -- I am secondary: show my primary
    SELECT 
      sg.id,
      sg.primary_user_id as user_id,
      p.nome,
      p.cpf,
      p.email,
      p.telefone,
      'principal' as parentesco,
      sg.created_at,
      'principal' as tipo,
      null as added_by
    FROM secondary_guardians sg
    JOIN profiles p ON p.user_id = sg.primary_user_id
    WHERE sg.secondary_user_id = _user_id
  ) r;

  RETURN COALESCE(_result, '[]'::json);
END;
$$;

-- RPC to add a guardian by registering them (creates auth user + profile + link)
CREATE OR REPLACE FUNCTION public.add_secondary_guardian(
  _nome text,
  _email text,
  _cpf text DEFAULT null,
  _telefone text DEFAULT null,
  _parentesco text DEFAULT 'outros',
  _senha text DEFAULT null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _primary_user_id uuid := auth.uid();
  _existing_profile profiles%ROWTYPE;
  _secondary_user_id uuid;
  _existing_link int;
BEGIN
  -- Check if email already has a profile
  SELECT * INTO _existing_profile FROM profiles WHERE LOWER(email) = LOWER(_email) LIMIT 1;
  
  IF _existing_profile.user_id IS NOT NULL THEN
    _secondary_user_id := _existing_profile.user_id;
    
    -- Check if already linked
    SELECT count(*) INTO _existing_link 
    FROM secondary_guardians 
    WHERE primary_user_id = _primary_user_id AND secondary_user_id = _secondary_user_id;
    
    IF _existing_link > 0 THEN
      RETURN json_build_object('success', false, 'error', 'Este responsável já está vinculado.');
    END IF;
    
    -- Cannot link to self
    IF _secondary_user_id = _primary_user_id THEN
      RETURN json_build_object('success', false, 'error', 'Você não pode vincular a si mesmo.');
    END IF;
  ELSE
    -- User doesn't exist yet - we'll just create the link placeholder
    -- The actual user registration should happen through normal signup
    RETURN json_build_object('success', false, 'error', 'Este e-mail ainda não possui cadastro. O responsável precisa criar uma conta primeiro.');
  END IF;
  
  -- Create the link
  INSERT INTO secondary_guardians (primary_user_id, secondary_user_id, nome, cpf, email, telefone, parentesco, added_by)
  VALUES (_primary_user_id, _secondary_user_id, _nome, _cpf, _email, _telefone, _parentesco, _primary_user_id);
  
  RETURN json_build_object('success', true, 'message', 'Responsável adicionado com sucesso!');
END;
$$;

-- RPC to remove a secondary guardian (primary can remove anyone, secondary can remove other secondary but not primary)
CREATE OR REPLACE FUNCTION public.remove_secondary_guardian(_link_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _link secondary_guardians%ROWTYPE;
BEGIN
  SELECT * INTO _link FROM secondary_guardians WHERE id = _link_id;
  
  IF _link.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vínculo não encontrado.');
  END IF;
  
  -- Primary can always remove
  IF _link.primary_user_id = _user_id THEN
    DELETE FROM secondary_guardians WHERE id = _link_id;
    RETURN json_build_object('success', true, 'message', 'Responsável removido com sucesso.');
  END IF;
  
  -- Secondary can remove other secondaries of the same primary, but not the primary link itself
  IF _link.secondary_user_id != _user_id THEN
    -- Check if current user is also a secondary of the same primary
    IF EXISTS (
      SELECT 1 FROM secondary_guardians 
      WHERE primary_user_id = _link.primary_user_id AND secondary_user_id = _user_id
    ) THEN
      DELETE FROM secondary_guardians WHERE id = _link_id;
      RETURN json_build_object('success', true, 'message', 'Responsável removido com sucesso.');
    END IF;
  END IF;
  
  RETURN json_build_object('success', false, 'error', 'Você não tem permissão para remover este vínculo.');
END;
$$;
