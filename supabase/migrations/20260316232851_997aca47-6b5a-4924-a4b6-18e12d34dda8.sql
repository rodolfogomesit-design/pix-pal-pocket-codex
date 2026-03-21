
CREATE OR REPLACE FUNCTION public.delete_referral(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() != _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  DELETE FROM referral_commissions WHERE referral_id IN (
    SELECT id FROM referrals WHERE referred_user_id = _user_id
  );

  DELETE FROM referrals WHERE referred_user_id = _user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;
