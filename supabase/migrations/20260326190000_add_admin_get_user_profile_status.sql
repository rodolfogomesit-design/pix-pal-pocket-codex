create or replace function public.admin_get_user_profile_status(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _profile public.profiles%rowtype;
  _banned_until timestamptz;
  _effective_blocked boolean := false;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissao');
  end if;

  select *
  into _profile
  from public.profiles
  where user_id = _user_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado');
  end if;

  select u.banned_until
  into _banned_until
  from auth.users u
  where u.id = _user_id;

  _effective_blocked := coalesce(_profile.is_blocked, false)
    or (_banned_until is not null and _banned_until > now());

  return jsonb_build_object(
    'success', true,
    'is_blocked', _effective_blocked,
    'limite_diario', _profile.limite_diario,
    'limite_deposito', _profile.limite_deposito,
    'cpf', _profile.cpf,
    'chave_pix', _profile.chave_pix
  );
end;
$$;
