create or replace function public.send_allowance_from_balance(
  _kid_id uuid,
  _valor numeric,
  _descricao text default 'Mesada'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _parent_id uuid := auth.uid();
  _family_owner_id uuid;
  _parent profiles%rowtype;
  _kid kids_profiles%rowtype;
  _today_spent numeric;
begin
  select coalesce(
    (
      select sg.primary_user_id
      from public.secondary_guardians sg
      where sg.secondary_user_id = _parent_id
      order by sg.created_at asc
      limit 1
    ),
    _parent_id
  )
  into _family_owner_id;

  select *
  into _parent
  from public.profiles
  where user_id = _parent_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  end if;

  if _parent.saldo < _valor then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente. Deposite mais fundos.');
  end if;

  if _parent.limite_diario is not null then
    select coalesce(sum(valor), 0)
    into _today_spent
    from public.transactions
    where from_user = _parent_id
      and status = 'aprovado'
      and created_at >= date_trunc('day', now());

    if (_today_spent + _valor) > _parent.limite_diario then
      return jsonb_build_object(
        'success', false,
        'error', format('Limite diário do responsável excedido (R$ %s/%s)', _today_spent::text, _parent.limite_diario::text)
      );
    end if;
  end if;

  select *
  into _kid
  from public.kids_profiles
  where id = _kid_id
    and user_responsavel = _family_owner_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  end if;

  if _kid.is_frozen then
    return jsonb_build_object('success', false, 'error', 'A conta do filho está congelada');
  end if;

  update public.profiles
  set saldo = saldo - _valor
  where user_id = _parent_id;

  update public.kids_profiles
  set saldo = saldo + _valor
  where id = _kid_id;

  insert into public.transactions (tipo, from_user, to_kid, valor, descricao, status)
  values ('mesada', _parent_id, _kid_id, _valor, _descricao, 'aprovado');

  perform public.process_referral_commission(null, _parent_id, _valor);

  return jsonb_build_object('success', true, 'new_parent_balance', _parent.saldo - _valor);
end;
$function$;

create or replace function public.remove_secondary_guardian(_link_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _user_id uuid := auth.uid();
  _link public.secondary_guardians%rowtype;
begin
  select * into _link
  from public.secondary_guardians
  where id = _link_id;

  if _link.id is null then
    return json_build_object('success', false, 'error', 'Vínculo não encontrado.');
  end if;

  if _link.primary_user_id <> _user_id then
    return json_build_object('success', false, 'error', 'Somente o responsável principal pode remover este vínculo.');
  end if;

  delete from public.secondary_guardians
  where id = _link_id;

  return json_build_object('success', true, 'message', 'Responsável removido com sucesso.');
end;
$function$;
