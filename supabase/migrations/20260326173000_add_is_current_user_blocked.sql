create or replace function public.is_current_user_blocked()
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  blocked boolean;
begin
  select coalesce(p.is_blocked, false)
    into blocked
  from public.profiles p
  where p.user_id = auth.uid();

  return coalesce(blocked, false);
end;
$$;

grant execute on function public.is_current_user_blocked() to authenticated;
