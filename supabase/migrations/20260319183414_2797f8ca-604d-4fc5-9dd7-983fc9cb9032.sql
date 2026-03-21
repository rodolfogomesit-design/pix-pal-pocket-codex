
DROP FUNCTION IF EXISTS public.add_secondary_guardian(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.add_secondary_guardian(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.add_secondary_guardian(
  _nome text,
  _email text,
  _cpf text DEFAULT NULL,
  _telefone text DEFAULT NULL,
  _parentesco text DEFAULT 'outros',
  _senha text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _caller_id uuid := auth.uid();
  _existing_user_id uuid;
  _new_user_id uuid;
BEGIN
  SELECT id INTO _existing_user_id FROM auth.users WHERE email = LOWER(_email);

  IF _existing_user_id IS NOT NULL THEN
    IF _existing_user_id = _caller_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Você não pode adicionar a si mesmo.');
    END IF;
    
    IF EXISTS (SELECT 1 FROM secondary_guardians WHERE primary_user_id = _caller_id AND secondary_user_id = _existing_user_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este responsável já está vinculado.');
    END IF;

    INSERT INTO secondary_guardians (primary_user_id, secondary_user_id, nome, cpf, email, telefone, parentesco, added_by)
    VALUES (_caller_id, _existing_user_id, _nome, _cpf, LOWER(_email), _telefone, _parentesco, _caller_id);

    RETURN jsonb_build_object('success', true, 'message', 'Responsável vinculado com sucesso.');
  ELSE
    IF _senha IS NOT NULL AND LENGTH(_senha) >= 6 THEN
      _new_user_id := extensions.uuid_generate_v4();
      
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        aud, role, confirmation_token
      ) VALUES (
        _new_user_id,
        '00000000-0000-0000-0000-000000000000',
        LOWER(_email),
        extensions.crypt(_senha, extensions.gen_salt('bf')),
        now(), now(), now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('nome', _nome),
        'authenticated', 'authenticated', ''
      );

      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        _new_user_id, _new_user_id, LOWER(_email),
        jsonb_build_object('sub', _new_user_id::text, 'email', LOWER(_email), 'email_verified', true, 'phone_verified', false),
        'email', now(), now(), now()
      );

      INSERT INTO secondary_guardians (primary_user_id, secondary_user_id, nome, cpf, email, telefone, parentesco, added_by)
      VALUES (_caller_id, _new_user_id, _nome, _cpf, LOWER(_email), _telefone, _parentesco, _caller_id);

      RETURN jsonb_build_object('success', true, 'message', 'Conta criada e responsável vinculado com sucesso.');
    ELSE
      IF EXISTS (SELECT 1 FROM secondary_guardians WHERE primary_user_id = _caller_id AND LOWER(email) = LOWER(_email) AND secondary_user_id IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Já existe um convite pendente para este e-mail.');
      END IF;

      INSERT INTO secondary_guardians (primary_user_id, secondary_user_id, nome, cpf, email, telefone, parentesco, added_by)
      VALUES (_caller_id, NULL, _nome, _cpf, LOWER(_email), _telefone, _parentesco, _caller_id);

      RETURN jsonb_build_object('success', true, 'message', 'Responsável adicionado.');
    END IF;
  END IF;
END;
$function$;
