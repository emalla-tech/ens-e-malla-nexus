-- Customer onboarding consistency and privacy-safe platform administration.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'Platform Admin' check (role in ('Platform Admin', 'Platform Support')),
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

-- Bootstrap the current ENs platform owner. Future admins must be added deliberately by database administration.
insert into public.platform_admins (user_id, role)
select id, 'Platform Admin' from auth.users where lower(email) = 'emallarwanda@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.complete_workspace_setup(
  target_workspace uuid,
  workspace_name text,
  workspace_type text,
  workspace_country text,
  workspace_currency text,
  workspace_timezone text,
  workspace_industry text,
  workspace_modules text[],
  workspace_plan text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  clean_slug text;
  allowed_modules text[];
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = auth.uid() and role = 'Owner' and status = 'Active'
  ) then raise exception 'Only the workspace owner can complete setup'; end if;
  if length(trim(workspace_name)) < 2 then raise exception 'Workspace name is too short'; end if;
  if workspace_type not in ('Personal', 'Company') then raise exception 'Invalid workspace type'; end if;
  if workspace_plan not in ('Personal', 'Business', 'Professional') then raise exception 'Invalid plan'; end if;

  select modules into allowed_modules from public.plan_definitions where code = workspace_plan and active;
  if allowed_modules is null then raise exception 'Selected plan is unavailable'; end if;
  if exists (select 1 from unnest(workspace_modules) selected where not selected = any(allowed_modules)) then
    raise exception 'One or more selected modules are not included in this plan';
  end if;

  clean_slug := trim(both '-' from regexp_replace(lower(workspace_name), '[^a-z0-9]+', '-', 'g')) || '-' || left(target_workspace::text, 6);
  update public.workspaces set
    name = trim(workspace_name), slug = clean_slug, type = workspace_type, country = workspace_country,
    currency = workspace_currency, timezone = workspace_timezone, industry = coalesce(workspace_industry, ''),
    enabled_modules = workspace_modules, plan = workspace_plan, onboarding_complete = true, updated_at = now()
  where id = target_workspace;

  insert into public.workspace_subscriptions (workspace_id, plan_code, status, trial_ends_at, current_period_start, current_period_end)
  values (target_workspace, workspace_plan, 'Trialing', now() + interval '14 days', now(), now() + interval '14 days')
  on conflict (workspace_id) do update set
    plan_code = excluded.plan_code,
    status = 'Trialing',
    trial_ends_at = excluded.trial_ends_at,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    updated_at = now();
end $$;
revoke all on function public.complete_workspace_setup(uuid,text,text,text,text,text,text,text[],text) from public;
grant execute on function public.complete_workspace_setup(uuid,text,text,text,text,text,text,text[],text) to authenticated;

create or replace function public.platform_admin_workspace_summary()
returns table (
  workspace_id uuid,
  name text,
  workspace_type text,
  country text,
  industry text,
  plan_code text,
  subscription_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  member_count bigint,
  owner_name text,
  owner_email text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  return query
  select
    workspace.id,
    workspace.name::text,
    workspace.type::text,
    workspace.country::text,
    workspace.industry::text,
    coalesce(subscription.plan_code, workspace.plan)::text,
    coalesce(subscription.status, 'Active')::text,
    coalesce(subscription.trial_ends_at, workspace.trial_ends_at),
    coalesce(subscription.current_period_end, workspace.trial_ends_at),
    (select count(*) from public.workspace_members member where member.workspace_id = workspace.id and member.status = 'Active'),
    coalesce(profile.full_name, 'Workspace owner')::text,
    coalesce(owner.email, '')::text,
    workspace.created_at
  from public.workspaces workspace
  join auth.users owner on owner.id = workspace.owner_id
  left join public.profiles profile on profile.id = workspace.owner_id
  left join public.workspace_subscriptions subscription on subscription.workspace_id = workspace.id
  order by workspace.created_at desc;
end $$;
revoke all on function public.platform_admin_workspace_summary() from public;
grant execute on function public.platform_admin_workspace_summary() to authenticated;

notify pgrst, 'reload schema';
