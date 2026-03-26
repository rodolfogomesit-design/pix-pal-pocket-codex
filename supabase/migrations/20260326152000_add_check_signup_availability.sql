create or replace function public.check_signup_availability(
  _email text,
  _cpf text
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _email_normalized text := lower(trim(coalesce(_email, '')));
  _cpf_digits text := regexp_replace(coalesce(_cpf, ''), '\D', '', 'g');
  _email_exists boolean := false;
  _cpf_exists boolean := false;
begin
  if _email_normalized <> '' then
    select exists(
      select 1
      from auth.users u
      where lower(u.email) = _email_normalized
    )
    into _email_exists;
  end if;

  if _cpf_digits <> '' then
    select exists(
      select 1
      from public.profiles p
      where regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = _cpf_digits
    )
    into _cpf_exists;
  end if;

  return json_build_object(
    'available', not _email_exists and not _cpf_exists,
    'email_exists', _email_exists,
    'cpf_exists', _cpf_exists
  );
end;
$$;

grant execute on function public.check_signup_availability(text, text) to anon, authenticated;
