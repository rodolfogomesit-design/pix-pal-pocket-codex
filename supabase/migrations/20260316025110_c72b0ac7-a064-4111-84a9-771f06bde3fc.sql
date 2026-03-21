
-- Add codigo_usuario to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS codigo_usuario TEXT UNIQUE;

-- Function to generate unique 5-digit code for parents
CREATE OR REPLACE FUNCTION public.generate_codigo_usuario()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE codigo_usuario = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Update handle_new_user to auto-generate codigo_usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, codigo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    public.generate_codigo_usuario()
  );
  RETURN NEW;
END;
$$;

-- Update generate_codigo_publico to use 5 digits for kids
CREATE OR REPLACE FUNCTION public.generate_codigo_publico()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;

-- Generate codes for existing profiles that don't have one
UPDATE public.profiles SET codigo_usuario = public.generate_codigo_usuario() WHERE codigo_usuario IS NULL;
