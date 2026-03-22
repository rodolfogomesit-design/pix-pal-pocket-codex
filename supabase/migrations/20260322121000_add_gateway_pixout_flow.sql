alter table public.withdrawals
  add column if not exists external_id text,
  add column if not exists gateway text,
  add column if not exists gateway_transaction_id text,
  add column if not exists fail_reason text,
  add column if not exists transaction_receipt_url text,
  add column if not exists end_to_end_identifier text,
  add column if not exists gateway_payload jsonb;

create unique index if not exists withdrawals_external_id_key on public.withdrawals (external_id) where external_id is not null;
create unique index if not exists withdrawals_gateway_transaction_id_key on public.withdrawals (gateway_transaction_id) where gateway_transaction_id is not null;

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
  _gateway_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _user_id uuid := auth.uid();
  _new_balance numeric;
  _withdrawal_id uuid;
begin
  if _user_id is null then
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
  where user_id = _user_id
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
    _user_id,
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

create or replace function public.update_gateway_withdrawal_status(
  _external_id text,
  _gateway_transaction_id text default null,
  _status text default null,
  _transaction_receipt_url text default null,
  _end_to_end_identifier text default null,
  _fail_reason text default null,
  _gateway_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _withdrawal public.withdrawals%rowtype;
  _normalized_status text;
  _should_refund boolean := false;
begin
  if coalesce(_external_id, '') = '' and coalesce(_gateway_transaction_id, '') = '' then
    return jsonb_build_object('success', false, 'error', 'Referência não informada');
  end if;

  select *
  into _withdrawal
  from public.withdrawals
  where (external_id = _external_id and _external_id is not null)
     or (gateway_transaction_id = _gateway_transaction_id and _gateway_transaction_id is not null)
  order by created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Saque não encontrado');
  end if;

  _normalized_status := upper(coalesce(_status, _withdrawal.status));

  if _normalized_status in ('TRANSFER_FAILED', 'FAILED', 'TRANSFER_CANCELLED', 'CANCELLED', 'TRANSFER_BLOCKED', 'BLOCKED')
     and upper(coalesce(_withdrawal.status, '')) not in ('FAILED', 'CANCELLED', 'BLOCKED', 'REFUNDED') then
    _should_refund := true;
  end if;

  update public.withdrawals
  set status = _normalized_status,
      gateway_transaction_id = coalesce(_gateway_transaction_id, gateway_transaction_id),
      transaction_receipt_url = coalesce(_transaction_receipt_url, transaction_receipt_url),
      end_to_end_identifier = coalesce(_end_to_end_identifier, end_to_end_identifier),
      fail_reason = coalesce(_fail_reason, fail_reason),
      gateway_payload = coalesce(_gateway_payload, gateway_payload)
  where id = _withdrawal.id;

  if _should_refund then
    update public.profiles
    set saldo = saldo + _withdrawal.valor
    where user_id = _withdrawal.user_id;
  end if;

  return jsonb_build_object('success', true, 'refunded', _should_refund);
end;
$$;
