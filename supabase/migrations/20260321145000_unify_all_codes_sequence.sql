create or replace function public.generate_app_codigo()
returns text
language plpgsql
set search_path = public
as $$
declare
  next_code integer;
begin
  select coalesce(max(code_num), 0) + 1
  into next_code
  from (
    select codigo_usuario::integer as code_num
    from public.profiles
    where codigo_usuario ~ '^\d{5}$'
    union all
    select codigo_publico::integer as code_num
    from public.kids_profiles
    where codigo_publico ~ '^\d{5}$'
  ) codes;

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

with all_codes as (
  select
    'profile' as entity_type,
    user_id::text as entity_id,
    created_at
  from public.profiles

  union all

  select
    'kid' as entity_type,
    id::text as entity_id,
    created_at
  from public.kids_profiles
),
ordered_codes as (
  select
    entity_type,
    entity_id,
    lpad(row_number() over (order by created_at, entity_type, entity_id)::text, 5, '0') as new_code
  from all_codes
)
update public.profiles p
set codigo_usuario = '__TMPU__' || oc.new_code
from ordered_codes oc
where oc.entity_type = 'profile'
  and oc.entity_id = p.user_id::text;

with all_codes as (
  select
    'profile' as entity_type,
    user_id::text as entity_id,
    created_at
  from public.profiles

  union all

  select
    'kid' as entity_type,
    id::text as entity_id,
    created_at
  from public.kids_profiles
),
ordered_codes as (
  select
    entity_type,
    entity_id,
    lpad(row_number() over (order by created_at, entity_type, entity_id)::text, 5, '0') as new_code
  from all_codes
)
update public.kids_profiles k
set
  codigo_publico = '__TMPK__' || oc.new_code,
  referral_code = case
    when k.is_mini_gerente then '__TMPK__' || oc.new_code
    else k.referral_code
  end
from ordered_codes oc
where oc.entity_type = 'kid'
  and oc.entity_id = k.id::text;

with all_codes as (
  select
    'profile' as entity_type,
    user_id::text as entity_id,
    created_at
  from public.profiles

  union all

  select
    'kid' as entity_type,
    id::text as entity_id,
    created_at
  from public.kids_profiles
),
ordered_codes as (
  select
    entity_type,
    entity_id,
    lpad(row_number() over (order by created_at, entity_type, entity_id)::text, 5, '0') as new_code
  from all_codes
)
update public.profiles p
set codigo_usuario = oc.new_code
from ordered_codes oc
where oc.entity_type = 'profile'
  and oc.entity_id = p.user_id::text;

with all_codes as (
  select
    'profile' as entity_type,
    user_id::text as entity_id,
    created_at
  from public.profiles

  union all

  select
    'kid' as entity_type,
    id::text as entity_id,
    created_at
  from public.kids_profiles
),
ordered_codes as (
  select
    entity_type,
    entity_id,
    lpad(row_number() over (order by created_at, entity_type, entity_id)::text, 5, '0') as new_code
  from all_codes
)
update public.kids_profiles k
set
  codigo_publico = oc.new_code,
  referral_code = case
    when k.is_mini_gerente then oc.new_code
    else k.referral_code
  end
from ordered_codes oc
where oc.entity_type = 'kid'
  and oc.entity_id = k.id::text
  and (
    k.codigo_publico is distinct from oc.new_code
    or (k.is_mini_gerente and k.referral_code is distinct from oc.new_code)
  );
