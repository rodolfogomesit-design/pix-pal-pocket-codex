do $$
declare
  _target_user_id uuid;
begin
  select p.user_id
  into _target_user_id
  from public.profiles p
  where lower(p.email) = 'pixkids@gmail.com'
     or regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = '74223950363'
  limit 1;

  if _target_user_id is null then
    raise exception 'Conta admin pixkids nao encontrada';
  end if;

  update auth.users
  set
    email = 'pixkids@gmail.com',
    encrypted_password = extensions.crypt('PixKids@2026', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    aud = coalesce(nullif(aud, ''), 'authenticated'),
    role = coalesce(nullif(role, ''), 'authenticated'),
    raw_app_meta_data = coalesce(
      raw_app_meta_data,
      jsonb_build_object('provider', 'email', 'providers', array['email'])
    ),
    raw_user_meta_data = coalesce(
      raw_user_meta_data,
      jsonb_build_object('nome', 'Pix Kids Admin')
    )
  where id = _target_user_id;

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    u.id,
    u.id,
    lower(u.email),
    jsonb_build_object(
      'sub', u.id::text,
      'email', lower(u.email),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    coalesce(u.created_at, now()),
    now()
  from auth.users u
  left join auth.identities i
    on i.user_id = u.id
   and i.provider = 'email'
  where u.id = _target_user_id
    and i.user_id is null;

  update public.profiles
  set
    email = 'pixkids@gmail.com',
    cpf = coalesce(cpf, '742.239.503-63')
  where user_id = _target_user_id;

  insert into public.user_roles (user_id, role)
  values (_target_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end $$;
