# Configurar login na nuvem (5 minutos)

## 1. Criar projeto no Supabase (se ainda não tiver)

1. Abra [https://supabase.com](https://supabase.com) e entre na sua conta.
2. **New project** → escolha nome e senha do banco (anote a senha).
3. Espere o projeto ficar verde (alguns minutos).

## 2. Copiar chaves para o `.env`

No Supabase: **Project Settings** (engrenagem) → **API**

No arquivo `dabliu/.env` (na pasta do projeto), cole:

| Variável | Onde pegar |
|----------|------------|
| `VITE_SUPABASE_URL` | **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | **anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (secret — não compartilhe) |

**Opcional** (para o script criar tabelas sozinho):

| Variável | Onde pegar |
|----------|------------|
| `SUPABASE_DB_URL` | **Database** → **Connection string** → URI (modo Session ou Direct) — troque `[YOUR-PASSWORD]` pela senha do banco |

Salve o arquivo `.env`.

## 3. Rodar o configurador

Na pasta `dabliu/`:

```bash
npm install
npm run setup:cloud
```

Isso tenta: criar tabelas (se tiver `SUPABASE_DB_URL`), criar usuários e testar login admin.

## 4. Se não usou `SUPABASE_DB_URL`

No Supabase: **SQL Editor** → **New query** → cole todo o arquivo `supabase/setup_completo.sql` → **Run**.

Depois rode também `supabase/layouts_cloud.sql` (layouts, PDFs na nuvem).

Depois rode de novo: `npm run setup:cloud` (só para criar usuários).

## 5. Desativar confirmação de e-mail

**Authentication** → **Providers** → **Email** → desligue **Confirm email** → Save.

## 6. Reiniciar o app

```bash
npm run dev
```

Abra **http://localhost:3000/** (login em `/login`).

Entre como **Funcionário** (nome + PIN 1001 para Michael) ou **Admin** (`admin` / `admin123`).

## PINs padrão

Michael 1001 · Hamilton 1002 · Iuri 1003 · Gabriel 1004 · Christian 1005 · Bruno 1006 · Kaique 1007 · David 1008

---

## 7. Usar na Vercel (produção)

Depois dos passos 1–6 no PC:

1. **Vercel** → projeto `dabliu-producao` → **Settings** → **Environment Variables**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AUTH_EMAIL_DOMAIN` = `dabliu.app`
2. **Redeploy** (Deployments → ⋮ → Redeploy)
3. **Supabase** → **Authentication** → **URL Configuration**
   - **Site URL:** `https://dabliu-producao.vercel.app` (ou o domínio que aparecer em **Domains** na Vercel)
   - **Redirect URLs:** `https://dabliu-producao.vercel.app/**`

A partir daí, login e dados (ponto, produção, insumos) ficam **sincronizados** para toda a equipe.
