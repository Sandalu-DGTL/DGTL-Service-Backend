begin;

-- Service access is explicitly managed by DGTL admins. Keep the existing
-- trigger/function in place for an easy rollback, but make the function inert
-- so new accounts receive no tools until an admin grants them.
create or replace function public.assign_default_client_tools()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  return new;
end;
$$;

revoke all on function public.assign_default_client_tools() from public;

commit;
