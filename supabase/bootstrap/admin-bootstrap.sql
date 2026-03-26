create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'transaction_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.transaction_type as enum ('mesada', 'transferencia', 'pagamento');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'transaction_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.transaction_status as enum ('pendente', 'aprovado', 'recusado');
  end if;
end
$$;

create table if not exists public.kids_profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_responsavel uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  apelido text,
  idade integer not null default 0 check (idade >= 0 and idade <= 18),
  codigo_publico text not null unique,
  saldo numeric(10, 2) not null default 0.00 check (saldo >= 0),
  saldo_poupanca numeric not null default 0.00,
  saldo_comissao numeric not null default 0.00,
  pin text not null default '0000',
  is_frozen boolean not null default false,
  is_mini_gerente boolean not null default false,
  referral_code text unique,
  limite_diario numeric(10, 2) default 50.00,
  limite_pix numeric(10, 2),
  limite_transferencia numeric(10, 2),
  aprovacao_transferencias boolean not null default false,
  bloqueio_envio boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.transactions (
  id uuid not null default gen_random_uuid() primary key,
  tipo public.transaction_type not null,
  from_user uuid,
  to_user uuid,
  from_kid uuid references public.kids_profiles(id),
  to_kid uuid references public.kids_profiles(id),
  valor numeric(10, 2) not null check (valor > 0),
  descricao text,
  status public.transaction_status not null default 'aprovado',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.deposits (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kid_id uuid references public.kids_profiles(id) on delete set null,
  valor numeric(10, 2) not null default 0,
  external_id text unique,
  pix_code text,
  qr_code_url text,
  status text not null default 'pendente',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.withdrawals (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  valor numeric(10, 2) not null default 0,
  chave_pix text,
  status text not null default 'pendente',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.platform_settings (
  id uuid not null default gen_random_uuid() primary key,
  key text not null unique,
  value text not null,
  label text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_kids_profiles_responsavel on public.kids_profiles(user_responsavel);
create index if not exists idx_kids_profiles_codigo on public.kids_profiles(codigo_publico);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);

drop trigger if exists update_kids_profiles_updated_at on public.kids_profiles;
create trigger update_kids_profiles_updated_at
before update on public.kids_profiles
for each row execute function public.update_updated_at_column();

drop trigger if exists update_deposits_updated_at on public.deposits;
create trigger update_deposits_updated_at
before update on public.deposits
for each row execute function public.update_updated_at_column();

drop trigger if exists update_withdrawals_updated_at on public.withdrawals;
create trigger update_withdrawals_updated_at
before update on public.withdrawals
for each row execute function public.update_updated_at_column();

drop trigger if exists update_platform_settings_updated_at on public.platform_settings;
create trigger update_platform_settings_updated_at
before update on public.platform_settings
for each row execute function public.update_updated_at_column();

insert into public.platform_settings (key, value, label)
values
  ('limite_diario_padrao', '50', 'Limite diário padrão'),
  ('limite_transferencia', '200', 'Limite por transferência'),
  ('limite_pix', '500', 'Limite por Pix'),
  ('limite_deposito', '1000', 'Limite de depósito diário'),
  ('idade_minima', '6', 'Idade mínima'),
  ('termos_uso', 'Termos ainda não configurados.', 'Termos de Uso'),
  ('politica_privacidade', 'Política de privacidade ainda não configurada.', 'Política de Privacidade'),
  ('mini_gerente_taxa', '1', 'Taxa Mini Gerente (%)'),
  ('mini_gerente_enabled', 'true', 'Mini Gerente ativado')
on conflict (key) do nothing;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.admin_get_metrics()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _total_users integer;
  _total_kids integer;
  _total_transactions integer;
  _total_balance numeric;
  _total_volume numeric;
  _pending_approvals integer;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  select count(*) into _total_users from public.profiles;
  select count(*) into _total_kids from public.kids_profiles;
  select count(*) into _total_transactions from public.transactions;
  select
    coalesce((select sum(saldo) from public.profiles), 0) +
    coalesce((select sum(saldo) from public.kids_profiles), 0)
  into _total_balance;
  select coalesce(sum(valor), 0) into _total_volume from public.transactions where status = 'aprovado';
  select count(*) into _pending_approvals from public.transactions where status = 'pendente';

  return jsonb_build_object(
    'success', true,
    'total_users', _total_users,
    'total_kids', _total_kids,
    'total_transactions', _total_transactions,
    'total_balance', _total_balance,
    'total_volume', _total_volume,
    'pending_approvals', _pending_approvals
  );
end;
$$;

create or replace function public.admin_get_detailed_metrics()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _total_responsaveis integer;
  _total_criancas integer;
  _responsaveis_hoje integer;
  _criancas_hoje integer;
  _responsaveis_mes integer;
  _criancas_mes integer;
  _responsaveis_ativos_24h integer;
  _responsaveis_ativos_30d integer;
  _total_balance numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  select count(*) into _total_responsaveis from public.profiles;
  select count(*) into _total_criancas from public.kids_profiles;
  select count(*) into _responsaveis_hoje from public.profiles where created_at >= date_trunc('day', now());
  select count(*) into _criancas_hoje from public.kids_profiles where created_at >= date_trunc('day', now());
  select count(*) into _responsaveis_mes from public.profiles where created_at >= date_trunc('month', now());
  select count(*) into _criancas_mes from public.kids_profiles where created_at >= date_trunc('month', now());

  select count(distinct coalesce(t.from_user, kp.user_responsavel)) into _responsaveis_ativos_24h
  from public.transactions t
  left join public.kids_profiles kp on kp.id = t.from_kid or kp.id = t.to_kid
  where t.created_at >= now() - interval '24 hours';

  select count(distinct coalesce(t.from_user, kp.user_responsavel)) into _responsaveis_ativos_30d
  from public.transactions t
  left join public.kids_profiles kp on kp.id = t.from_kid or kp.id = t.to_kid
  where t.created_at >= now() - interval '30 days';

  select
    coalesce((select sum(saldo) from public.profiles), 0) +
    coalesce((select sum(saldo) from public.kids_profiles), 0)
  into _total_balance;

  return jsonb_build_object(
    'success', true,
    'total_responsaveis', _total_responsaveis,
    'total_criancas', _total_criancas,
    'responsaveis_hoje', _responsaveis_hoje,
    'criancas_hoje', _criancas_hoje,
    'responsaveis_mes', _responsaveis_mes,
    'criancas_mes', _criancas_mes,
    'ativos_24h', _responsaveis_ativos_24h,
    'ativos_30d', _responsaveis_ativos_30d,
    'total_balance', _total_balance
  );
end;
$$;

create or replace function public.admin_search_users(_query text default ''::text, _limit integer default 10, _offset integer default 0)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _total integer;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  select count(*) into _total
  from public.profiles p
  where _query = ''
    or p.nome ilike '%' || _query || '%'
    or p.email ilike '%' || _query || '%'
    or p.cpf ilike '%' || _query || '%'
    or p.codigo_usuario ilike '%' || _query || '%';

  return jsonb_build_object(
    'success', true,
    'total', _total,
    'users', (
      select coalesce(jsonb_agg(row_to_json(u)), '[]'::jsonb)
      from (
        select
          p.id,
          p.user_id,
          p.nome,
          p.email,
          p.telefone,
          p.cpf,
          p.codigo_usuario,
          p.created_at,
          (select count(*) from public.kids_profiles k where k.user_responsavel = p.user_id) as kids_count,
          coalesce(p.saldo, 0) +
          coalesce((select sum(k.saldo) from public.kids_profiles k where k.user_responsavel = p.user_id), 0) as total_balance
        from public.profiles p
        where _query = ''
          or p.nome ilike '%' || _query || '%'
          or p.email ilike '%' || _query || '%'
          or p.cpf ilike '%' || _query || '%'
          or p.codigo_usuario ilike '%' || _query || '%'
        order by p.created_at desc
        limit _limit offset _offset
      ) u
    )
  );
end;
$$;

create or replace function public.admin_get_user_kids(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  return jsonb_build_object(
    'success', true,
    'kids', (
      select coalesce(jsonb_agg(row_to_json(k)), '[]'::jsonb)
      from (
        select
          id,
          nome,
          apelido,
          idade,
          codigo_publico,
          saldo,
          is_frozen,
          limite_diario,
          limite_pix,
          limite_transferencia,
          aprovacao_transferencias,
          bloqueio_envio,
          created_at
        from public.kids_profiles
        where user_responsavel = _user_id
        order by created_at
      ) k
    )
  );
end;
$$;

create or replace function public.admin_get_recent_transactions(_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  return jsonb_build_object(
    'success', true,
    'transactions', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select
          tx.id,
          tx.tipo,
          tx.valor,
          tx.descricao,
          tx.status,
          tx.created_at,
          tx.from_user,
          tx.from_kid,
          tx.to_kid,
          coalesce(p.nome, '') as from_user_nome,
          coalesce(fk.nome, '') as from_kid_nome,
          coalesce(tk.nome, '') as to_kid_nome
        from public.transactions tx
        left join public.profiles p on p.user_id = tx.from_user
        left join public.kids_profiles fk on fk.id = tx.from_kid
        left join public.kids_profiles tk on tk.id = tx.to_kid
        order by tx.created_at desc
        limit _limit
      ) t
    )
  );
end;
$$;

create or replace function public.admin_toggle_freeze(_kid_id uuid, _freeze boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  update public.kids_profiles
  set is_frozen = _freeze
  where id = _kid_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_get_deposit_metrics()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _hoje_valor numeric;
  _mes_valor numeric;
  _total_valor numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  select coalesce(sum(valor), 0) into _hoje_valor
  from public.deposits
  where created_at >= date_trunc('day', now());

  select coalesce(sum(valor), 0) into _mes_valor
  from public.deposits
  where created_at >= date_trunc('month', now());

  select coalesce(sum(valor), 0) into _total_valor
  from public.deposits;

  return jsonb_build_object(
    'success', true,
    'deposits_today', _hoje_valor,
    'deposits_month', _mes_valor,
    'deposits_total', _total_valor,
    'recent_deposits', '[]'::jsonb
  );
end;
$$;

create or replace function public.admin_get_financial_metrics()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _saques_hoje_valor numeric;
  _saques_mes_valor numeric;
  _saques_total_valor numeric;
  _transfers_hoje_valor numeric;
  _transfers_mes_valor numeric;
  _transfers_total_valor numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissão');
  end if;

  select coalesce(sum(valor), 0) into _saques_hoje_valor
  from public.withdrawals
  where created_at >= date_trunc('day', now());

  select coalesce(sum(valor), 0) into _saques_mes_valor
  from public.withdrawals
  where created_at >= date_trunc('month', now());

  select coalesce(sum(valor), 0) into _saques_total_valor
  from public.withdrawals;

  select coalesce(sum(valor), 0) into _transfers_hoje_valor
  from public.transactions
  where created_at >= date_trunc('day', now());

  select coalesce(sum(valor), 0) into _transfers_mes_valor
  from public.transactions
  where created_at >= date_trunc('month', now());

  select coalesce(sum(valor), 0) into _transfers_total_valor
  from public.transactions;

  return jsonb_build_object(
    'success', true,
    'withdrawals_today', _saques_hoje_valor,
    'withdrawals_month', _saques_mes_valor,
    'withdrawals_total', _saques_total_valor,
    'transactions_today', _transfers_hoje_valor,
    'transactions_month', _transfers_mes_valor,
    'transactions_total', _transfers_total_valor
  );
end;
$$;
