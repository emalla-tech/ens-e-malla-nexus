alter table public.notes add column if not exists folder text not null default 'General';
alter table public.notes add column if not exists tags text[] not null default '{}';
alter table public.notes add column if not exists pinned boolean not null default false;
alter table public.notes add column if not exists linked_type text not null default 'None';
alter table public.notes add column if not exists linked_id text;

alter table public.notes drop constraint if exists notes_linked_type_check;
alter table public.notes add constraint notes_linked_type_check
  check (linked_type in ('None', 'Project', 'Customer'));
