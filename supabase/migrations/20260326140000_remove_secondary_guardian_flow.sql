create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', 'Usuario'),
    new.email,
    nullif(new.raw_user_meta_data->>'telefone', ''),
    nullif(new.raw_user_meta_data->>'cpf', ''),
    public.generate_codigo_usuario()
  )
  on conflict (user_id) do update
  set
    nome = excluded.nome,
    email = excluded.email,
    telefone = coalesce(excluded.telefone, public.profiles.telefone),
    cpf = coalesce(excluded.cpf, public.profiles.cpf),
    codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);

  return new;
end;
$$;

create or replace function public.get_email_by_cpf(_cpf text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _email text;
  _cpf_digits text;
begin
  _cpf_digits := regexp_replace(coalesce(_cpf, ''), '\D', '', 'g');

  select email
  into _email
  from public.profiles
  where regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = _cpf_digits
    and coalesce(email, '') <> ''
  limit 1;

  if _email is null then
    return json_build_object('success', false, 'error', 'CPF nao encontrado');
  end if;

  return json_build_object('success', true, 'email', lower(_email));
end;
$$;

create or replace function public.is_guardian(_user_id uuid, _kid_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.kids_profiles
    where id = _kid_id
      and user_responsavel = _user_id
  );
$$;

create or replace function public.rescue_allowance(
  _kid_id uuid,
  _valor numeric,
  _descricao text default 'Resgate de mesada'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_kid public.kids_profiles%rowtype;
begin
  select *
  into v_kid
  from public.kids_profiles
  where id = _kid_id
    and user_responsavel = auth.uid();

  if not found then
    return jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  end if;

  if v_kid.is_frozen then
    return jsonb_build_object('success', false, 'error', 'Conta congelada');
  end if;

  if _valor <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor inválido');
  end if;

  if v_kid.saldo < _valor then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente do filho');
  end if;

  update public.kids_profiles
  set saldo = saldo - _valor
  where id = _kid_id;

  update public.profiles
  set saldo = saldo + _valor
  where user_id = auth.uid();

  insert into public.transactions (tipo, from_kid, to_user, valor, descricao, status)
  values ('mesada', _kid_id, auth.uid(), _valor, _descricao, 'aprovado');

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.send_allowance_from_balance(
  _kid_id uuid,
  _valor numeric,
  _descricao text default 'Mesada'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _parent_id uuid := auth.uid();
  _parent public.profiles%rowtype;
  _kid public.kids_profiles%rowtype;
  _today_spent numeric;
begin
  select *
  into _parent
  from public.profiles
  where user_id = _parent_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  end if;

  if _parent.saldo < _valor then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente. Deposite mais fundos.');
  end if;

  if _parent.limite_diario is not null then
    select coalesce(sum(valor), 0)
    into _today_spent
    from public.transactions
    where from_user = _parent_id
      and status = 'aprovado'
      and created_at >= date_trunc('day', now());

    if (_today_spent + _valor) > _parent.limite_diario then
      return jsonb_build_object(
        'success', false,
        'error', format('Limite diário do responsável excedido (R$ %s/%s)', _today_spent::text, _parent.limite_diario::text)
      );
    end if;
  end if;

  select *
  into _kid
  from public.kids_profiles
  where id = _kid_id
    and user_responsavel = _parent_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  end if;

  if _kid.is_frozen then
    return jsonb_build_object('success', false, 'error', 'A conta do filho está congelada');
  end if;

  update public.profiles set saldo = saldo - _valor where user_id = _parent_id;
  update public.kids_profiles set saldo = saldo + _valor where id = _kid_id;

  insert into public.transactions (tipo, from_user, to_kid, valor, descricao, status)
  values ('mesada', _parent_id, _kid_id, _valor, _descricao, 'aprovado');

  perform public.process_referral_commission(null, _parent_id, _valor);

  return jsonb_build_object('success', true, 'new_parent_balance', _parent.saldo - _valor);
end;
$$;

create or replace function public.admin_delete_user(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissao');
  end if;

  delete from public.referral_commissions
  where referrer_kid_id in (
    select id from public.kids_profiles where user_responsavel = _user_id
  );

  delete from public.referrals
  where referred_user_id = _user_id
     or referrer_kid_id in (
       select id from public.kids_profiles where user_responsavel = _user_id
     );

  delete from public.transactions
  where from_user = _user_id
     or to_user = _user_id
     or from_kid in (
       select id from public.kids_profiles where user_responsavel = _user_id
     )
     or to_kid in (
       select id from public.kids_profiles where user_responsavel = _user_id
     );

  delete from public.deposits
  where user_id = _user_id
     or kid_id in (
       select id from public.kids_profiles where user_responsavel = _user_id
     );

  delete from public.withdrawals where user_id = _user_id;
  delete from public.user_custom_fees where user_id = _user_id;
  delete from public.user_roles where user_id = _user_id;
  delete from public.kids_profiles where user_responsavel = _user_id;
  delete from public.profiles where user_id = _user_id;

  return jsonb_build_object('success', true);
end;
$$;

drop function if exists public.accept_guardian_invite(text);
drop function if exists public.add_secondary_guardian(text, text, text, text, text, text);
drop function if exists public.admin_unlink_secondary_guardian(uuid, uuid);
drop function if exists public.get_family_profile();
drop function if exists public.get_guardians_for_user();
drop function if exists public.get_my_pending_invites();
drop function if exists public.get_my_secondary_guardians();
drop function if exists public.invite_guardian(text);
drop function if exists public.is_family_member(uuid, uuid);
drop function if exists public.remove_secondary_guardian(uuid);
drop function if exists public.update_family_pix_key(text);

drop policy if exists "Guardians can create kids" on public.kids_profiles;
drop policy if exists "Guardians can delete kids" on public.kids_profiles;
drop policy if exists "Guardians can update kids" on public.kids_profiles;
drop policy if exists "Guardians can view kids" on public.kids_profiles;
drop policy if exists "Parents can view their kids" on public.kids_profiles;
drop policy if exists "Parents can create kids" on public.kids_profiles;
drop policy if exists "Parents can update their kids" on public.kids_profiles;
drop policy if exists "Parents can delete their kids" on public.kids_profiles;

create policy "Parents can view their kids"
  on public.kids_profiles
  for select
  to authenticated
  using (auth.uid() = user_responsavel);

create policy "Parents can create kids"
  on public.kids_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_responsavel);

create policy "Parents can update their kids"
  on public.kids_profiles
  for update
  to authenticated
  using (auth.uid() = user_responsavel);

create policy "Parents can delete their kids"
  on public.kids_profiles
  for delete
  to authenticated
  using (auth.uid() = user_responsavel);

drop policy if exists "Primary can view secondary guardians" on public.secondary_guardians;
drop policy if exists "Primary can insert secondary guardians" on public.secondary_guardians;

drop table if exists public.secondary_guardians;
