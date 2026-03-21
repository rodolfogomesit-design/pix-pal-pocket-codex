create extension if not exists pgcrypto;

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
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.generate_codigo_usuario()
returns text
language plpgsql
as $$
declare
  next_code integer;
begin
  select coalesce(max(codigo_usuario::integer), 0) + 1
  into next_code
  from public.profiles
  where codigo_usuario ~ '^\d{5}$';

  return lpad(next_code::text, 5, '0');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', 'Usuário'),
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
$function$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.get_email_by_cpf(_cpf text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _email text;
begin
  select email into _email
  from public.profiles
  where cpf = _cpf;

  if _email is null then
    return json_build_object('success', false, 'error', 'CPF não encontrado');
  end if;

  return json_build_object('success', true, 'email', _email);
end;
$function$;

insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'nome', u.raw_user_meta_data->>'full_name', 'Usuário'),
  u.email,
  nullif(u.raw_user_meta_data->>'telefone', ''),
  nullif(u.raw_user_meta_data->>'cpf', ''),
  public.generate_codigo_usuario()
from auth.users u
on conflict (user_id) do update
set
  nome = excluded.nome,
  email = excluded.email,
  telefone = coalesce(excluded.telefone, public.profiles.telefone),
  cpf = coalesce(excluded.cpf, public.profiles.cpf),
  codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);
