
DROP FUNCTION IF EXISTS public.kid_login(text, text);

CREATE OR REPLACE FUNCTION public.kid_login(_codigo text, _pin text)
RETURNS TABLE(
  id uuid, nome text, apelido text, idade integer, codigo_publico text,
  saldo numeric, saldo_poupanca numeric, is_frozen boolean,
  limite_diario numeric, aprovacao_transferencias boolean, bloqueio_envio boolean,
  is_mini_gerente boolean, referral_code text, saldo_comissao numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.nome, k.apelido, k.idade, k.codigo_publico,
         k.saldo, k.saldo_poupanca, k.is_frozen,
         k.limite_diario, k.aprovacao_transferencias, k.bloqueio_envio,
         k.is_mini_gerente, k.referral_code, k.saldo_comissao
  FROM kids_profiles k
  WHERE (k.codigo_publico = _codigo OR LOWER(split_part(k.nome, ' ', 1)) = LOWER(_codigo))
    AND k.pin = _pin;
END;
$$;
