create or replace function public.is_guardian(_user_id uuid, _kid_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.kids_profiles kp
    where kp.id = _kid_id
      and (
        kp.user_responsavel = _user_id
        or exists (
          select 1
          from public.secondary_guardians sg
          where sg.primary_user_id = kp.user_responsavel
            and sg.secondary_user_id = _user_id
        )
      )
  );
$$;
