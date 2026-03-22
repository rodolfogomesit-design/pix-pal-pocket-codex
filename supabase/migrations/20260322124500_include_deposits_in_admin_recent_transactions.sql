create or replace function public.admin_get_recent_transactions(_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('success', false, 'error', 'Sem permissao');
  end if;

  return jsonb_build_object(
    'success', true,
    'transactions', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb)
      from (
        select *
        from (
          select
            tx.id,
            tx.tipo::text as tipo,
            tx.valor,
            tx.descricao,
            tx.status::text as status,
            tx.created_at,
            tx.from_user,
            tx.from_kid,
            tx.to_kid,
            coalesce(p.nome, '') as from_user_nome,
            coalesce(fk.nome, '') as from_kid_nome,
            coalesce(tk.nome, '') as to_kid_nome
          from public.transactions tx
          left join public.profiles p on p.user_id = tx.from_user
          left join public.kids_profiles fk on fk.id = tx.from_kid
          left join public.kids_profiles tk on tk.id = tx.to_kid

          union all

          select
            dep.id,
            'deposito'::text as tipo,
            dep.valor,
            coalesce(dep.external_id, 'Deposito Pix') as descricao,
            dep.status::text as status,
            dep.created_at,
            dep.user_id as from_user,
            dep.kid_id as from_kid,
            null::uuid as to_kid,
            coalesce(p.nome, '') as from_user_nome,
            coalesce(k.nome, '') as from_kid_nome,
            '' as to_kid_nome
          from public.deposits dep
          left join public.profiles p on p.user_id = dep.user_id
          left join public.kids_profiles k on k.id = dep.kid_id

          union all

          select
            wd.id,
            'saque'::text as tipo,
            wd.valor,
            'Saque via Pix'::text as descricao,
            wd.status::text as status,
            wd.created_at,
            wd.user_id as from_user,
            null::uuid as from_kid,
            null::uuid as to_kid,
            coalesce(p.nome, '') as from_user_nome,
            '' as from_kid_nome,
            '' as to_kid_nome
          from public.withdrawals wd
          left join public.profiles p on p.user_id = wd.user_id
        ) combined
        order by created_at desc
        limit _limit
      ) t
    )
  );
end;
$$;
