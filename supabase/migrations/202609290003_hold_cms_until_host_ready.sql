begin;

-- The CMS project is owned and hosted separately. Keep assigned CMS access
-- visible but non-clickable until cms.dgtl.lk has a verified deployment,
-- working /sso route, DNS, and HTTPS certificate.
update public.services
set default_url = null
where key = 'cms';

commit;
