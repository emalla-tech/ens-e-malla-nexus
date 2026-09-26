create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  type text not null default 'Company' check (type in ('Personal', 'Company')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  currency text not null default 'RWF', timezone text not null default 'Africa/Kigali',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'Member' check (role in ('Owner', 'Admin', 'Member')),
  status text not null default 'Active' check (status in ('Active', 'Suspended')),
  joined_at timestamptz not null default now(), unique (workspace_id, user_id)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null, role text not null default 'Member' check (role in ('Admin', 'Member')),
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Revoked')),
  invited_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'), unique (workspace_id, email, status)
);

insert into public.workspaces (name, slug, type, owner_id)
select case when lower(coalesce(p.full_name, '')) = 'john' then 'E-Malla Rwanda' else coalesce(nullif(p.full_name, ''), 'My') || '''s Workspace' end, 'workspace-' || left(u.id::text, 8), 'Company', u.id
from auth.users u left join public.profiles p on p.id = u.id
where not exists (select 1 from public.workspaces w where w.owner_id = u.id);

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'Owner' from public.workspaces w
on conflict (workspace_id, user_id) do nothing;

do $$ declare table_name text; begin
  foreach table_name in array array['tasks','projects','customers','follow_ups','notes','meetings','goals','reminders','finance_transactions','invoices'] loop
    execute format('alter table public.%I add column if not exists workspace_id uuid references public.workspaces(id)', table_name);
    execute format('update public.%I record set workspace_id = member.workspace_id from public.workspace_members member where member.user_id = record.user_id and member.role = ''Owner'' and record.workspace_id is null', table_name);
    execute format('alter table public.%I alter column workspace_id set not null', table_name);
    execute format('create index if not exists %I on public.%I (workspace_id)', table_name || '_workspace_idx', table_name);
  end loop;
end $$;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and status = 'Active') $$;

create or replace function public.can_manage_workspace(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and status = 'Active' and role in ('Owner', 'Admin')) $$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
create policy "members can view workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "users can create workspaces" on public.workspaces for insert with check (owner_id = auth.uid());
create policy "owners can update workspaces" on public.workspaces for update using (owner_id = auth.uid());
create policy "members can view membership" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "managers can add membership" on public.workspace_members for insert with check (public.can_manage_workspace(workspace_id));
create policy "managers can update membership" on public.workspace_members for update using (public.can_manage_workspace(workspace_id) and role <> 'Owner');
create policy "managers can remove membership" on public.workspace_members for delete using (public.can_manage_workspace(workspace_id) and role <> 'Owner');
create policy "managers can manage invitations" on public.workspace_invitations for all using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));

do $$ declare table_name text; policy_name text; begin
  foreach table_name in array array['tasks','projects','customers','follow_ups','notes','meetings','goals','reminders','finance_transactions','invoices'] loop
    for policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = table_name loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
    execute format('create policy "workspace members can access %s" on public.%I for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', table_name, table_name);
  end loop;
end $$;

create or replace view public.workspace_member_directory as
select wm.id, wm.workspace_id, wm.user_id, coalesce(p.full_name, 'Team member') as full_name,
  coalesce(u.email, '') as email, wm.role, wm.joined_at
from public.workspace_members wm join auth.users u on u.id = wm.user_id left join public.profiles p on p.id = wm.user_id
where public.is_workspace_member(wm.workspace_id);
grant select on public.workspace_member_directory to authenticated;

create or replace function public.claim_workspace_invitations()
returns integer language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  select workspace_id, auth.uid(), role from public.workspace_invitations
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status = 'Pending' and expires_at > now()
  on conflict (workspace_id, user_id) do nothing;
  get diagnostics claimed = row_count;
  update public.workspace_invitations set status = 'Accepted'
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status = 'Pending' and expires_at > now();
  return claimed;
end $$;
grant execute on function public.claim_workspace_invitations() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_workspace_id uuid;
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'));
  insert into public.workspaces (name, slug, type, owner_id)
  values (coalesce(new.raw_user_meta_data ->> 'full_name', 'My') || '''s Workspace', 'workspace-' || left(new.id::text, 8), 'Personal', new.id)
  returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (new_workspace_id, new.id, 'Owner');
  return new;
end; $$;
