create or replace function public.create_gateway_withdrawal(
  _valor numeric,
  _chave_pix text,
  _external_id text,
  _gateway text,
  _gateway_transaction_id text,
  _status text default 'PENDING',
  _transaction_receipt_url text default null,
  _end_to_end_identifier text default null,
  _fail_reason text default null,
  _gateway_payload jsonb default null,
  _user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _target_user_id uuid := coalesce(_user_id, auth.uid());
  _new_balance numeric;
  _withdrawal_id uuid;
begin
  if _target_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  end if;

  if _valor is null or _valor <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor inválido');
  end if;

  if _chave_pix is null or btrim(_chave_pix) = '' then
    return jsonb_build_object('success', false, 'error', 'Chave Pix não cadastrada');
  end if;

  update public.profiles
  set saldo = saldo - _valor
  where user_id = _target_user_id
    and saldo >= _valor
  returning saldo into _new_balance;

  if _new_balance is null then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  end if;

  insert into public.withdrawals (
    user_id,
    valor,
    chave_pix,
    status,
    external_id,
    gateway,
    gateway_transaction_id,
    transaction_receipt_url,
    end_to_end_identifier,
    fail_reason,
    gateway_payload
  )
  values (
    _target_user_id,
    _valor,
    _chave_pix,
    _status,
    _external_id,
    _gateway,
    _gateway_transaction_id,
    _transaction_receipt_url,
    _end_to_end_identifier,
    _fail_reason,
    _gateway_payload
  )
  returning id into _withdrawal_id;

  return jsonb_build_object(
    'success', true,
    'withdrawal_id', _withdrawal_id,
    'new_balance', _new_balance
  );
end;
$$;
