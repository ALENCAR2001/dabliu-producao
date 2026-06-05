-- Pedidos de ajuda de ponto (funcionário esqueceu de registrar)
-- Rode no Supabase → SQL Editor se aparecer erro "ponto_help_requests not found"

create table if not exists public.ponto_help_requests (
  id text primary key,
  user_id text not null,
  user_nome text not null,
  help_date date not null,
  motivo text,
  status text not null default 'pendente' check (status in ('pendente', 'resolvido')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists ponto_help_requests_created_at_idx
  on public.ponto_help_requests (created_at desc);

create index if not exists ponto_help_requests_status_idx
  on public.ponto_help_requests (status, help_date desc);

alter table public.ponto_help_requests enable row level security;

drop policy if exists "ponto_help_requests_anon_all" on public.ponto_help_requests;

drop policy if exists "ponto_help_requests_select" on public.ponto_help_requests;
create policy "ponto_help_requests_select"
  on public.ponto_help_requests
  for select
  to authenticated
  using (
    public.is_admin ()
    or user_id = (select legacy_id from public.profiles where id = auth.uid ())
  );

drop policy if exists "ponto_help_requests_insert" on public.ponto_help_requests;
create policy "ponto_help_requests_insert"
  on public.ponto_help_requests
  for insert
  to authenticated
  with check (
    user_id = (select legacy_id from public.profiles where id = auth.uid ())
  );

drop policy if exists "ponto_help_requests_update" on public.ponto_help_requests;
create policy "ponto_help_requests_update"
  on public.ponto_help_requests
  for update
  to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());
