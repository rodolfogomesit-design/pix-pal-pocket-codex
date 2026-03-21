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
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_type' and typnamespace = 'public'::regnamespace) then
    create type public.transaction_type as enum ('mesada', 'transferencia', 'pagamento');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_status' and typnamespace = 'public'::regnamespace) then
    create type public.transaction_status as enum ('pendente', 'aprovado', 'recusado');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  cpf text,
  chave_pix text,
  saldo numeric not null default 0.00,
  codigo_usuario text unique,
  is_blocked boolean not null default false,
  limite_diario numeric,
  limite_deposito numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table if not exists public.kids_profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_responsavel uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  apelido text,
  idade integer not null default 0,
  codigo_publico text not null unique,
  saldo numeric(10,2) not null default 0.00,
  saldo_poupanca numeric not null default 0.00,
  saldo_comissao numeric not null default 0.00,
  pin text not null default '0000',
  is_frozen boolean not null default false,
  is_mini_gerente boolean not null default false,
  referral_code text unique,
  limite_diario numeric(10,2) default 50.00,
  limite_pix numeric(10,2),
  limite_transferencia numeric(10,2),
  aprovacao_transferencias boolean not null default false,
  bloqueio_envio boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid not null default gen_random_uuid() primary key,
  tipo public.transaction_type not null,
  from_user uuid,
  to_user uuid,
  from_kid uuid references public.kids_profiles(id),
  to_kid uuid references public.kids_profiles(id),
  valor numeric(10,2) not null,
  descricao text,
  status public.transaction_status not null default 'aprovado',
  created_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kid_id uuid references public.kids_profiles(id) on delete set null,
  valor numeric(10,2) not null default 0,
  external_id text unique,
  pix_code text,
  qr_code_url text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  valor numeric(10,2) not null default 0,
  chave_pix text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  id uuid not null default gen_random_uuid() primary key,
  key text not null unique,
  value text not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_custom_fees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fee_key text not null,
  fee_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fee_key)
);

create table if not exists public.secondary_guardians (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid not null references auth.users(id) on delete cascade,
  secondary_user_id uuid references auth.users(id) on delete set null,
  nome text,
  cpf text,
  email text,
  telefone text,
  parentesco text default 'outros',
  added_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_kid_id uuid references public.kids_profiles(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referred_nome text default '',
  referred_codigo text default '',
  created_at timestamptz not null default now(),
  unique (referrer_kid_id, referred_user_id)
);

create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  referrer_kid_id uuid not null references public.kids_profiles(id) on delete cascade,
  deposit_id uuid references public.deposits(id),
  valor_deposito numeric not null default 0,
  taxa_percentual numeric not null default 0,
  valor_comissao numeric not null default 0,
  created_at timestamptz not null default now()
);

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
drop trigger if exists update_kids_profiles_updated_at on public.kids_profiles;
create trigger update_kids_profiles_updated_at before update on public.kids_profiles for each row execute function public.update_updated_at_column();
drop trigger if exists update_deposits_updated_at on public.deposits;
create trigger update_deposits_updated_at before update on public.deposits for each row execute function public.update_updated_at_column();
drop trigger if exists update_withdrawals_updated_at on public.withdrawals;
create trigger update_withdrawals_updated_at before update on public.withdrawals for each row execute function public.update_updated_at_column();
drop trigger if exists update_platform_settings_updated_at on public.platform_settings;
create trigger update_platform_settings_updated_at before update on public.platform_settings for each row execute function public.update_updated_at_column();

insert into public.platform_settings (key, value, label)
values
  ('limite_diario_padrao', '50', 'Limite diario padrao'),
  ('limite_transferencia', '200', 'Limite por transferencia'),
  ('limite_pix', '500', 'Limite por Pix'),
  ('limite_deposito', '1000', 'Limite de deposito diario'),
  ('idade_minima', '6', 'Idade minima'),
  ('termos_uso', 'Termos ainda nao configurados.', 'Termos de Uso'),
  ('politica_privacidade', 'Politica de privacidade ainda nao configurada.', 'Politica de Privacidade')
on conflict (key) do nothing;

