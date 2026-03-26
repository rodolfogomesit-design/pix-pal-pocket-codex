update auth.users u
set
  email = lower(coalesce(u.email, sg.email)),
  email_confirmed_at = coalesce(u.email_confirmed_at, now()),
  aud = coalesce(nullif(u.aud, ''), 'authenticated'),
  role = coalesce(nullif(u.role, ''), 'authenticated'),
  raw_app_meta_data = coalesce(
    u.raw_app_meta_data,
    jsonb_build_object('provider', 'email', 'providers', array['email'])
  ),
  raw_user_meta_data = coalesce(
    u.raw_user_meta_data,
    jsonb_build_object('nome', coalesce(nullif(sg.nome, ''), 'Usuário'))
  )
from public.secondary_guardians sg
where sg.secondary_user_id = u.id
  and sg.secondary_user_id is not null;

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
join public.secondary_guardians sg on sg.secondary_user_id = u.id
left join auth.identities i
  on i.user_id = u.id
 and i.provider = 'email'
where sg.secondary_user_id is not null
  and coalesce(u.email, '') <> ''
  and i.user_id is null;
