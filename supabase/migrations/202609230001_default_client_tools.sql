begin;

-- CMS currently uses the SEO destination requested by the project owner.
update public.services
set default_url = case key
  when 'cms' then 'https://seo.dgtl.lk/'
  when 'seo' then 'https://seo.dgtl.lk/'
  when 'hr' then 'https://hr.dgtl.lk/'
  when 'crm' then 'https://crm.dgtl.lk/'
end
where key in ('cms', 'seo', 'hr', 'crm');

-- Preserve explicit disabled assignments and client-specific destinations.
insert into public.client_service_access (client_id, service_id)
select profiles.id, services.id
from public.profiles
cross join public.services
where profiles.role = 'client' and profiles.status = 'active'
  and services.key in ('cms', 'seo', 'hr', 'crm')
on conflict (client_id, service_id) do nothing;

create or replace function public.assign_default_client_tools()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'client' and new.status = 'active' then
    insert into public.client_service_access (client_id, service_id)
    select new.id, id from public.services
    where key in ('cms', 'seo', 'hr', 'crm')
    on conflict (client_id, service_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_default_client_tools() from public;

create trigger profiles_assign_default_tools
after insert on public.profiles
for each row execute function public.assign_default_client_tools();

commit;
