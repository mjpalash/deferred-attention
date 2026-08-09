create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text,
  title text,
  raw_text text not null,
  source_type text,
  note text,
  status text not null default 'inbox'
    check (status in ('inbox', 'done', 'kept')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint items_capture_not_empty check (
    url is not null
    or length(btrim(raw_text)) > 0
  )
);

create index if not exists items_user_inbox_created_idx
  on public.items (user_id, status, created_at desc);

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

drop trigger if exists items_set_updated_at on public.items;

create trigger items_set_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

alter table public.items enable row level security;

grant select, insert, update
  on table public.items
  to authenticated;

revoke all
  on table public.items
  from anon;

drop policy if exists "Users can read their own items" on public.items;
create policy "Users can read their own items"
on public.items
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own items" on public.items;
create policy "Users can insert their own items"
on public.items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own items" on public.items;
create policy "Users can update their own items"
on public.items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
