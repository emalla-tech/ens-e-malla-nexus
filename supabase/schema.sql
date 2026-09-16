create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'John',
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Planning' check (status in ('Planning', 'Active', 'At Risk', 'Completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  total_tasks integer not null default 0,
  completed_tasks integer not null default 0,
  due_date date not null default current_date,
  owner text not null default 'John',
  client text not null default 'Internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  due_date date not null default current_date,
  project_id text,
  assignee text not null default 'John',
  schedule text not null default 'Morning' check (schedule in ('Morning', 'Afternoon', 'Evening')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company text not null,
  email text not null default '',
  phone text not null default '',
  status text not null default 'Lead' check (status in ('Lead', 'Prospect', 'Active', 'At Risk', 'Dormant')),
  health text not null default 'Healthy' check (health in ('Healthy', 'Watch', 'Risk')),
  owner text not null default 'John',
  value numeric(12, 2) not null default 0,
  last_contact date not null default current_date,
  next_follow_up date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null,
  customer text not null,
  note text not null,
  due_date date not null default current_date,
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  status text not null default 'Open' check (status in ('Open', 'Scheduled', 'Completed', 'Waiting')),
  owner text not null default 'John',
  channel text not null default 'Email' check (channel in ('Email', 'Call', 'Meeting', 'WhatsApp')),
  next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.customers enable row level security;
alter table public.follow_ups enable row level security;
alter table public.notes enable row level security;
alter table public.meetings enable row level security;
alter table public.goals enable row level security;

create policy "profiles are user-owned" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "projects are user-owned" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks are user-owned" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "customers are user-owned" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "follow ups are user-owned" on public.follow_ups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes are user-owned" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meetings are user-owned" on public.meetings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals are user-owned" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'John'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
