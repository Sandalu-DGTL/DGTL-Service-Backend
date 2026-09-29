begin;

-- Service access is explicitly managed by DGTL admins. New accounts must not
-- receive every current (or future) tool automatically.
drop trigger if exists profiles_assign_default_tools on public.profiles;
drop function if exists public.assign_default_client_tools();

commit;
