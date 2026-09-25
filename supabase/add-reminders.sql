create table if not exists public.reminders (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  category text not null default 'Business' check (category in ('Personal', 'Business', 'Customer', 'Payment', 'Call')),
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  reminder_date date not null default current_date,
  reminder_time time not null default '09:00',
  repeat_interval text not null default 'Once' check (repeat_interval in ('Once', 'Daily', 'Weekly', 'Monthly')),
  status text not null default 'Active' check (status in ('Active', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reminders enable row level security;
drop policy if exists "reminders are user-owned" on public.reminders;
create policy "reminders are user-owned" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
