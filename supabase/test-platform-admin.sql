-- Run after add-platform-admin.sql. This test is read-only and changes no customer data.
begin;

do $$
begin
  if not exists (select 1 from public.platform_admins) then
    raise exception 'No platform administrator was bootstrapped. Confirm the owner email in add-platform-admin.sql.';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'platform_admin_workspace_summary'
      and lower(pg_catalog.pg_get_function_result(procedure.oid)) ~ '(task_title|customer_name|transaction_amount|note_body)'
  ) then raise exception 'Platform summary exposes operational customer data'; end if;
end $$;

select role, created_at from public.platform_admins order by created_at;
rollback;
