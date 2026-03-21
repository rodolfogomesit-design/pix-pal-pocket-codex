CREATE OR REPLACE FUNCTION public.get_email_by_cpf(_cpf text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM profiles WHERE cpf = _cpf;
  IF _email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'CPF não encontrado');
  END IF;
  RETURN jsonb_build_object('success', true, 'email', _email);
END;
$$;