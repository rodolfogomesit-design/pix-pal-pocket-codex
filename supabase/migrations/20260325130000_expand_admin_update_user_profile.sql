DROP FUNCTION IF EXISTS public.admin_update_user_profile(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  _user_id uuid,
  _nome text DEFAULT NULL,
  _telefone text DEFAULT NULL,
  _email text DEFAULT NULL,
  _cpf text DEFAULT NULL,
  _chave_pix text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE profiles SET
    nome = COALESCE(_nome, nome),
    telefone = COALESCE(_telefone, telefone),
    email = COALESCE(_email, email),
    cpf = COALESCE(_cpf, cpf),
    chave_pix = COALESCE(_chave_pix, chave_pix)
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
