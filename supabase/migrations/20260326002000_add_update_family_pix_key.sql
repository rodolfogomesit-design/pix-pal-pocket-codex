create or replace function public.update_family_pix_key(_chave_pix text)
returns jsonb
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

  update public.profiles
  set chave_pix = nullif(btrim(_chave_pix), ''),
      updated_at = now()
  where user_id = _owner_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Perfil da família não encontrado');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.update_family_pix_key(text) to authenticated;
