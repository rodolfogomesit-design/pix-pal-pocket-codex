do $$
declare
  _target_email text := 'livia@hotmail.com';
begin
  update public.secondary_guardians
  set secondary_user_id = null
  where lower(email) = lower(_target_email);

  delete from auth.identities
  where lower(provider_id) = lower(_target_email);

  delete from public.profiles
  where lower(email) = lower(_target_email);

  delete from auth.users
  where lower(email) = lower(_target_email);
end
$$;
