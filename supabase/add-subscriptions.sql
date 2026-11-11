-- ENs subscriptions, trials, entitlements, and workspace capacity limits.
-- This migration is additive. Existing workspaces keep their current plan and become Active.

create table if not exists public.plan_definitions (
  code text primary key check (code in ('Personal', 'Business', 'Professional')),
  name text not null,
  description text not null default '',
  modules text[] not null default '{}',
  max_members integer not null check (max_members > 0),
  max_customers integer not null check (max_customers >= 0),
  max_projects integer not null check (max_projects >= 0),
  storage_mb integer not null check (storage_mb >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plan_definitions (code, name, description, modules, max_members, max_customers, max_projects, storage_mb)
values
  ('Personal', 'Personal', 'For one person managing daily execution.', array['Tasks','Calendar','Reminders','Notes','Goals'], 1, 50, 10, 100),
  ('Business', 'Business', 'For operating teams managing customers and finance.', array['Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Finance','Reports'], 10, 1000, 100, 5120),
  ('Professional', 'Professional', 'For growing companies needing scale, governance, and advanced controls.', array['Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Finance','Reports'], 50, 10000, 1000, 51200)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  modules = excluded.modules,
  max_members = excluded.max_members,
  max_customers = excluded.max_customers,
  max_projects = excluded.max_projects,
  storage_mb = excluded.storage_mb,
  active = true,
  updated_at = now();

create table if not exists public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan_code text not null references public.plan_definitions(code),
  status text not null default 'Trialing' check (status in ('Trialing', 'Active', 'Past Due', 'Cancelled', 'Expired')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_change_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_plan text not null references public.plan_definitions(code),
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists one_pending_subscription_request_per_workspace
  on public.subscription_change_requests (workspace_id) where status = 'Pending';

insert into public.workspace_subscriptions (workspace_id, plan_code, status, trial_ends_at, current_period_start, current_period_end)
select workspace.id, workspace.plan, 'Active', workspace.trial_ends_at, now(), now() + interval '1 month'
from public.workspaces workspace
where not exists (select 1 from public.workspace_subscriptions subscription where subscription.workspace_id = workspace.id);

create or replace function public.workspace_plan_allows(target_workspace uuid, requested_module text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when lower(requested_module) in ('dashboard', 'notifications', 'team', 'settings', 'billing') then true
    else exists (
      select 1
      from public.workspaces workspace
      join public.plan_definitions plan on plan.code = coalesce(
        (select subscription.plan_code from public.workspace_subscriptions subscription where subscription.workspace_id = workspace.id),
        workspace.plan
      )
      where workspace.id = target_workspace
        and plan.active
        and lower(requested_module) = any(select lower(module_name) from unnest(plan.modules) module_name)
        and coalesce(
          (select subscription.status in ('Trialing', 'Active', 'Past Due')
           and (subscription.status <> 'Trialing' or subscription.trial_ends_at >= now())
           from public.workspace_subscriptions subscription where subscription.workspace_id = workspace.id),
          true
        )
    )
  end
$$;
grant execute on function public.workspace_plan_allows(uuid, text) to authenticated;

create or replace function public.has_workspace_permission(target_workspace uuid, requested_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.workspace_plan_allows(target_workspace, split_part(requested_permission, '.', 1))
    and exists (
      select 1 from public.workspace_members member
      where member.workspace_id = target_workspace
        and member.user_id = auth.uid()
        and member.status = 'Active'
        and (
          member.role = 'Owner'
          or exists (
            select 1 from public.role_permission_defaults permission
            where permission.role = member.role and permission.permission = requested_permission
          )
        )
    )
$$;
grant execute on function public.has_workspace_permission(uuid, text) to authenticated;

create or replace function public.workspace_usage_summary(target_workspace uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = auth.uid() and status = 'Active'
  ) then raise exception 'Workspace access denied'; end if;

  return jsonb_build_object(
    'members', (select count(*) from public.workspace_members where workspace_id = target_workspace and status = 'Active'),
    'customers', (select count(*) from public.customers where workspace_id = target_workspace),
    'projects', (select count(*) from public.projects where workspace_id = target_workspace),
    'storage_mb', 0
  );
end $$;
grant execute on function public.workspace_usage_summary(uuid) to authenticated;

create or replace function public.enforce_workspace_plan_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  limit_value integer;
  used_value integer;
  plan_name text;
  limit_column text := tg_argv[0];
begin
  select plan.code,
    case limit_column
      when 'max_members' then plan.max_members
      when 'max_customers' then plan.max_customers
      when 'max_projects' then plan.max_projects
    end
  into plan_name, limit_value
  from public.workspaces workspace
  join public.plan_definitions plan on plan.code = coalesce(
    (select subscription.plan_code from public.workspace_subscriptions subscription where subscription.workspace_id = workspace.id),
    workspace.plan
  )
  where workspace.id = new.workspace_id;

  if limit_value is null then raise exception 'No active plan is configured for this workspace'; end if;

  if tg_table_name = 'workspace_members' then
    select count(*) into used_value from public.workspace_members where workspace_id = new.workspace_id and status = 'Active';
  elsif tg_table_name = 'customers' then
    select count(*) into used_value from public.customers where workspace_id = new.workspace_id;
  elsif tg_table_name = 'projects' then
    select count(*) into used_value from public.projects where workspace_id = new.workspace_id;
  end if;

  if used_value >= limit_value then
    raise exception '% plan limit reached for % (% of % used)', plan_name, replace(limit_column, 'max_', ''), used_value, limit_value;
  end if;
  return new;
end $$;

drop trigger if exists enforce_member_plan_limit on public.workspace_members;
create trigger enforce_member_plan_limit before insert on public.workspace_members
for each row execute function public.enforce_workspace_plan_limit('max_members');
drop trigger if exists enforce_customer_plan_limit on public.customers;
create trigger enforce_customer_plan_limit before insert on public.customers
for each row execute function public.enforce_workspace_plan_limit('max_customers');
drop trigger if exists enforce_project_plan_limit on public.projects;
create trigger enforce_project_plan_limit before insert on public.projects
for each row execute function public.enforce_workspace_plan_limit('max_projects');

create or replace function public.sync_workspace_subscription_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.workspaces set plan = new.plan_code, trial_ends_at = new.trial_ends_at, updated_at = now()
  where id = new.workspace_id;
  return new;
end $$;
drop trigger if exists sync_workspace_plan_after_subscription on public.workspace_subscriptions;
create trigger sync_workspace_plan_after_subscription after insert or update of plan_code, trial_ends_at on public.workspace_subscriptions
for each row execute function public.sync_workspace_subscription_plan();

alter table public.plan_definitions enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.subscription_change_requests enable row level security;

drop policy if exists "authenticated users can view plans" on public.plan_definitions;
create policy "authenticated users can view plans" on public.plan_definitions for select to authenticated using (active);
drop policy if exists "members can view workspace subscription" on public.workspace_subscriptions;
create policy "members can view workspace subscription" on public.workspace_subscriptions for select to authenticated
using (exists (select 1 from public.workspace_members member where member.workspace_id = workspace_id and member.user_id = auth.uid() and member.status = 'Active'));
drop policy if exists "owners can view plan requests" on public.subscription_change_requests;
create policy "owners can view plan requests" on public.subscription_change_requests for select to authenticated
using (public.has_workspace_permission(workspace_id, 'billing.view'));
drop policy if exists "owners can request plan changes" on public.subscription_change_requests;
create policy "owners can request plan changes" on public.subscription_change_requests for insert to authenticated
with check (requested_by = auth.uid() and public.has_workspace_permission(workspace_id, 'billing.manage'));

grant select on public.plan_definitions to authenticated;
grant select on public.workspace_subscriptions to authenticated;
grant select, insert on public.subscription_change_requests to authenticated;
revoke insert, update, delete on public.plan_definitions from anon, authenticated;
revoke insert, update, delete on public.workspace_subscriptions from anon, authenticated;
revoke update, delete on public.subscription_change_requests from anon, authenticated;

create or replace function public.create_workspace(
  workspace_name text,
  workspace_type text,
  workspace_country text,
  workspace_currency text,
  workspace_timezone text,
  workspace_industry text,
  workspace_modules text[],
  workspace_plan text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; clean_slug text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(workspace_name)) < 2 then raise exception 'Workspace name is too short'; end if;
  if workspace_type not in ('Personal', 'Company') then raise exception 'Invalid workspace type'; end if;
  if workspace_plan not in ('Personal', 'Business', 'Professional') then raise exception 'Invalid plan'; end if;
  clean_slug := trim(both '-' from regexp_replace(lower(workspace_name), '[^a-z0-9]+', '-', 'g')) || '-' || left(gen_random_uuid()::text, 6);
  insert into public.workspaces (name, slug, type, owner_id, country, currency, timezone, industry, enabled_modules, plan, onboarding_complete)
  values (trim(workspace_name), clean_slug, workspace_type, auth.uid(), workspace_country, workspace_currency, workspace_timezone, coalesce(workspace_industry, ''), workspace_modules, workspace_plan, true)
  returning id into new_id;
  insert into public.workspace_subscriptions (workspace_id, plan_code, status) values (new_id, workspace_plan, 'Trialing');
  insert into public.workspace_members (workspace_id, user_id, role) values (new_id, auth.uid(), 'Owner');
  return new_id;
end $$;
grant execute on function public.create_workspace(text,text,text,text,text,text,text[],text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_workspace_id uuid;
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'));
  insert into public.workspaces (name, slug, type, owner_id, plan, onboarding_complete)
  values (coalesce(new.raw_user_meta_data ->> 'full_name', 'My') || '''s Workspace', 'workspace-' || left(new.id::text, 8), 'Personal', new.id, 'Personal', false)
  returning id into new_workspace_id;
  insert into public.workspace_subscriptions (workspace_id, plan_code, status) values (new_workspace_id, 'Personal', 'Trialing');
  insert into public.workspace_members (workspace_id, user_id, role) values (new_workspace_id, new.id, 'Owner');
  return new;
end $$;

notify pgrst, 'reload schema';
