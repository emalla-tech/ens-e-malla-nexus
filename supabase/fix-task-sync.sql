alter table if exists public.tasks
  drop constraint if exists tasks_project_id_fkey;

alter table if exists public.follow_ups
  drop constraint if exists follow_ups_customer_id_fkey;

alter table if exists public.projects
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table if exists public.tasks
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text,
  alter column project_id type text using project_id::text;

alter table if exists public.customers
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table if exists public.follow_ups
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text,
  alter column customer_id type text using customer_id::text;
