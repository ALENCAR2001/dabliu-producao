# Publicar no GitHub e Vercel

Guia para colocar o **DABLIU** online (app estático + Supabase).

## 1. Repositório no GitHub

### 1.1 Criar o repositório no site

1. Acesse [github.com/new](https://github.com/new)
2. Nome sugerido: `dabliu` (ou `dabliu-jeans`)
3. **Private** ou **Public** — sua escolha
4. **Não** marque “Add a README” (o projeto já tem arquivos)
5. Clique **Create repository**

### 1.2 Enviar o código (terminal na pasta `dabliu`)

Substitua `SEU_USUARIO` e `NOME_DO_REPO`:

```powershell
cd "c:\projeto dabliu\dabliu"

git add .
git commit -m "Preparar DABLIU para deploy na Vercel"

git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

Se o `remote` já existir:

```powershell
git remote set-url origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

> O arquivo `.env` **não** vai para o GitHub (está no `.gitignore`). Só `.env.example`.

---

## 2. Projeto na Vercel

### 2.1 Importar do GitHub

1. [vercel.com](https://vercel.com) → login (conta GitHub)
2. **Add New…** → **Project**
3. Importe o repositório `dabliu`
4. **Root Directory:** deixe `.` (raiz do repo = pasta `dabliu` se você subiu só ela)
5. Framework: **Vite** (detectado automaticamente)
6. Build: `npm run build` · Output: `dist` (já em `vercel.json`)

### 2.2 Variáveis de ambiente (obrigatório para nuvem)

Em **Settings → Environment Variables**, adicione:

| Nome | Valor | Ambiente |
|------|--------|----------|
| `VITE_SUPABASE_URL` | Project URL do Supabase | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | chave **anon public** | Production, Preview |
| `VITE_AUTH_EMAIL_DOMAIN` | ex. `dabliu.app` | Production, Preview |

**Não** coloque `SUPABASE_SERVICE_ROLE_KEY` na Vercel (só use localmente nos scripts).

Clique **Deploy**.

### 2.3 Sem Supabase

Se não configurar as variáveis, o app sobe em **modo local** (dados só no navegador de cada usuário). Para equipe em produção, use Supabase.

---

## 3. Configurar Supabase para o domínio Vercel

Depois do primeiro deploy, você terá uma URL como `https://dabliu-xxx.vercel.app`.

No [Supabase Dashboard](https://supabase.com/dashboard):

1. **Authentication** → **URL Configuration**
   - **Site URL:** `https://seu-app.vercel.app`
   - **Redirect URLs:** adicione `https://seu-app.vercel.app/**`
2. **Authentication** → **Providers** → **Email** → desative **Confirm email** (como no setup local)
3. Rode o SQL `supabase/setup_completo.sql` no **SQL Editor** (se ainda não rodou)
4. No seu PC, com `.env` preenchido:

```powershell
cd "c:\projeto dabliu\dabliu"
npm run setup:cloud
```

Isso cria usuários (admin, funcionários, Kaique, David, etc.).

---

## 4. Atualizações futuras

```powershell
git add .
git commit -m "Descrição da mudança"
git push
```

A Vercel faz **deploy automático** a cada push na branch `main`.

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Página 404 ao atualizar `/login` | `vercel.json` com rewrite já incluído — faça redeploy |
| Login nuvem não funciona | Confira variáveis `VITE_*` na Vercel e URLs no Supabase |
| Tela branca após deploy | Veja **Deployments → Build Logs**; rode `npm run build` local |
| Build falha no TypeScript | Corrija erros com `npm run build` antes do `git push` |
