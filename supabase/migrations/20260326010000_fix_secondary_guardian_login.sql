create or replace function public.get_email_by_cpf(_cpf text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _email text;
  _cpf_digits text;
begin
  _cpf_digits := regexp_replace(coalesce(_cpf, ''), '\D', '', 'g');

  select p.email
  into _email
  from public.profiles p
  where regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = _cpf_digits
    and coalesce(p.email, '') <> ''
  limit 1;

  if _email is null then
    select coalesce(au.email, sg.email)
    into _email
    from public.secondary_guardians sg
    left join auth.users au on au.id = sg.secondary_user_id
    where regexp_replace(coalesce(sg.cpf, ''), '\D', '', 'g') = _cpf_digits
      and coalesce(au.email, sg.email, '') <> ''
    order by sg.created_at desc
    limit 1;
  end if;

  if _email is null then
    return json_build_object('success', false, 'error', 'CPF nao encontrado');
  end if;

  return json_build_object('success', true, 'email', lower(_email));
end;
$$;

create or replace function public.add_secondary_guardian(
  _nome text,
  _email text,
  _cpf text default null,
  _telefone text default null,
  _parentesco text default 'outros',
  _senha text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _caller_id uuid := auth.uid();
  _family_owner_id uuid;
  _existing_user_id uuid;
  _new_user_id uuid;
begin
  select coalesce(
    (
      select sg.primary_user_id
      from public.secondary_guardians sg
      where sg.secondary_user_id = _caller_id
      order by sg.created_at asc
      limit 1
    ),
    _caller_id
  )
  into _family_owner_id;

  select id into _existing_user_id
  from auth.users
  where lower(email) = lower(_email);

  if _existing_user_id is not null then
    if _existing_user_id = _family_owner_id then
      return jsonb_build_object('success', false, 'error', 'Você não pode adicionar o responsável principal.');
    end if;

    if exists (
      select 1
      from public.secondary_guardians
      where primary_user_id = _family_owner_id
        and secondary_user_id = _existing_user_id
    ) then
      return jsonb_build_object('success', false, 'error', 'Este responsável já está vinculado.');
    end if;

    insert into public.secondary_guardians (
      primary_user_id,
      secondary_user_id,
      nome,
      cpf,
      email,
      telefone,
      parentesco,
      added_by
    )
    values (
      _family_owner_id,
      _existing_user_id,
      _nome,
      _cpf,
      lower(_email),
      _telefone,
      _parentesco,
      _caller_id
    );

    insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
    values (
      _existing_user_id,
      _nome,
      lower(_email),
      _telefone,
      _cpf,
      public.generate_codigo_usuario()
    )
    on conflict (user_id) do update
    set
      nome = coalesce(nullif(public.profiles.nome, 'Usuário'), excluded.nome, public.profiles.nome),
      email = coalesce(public.profiles.email, excluded.email),
      telefone = coalesce(public.profiles.telefone, excluded.telefone),
      cpf = coalesce(public.profiles.cpf, excluded.cpf),
      codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);

    return jsonb_build_object('success', true, 'message', 'Responsável vinculado com sucesso.');
  end if;

  if _senha is not null and length(_senha) >= 6 then
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
      lower(_email),
      extensions.crypt(_senha, extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('nome', _nome),
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
      lower(_email),
      jsonb_build_object(
        'sub', _new_user_id::text,
        'email', lower(_email),
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );

    insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
    values (
      _new_user_id,
      _nome,
      lower(_email),
      _telefone,
      _cpf,
      public.generate_codigo_usuario()
    )
    on conflict (user_id) do update
    set
      nome = coalesce(excluded.nome, public.profiles.nome),
      email = coalesce(excluded.email, public.profiles.email),
      telefone = coalesce(excluded.telefone, public.profiles.telefone),
      cpf = coalesce(excluded.cpf, public.profiles.cpf),
      codigo_usuario = coalesce(public.profiles.codigo_usuario, excluded.codigo_usuario);

    insert into public.secondary_guardians (
      primary_user_id,
      secondary_user_id,
      nome,
      cpf,
      email,
      telefone,
      parentesco,
      added_by
    )
    values (
      _family_owner_id,
      _new_user_id,
      _nome,
      _cpf,
      lower(_email),
      _telefone,
      _parentesco,
      _caller_id
    );

    return jsonb_build_object('success', true, 'message', 'Conta criada e responsável vinculado com sucesso.');
  end if;

  if exists (
    select 1
    from public.secondary_guardians
    where primary_user_id = _family_owner_id
      and lower(email) = lower(_email)
      and secondary_user_id is null
  ) then
    return jsonb_build_object('success', false, 'error', 'Já existe um convite pendente para este e-mail.');
  end if;

  insert into public.secondary_guardians (
    primary_user_id,
    secondary_user_id,
    nome,
    cpf,
    email,
    telefone,
    parentesco,
    added_by
  )
  values (
    _family_owner_id,
    null,
    _nome,
    _cpf,
    lower(_email),
    _telefone,
    _parentesco,
    _caller_id
  );

  return jsonb_build_object('success', true, 'message', 'Responsável adicionado.');
end;
$function$;

insert into public.profiles (user_id, nome, email, telefone, cpf, codigo_usuario)
select
  sg.secondary_user_id,
  coalesce(nullif(sg.nome, ''), 'Usuário'),
  lower(coalesce(au.email, sg.email)),
  sg.telefone,
  sg.cpf,
  public.generate_codigo_usuario()
from public.secondary_guardians sg
left join auth.users au on au.id = sg.secondary_user_id
left join public.profiles p on p.user_id = sg.secondary_user_id
where sg.secondary_user_id is not null
  and p.user_id is null
  and coalesce(au.email, sg.email) is not null;

update public.profiles p
set
  nome = coalesce(nullif(p.nome, 'Usuário'), nullif(sg.nome, ''), p.nome),
  email = coalesce(nullif(p.email, ''), lower(coalesce(au.email, sg.email)), p.email),
  telefone = coalesce(p.telefone, sg.telefone),
  cpf = coalesce(p.cpf, sg.cpf)
from public.secondary_guardians sg
left join auth.users au on au.id = sg.secondary_user_id
where p.user_id = sg.secondary_user_id
  and sg.secondary_user_id is not null;
