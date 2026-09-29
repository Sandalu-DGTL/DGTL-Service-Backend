begin;

-- CMS is an independent DGTL application. It must never resolve to the SEO worker.
update public.services
set default_url = 'https://cms.dgtl.lk/'
where key = 'cms';

commit;
