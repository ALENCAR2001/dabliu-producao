# Criar projeto Supabase (primeira vez)

Siga na ordem. Não precisa entender código — só copiar e colar.

## Passo 1 — Conta

1. Abra **[supabase.com](https://supabase.com)** no navegador.
2. Clique em **Start your project** e entre com GitHub, Google ou e-mail.

## Passo 2 — Novo projeto

1. Clique em **New project**.
2. **Organization:** pode usar a padrão (Free).
3. **Name:** por exemplo `dabliu`.
4. **Database password:** invente uma senha forte e **anote num lugar seguro** (vai usar se quiser SQL automático depois).
5. **Region:** escolha a mais perto (ex. South America se aparecer).
6. Clique em **Create new project** e espere 1–3 minutos (barra de progresso).

## Passo 3 — Copiar as chaves para o `.env`

1. No menu lateral, clique na **engrenagem** → **Project Settings**.
2. Clique em **API**.
3. No seu computador, abra o arquivo **`dabliu/.env`** no Cursor.
4. Copie e cole assim:

| No site Supabase | No arquivo `.env` |
|------------------|-------------------|
| **Project URL** | `VITE_SUPABASE_URL=` |
| **anon public** (em Project API keys) | `VITE_SUPABASE_ANON_KEY=` |
| **service_role** (clique Reveal) | `SUPABASE_SERVICE_ROLE_KEY=` |

5. Salve o `.env` (Ctrl+S).

⚠️ A chave **service_role** é secreta — não mande para ninguém nem coloque em foto.

## Passo 4 — Rodar o configurador (no Cursor ou terminal)

Na pasta `dabliu`:

```bash
npm run setup:cloud
```

Se der certo, aparece **Login na nuvem pronto!**

## Passo 5 — SQL (se o script avisar)

Se não tiver colocado `SUPABASE_DB_URL`:

1. No Supabase: **SQL Editor** → **New query**.
2. Abra no Cursor o arquivo `supabase/setup_completo.sql`, copie **tudo**, cole no editor.
3. Clique **Run**.
4. Rode de novo: `npm run setup:cloud`.

## Passo 6 — Desligar confirmação de e-mail

1. Menu **Authentication** → **Providers** → **Email**.
2. Desative **Confirm email**.
3. **Save**.

## Passo 7 — Testar o app

```bash
npm run dev
```

- **Funcionário:** Michael → PIN `1001`
- **Admin:** usuário `admin` → senha `admin123`

---

Quando terminar o **Passo 3**, volte no chat e diga **“chaves no env”** que eu rodo o setup para você.
