-- Slice 0: provision a tiny, non-domain health-check object.
-- The /api/health endpoint only reads this table; it never mutates it.

create table if not exists public.healthcheck (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

alter table public.healthcheck enable row level security;

-- This table is not part of the public application API.
revoke all on table public.healthcheck from anon, authenticated;
grant select on table public.healthcheck to service_role;

-- Seed once. A numeric count (including zero) proves that the query executed,
-- but keeping one row makes manual inspection straightforward.
insert into public.healthcheck (created_at)
select now()
where not exists (select 1 from public.healthcheck);
