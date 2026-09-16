create table if not exists public.goals (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  owner text not null default 'John',
  horizon text not null default 'Monthly' check (horizon in ('Weekly', 'Monthly', 'Quarterly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

drop policy if exists "goals are user-owned" on public.goals;

create policy "goals are user-owned" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
