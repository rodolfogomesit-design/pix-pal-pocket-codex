create or replace function public.kid_transfer(
  _from_kid_id uuid,
  _to_codigo text,
  _valor numeric,
  _descricao text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _from kids_profiles%rowtype;
  _to kids_profiles%rowtype;
  _to_profile profiles%rowtype;
  _today_spent numeric;
begin
  select * into _from from kids_profiles where id = _from_kid_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Conta não encontrada');
  end if;

  if _from.is_frozen then
    return jsonb_build_object('success', false, 'error', 'Conta congelada');
  end if;

  if _from.bloqueio_envio then
    return jsonb_build_object('success', false, 'error', 'Envio bloqueado pelos seus pais');
  end if;

  if _valor <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor inválido');
  end if;

  if _valor > _from.saldo then
    return jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  end if;

  if _from.limite_diario is not null then
    select coalesce(sum(valor), 0)
      into _today_spent
      from transactions
     where from_kid = _from_kid_id
       and tipo in ('transferencia', 'pagamento')
       and status in ('aprovado', 'pendente')
       and created_at >= date_trunc('day', now());

    if (_today_spent + _valor) > _from.limite_diario then
      return jsonb_build_object(
        'success', false,
        'error', format('Limite diário excedido (R$ %s/%s)', _today_spent::text, _from.limite_diario::text)
      );
    end if;
  end if;

  if _from.limite_transferencia is not null and _valor > _from.limite_transferencia then
    return jsonb_build_object(
      'success', false,
      'error', format('Valor excede limite por transferência (R$ %s)', _from.limite_transferencia::text)
    );
  end if;

  select * into _to from kids_profiles where codigo_publico = _to_codigo;
  if found then
    if _to.id = _from_kid_id then
      return jsonb_build_object('success', false, 'error', 'Você não pode transferir para si mesmo');
    end if;

    if _from.aprovacao_transferencias then
      insert into transactions (tipo, from_kid, to_kid, valor, descricao, status)
      values ('transferencia', _from_kid_id, _to.id, _valor, coalesce(_descricao, 'Pagamento'), 'pendente');

      return jsonb_build_object('success', true, 'needs_approval', true, 'to_name', coalesce(_to.apelido, _to.nome));
    end if;

    update kids_profiles set saldo = saldo - _valor where id = _from_kid_id;
    update kids_profiles set saldo = saldo + _valor where id = _to.id;

    insert into transactions (tipo, from_kid, to_kid, valor, descricao, status)
    values ('transferencia', _from_kid_id, _to.id, _valor, coalesce(_descricao, 'Pagamento'), 'aprovado');

    return jsonb_build_object('success', true, 'needs_approval', false, 'to_name', coalesce(_to.apelido, _to.nome));
  end if;

  select * into _to_profile from profiles where codigo_usuario = _to_codigo;
  if found then
    if _from.aprovacao_transferencias then
      insert into transactions (tipo, from_kid, to_user, valor, descricao, status)
      values ('transferencia', _from_kid_id, _to_profile.user_id, _valor, coalesce(_descricao, 'Pagamento'), 'pendente');

      return jsonb_build_object('success', true, 'needs_approval', true, 'to_name', _to_profile.nome);
    end if;

    update kids_profiles set saldo = saldo - _valor where id = _from_kid_id;
    update profiles set saldo = saldo + _valor where user_id = _to_profile.user_id;

    insert into transactions (tipo, from_kid, to_user, valor, descricao, status)
    values ('transferencia', _from_kid_id, _to_profile.user_id, _valor, coalesce(_descricao, 'Pagamento'), 'aprovado');

    return jsonb_build_object('success', true, 'needs_approval', false, 'to_name', _to_profile.nome);
  end if;

  return jsonb_build_object('success', false, 'error', 'Código não encontrado');
end;
$function$;
