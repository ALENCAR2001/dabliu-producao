-- DABLIU — Autenticação Supabase (execute após schema.sql)
-- Dashboard → SQL Editor → colar e executar

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
  'Perfil DABLIU por usuário Auth. legacy_id (func-1…) mantém compatibilidade com ponto e dados antigos.';

-- Lista pública para tela de login (sem dados sensíveis)
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

-- Trigger: cria perfil ao cadastrar usuário no Auth
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

-- Quem é o usuário logado?
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

-- Políticas de dados: admin vê tudo; funcionário vê o próprio ponto
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

-- Produção e insumos: autenticados (ajuste fino depois se quiser só admin escrever)
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
