-- Run after add-subscriptions.sql. Every assertion rolls back and leaves no data behind.
begin;

do $$
declare personal_modules text[]; business_members integer; professional_members integer;
begin
  select modules into personal_modules from public.plan_definitions where code = 'Personal';
  if 'Finance' = any(personal_modules) or 'Customers' = any(personal_modules) then
    raise exception 'Personal plan exposes advanced modules';
  end if;
  select max_members into business_members from public.plan_definitions where code = 'Business';
  select max_members into professional_members from public.plan_definitions where code = 'Professional';
  if professional_members <= business_members then raise exception 'Professional member limit must exceed Business'; end if;
end $$;

do $$
declare missing_count integer;
begin
  select count(*) into missing_count
  from public.workspaces workspace
  where not exists (select 1 from public.workspace_subscriptions subscription where subscription.workspace_id = workspace.id);
  if missing_count <> 0 then raise exception '% workspaces have no subscription', missing_count; end if;
end $$;

select code, max_members, max_customers, max_projects, storage_mb, modules
from public.plan_definitions order by max_members;

rollback;
