create or replace function public.rescue_allowance(
  _kid_id uuid,
  _valor numeric,
  _descricao text default 'Resgate de mesada'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_kid kids_profiles%rowtype;
  v_family_owner_id uuid;
begin
  select coalesce(
    (
      select sg.primary_user_id
      from public.secondary_guardians sg
      where sg.secondary_user_id = auth.uid()
      order by sg.created_at asc
      limit 1
    ),
    auth.uid()
  )
  into v_family_owner_id;

  select *
  into v_kid
  from public.kids_profiles
  where id = _kid_id
    and user_responsavel = v_family_owner_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  end if;

  if v_kid.is_frozen then
    return jsonb_build_object('success', false, 'error', 'Conta congelada');
  end if;

  if _valor <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor inválido');
  end if;

  if v_kid.saldo < _valor then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente do filho');
  end if;

  update public.kids_profiles
  set saldo = saldo - _valor
  where id = _kid_id;

  update public.profiles
  set saldo = saldo + _valor
  where user_id = auth.uid();

  insert into public.transactions (tipo, from_kid, to_user, valor, descricao, status)
  values ('mesada', _kid_id, auth.uid(), _valor, _descricao, 'aprovado');

  return jsonb_build_object('success', true);
end;
$function$;
