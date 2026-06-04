---
readWhen: always
description: Entrada para agentes no projeto DABLIU. Leia primeiro SEMPRE.
---

# DABLIU — guia para agentes

App React + Vite + TypeScript: layouts, produção, ponto, insumos, dashboard (admin).

## Maestro + equipe (ativo)

Este projeto usa o **Agent Starter Kit** em `.agents/`:

- `.agents/personas/` — Maestro, Architect, Coder, Reviewer, Contextualizer
- `.agents/skills/` — boot, dispatch, review-loop, memória, etc.
- `.agents/rules/` — commandments, edicts

**Boot:** leia e siga `.agents/personas/maestro.md` e `.agents/skills/boot.md`.  
**Dispatch:** `.agents/skills/dispatch.md` (obrigatório antes de delegar).  
**Memória:** `.memory/` na raiz do projeto.

Cursor: regra `.cursor/rules/maestro.mdc` (sempre ativa).

## Contexto do projeto

1. Leia `docs/FEATURE-MAP.md` e os arquivos `.context.md` nas pastas que for alterar.
2. Stack: React 19, Vite, Tailwind, React Router, Supabase (opcional), localStorage como fallback.

## Modo Agent Skills (addy — ativo)

Pacote [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) em `vendor/agent-skills/`.

**Antes de implementar** feature, bug complexo, refactor ou review:

1. Leia `vendor/agent-skills/skills/using-agent-skills/SKILL.md`
2. Leia o skill aplicável em `vendor/agent-skills/skills/<nome>/SKILL.md` e siga o workflow completo

| Trabalho | Skill |
|----------|--------|
| Telas / UI (React) | `frontend-ui-engineering` |
| Nova feature / escopo | `spec-driven-development` → `incremental-implementation` |
| Testes | `test-driven-development` |
| Bug | `debugging-and-error-recovery` |
| Review | `code-review-and-quality` |
| Segurança (auth, dados) | `security-and-hardening` |

Detalhes: `docs/ADDY-AGENT-SKILLS.md` · integração kit: `.agents/skills/addy-agent-skills.md`

Atualizar pacote: `git -C vendor/agent-skills pull`

## Convenções DABLIU

- Ao alterar comportamento ou fluxo importante, acrescente uma entrada em **`CHANGELOG.md`** com o próximo ID `CHG-NNN` (escopo, arquivos, riscos) para triagem de bugs.
- Admin vs funcionário: rotas e menus em `src/App.tsx`, auth em `src/context/AuthContext.tsx`
- Insumos: `src/pages/Estoque.tsx`, mínimos em Administração
- Não commitar `.env` · não alterar credenciais em `src/data/users.ts` em produção sem pedido explícito
