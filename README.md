# DGTL Service Backend

NestJS API for the DGTL Service Hub. Supabase provides identity and PostgreSQL; this API owns privileged client-management operations and keeps the secret key off the browser.

## Local setup

1. Copy `.env.example` to `.env` and add the Supabase project URL and server-only secret key.
2. Run `supabase/migrations/202609220001_initial_dgtl_auth.sql` in the Supabase SQL editor (or apply it with the Supabase CLI).
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:4000/docs` for the API contract and `http://localhost:4000/v1/health` for the health check.

## Create the first admin

Sign up once through the frontend, then run this in the Supabase SQL editor with the real account email:

```sql
update public.profiles
set role = 'admin', status = 'active'
where lower(email) = lower('admin@dgtl.lk');
```

The email is only used to find the initial row during this one-time bootstrap. Runtime authorization uses the protected `profiles.role` value.

Set each service's destination once the tools are deployed:

```sql
update public.services set default_url = 'https://cms.dgtl.lk' where key = 'cms';
update public.services set default_url = 'https://crm.dgtl.lk' where key = 'crm';
update public.services set default_url = 'https://seo.dgtl.lk' where key = 'seo';
update public.services set default_url = 'https://hr.dgtl.lk' where key = 'hr';
```

## Security boundary

- Browser requests carry a Supabase access token.
- `SupabaseAuthGuard` validates that token with Supabase Auth.
- `RolesGuard` checks the role loaded from the protected profile row.
- Supabase Row Level Security adds database-level protection.
- `SUPABASE_SECRET_KEY` belongs only in this backend. Never add it to a `NEXT_PUBLIC_*` variable.
