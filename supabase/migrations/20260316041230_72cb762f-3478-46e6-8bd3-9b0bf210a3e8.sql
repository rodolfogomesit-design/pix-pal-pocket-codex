
CREATE OR REPLACE FUNCTION public.kid_update_pix_contact_name(_kid_id uuid, _contact_id uuid, _new_nome text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE kid_pix_contacts 
  SET nome = _new_nome 
  WHERE id = _contact_id AND kid_id = _kid_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contato não encontrado');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;
