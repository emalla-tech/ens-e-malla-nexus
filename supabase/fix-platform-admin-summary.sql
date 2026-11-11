-- Fix return-type compatibility for the Platform Admin workspace summary.
-- Safe to run more than once. No customer operational data is queried.

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
