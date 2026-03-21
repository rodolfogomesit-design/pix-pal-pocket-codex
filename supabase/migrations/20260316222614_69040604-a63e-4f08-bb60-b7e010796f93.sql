-- Update generate_codigo_publico to be sequential
CREATE OR REPLACE FUNCTION public.generate_codigo_publico()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  max_code integer;
  new_code text;
BEGIN
  -- Get the highest numeric code currently in use
  SELECT COALESCE(MAX(codigo_publico::integer), 10000)
  INTO max_code
  FROM kids_profiles
  WHERE codigo_publico ~ '^\d{5}$';

  -- Next sequential code
  new_code := LPAD((max_code + 1)::text, 5, '0');

  RETURN new_code;
END;
$$;

-- Also update generate_codigo_usuario to be sequential for profiles
CREATE OR REPLACE FUNCTION public.generate_codigo_usuario()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  max_code integer;
  new_code text;
BEGIN
  SELECT COALESCE(MAX(codigo_usuario::integer), 10000)
  INTO max_code
  FROM profiles
  WHERE codigo_usuario ~ '^\d{5}$';

  new_code := LPAD((max_code + 1)::text, 5, '0');

  RETURN new_code;
END;
$$;