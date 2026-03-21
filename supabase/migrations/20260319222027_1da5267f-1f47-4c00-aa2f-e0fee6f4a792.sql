
-- Save contact without PIN (for use after successful transfers)
CREATE OR REPLACE FUNCTION public.kid_save_contact_no_pin(_kid_id uuid, _contact_codigo text, _contact_nome text, _contact_type text DEFAULT 'kid'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kids_profiles WHERE id = _kid_id) THEN
    RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
  END IF;
  INSERT INTO kid_contacts (kid_id, contact_codigo, contact_nome, contact_type) 
  VALUES (_kid_id, _contact_codigo, _contact_nome, _contact_type) 
  ON CONFLICT (kid_id, contact_codigo) DO UPDATE SET contact_nome = EXCLUDED.contact_nome;
  RETURN json_build_object('success', true);
END;
$function$;
