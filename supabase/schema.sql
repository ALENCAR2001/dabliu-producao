-- DABLIU — schema inicial (Supabase / PostgreSQL)
-- Execute no SQL Editor do projeto Supabase: https://supabase.com/dashboard

-- Fechamentos de produção (contagem por modelo + tamanhos)
create table if not exists public.production_closures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  layout_id text,
  marca text not null,
  tipo_modelo text not null,
  tipo_modelo_label text not null,
  nome text not null,
  codigo text not null,
  cor_tecido text not null default '',
  quantidades jsonb not null,
  total integer not null check (total >= 0),
  observacoes text
);

create index if not exists production_closures_created_at_idx
  on public.production_closures (created_at desc);

create index if not exists production_closures_marca_tipo_idx
  on public.production_closures (marca, tipo_modelo);

comment on table public.production_closures is
  'Fechamentos de contagem por peça/modelo. Base para histórico e gráficos de produção.';

-- RLS (desenvolvimento: acesso aberto; restrinja quando tiver login)
alter table public.production_closures enable row level security;

drop policy if exists "production_closures_anon_all" on public.production_closures;
create policy "production_closures_anon_all"
  on public.production_closures
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- View útil para gráficos futuros (produção por dia)
create or replace view public.production_daily_totals as
select
  date_trunc('day', created_at at time zone 'America/Sao_Paulo')::date as dia,
  marca,
  tipo_modelo,
  sum(total) as pecas_total,
  count(*) as fechamentos
from public.production_closures
group by 1, 2, 3
order by 1 desc;

-- Ponto eletrônico (entrada / saída por dia e funcionário)
create table if not exists public.time_punches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_nome text not null,
  punch_date date not null,
  entrada_at timestamptz,
  saida_at timestamptz,
  unique (user_id, punch_date)
);

create index if not exists time_punches_date_idx on public.time_punches (punch_date desc);
create index if not exists time_punches_user_idx on public.time_punches (user_id, punch_date desc);

alter table public.time_punches enable row level security;

drop policy if exists "time_punches_anon_all" on public.time_punches;
create policy "time_punches_anon_all"
  on public.time_punches
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Insumos (cola, tinta, fita)
create table if not exists public.inventory_items (
  id text primary key,
  categoria text not null check (categoria in ('cola', 'tinta', 'fita', 'emulsao', 'desgravador', 'solvente')),
  nome text not null,
  cor_tinta text,
  tipo_tinta text check (tipo_tinta is null or tipo_tinta in ('gel', 'relevo')),
  quantidade numeric not null default 0 check (quantidade >= 0),
  observacoes text,
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_categoria_idx on public.inventory_items (categoria);

alter table public.inventory_items enable row level security;

drop policy if exists "inventory_items_anon_all" on public.inventory_items;
create policy "inventory_items_anon_all"
  on public.inventory_items
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Pedidos de ajuda (funcionário esqueceu de registrar o ponto)
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
create policy "ponto_help_requests_anon_all"
  on public.ponto_help_requests
  for all
  to anon, authenticated
  using (true)
  with check (true);
