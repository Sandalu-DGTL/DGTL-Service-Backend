create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'client');
create type public.client_status as enum ('invited', 'active', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role public.app_role not null default 'client',
  status public.client_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));
create index profiles_role_status_idx on public.profiles (role, status);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key = lower(key)),
  name text not null,
  description text not null default '',
  default_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_service_access (
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  enabled boolean not null default true,
  tool_url text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (client_id, service_id)
);

create index client_service_access_client_idx
  on public.client_service_access (client_id)
  where enabled = true;

insert into public.services (key, name, description)
values
  ('cms', 'Content Management', 'Plan, publish and maintain your digital content.'),
  ('crm', 'Customer Operations', 'Keep customer relationships and opportunities visible.'),
  ('seo', 'Search Performance', 'Track search visibility and turn insights into action.'),
  ('hr', 'People Operations', 'Access essential people and HR workflows.');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger client_service_access_set_updated_at
before update on public.client_service_access
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = coalesce(new.email, '')
    where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.sync_auth_user_email();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select profile.role = 'admin'::public.app_role
     from public.profiles as profile
     where profile.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.replace_client_services(
  target_client_id uuid,
  target_service_ids uuid[],
  actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = target_client_id and role = 'client'::public.app_role
  ) then
    raise exception 'Client profile not found';
  end if;

  if exists (
    select requested.id
    from unnest(target_service_ids) as requested(id)
    left join public.services on public.services.id = requested.id
    where public.services.id is null
  ) then
    raise exception 'Invalid service id';
  end if;

  delete from public.client_service_access
  where client_id = target_client_id;

  insert into public.client_service_access (client_id, service_id, assigned_by)
  select target_client_id, requested.service_id, actor_id
  from unnest(target_service_ids) as requested(service_id);
end;
$$;

revoke all on function public.replace_client_services(uuid, uuid[], uuid) from public;
grant execute on function public.replace_client_services(uuid, uuid[], uuid) to service_role;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.client_service_access enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.client_service_access from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.services to authenticated;
grant select on table public.client_service_access to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Admins can read all profiles"
on public.profiles for select to authenticated
using ((select public.is_admin()));

create policy "Users can update their own safe profile fields"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Authenticated users can read the service catalog"
on public.services for select to authenticated
using (true);

create policy "Clients can read their own service access"
on public.client_service_access for select to authenticated
using ((select auth.uid()) = client_id);

create policy "Admins can read all service access"
on public.client_service_access for select to authenticated
using ((select public.is_admin()));

comment on table public.profiles is
  'Application profiles and authoritative admin/client role. Roles are never inferred from email.';
comment on table public.client_service_access is
  'The services each client can see and open in the DGTL portal.';
