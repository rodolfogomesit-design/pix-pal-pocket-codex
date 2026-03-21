
CREATE OR REPLACE FUNCTION public.kid_save_pix_contact_no_pin(_kid_id uuid, _nome text, _chave_pix text, _tipo_chave text DEFAULT 'outro'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kids_profiles WHERE id = _kid_id) THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  INSERT INTO kid_pix_contacts (kid_id, nome, chave_pix, tipo_chave) VALUES (_kid_id, _nome, _chave_pix, _tipo_chave);
  RETURN json_build_object('success', true);
END;
$function$;