create or replace function public.generate_codigo_usuario()
returns text language plpgsql as $$
declare next_code integer;
begin
  select coalesce(max(codigo_usuario::integer), 0) + 1 into next_code
  from public.profiles where codigo_usuario ~ '^\d{5}$';
  return lpad(next_code::text, 5, '0');
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
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
  set nome = excluded.nome,
      email = excluded.email,
      telefone = coalesce(excluded.telefone, public.profiles.telefone),
      cpf = coalesce(excluded.cpf, public.profiles.cpf),
      codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop function if exists public.get_email_by_cpf(text);

create or replace function public.get_email_by_cpf(_cpf text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare _email text;
declare _cpf_digits text;
begin
  _cpf_digits := regexp_replace(coalesce(_cpf, ''), '\D', '', 'g');
  select email into _email
  from public.profiles
  where regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = _cpf_digits;
  if _email is null then
    return json_build_object('success', false, 'error', 'CPF nao encontrado');
  end if;
  return json_build_object('success', true, 'email', _email);
end;
$$;

create or replace function public.admin_get_metrics() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _total_users integer; _total_kids integer; _total_transactions integer; _total_balance numeric; _total_volume numeric; _pending_approvals integer;
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  select count(*) into _total_users from public.profiles;
  select count(*) into _total_kids from public.kids_profiles;
  select count(*) into _total_transactions from public.transactions;
  select
    coalesce((select sum(saldo) from public.profiles), 0) +
    coalesce((select sum(saldo) from public.kids_profiles), 0)
  into _total_balance;
  select coalesce(sum(valor),0) into _total_volume from public.transactions where status = 'aprovado';
  select count(*) into _pending_approvals from public.transactions where status = 'pendente';
  return jsonb_build_object('success', true, 'total_users', _total_users, 'total_kids', _total_kids, 'total_transactions', _total_transactions, 'total_balance', _total_balance, 'total_volume', _total_volume, 'pending_approvals', _pending_approvals);
end;
$$;

create or replace function public.admin_get_detailed_metrics() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _total_responsaveis integer; _total_criancas integer; _responsaveis_hoje integer; _criancas_hoje integer; _responsaveis_mes integer; _criancas_mes integer; _ativos_24h integer; _ativos_30d integer; _total_balance numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  select count(*) into _total_responsaveis from public.profiles;
  select count(*) into _total_criancas from public.kids_profiles;
  select count(*) into _responsaveis_hoje from public.profiles where created_at >= date_trunc('day', now());
  select count(*) into _criancas_hoje from public.kids_profiles where created_at >= date_trunc('day', now());
  select count(*) into _responsaveis_mes from public.profiles where created_at >= date_trunc('month', now());
  select count(*) into _criancas_mes from public.kids_profiles where created_at >= date_trunc('month', now());
  select count(distinct coalesce(t.from_user, kp.user_responsavel)) into _ativos_24h from public.transactions t left join public.kids_profiles kp on kp.id = t.from_kid or kp.id = t.to_kid where t.created_at >= now() - interval '24 hours';
  select count(distinct coalesce(t.from_user, kp.user_responsavel)) into _ativos_30d from public.transactions t left join public.kids_profiles kp on kp.id = t.from_kid or kp.id = t.to_kid where t.created_at >= now() - interval '30 days';
  select
    coalesce((select sum(saldo) from public.profiles), 0) +
    coalesce((select sum(saldo) from public.kids_profiles), 0)
  into _total_balance;
  return jsonb_build_object('success', true, 'total_responsaveis', _total_responsaveis, 'total_criancas', _total_criancas, 'responsaveis_hoje', _responsaveis_hoje, 'criancas_hoje', _criancas_hoje, 'responsaveis_mes', _responsaveis_mes, 'criancas_mes', _criancas_mes, 'ativos_24h', _ativos_24h, 'ativos_30d', _ativos_30d, 'total_balance', _total_balance);
end;
$$;

create or replace function public.admin_search_users(_query text default ''::text, _limit integer default 10, _offset integer default 0) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _total integer;
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  select count(*) into _total from public.profiles p where _query = '' or p.nome ilike '%' || _query || '%' or p.email ilike '%' || _query || '%' or p.cpf ilike '%' || _query || '%' or p.codigo_usuario ilike '%' || _query || '%';
  return jsonb_build_object(
    'success', true,
    'total', _total,
    'users', (
      select coalesce(jsonb_agg(row_to_json(u)), '[]'::jsonb)
      from (
        select p.id, p.user_id, p.nome, p.email, p.telefone, p.cpf, p.codigo_usuario, p.created_at,
          (select count(*) from public.kids_profiles k where k.user_responsavel = p.user_id) as kids_count,
          coalesce(p.saldo, 0) +
          coalesce((select sum(k.saldo) from public.kids_profiles k where k.user_responsavel = p.user_id), 0) as total_balance
        from public.profiles p
        where _query = '' or p.nome ilike '%' || _query || '%' or p.email ilike '%' || _query || '%' or p.cpf ilike '%' || _query || '%' or p.codigo_usuario ilike '%' || _query || '%'
        order by p.created_at desc
        limit _limit offset _offset
      ) u
    )
  );
end;
$$;

create or replace function public.admin_get_user_kids(_user_id uuid) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  return jsonb_build_object(
    'success', true,
    'kids', (
      select coalesce(jsonb_agg(row_to_json(k)), '[]'::jsonb)
      from (
        select id, nome, apelido, idade, codigo_publico, saldo, is_frozen, limite_diario, limite_pix, limite_transferencia, aprovacao_transferencias, bloqueio_envio, created_at
        from public.kids_profiles
        where user_responsavel = _user_id
        order by created_at
      ) k
    )
  );
end;
$$;

create or replace function public.admin_get_recent_transactions(_limit integer default 20) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  return jsonb_build_object(
    'success', true,
    'transactions', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select tx.id, tx.tipo, tx.valor, tx.descricao, tx.status, tx.created_at, tx.from_user, tx.from_kid, tx.to_kid,
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

create or replace function public.admin_toggle_freeze(_kid_id uuid, _freeze boolean) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  update public.kids_profiles set is_frozen = _freeze where id = _kid_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Crianca nao encontrada'); end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_block_user(_user_id uuid, _block boolean) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  update public.profiles set is_blocked = _block where user_id = _user_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado'); end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_toggle_admin(_user_id uuid, _enable boolean) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  if _enable then
    insert into public.user_roles (user_id, role) values (_user_id, 'admin') on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = 'admin';
  end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_delete_user(_user_id uuid) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  delete from public.referral_commissions where referrer_kid_id in (select id from public.kids_profiles where user_responsavel = _user_id);
  delete from public.referrals where referred_user_id = _user_id or referrer_kid_id in (select id from public.kids_profiles where user_responsavel = _user_id);
  delete from public.transactions where from_user = _user_id or to_user = _user_id or from_kid in (select id from public.kids_profiles where user_responsavel = _user_id) or to_kid in (select id from public.kids_profiles where user_responsavel = _user_id);
  delete from public.deposits where user_id = _user_id or kid_id in (select id from public.kids_profiles where user_responsavel = _user_id);
  delete from public.withdrawals where user_id = _user_id;
  delete from public.user_custom_fees where user_id = _user_id;
  delete from public.secondary_guardians where primary_user_id = _user_id or secondary_user_id = _user_id;
  delete from public.user_roles where user_id = _user_id;
  delete from public.kids_profiles where user_responsavel = _user_id;
  delete from public.profiles where user_id = _user_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_get_user_transactions(_user_id uuid, _limit integer default 50) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  return jsonb_build_object(
    'success', true,
    'transactions', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select tx.id, tx.tipo, tx.valor, tx.descricao, tx.status, tx.created_at, tx.from_user, tx.from_kid, tx.to_kid,
          coalesce(p.nome, '') as from_user_nome,
          coalesce(fk.nome, '') as from_kid_nome,
          coalesce(tk.nome, '') as to_kid_nome
        from public.transactions tx
        left join public.profiles p on p.user_id = tx.from_user
        left join public.kids_profiles fk on fk.id = tx.from_kid
        left join public.kids_profiles tk on tk.id = tx.to_kid
        where tx.from_user = _user_id or tx.to_user = _user_id or tx.from_kid in (select id from public.kids_profiles where user_responsavel = _user_id) or tx.to_kid in (select id from public.kids_profiles where user_responsavel = _user_id)
        order by tx.created_at desc
        limit _limit
      ) t
    )
  );
