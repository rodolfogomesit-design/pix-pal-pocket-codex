
-- Add individual limit columns to kids_profiles
ALTER TABLE public.kids_profiles ADD COLUMN IF NOT EXISTS limite_pix numeric DEFAULT NULL;
ALTER TABLE public.kids_profiles ADD COLUMN IF NOT EXISTS limite_transferencia numeric DEFAULT NULL;

-- Admin update kid limits
CREATE OR REPLACE FUNCTION public.admin_update_kid_limits(
  _kid_id uuid,
  _limite_diario numeric DEFAULT NULL,
  _limite_pix numeric DEFAULT NULL,
  _limite_transferencia numeric DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  UPDATE kids_profiles SET
    limite_diario = _limite_diario,
    limite_pix = _limite_pix,
    limite_transferencia = _limite_transferencia
  WHERE id = _kid_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
