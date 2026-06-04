# Onde clicar — passo a passo com desenho

## Parte A — No seu computador (mais fácil)

### Opção 1 — Duplo clique (recomendado)

1. Abra a pasta do projeto no **Explorador de Arquivos** do Windows:
   ```
   c:\projeto dabliu\dabliu
   ```
2. Procure o arquivo **`CONFIGURAR-DABLIU.bat`** (ícone de engrenagem ou janela).
3. **Duplo clique** nele.
4. Uma janela preta abre — siga o texto em português.

### Opção 2 — Pelo Cursor

1. Abra o Cursor.
2. Menu superior **Terminal** → **Novo terminal**.
3. Uma faixa aparece **embaixo** da tela.
4. Digite: `npm run configurar` e Enter.

---

## Parte B — No site Supabase (onde estão as 3 coisas para copiar)

### 1. Entrar no site

- Abra: **https://supabase.com**
- Faça login (Google, GitHub ou e-mail).

### 2. Ver seus projetos

Depois do login você deve ver uma **lista de projetos**.

- Se aparecer **“New project”** e um card com o nome do seu projeto (ex: **dabliu**), **clique no card/nome do projeto**.
- Se não aparecer nenhum projeto, o projeto ainda não foi criado — clique **New project** primeiro.

### 3. Dentro do projeto — achar as chaves

A tela tem uma **barra lateral esquerda** (menu escuro). Role até o **final** da lista.

Procure um destes (o Supabase muda o texto às vezes):

| Pode aparecer como | Ícone |
|--------------------|--------|
| **Project Settings** | ⚙️ engrenagem |
| **Settings** | ⚙️ |
| **Configurações do projeto** | ⚙️ |

**Clique** nisso.

Agora aparece um **submenu** à direita ou no meio. Clique em:

| Clique em |
|-----------|
| **API** |

### 4. O que copiar (nesta página API)

Você verá algo assim:

```
Project URL
https://xxxxxxxx.supabase.co     [ícone copiar]

Project API keys
  anon          public    eyJhbG...   [Reveal] [Copy]
  service_role  secret    eyJhbG...   [Reveal] [Copy]
```

Copie nesta ordem quando o assistente pedir:

1. Tudo em **Project URL** (começa com `https://`)
2. A chave **anon** — linha que diz **public** — botão **Copy**
3. A chave **service_role** — clique **Reveal** depois **Copy**

---

## Parte C — Se NÃO aparece engrenagem / API

### Tela diferente?

Me diga **o que você vê** na barra da esquerda. Exemplos:

- Table Editor, SQL Editor, Authentication…
- Só “Home” e “Database”
- Está na página da **organização** (nome da empresa), não dentro do projeto

### Atalho direto (se souber o nome do projeto)

Tente abrir (troque `dabliu` pelo nome exato do seu projeto na URL do navegador):

```
https://supabase.com/dashboard/project/_/settings/api
```

Se pedir login, entre e escolha o projeto na lista.

### Link pela lista de projetos

1. https://supabase.com/dashboard/projects
2. Clique no **único projeto** da lista
3. Na URL do navegador aparece algo como:  
   `.../project/abcdefghijklmnop/...`  
   O código no meio é o ID do projeto.

Depois cole na barra de endereço (troque `SEU_ID` pelo código):

```
https://supabase.com/dashboard/project/SEU_ID/settings/api
```

---

## Parte D — Desligar confirmação de e-mail (depois do assistente)

Na **mesma barra lateral esquerda** (dentro do projeto):

1. **Authentication** (ícone de cadeado ou pessoa)
2. **Providers** (ou “Sign In / Providers”)
3. Clique em **Email**
4. Desligue **Confirm email**
5. **Save**

---

## Me ajude a te ajudar

Responda no chat **apenas uma letra**:

- **A** — Não acho a pasta `c:\projeto dabliu\dabliu` no Windows  
- **B** — Não acho o arquivo `CONFIGURAR-DABLIU.bat`  
- **C** — Entro no Supabase mas não vejo meu projeto  
- **D** — Vejo o projeto mas não acho engrenagem / API  
- **E** — Consegui abrir a página API (aí te guio na colagem)