end;
$$;

create or replace function public.admin_adjust_balance(_user_id uuid, _valor numeric, _descricao text default 'Ajuste administrativo') returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _new_saldo numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  update public.profiles set saldo = saldo + _valor where user_id = _user_id returning saldo into _new_saldo;
  if _new_saldo is null then return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado'); end if;
  insert into public.transactions (tipo, to_user, valor, descricao, status) values ('transferencia', _user_id, abs(_valor), _descricao, 'aprovado');
  return jsonb_build_object('success', true, 'new_balance', _new_saldo);
end;
$$;

create or replace function public.admin_update_user_profile(_user_id uuid, _nome text default null, _telefone text default null, _email text default null) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  update public.profiles set nome = coalesce(_nome, nome), telefone = _telefone, email = coalesce(_email, email) where user_id = _user_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado'); end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_update_kid_limits(_kid_id uuid, _limite_diario numeric default null, _limite_pix numeric default null, _limite_transferencia numeric default null) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  update public.kids_profiles set limite_diario = _limite_diario, limite_pix = _limite_pix, limite_transferencia = _limite_transferencia where id = _kid_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Crianca nao encontrada'); end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_update_user_limits(_user_id uuid, _limite_diario numeric default null, _limite_deposito numeric default null) returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  update public.profiles set limite_diario = _limite_diario, limite_deposito = _limite_deposito where user_id = _user_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado'); end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_get_deposit_metrics() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _hoje_valor numeric; _mes_valor numeric; _total_valor numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  select coalesce(sum(valor),0) into _hoje_valor from public.deposits where created_at >= date_trunc('day', now());
  select coalesce(sum(valor),0) into _mes_valor from public.deposits where created_at >= date_trunc('month', now());
  select coalesce(sum(valor),0) into _total_valor from public.deposits;
  return jsonb_build_object('success', true, 'deposits_today', _hoje_valor, 'deposits_month', _mes_valor, 'deposits_total', _total_valor, 'recent_deposits', '[]'::jsonb);
