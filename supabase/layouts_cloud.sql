-- DABLIU — Layouts e PDFs na nuvem (execute no SQL Editor após setup_completo.sql)

-- Catálogo customizado (marcas/tipos extras)
create table if not exists public.layout_catalog (
  id text primary key default 'default',
  custom_marcas jsonb not null default '[]'::jsonb,
  custom_tipos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.layout_catalog (id, custom_marcas, custom_tipos)
values ('default', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

-- Coleções (lotes de PDF)
create table if not exists public.layout_colecoes (
  id text primary key,
  marca text not null,
  tipo_modelo text not null,
  nome text not null,
  file_name text not null default '',
  storage_path text,
  page_count integer not null default 0 check (page_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists layout_colecoes_marca_tipo_idx
  on public.layout_colecoes (marca, tipo_modelo, created_at desc);

-- Modelos / cores
create table if not exists public.layout_models (
  id text primary key,
  marca text not null,
  tipo_modelo text not null,
  colecao_id text references public.layout_colecoes (id) on delete set null,
  pdf_page integer,
  nome text not null,
  codigo text not null,
  cor_tecido text not null default '',
  silk text not null default '',
  puff text not null default '',
  demaos text not null default '',
  altura_gola text not null default '',
  observacoes text not null default '',
  status text not null default 'ativo' check (status in ('ativo', 'producao', 'finalizado')),
  created_at timestamptz not null default now()
);

create index if not exists layout_models_colecao_idx on public.layout_models (colecao_id);
create index if not exists layout_models_marca_tipo_idx on public.layout_models (marca, tipo_modelo);

alter table public.layout_catalog enable row level security;
alter table public.layout_colecoes enable row level security;
alter table public.layout_models enable row level security;

drop policy if exists "layout_catalog_auth" on public.layout_catalog;
create policy "layout_catalog_auth"
  on public.layout_catalog for all to authenticated
  using (true) with check (true);

drop policy if exists "layout_colecoes_auth" on public.layout_colecoes;
create policy "layout_colecoes_auth"
  on public.layout_colecoes for all to authenticated
  using (true) with check (true);

drop policy if exists "layout_models_auth" on public.layout_models;
create policy "layout_models_auth"
  on public.layout_models for all to authenticated
  using (true) with check (true);

-- Bucket para PDFs (Storage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'layout-pdfs',
  'layout-pdfs',
  false,
  52428800,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "layout_pdfs_select" on storage.objects;
create policy "layout_pdfs_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'layout-pdfs');

drop policy if exists "layout_pdfs_insert" on storage.objects;
create policy "layout_pdfs_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'layout-pdfs');

drop policy if exists "layout_pdfs_update" on storage.objects;
create policy "layout_pdfs_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'layout-pdfs')
  with check (bucket_id = 'layout-pdfs');

drop policy if exists "layout_pdfs_delete" on storage.objects;
create policy "layout_pdfs_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'layout-pdfs');
