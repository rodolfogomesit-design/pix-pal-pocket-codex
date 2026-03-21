DROP FUNCTION public.get_kid_transactions(uuid);

CREATE FUNCTION public.get_kid_transactions(_kid_id uuid)
RETURNS TABLE(
  id uuid,
  tipo transaction_type,
  valor numeric,
  descricao text,
  status transaction_status,
  created_at timestamptz,
  from_name text,
  to_name text,
  direction text,
  from_codigo text,
  to_codigo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.tipo,
    t.valor,
    t.descricao,
    t.status,
    t.created_at,
    COALESCE(
      (SELECT kp.nome FROM kids_profiles kp WHERE kp.id = t.from_kid),
      (SELECT p.nome FROM profiles p WHERE p.user_id = t.from_user),
      'Desconhecido'
    )::text AS from_name,
    COALESCE(
      (SELECT kp.nome FROM kids_profiles kp WHERE kp.id = t.to_kid),
      (SELECT p.nome FROM profiles p WHERE p.user_id = t.to_user),
      'Desconhecido'
    )::text AS to_name,
    CASE
      WHEN t.from_kid = _kid_id THEN 'sent'
      ELSE 'received'
    END::text AS direction,
    COALESCE(
      (SELECT kp.codigo_publico FROM kids_profiles kp WHERE kp.id = t.from_kid),
      (SELECT p.codigo_usuario FROM profiles p WHERE p.user_id = t.from_user),
      ''
    )::text AS from_codigo,
    COALESCE(
      (SELECT kp.codigo_publico FROM kids_profiles kp WHERE kp.id = t.to_kid),
      (SELECT p.codigo_usuario FROM profiles p WHERE p.user_id = t.to_user),
      ''
    )::text AS to_codigo
  FROM transactions t
  WHERE t.to_kid = _kid_id OR t.from_kid = _kid_id
  ORDER BY t.created_at DESC
  LIMIT 30;
END;
$$;