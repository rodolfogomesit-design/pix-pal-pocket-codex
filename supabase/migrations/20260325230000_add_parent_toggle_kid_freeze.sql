create or replace function public.toggle_kid_freeze(_kid_id uuid, _freeze boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.kids_profiles
  set is_frozen = _freeze
  where id = _kid_id
    and user_responsavel = auth.uid();

  if not found then
    return jsonb_build_object('success', false, 'error', 'Criança não encontrada');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.toggle_kid_freeze(uuid, boolean) to authenticated;
