do $$
declare
  _target_email text := 'livia@hotmail.com';
  _target_password text := 'Livia@2026';
  _pending_link_id uuid;
  _existing_user_id uuid;
  _new_user_id uuid;
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

  _pending_link_id := _invite.id;

  select u.id
  into _existing_user_id
  from auth.users u
  where lower(u.email) = lower(_target_email)
  limit 1;

  if _existing_user_id is null then
    _new_user_id := extensions.uuid_generate_v4();

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
      jsonb_build_object('nome', coalesce(nullif(_invite.nome, ''), 'Livia')),
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

    _existing_user_id := _new_user_id;
  else
    update auth.users
    set
      email = lower(_target_email),
      encrypted_password = extensions.crypt(_target_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      aud = 'authenticated',
      role = 'authenticated',
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
      raw_user_meta_data = jsonb_build_object('nome', coalesce(nullif(_invite.nome, ''), 'Livia')),
      updated_at = now()
    where id = _existing_user_id;

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
      _existing_user_id,
      _existing_user_id,
      lower(_target_email),
      jsonb_build_object(
        'sub', _existing_user_id::text,
        'email', lower(_target_email),
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    where not exists (
      select 1
      from auth.identities i
      where i.user_id = _existing_user_id
        and i.provider = 'email'
    );
  end if;

  insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
  values (
    _existing_user_id,
    coalesce(nullif(_invite.nome, ''), 'Livia'),
    lower(_target_email),
    _invite.telefone,
    _invite.cpf,
    public.generate_codigo_usuario()
  )
  on conflict (user_id) do update
  set
    nome = coalesce(excluded.nome, public.profiles.nome),
    email = excluded.email,
    telefone = coalesce(excluded.telefone, public.profiles.telefone),
    cpf = coalesce(excluded.cpf, public.profiles.cpf),
    codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);

  update public.secondary_guardians
  set
    secondary_user_id = _existing_user_id,
    nome = coalesce(nullif(nome, ''), _invite.nome),
    telefone = coalesce(telefone, _invite.telefone),
    cpf = coalesce(cpf, _invite.cpf)
  where id = _pending_link_id;
end
$$;