end;
$$;

create or replace function public.admin_get_financial_metrics() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare _saques_hoje_valor numeric; _saques_mes_valor numeric; _saques_total_valor numeric; _transfers_hoje_valor numeric; _transfers_mes_valor numeric; _transfers_total_valor numeric;
begin
  if not public.has_role(auth.uid(), 'admin') then return jsonb_build_object('success', false, 'error', 'Sem permissao'); end if;
  select coalesce(sum(valor),0) into _saques_hoje_valor from public.withdrawals where created_at >= date_trunc('day', now());
  select coalesce(sum(valor),0) into _saques_mes_valor from public.withdrawals where created_at >= date_trunc('month', now());
  select coalesce(sum(valor),0) into _saques_total_valor from public.withdrawals;
  select coalesce(sum(valor),0) into _transfers_hoje_valor from public.transactions where created_at >= date_trunc('day', now());
  select coalesce(sum(valor),0) into _transfers_mes_valor from public.transactions where created_at >= date_trunc('month', now());
  select coalesce(sum(valor),0) into _transfers_total_valor from public.transactions;
  return jsonb_build_object('success', true, 'withdrawals_today', _saques_hoje_valor, 'withdrawals_month', _saques_mes_valor, 'withdrawals_total', _saques_total_valor, 'transactions_today', _transfers_hoje_valor, 'transactions_month', _transfers_mes_valor, 'transactions_total', _transfers_total_valor);
end;
$$;

insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
select u.id, coalesce(u.raw_user_meta_data->>'nome', u.raw_user_meta_data->>'full_name', 'Usuario'), u.email, nullif(u.raw_user_meta_data->>'telefone', ''), nullif(u.raw_user_meta_data->>'cpf', ''), public.generate_codigo_usuario()
from auth.users u
on conflict (user_id) do update
set nome = excluded.nome,
    email = excluded.email,
    telefone = coalesce(excluded.telefone, public.profiles.telefone),
    cpf = coalesce(excluded.cpf, public.profiles.cpf),
    codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);
