update auth.users u
set
  email = lower(coalesce(u.email, p.email)),
  email_confirmed_at = coalesce(u.email_confirmed_at, now()),
  aud = coalesce(nullif(u.aud, ''), 'authenticated'),
  role = coalesce(nullif(u.role, ''), 'authenticated'),
  raw_app_meta_data = coalesce(
    u.raw_app_meta_data,
    jsonb_build_object('provider', 'email', 'providers', array['email'])
  ),
  raw_user_meta_data = coalesce(
    u.raw_user_meta_data,
    jsonb_build_object('nome', coalesce(nullif(p.nome, ''), 'Usuário'))
  )
from public.profiles p
where p.user_id = u.id
  and coalesce(p.email, u.email, '') <> '';

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
  lower(coalesce(u.email, p.email)),
  jsonb_build_object(
    'sub', u.id::text,
    'email', lower(coalesce(u.email, p.email)),
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  coalesce(u.created_at, now()),
  now()
from auth.users u
join public.profiles p on p.user_id = u.id
left join auth.identities i
  on i.user_id = u.id
 and i.provider = 'email'
where coalesce(u.email, p.email, '') <> ''
  and i.user_id is null;
