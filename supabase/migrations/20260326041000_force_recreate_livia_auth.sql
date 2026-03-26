do $$
declare
  _target_email text := 'livia@hotmail.com';
  _target_password text := 'Livia@2026';
  _new_user_id uuid := extensions.uuid_generate_v4();
  _invite record;
begin
  select id, primary_user_id, nome, telefone, cpf
  into _invite
  from public.secondary_guardians
  where lower(email) = lower(_target_email)
  order by created_at desc
  limit 1;

  if _invite.id is null then
    raise exception 'Convite pendente nao encontrado para %', _target_email;
  end if;

  delete from auth.identities
  where lower(provider_id) = lower(_target_email);

  delete from public.profiles
  where lower(email) = lower(_target_email);

  delete from auth.users
  where lower(email) = lower(_target_email);

  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    confirmation_token
  )
  values (
    _new_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(_target_email),
    extensions.crypt(_target_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(
      'nome', coalesce(nullif(_invite.nome, ''), 'Livia'),
      'cpf', _invite.cpf,
      'telefone', _invite.telefone
    ),
    'authenticated',
    'authenticated',
    ''
  );

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
  values (
    _new_user_id,
    _new_user_id,
    lower(_target_email),
    jsonb_build_object(
      'sub', _new_user_id::text,
      'email', lower(_target_email),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  update public.profiles
  set
    nome = coalesce(nullif(_invite.nome, ''), 'Livia'),
    email = lower(_target_email),
    telefone = _invite.telefone,
    cpf = _invite.cpf,
    codigo_usuario = coalesce(codigo_usuario, public.generate_codigo_usuario())
  where user_id = _new_user_id;

  update public.secondary_guardians
  set
    secondary_user_id = _new_user_id,
    nome = coalesce(nome, _invite.nome),
    telefone = coalesce(telefone, _invite.telefone),
    cpf = coalesce(cpf, _invite.cpf)
  where id = _invite.id;
end
$$;
