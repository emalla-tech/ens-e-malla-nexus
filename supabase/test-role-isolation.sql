begin;

do $$
declare
  test_workspace uuid;
  test_user uuid;
  original_role text;
  policy_count integer;
begin
  select wm.workspace_id, wm.user_id, wm.role
  into test_workspace, test_user, original_role
  from public.workspace_members wm
  where wm.role = 'Owner' and wm.status = 'Active'
  limit 1;

  if test_workspace is null then raise exception 'No active Owner membership is available for testing'; end if;
  perform set_config('request.jwt.claim.sub', test_user::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  if not public.has_workspace_permission(test_workspace, 'finance.manage') then raise exception 'Owner should manage finance'; end if;
  if not public.has_workspace_permission(test_workspace, 'team.manage') then raise exception 'Owner should manage team'; end if;

  update public.workspace_members set role = 'Manager' where workspace_id = test_workspace and user_id = test_user;
  if not public.has_workspace_permission(test_workspace, 'tasks.manage') then raise exception 'Manager should manage tasks'; end if;
  if public.has_workspace_permission(test_workspace, 'finance.view') then raise exception 'Manager must not view finance'; end if;
  if public.has_workspace_permission(test_workspace, 'team.manage') then raise exception 'Manager must not manage team'; end if;

  update public.workspace_members set role = 'Finance' where workspace_id = test_workspace and user_id = test_user;
  if not public.has_workspace_permission(test_workspace, 'finance.manage') then raise exception 'Finance should manage finance'; end if;
  if public.has_workspace_permission(test_workspace, 'customers.view') then raise exception 'Finance must not view customers'; end if;

  update public.workspace_members set role = 'Viewer' where workspace_id = test_workspace and user_id = test_user;
  if not public.has_workspace_permission(test_workspace, 'tasks.view') then raise exception 'Viewer should view tasks'; end if;
  if public.has_workspace_permission(test_workspace, 'tasks.manage') then raise exception 'Viewer must not manage tasks'; end if;
  if public.has_workspace_permission(test_workspace, 'finance.view') then raise exception 'Viewer must not view finance'; end if;

  update public.workspace_members set role = original_role where workspace_id = test_workspace and user_id = test_user;

  select count(*) into policy_count from pg_policies
  where schemaname = 'public'
    and tablename in ('tasks','projects','customers','follow_ups','meetings','reminders','notes','goals','finance_transactions','invoices')
    and (qual like '%has_workspace_permission%' or with_check like '%has_workspace_permission%');
  if policy_count < 30 then raise exception 'Expected permission policies are missing; found %', policy_count; end if;

  raise notice 'PASS: role permission matrix and RLS policy coverage verified';
end $$;

rollback;
