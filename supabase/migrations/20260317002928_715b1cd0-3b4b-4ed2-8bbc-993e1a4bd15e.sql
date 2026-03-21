
CREATE OR REPLACE FUNCTION public.admin_get_financial_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  -- Saques
  _saques_hoje_valor numeric;
  _saques_mes_valor numeric;
  _saques_total_valor numeric;
  -- Transferências internas
  _transf_hoje_valor numeric;
  _transf_mes_valor numeric;
  _transf_total_valor numeric;
  -- Pagamentos Pix
  _pix_hoje_valor numeric;
  _pix_mes_valor numeric;
  _pix_total_valor numeric;
  -- Comissões Mini Gerente
  _comissao_hoje_valor numeric;
  _comissao_mes_valor numeric;
  _comissao_total_valor numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  -- Saques (withdrawals table)
  SELECT COALESCE(SUM(valor), 0) INTO _saques_hoje_valor FROM withdrawals WHERE created_at >= date_trunc('day', now());
  SELECT COALESCE(SUM(valor), 0) INTO _saques_mes_valor FROM withdrawals WHERE created_at >= date_trunc('month', now());
  SELECT COALESCE(SUM(valor), 0) INTO _saques_total_valor FROM withdrawals;

  -- Transferências internas (transactions where tipo = 'transferencia' or 'mesada', status = 'aprovado')
  SELECT COALESCE(SUM(valor), 0) INTO _transf_hoje_valor FROM transactions WHERE tipo IN ('transferencia', 'mesada') AND status = 'aprovado' AND created_at >= date_trunc('day', now());
  SELECT COALESCE(SUM(valor), 0) INTO _transf_mes_valor FROM transactions WHERE tipo IN ('transferencia', 'mesada') AND status = 'aprovado' AND created_at >= date_trunc('month', now());
  SELECT COALESCE(SUM(valor), 0) INTO _transf_total_valor FROM transactions WHERE tipo IN ('transferencia', 'mesada') AND status = 'aprovado';

  -- Pagamentos Pix (kid_pix_requests with status = 'aprovado')
  SELECT COALESCE(SUM(valor), 0) INTO _pix_hoje_valor FROM kid_pix_requests WHERE status = 'aprovado' AND created_at >= date_trunc('day', now());
  SELECT COALESCE(SUM(valor), 0) INTO _pix_mes_valor FROM kid_pix_requests WHERE status = 'aprovado' AND created_at >= date_trunc('month', now());
  SELECT COALESCE(SUM(valor), 0) INTO _pix_total_valor FROM kid_pix_requests WHERE status = 'aprovado';

  -- Comissões Mini Gerente (referral_commissions with status = 'aprovado')
  SELECT COALESCE(SUM(valor_comissao), 0) INTO _comissao_hoje_valor FROM referral_commissions WHERE status = 'aprovado' AND created_at >= date_trunc('day', now());
  SELECT COALESCE(SUM(valor_comissao), 0) INTO _comissao_mes_valor FROM referral_commissions WHERE status = 'aprovado' AND created_at >= date_trunc('month', now());
  SELECT COALESCE(SUM(valor_comissao), 0) INTO _comissao_total_valor FROM referral_commissions WHERE status = 'aprovado';

  RETURN jsonb_build_object(
    'success', true,
    'saques_hoje', _saques_hoje_valor,
    'saques_mes', _saques_mes_valor,
    'saques_total', _saques_total_valor,
    'transf_hoje', _transf_hoje_valor,
    'transf_mes', _transf_mes_valor,
    'transf_total', _transf_total_valor,
    'pix_hoje', _pix_hoje_valor,
    'pix_mes', _pix_mes_valor,
    'pix_total', _pix_total_valor,
    'comissao_hoje', _comissao_hoje_valor,
    'comissao_mes', _comissao_mes_valor,
    'comissao_total', _comissao_total_valor
  );
END;
$$;
