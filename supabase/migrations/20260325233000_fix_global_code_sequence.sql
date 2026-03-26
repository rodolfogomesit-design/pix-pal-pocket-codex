create sequence if not exists public.app_codigo_seq;

do $$
declare
  next_code bigint;
begin
  select coalesce(max(code_num), 0) + 1
  into next_code
  from (
    select codigo_usuario::bigint as code_num
    from public.profiles
    where codigo_usuario ~ '^\d{5}$'

    union all

    select codigo_publico::bigint as code_num
    from public.kids_profiles
    where codigo_publico ~ '^\d{5}$'
  ) codes;

  perform setval('public.app_codigo_seq', greatest(next_code - 1, 0), true);
end
$$;

create or replace function public.generate_app_codigo()
returns text
language plpgsql
set search_path = public
as $$
declare
  next_code bigint;
begin
  next_code := nextval('public.app_codigo_seq');
  return lpad(next_code::text, 5, '0');
end;
$$;

create or replace function public.generate_codigo_usuario()
returns text
language plpgsql
set search_path = public
as $$
begin
  return public.generate_app_codigo();
end;
$$;

create or replace function public.generate_codigo_publico()
returns text
language plpgsql
set search_path = public
as $$
begin
  return public.generate_app_codigo();
end;
$$;

grant usage, select on sequence public.app_codigo_seq to postgres, anon, authenticated, service_role;
