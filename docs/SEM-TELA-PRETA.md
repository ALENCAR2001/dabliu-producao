# Configurar SEM janela preta — só no Cursor

Use isto se o `CONFIGURAR-DABLIU.bat` não funcionar.

## 1. Abrir o arquivo `.env` no Cursor

1. Abra o **Cursor**
2. Menu **File** → **Open Folder** → escolha a pasta `c:\projeto dabliu\dabliu`
3. Na **lista à esquerda**, clique no arquivo **`.env`**
   - Se não aparecer: pode estar oculto; use **Ctrl+P**, digite `.env`, Enter

## 2. Colar as 3 chaves (página API do Supabase aberta)

Apague o que tiver e deixe **exatamente** assim (cole DEPOIS do `=`):

```
VITE_SUPABASE_URL=COLE_A_URL_AQUI
VITE_SUPABASE_ANON_KEY=COLE_ANON_AQUI
VITE_AUTH_EMAIL_DOMAIN=dabliu.app
SUPABASE_SERVICE_ROLE_KEY=COLE_SERVICE_ROLE_AQUI
```

- **URL** = Project URL (https://....supabase.co)
- **ANON** = chave anon public
- **SERVICE** = service_role (Reveal antes)

Salve: **Ctrl+S**

## 3. Terminal só DENTRO do Cursor

1. Menu **Terminal** → **New Terminal** (faixa embaixo)
2. Cole e Enter:

```
cd "c:\projeto dabliu\dabliu"
npm run seed:auth
```

## 4. SQL no site (uma vez)

Supabase → **SQL Editor** → **New query**

No Cursor: abra `supabase/setup_completo.sql` → Ctrl+A → Ctrl+C → cole no site → **Run**

Se o seed falhou, rode de novo: `npm run seed:auth`

## 5. Desligar e-mail

Authentication → Providers → Email → **Confirm email OFF** → Save

## 6. Abrir app

```
npm run dev
```
