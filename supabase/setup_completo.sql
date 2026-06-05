-- DABLIU â€” schema inicial (Supabase / PostgreSQL)
-- Execute no SQL Editor do projeto Supabase: https://supabase.com/dashboard

-- Fechamentos de produÃ§Ã£o (contagem por modelo + tamanhos)
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
  'Fechamentos de contagem por peÃ§a/modelo. Base para histÃ³rico e grÃ¡ficos de produÃ§Ã£o.';

-- RLS (desenvolvimento: acesso aberto; restrinja quando tiver login)
alter table public.production_closures enable row level security;

drop policy if exists "production_closures_anon_all" on public.production_closures;
create policy "production_closures_anon_all"
  on public.production_closures
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- View Ãºtil para grÃ¡ficos futuros (produÃ§Ã£o por dia)
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

-- Ponto eletrÃ´nico (entrada / saÃ­da por dia e funcionÃ¡rio)
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
-- DABLIU â€” AutenticaÃ§Ã£o Supabase (execute apÃ³s schema.sql)
-- Dashboard â†’ SQL Editor â†’ colar e executar

-- Perfis vinculados ao auth.users (login na nuvem)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  legacy_id text not null unique,
  nome text not null,
  login text not null unique,
  role text not null check (role in ('admin', 'funcionario')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role) where active;
create index if not exists profiles_legacy_id_idx on public.profiles (legacy_id);

comment on table public.profiles is
  'Perfil DABLIU por usuÃ¡rio Auth. legacy_id (func-1â€¦) mantÃ©m compatibilidade com ponto e dados antigos.';

-- Lista pÃºblica para tela de login (sem dados sensÃ­veis)
create or replace view public.team_login as
select
  legacy_id as id,
  nome,
  login
from public.profiles
where role = 'funcionario'
  and active = true
order by nome;

grant select on public.team_login to anon, authenticated;

-- Trigger: cria perfil ao cadastrar usuÃ¡rio no Auth
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, legacy_id, nome, login, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'legacy_id', new.id::text),
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'funcionario')
  )
  on conflict (id) do update
  set
    nome = excluded.nome,
    login = excluded.login,
    role = excluded.role,
    legacy_id = excluded.legacy_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- Quem Ã© o usuÃ¡rio logado?
create or replace function public.current_profile ()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid ()
  limit 1;
$$;

create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid ()
      and role = 'admin'
      and active
  );
$$;

grant execute on function public.current_profile () to authenticated;
grant execute on function public.is_admin () to authenticated;

-- RLS profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid ());

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin ());

-- PolÃ­ticas de dados: admin vÃª tudo; funcionÃ¡rio vÃª o prÃ³prio ponto
drop policy if exists "time_punches_anon_all" on public.time_punches;

drop policy if exists "time_punches_select" on public.time_punches;
create policy "time_punches_select"
  on public.time_punches
  for select
  to authenticated
  using (
    public.is_admin ()
    or user_id = (select legacy_id from public.profiles where id = auth.uid ())
  );

drop policy if exists "time_punches_insert" on public.time_punches;
create policy "time_punches_insert"
  on public.time_punches
  for insert
  to authenticated
  with check (
    public.is_admin ()
    or user_id = (select legacy_id from public.profiles where id = auth.uid ())
  );

drop policy if exists "time_punches_update" on public.time_punches;
create policy "time_punches_update"
  on public.time_punches
  for update
  to authenticated
  using (
    public.is_admin ()
    or user_id = (select legacy_id from public.profiles where id = auth.uid ())
  )
  with check (
    public.is_admin ()
    or user_id = (select legacy_id from public.profiles where id = auth.uid ())
  );

drop policy if exists "time_punches_delete" on public.time_punches;
create policy "time_punches_delete"
  on public.time_punches
  for delete
  to authenticated
  using (public.is_admin ());

-- ProduÃ§Ã£o e insumos: autenticados (ajuste fino depois se quiser sÃ³ admin escrever)
drop policy if exists "production_closures_anon_all" on public.production_closures;

drop policy if exists "production_closures_auth" on public.production_closures;
create policy "production_closures_auth"
  on public.production_closures
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "inventory_items_anon_all" on public.inventory_items;

drop policy if exists "inventory_items_auth" on public.inventory_items;
create policy "inventory_items_auth"
  on public.inventory_items
  for all
  to authenticated
  using (true)
  with check (true);

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
