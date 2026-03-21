CREATE OR REPLACE FUNCTION public.get_guardians_for_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _result json;
BEGIN
  SELECT json_agg(row_to_json(r)) INTO _result
  FROM (
    -- I am primary: list my secondary guardians (always as 'secundario')
    SELECT 
      sg.id,
      COALESCE(sg.secondary_user_id, '00000000-0000-0000-0000-000000000000'::uuid) as user_id,
      COALESCE(sp.nome, sg.nome) as nome,
      COALESCE(sp.cpf, sg.cpf) as cpf,
      COALESCE(sp.email, sg.email) as email,
      COALESCE(sp.telefone, sg.telefone) as telefone,
      COALESCE(sg.parentesco, 'outros') as parentesco,
      sp.codigo_usuario,
      sg.created_at,
      'secundario' as tipo,
      sg.added_by
    FROM secondary_guardians sg
    LEFT JOIN profiles sp ON sp.user_id = sg.secondary_user_id
    WHERE sg.primary_user_id = _user_id

    UNION ALL

    -- I am secondary: show my primary
    SELECT 
      sg.id,
      sg.primary_user_id as user_id,
      p.nome,
      p.cpf,
      p.email,
      p.telefone,
      'principal' as parentesco,
      p.codigo_usuario,
      sg.created_at,
      'principal' as tipo,
      null as added_by
    FROM secondary_guardians sg
    JOIN profiles p ON p.user_id = sg.primary_user_id
    WHERE sg.secondary_user_id = _user_id
  ) r;

  RETURN COALESCE(_result, '[]'::json);
END;
$function$;