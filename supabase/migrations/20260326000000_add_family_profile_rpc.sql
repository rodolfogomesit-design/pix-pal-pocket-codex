create or replace function public.get_family_profile()
returns table (
  user_id uuid,
  nome text,
  email text,
  telefone text,
  cpf text,
  chave_pix text,
  saldo numeric,
  codigo_usuario text,
  limite_diario numeric,
  limite_deposito numeric
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _owner_id uuid;
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
  into _owner_id;

  return query
  select
    p.user_id,
    p.nome,
    p.email,
    p.telefone,
    p.cpf,
    p.chave_pix,
    p.saldo,
    p.codigo_usuario,
    p.limite_diario,
    p.limite_deposito
  from public.profiles p
  where p.user_id = _owner_id;
end;
$$;

grant execute on function public.get_family_profile() to authenticated;
