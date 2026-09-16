create table if not exists public.meetings (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null default current_date,
  time time not null default '09:00',
  attendees text[] not null default '{}',
  location text not null default 'TBD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

drop policy if exists "meetings are user-owned" on public.meetings;

create policy "meetings are user-owned" on public.meetings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
