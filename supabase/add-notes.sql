create table if not exists public.notes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "notes are user-owned" on public.notes;

create policy "notes are user-owned" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
