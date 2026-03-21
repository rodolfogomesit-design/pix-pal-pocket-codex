create table if not exists public.secondary_guardians (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid not null references auth.users(id) on delete cascade,
  secondary_user_id uuid references auth.users(id) on delete set null,
  nome text,
  cpf text,
  email text,
  telefone text,
  parentesco text default 'outros',
  added_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.secondary_guardians enable row level security;

create index if not exists idx_secondary_guardians_primary_user_id
  on public.secondary_guardians(primary_user_id);

create index if not exists idx_secondary_guardians_secondary_user_id
  on public.secondary_guardians(secondary_user_id);

drop policy if exists "Primary can view secondary guardians" on public.secondary_guardians;
create policy "Primary can view secondary guardians"
  on public.secondary_guardians
  for select
  to authenticated
  using (primary_user_id = auth.uid() or secondary_user_id = auth.uid());
