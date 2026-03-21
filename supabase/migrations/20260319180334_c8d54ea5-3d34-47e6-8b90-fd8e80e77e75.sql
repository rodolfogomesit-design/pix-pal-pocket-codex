
-- 1. Make secondary_user_id nullable to support pending guardians
ALTER TABLE public.secondary_guardians ALTER COLUMN secondary_user_id DROP NOT NULL;

-- 2. Replace add_secondary_guardian to allow adding without existing account
CREATE OR REPLACE FUNCTION public.add_secondary_guardian(_nome text, _email text, _cpf text DEFAULT NULL::text, _telefone text DEFAULT NULL::text, _parentesco text DEFAULT 'outros'::text, _senha text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Cannot link to self
    IF _secondary_user_id = _primary_user_id THEN
      RETURN json_build_object('success', false, 'error', 'Você não pode vincular a si mesmo.');
    END IF;
    
    -- Check if already linked
    SELECT count(*) INTO _existing_link 
    FROM secondary_guardians 
    WHERE primary_user_id = _primary_user_id AND secondary_user_id = _secondary_user_id;
    
    IF _existing_link > 0 THEN
      RETURN json_build_object('success', false, 'error', 'Este responsável já está vinculado.');
    END IF;
  ELSE
    _secondary_user_id := NULL;
    
    -- Check if already has a pending link with this email
    SELECT count(*) INTO _existing_link
    FROM secondary_guardians
    WHERE primary_user_id = _primary_user_id AND LOWER(email) = LOWER(_email) AND secondary_user_id IS NULL;
    
    IF _existing_link > 0 THEN
      RETURN json_build_object('success', false, 'error', 'Já existe um convite pendente para este e-mail.');
    END IF;
  END IF;
  
  -- Create the link (with or without secondary_user_id)
  INSERT INTO secondary_guardians (primary_user_id, secondary_user_id, nome, cpf, email, telefone, parentesco, added_by)
  VALUES (_primary_user_id, _secondary_user_id, _nome, _cpf, _email, _telefone, _parentesco, _primary_user_id);
  
  IF _secondary_user_id IS NULL THEN
    RETURN json_build_object('success', true, 'message', 'Responsável cadastrado! Quando ele criar uma conta com este e-mail, será vinculado automaticamente.');
  ELSE
    RETURN json_build_object('success', true, 'message', 'Responsável adicionado com sucesso!');
  END IF;
END;
$function$;

-- 3. Update handle_new_user to auto-link pending guardians on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, codigo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    public.generate_codigo_usuario()
  );
  
  -- Auto-link any pending secondary guardian entries for this email
  UPDATE public.secondary_guardians
  SET secondary_user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email) AND secondary_user_id IS NULL;
  
  RETURN NEW;
END;
$function$;

-- 4. Update is_guardian to handle nullable secondary_user_id
CREATE OR REPLACE FUNCTION public.is_guardian(_user_id uuid, _kid_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM kids_profiles WHERE id = _kid_id AND user_responsavel = _user_id
  ) OR EXISTS (
    SELECT 1 FROM secondary_guardians sg
    JOIN kids_profiles kp ON kp.user_responsavel = sg.primary_user_id
    WHERE sg.secondary_user_id = _user_id AND sg.secondary_user_id IS NOT NULL AND kp.id = _kid_id
  );
$function$;

-- 5. Update get_guardians_for_user to show pending guardians too
CREATE OR REPLACE FUNCTION public.get_guardians_for_user()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _result json;
BEGIN
  SELECT json_agg(row_to_json(r)) INTO _result
  FROM (
    -- I am primary: list my secondary guardians (linked and pending)
    SELECT 
      sg.id,
      COALESCE(sg.secondary_user_id, '00000000-0000-0000-0000-000000000000'::uuid) as user_id,
      sg.nome,
      sg.cpf,
      sg.email,
      sg.telefone,
      COALESCE(sg.parentesco, 'outros') as parentesco,
      sg.created_at,
      CASE WHEN sg.secondary_user_id IS NULL THEN 'pendente' ELSE 'secundario' END as tipo,
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
$function$;

-- 6. Update RLS for secondary_guardians to allow delete of pending entries by primary
-- (existing policy already covers primary_user_id = auth.uid(), so no change needed)
