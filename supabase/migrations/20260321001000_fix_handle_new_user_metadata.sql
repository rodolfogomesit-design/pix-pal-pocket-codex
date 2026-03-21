CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'telefone', ''),
    NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
    public.generate_codigo_usuario()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    telefone = COALESCE(EXCLUDED.telefone, public.profiles.telefone),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    codigo_usuario = COALESCE(public.profiles.codigo_usuario, EXCLUDED.codigo_usuario);

  UPDATE public.secondary_guardians
  SET secondary_user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email) AND secondary_user_id IS NULL;

  RETURN NEW;
END;
$function$;

UPDATE public.profiles AS p
SET
  telefone = COALESCE(p.telefone, NULLIF(u.raw_user_meta_data->>'telefone', '')),
  cpf = COALESCE(p.cpf, NULLIF(u.raw_user_meta_data->>'cpf', '')),
  codigo_usuario = COALESCE(p.codigo_usuario, public.generate_codigo_usuario())
FROM auth.users AS u
WHERE u.id = p.user_id
  AND (
    p.telefone IS NULL
    OR p.cpf IS NULL
    OR p.codigo_usuario IS NULL
  );
