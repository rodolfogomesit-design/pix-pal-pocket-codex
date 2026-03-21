CREATE OR REPLACE FUNCTION public.generate_codigo_publico()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(codigo_publico::integer), 0)
  INTO max_code
  FROM kids_profiles
  WHERE codigo_publico ~ '^\d{5}$';

  RETURN LPAD((max_code + 1)::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_codigo_usuario()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(codigo_usuario::integer), 0)
  INTO max_code
  FROM profiles
  WHERE codigo_usuario ~ '^\d{5}$';

  RETURN LPAD((max_code + 1)::text, 5, '0');
END;
$$;