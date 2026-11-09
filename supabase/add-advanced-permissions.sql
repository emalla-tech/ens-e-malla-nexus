alter table public.workspace_members drop constraint if exists workspace_members_role_check;
alter table public.workspace_members add constraint workspace_members_role_check
  check (role in ('Owner', 'Admin', 'Manager', 'Finance', 'Member', 'Viewer'));

alter table public.workspace_invitations drop constraint if exists workspace_invitations_role_check;
alter table public.workspace_invitations add constraint workspace_invitations_role_check
  check (role in ('Admin', 'Manager', 'Finance', 'Member', 'Viewer'));

create table if not exists public.role_permission_defaults (
  role text not null,
  permission text not null,
  primary key (role, permission)
);
alter table public.role_permission_defaults enable row level security;
revoke all on public.role_permission_defaults from anon, authenticated;

insert into public.role_permission_defaults (role, permission) values
  ('Admin','tasks.view'),('Admin','tasks.manage'),('Admin','projects.view'),('Admin','projects.manage'),
  ('Admin','customers.view'),('Admin','customers.manage'),('Admin','calendar.view'),('Admin','calendar.manage'),
  ('Admin','reminders.view'),('Admin','reminders.manage'),('Admin','notes.view'),('Admin','notes.manage'),
  ('Admin','goals.view'),('Admin','goals.manage'),('Admin','finance.view'),('Admin','finance.manage'),
  ('Admin','reports.view'),('Admin','team.view'),('Admin','team.manage'),('Admin','settings.view'),
  ('Manager','tasks.view'),('Manager','tasks.manage'),('Manager','projects.view'),('Manager','projects.manage'),
  ('Manager','customers.view'),('Manager','customers.manage'),('Manager','calendar.view'),('Manager','calendar.manage'),
  ('Manager','reminders.view'),('Manager','reminders.manage'),('Manager','notes.view'),('Manager','notes.manage'),
  ('Manager','goals.view'),('Manager','goals.manage'),('Manager','reports.view'),('Manager','team.view'),
  ('Finance','finance.view'),('Finance','finance.manage'),('Finance','reports.view'),('Finance','team.view'),
  ('Member','tasks.view'),('Member','tasks.manage'),('Member','projects.view'),('Member','projects.manage'),
  ('Member','customers.view'),('Member','customers.manage'),('Member','calendar.view'),('Member','calendar.manage'),
  ('Member','reminders.view'),('Member','reminders.manage'),('Member','notes.view'),('Member','notes.manage'),
  ('Member','goals.view'),('Member','goals.manage'),('Member','team.view'),
  ('Viewer','tasks.view'),('Viewer','projects.view'),('Viewer','customers.view'),('Viewer','calendar.view'),
  ('Viewer','reminders.view'),('Viewer','notes.view'),('Viewer','goals.view'),('Viewer','reports.view'),('Viewer','team.view')
on conflict do nothing;

create or replace function public.has_workspace_permission(target_workspace uuid, requested_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
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

create or replace function public.can_manage_workspace(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.has_workspace_permission(target_workspace, 'team.manage') $$;

do $$
declare item record; policy_name text;
begin
  for item in select * from (values
    ('tasks','tasks'),('projects','projects'),('customers','customers'),('follow_ups','customers'),
    ('meetings','calendar'),('reminders','reminders'),('notes','notes'),('goals','goals'),
    ('finance_transactions','finance'),('invoices','finance')
  ) as mapping(table_name, permission_prefix)
  loop
    for policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = item.table_name loop
      execute format('drop policy if exists %I on public.%I', policy_name, item.table_name);
    end loop;
    execute format('create policy %I on public.%I for select using (public.has_workspace_permission(workspace_id, %L))', item.table_name || '_select_by_permission', item.table_name, item.permission_prefix || '.view');
    execute format('create policy %I on public.%I for insert with check (public.has_workspace_permission(workspace_id, %L))', item.table_name || '_insert_by_permission', item.table_name, item.permission_prefix || '.manage');
    execute format('create policy %I on public.%I for update using (public.has_workspace_permission(workspace_id, %L)) with check (public.has_workspace_permission(workspace_id, %L))', item.table_name || '_update_by_permission', item.table_name, item.permission_prefix || '.manage', item.permission_prefix || '.manage');
    execute format('create policy %I on public.%I for delete using (public.has_workspace_permission(workspace_id, %L))', item.table_name || '_delete_by_permission', item.table_name, item.permission_prefix || '.manage');
  end loop;
end $$;

drop policy if exists "members can view membership" on public.workspace_members;
drop policy if exists "managers can add membership" on public.workspace_members;
drop policy if exists "managers can update membership" on public.workspace_members;
drop policy if exists "managers can remove membership" on public.workspace_members;
create policy "members can view permitted membership" on public.workspace_members for select
  using (user_id = auth.uid() or public.has_workspace_permission(workspace_id, 'team.view'));
create policy "team managers can add membership" on public.workspace_members for insert
  with check (public.has_workspace_permission(workspace_id, 'team.manage') and role <> 'Owner');
create policy "team managers can update membership" on public.workspace_members for update
  using (public.has_workspace_permission(workspace_id, 'team.manage') and role <> 'Owner')
  with check (public.has_workspace_permission(workspace_id, 'team.manage') and role <> 'Owner');
create policy "team managers can remove membership" on public.workspace_members for delete
  using (public.has_workspace_permission(workspace_id, 'team.manage') and role <> 'Owner');

create or replace view public.workspace_member_directory as
select wm.id, wm.workspace_id, wm.user_id, coalesce(p.full_name, 'Team member') as full_name,
  coalesce(u.email, '') as email, wm.role, wm.joined_at
from public.workspace_members wm
join auth.users u on u.id = wm.user_id
left join public.profiles p on p.id = wm.user_id
where wm.user_id = auth.uid() or public.has_workspace_permission(wm.workspace_id, 'team.view');
grant select on public.workspace_member_directory to authenticated;
