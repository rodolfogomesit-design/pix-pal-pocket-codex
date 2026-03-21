create or replace function public.generate_codigo_usuario()
returns text
language plpgsql
set search_path = public
as $$
declare
  next_code integer;
begin
  select coalesce(max(substring(codigo_usuario from 2)::integer), 0) + 1
  into next_code
  from public.profiles
  where codigo_usuario ~ '^U\d{5}$';

  return 'U' || lpad(next_code::text, 5, '0');
end;
$$;

create or replace function public.generate_codigo_publico()
returns text
language plpgsql
set search_path = public
as $$
declare
  next_code integer;
begin
  select coalesce(max(substring(codigo_publico from 2)::integer), 0) + 1
  into next_code
  from public.kids_profiles
  where codigo_publico ~ '^K\d{5}$';

  return 'K' || lpad(next_code::text, 5, '0');
end;
$$;

with ordered_profiles as (
  select
    user_id,
    'U' || lpad(row_number() over (order by created_at, user_id)::text, 5, '0') as new_code
  from public.profiles
)
update public.profiles p
set codigo_usuario = o.new_code
from ordered_profiles o
where o.user_id = p.user_id
  and p.codigo_usuario is distinct from o.new_code;

with ordered_kids as (
  select
    id,
    'K' || lpad(row_number() over (order by created_at, id)::text, 5, '0') as new_code
  from public.kids_profiles
)
update public.kids_profiles k
set
  codigo_publico = o.new_code,
  referral_code = case
    when k.is_mini_gerente then o.new_code
    else k.referral_code
  end
from ordered_kids o
where o.id = k.id
  and (
    k.codigo_publico is distinct from o.new_code
    or (k.is_mini_gerente and k.referral_code is distinct from o.new_code)
  );
