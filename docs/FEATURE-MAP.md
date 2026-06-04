# Feature Map

> Índice auto-mantido das features visíveis ao usuário e o caminho de código que as implementa.

## Navegação e Shell do App (Sidebar + Rotas)

App com sidebar (mobile/desktop) e páginas navegáveis via `react-router-dom`.

**Flow:**

1. `src/main.tsx` — bootstrap do React; renderiza `App`.
2. `src/App.tsx` — define layout, sidebar e rotas (`BrowserRouter`, `Routes`, `Route`).
3. `src/pages/*` — páginas renderizadas em cada rota.

---

## Dashboard (`/`)

Visão geral da produção (cards/indicadores). No estado atual, os números são estáticos (mock).

**Flow:**

1. `src/App.tsx` — rota `path="/"`.
2. `src/pages/Dashboard.tsx` — UI do dashboard.

---

## Layouts (`/layouts`)

Gerenciamento de layouts (lista + cadastro via modal). No estado atual, o “CRUD” é em memória (state local), sem persistência.

**Flow:**

1. `src/App.tsx` — rota `path="/layouts"`.
2. `src/pages/Layouts.tsx` — estado local `layouts`, modal, formulário e exclusão com `confirm(...)`.
3. `src/types/layout.ts` — contrato do objeto `Layout`.

---

## Produção (`/producao`)

Tela para registrar produção do dia (contagem por tamanho). No estado atual, a UI é estática (sem estado/handlers implementados).

**Flow:**

1. `src/App.tsx` — rota `path="/producao"`.
2. `src/pages/Producao.tsx` — UI da contagem.

---

## Administração (`/administracao`)

Tela de configurações do sistema (seções: Funcionários, Categorias, Backup). No estado atual, é apenas UI (sem navegação interna ou ações).

**Flow:**

1. `src/App.tsx` — rota `path="/administracao"`.
2. `src/pages/Administracao.tsx` — UI da administração.

---
