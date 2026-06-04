# Login na nuvem — Supabase Auth (DABLIU)

Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`, o app usa **Supabase Auth** em vez de senhas só no navegador.

## O que muda para a equipe

| Quem | Como entra |
|------|------------|
| **Funcionário** | Igual: toca no nome → PIN de 4 dígitos |
| **Admin** | Usuário `admin` + senha (padrão `admin123` após seed) |

Por baixo, o Supabase usa e-mail + senha:

- Michael → `michael@dabliu.app` + PIN `1001`
- Admin → `admin@dabliu.app` + `admin123`

O domínio padrão é `dabliu.app` (só técnico; o funcionário **não** digita e-mail).

## Passo a passo (primeira vez)

### 1. SQL no Supabase

No **SQL Editor**, execute nesta ordem:

1. `supabase/schema.sql` (se ainda não rodou)
2. `supabase/auth_schema.sql`

### 2. Variáveis no `.env`

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Opcional — domínio dos e-mails Auth
VITE_AUTH_EMAIL_DOMAIN=dabliu.app

# Só para o script de seed (não coloque no front público)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Criar usuários (seed)

Na pasta `dabliu/`:

```bash
node scripts/seed-supabase-auth.mjs
```

Isso cria/atualiza os 7 usuários (admin + 6 funcionários) e a tabela `profiles`.

### 4. Auth no painel Supabase

**Authentication → Providers → Email**

- Desative **Confirm email** (equipe interna, entrada imediata).

### 5. Edge Function (admin altera PIN)

Para o administrador mudar PINs pelo app:

```bash
# Com Supabase CLI logado no projeto
supabase functions deploy admin-update-password
```

Sem essa função, o login funciona, mas **Alterar / Novo PIN** na Administração retorna erro.

### 6. Reiniciar o app

```bash
npm run dev
```

Na Administração deve aparecer o selo **Nuvem**.

## PINs padrão (após seed)

| Funcionário | PIN |
|-------------|-----|
| Michael Jackson | 1001 |
| Hamilton Santos | 1002 |
| Iuri | 1003 |
| Gabriel Alencar | 1004 |
| Christian Nascimento | 1005 |
| Bruno Brasil | 1006 |
| Kaique Gomes | 1007 |
| David Oliveira | 1008 |

Admin: `admin` / `admin123`

## Modo local (sem Supabase)

Se `.env` não tiver URL/chave, o app continua com login e PINs no **localStorage** (como antes).

## Segurança

- `auth_schema.sql` restringe **ponto**, **produção** e **insumos** a usuários autenticados.
- A view `team_login` só expõe nome/login para a tela de entrada (sem senha).
- PINs na nuvem **não são legíveis** no app; após gerar/alterar, o PIN aparece uma vez para imprimir.

## Ponto e IDs antigos

O campo `user_id` no ponto continua `func-1`, `func-2`… (`legacy_id` no perfil). Dados antigos no banco seguem compatíveis.
