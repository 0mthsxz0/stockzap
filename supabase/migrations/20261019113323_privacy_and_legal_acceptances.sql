-- Additive migration: existing companies, members and business records are preserved.
create table public.stockzap_legal_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null check (version ~ '^\d{4}-\d{2}-\d{2}$'),
  accepted_at timestamptz not null default now(),
  primary key (user_id, version)
);
alter table public.stockzap_legal_acceptances enable row level security;
revoke all on public.stockzap_legal_acceptances from anon, authenticated;
grant select on public.stockzap_legal_acceptances to authenticated;
grant all on public.stockzap_legal_acceptances to service_role;
create policy legal_acceptances_read_own on public.stockzap_legal_acceptances
  for select to authenticated using ((select auth.uid()) = user_id);

create table public.stockzap_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('access','correction','deletion','objection','other')),
  details text not null default '' check (length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending','in_review','completed','rejected')),
  response text not null default '' check (length(response) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stockzap_privacy_requests_user_created on public.stockzap_privacy_requests(user_id, created_at desc);
alter table public.stockzap_privacy_requests enable row level security;
revoke all on public.stockzap_privacy_requests from anon, authenticated;
grant select on public.stockzap_privacy_requests to authenticated;
grant all on public.stockzap_privacy_requests to service_role;
create policy privacy_requests_read_own on public.stockzap_privacy_requests
  for select to authenticated using ((select auth.uid()) = user_id);
comment on table public.stockzap_privacy_requests is 'Requests require operator review. Inserting a request never deletes an account automatically.';
