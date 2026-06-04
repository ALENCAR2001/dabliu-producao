# Banco de dados — DABLIU

O sistema usa **Supabase** (PostgreSQL na nuvem) para guardar fechamentos de produção, histórico e **gráficos futuros**.

Enquanto o Supabase não estiver configurado, os fechamentos ficam no **localStorage** do navegador.

## 1. Criar projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie um projeto gratuito.
2. No menu **SQL Editor**, abra e execute o arquivo `supabase/schema.sql` do repositório.
3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public** key

## 2. Configurar o app

Na pasta `dabliu/`:

```bash
cp .env.example .env
```

Edite `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

Na aba **Produção**, o rodapé deve mostrar **Armazenamento: Banco de dados (Supabase)**.

## 3. Migrar dados locais (opcional)

Se você já tinha fechamentos salvos no navegador, use o botão **“Enviar histórico local para o banco”** na aba Produção → Histórico.

## 4. Gráficos futuros

A tabela `production_closures` e a view `production_daily_totals` já permitem consultas como:

- peças produzidas por dia
- por marca e tipo (Long Line, Oversized…)
- volume de fechamentos por período

Quando for implementar gráficos, use essas agregações no Supabase ou no front com os dados da API.

## Ponto eletrônico

A tabela `time_punches` guarda entrada/saída por funcionário e dia (`user_id` + `punch_date` únicos). Execute o trecho correspondente em `supabase/schema.sql` se o projeto já existia antes dessa feature.

## Autenticação (login na nuvem)

Execute também `supabase/auth_schema.sql` e siga **`docs/AUTH-SUPABASE.md`** para criar usuários Auth, perfis e login com PIN na nuvem.

## Segurança

Com `auth_schema.sql`, ponto/produção/insumos exigem usuário autenticado. A lista de nomes na tela de login usa a view pública `team_login` (sem senhas).
