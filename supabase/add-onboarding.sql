alter table public.workspaces add column if not exists country text not null default 'RW';
alter table public.workspaces add column if not exists industry text not null default '';
alter table public.workspaces add column if not exists enabled_modules text[] not null default array['Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Finance','Reports'];
alter table public.workspaces add column if not exists plan text not null default 'Personal';
alter table public.workspaces add column if not exists onboarding_complete boolean not null default false;
alter table public.workspaces add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days');

alter table public.workspaces drop constraint if exists workspaces_plan_check;
alter table public.workspaces add constraint workspaces_plan_check check (plan in ('Personal', 'Business', 'Professional'));

update public.workspaces
set onboarding_complete = true,
    enabled_modules = array['Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Finance','Reports'],
    plan = case when type = 'Company' then 'Business' else 'Personal' end
where onboarding_complete = false;

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
  insert into public.workspace_members (workspace_id, user_id, role) values (new_id, auth.uid(), 'Owner');
  return new_id;
end $$;
grant execute on function public.create_workspace(text,text,text,text,text,text,text[],text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_workspace_id uuid;
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'));
  insert into public.workspaces (name, slug, type, owner_id, onboarding_complete)
  values (coalesce(new.raw_user_meta_data ->> 'full_name', 'My') || '''s Workspace', 'workspace-' || left(new.id::text, 8), 'Personal', new.id, false)
  returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (new_workspace_id, new.id, 'Owner');
  return new;
end; $$;
