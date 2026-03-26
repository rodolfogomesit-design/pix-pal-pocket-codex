create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', 'Usuário'),
    new.email
  )
  on conflict (user_id) do update
  set
    nome = coalesce(excluded.nome, public.profiles.nome),
    email = coalesce(excluded.email, public.profiles.email);

  update public.secondary_guardians
  set secondary_user_id = new.id
  where secondary_user_id is null
    and lower(coalesce(email, '')) = lower(coalesce(new.email, ''));

  update public.profiles p
  set
    nome = coalesce(nullif(p.nome, 'Usuário'), nullif(sg.nome, ''), p.nome),
    telefone = coalesce(p.telefone, sg.telefone),
    cpf = coalesce(p.cpf, sg.cpf)
  from public.secondary_guardians sg
  where p.user_id = new.id
    and sg.secondary_user_id = new.id;

  return new;
end;
$$;
