# Agent Skills no projeto DABLIU

## O que é?

O [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) traz **workflows de engenharia** para o Cursor e outros agentes: spec, plano, implementação, testes, review, segurança, etc.

Clone neste projeto:

```
vendor/agent-skills/
```

## Ativo no Cursor?

Sim. A regra `.cursor/rules/addy-agent-skills.mdc` está com **alwaysApply: true**.

Também existe `AGENTS.md` na raiz do projeto DABLIU com o resumo para o agente.

## Como usar no dia a dia

No chat do Cursor, por exemplo:

- *"Siga o AGENTS.md e frontend-ui-engineering para melhorar o Dashboard"*
- *"Use spec-driven-development antes de adicionar o módulo X"*
- *"Review com code-review-and-quality no que mudamos em Produção"*

O agente deve abrir e seguir o arquivo:

`vendor/agent-skills/skills/<nome-do-skill>/SKILL.md`

## Skills mais úteis para o DABLIU

| Skill | Quando |
|-------|--------|
| `frontend-ui-engineering` | Layouts, Dashboard, Estoque, Login, Tailwind |
| `incremental-implementation` | Qualquer feature em vários arquivos |
| `test-driven-development` | Lógica de produção, ponto, insumos |
| `debugging-and-error-recovery` | Tela branca, erro de build, Supabase |
| `security-and-hardening` | Auth, roles, dados de funcionários |
| `code-review-and-quality` | Antes de considerar pronto |
| `spec-driven-development` | Feature grande nova |

Lista completa: `vendor/agent-skills/README.md`

## Clone no projeto

```
vendor/agent-skills/   ← repositório addyosmani/agent-skills (git clone)
```

Commit atual (após `git pull`): verifique com `git -C vendor/agent-skills log -1 --oneline`.

## Status: MODO ATIVO

- Regra Cursor: `.cursor/rules/addy-agent-skills.mdc` (`alwaysApply: true`)
- Entrada: `AGENTS.md` na raiz
- 23 skills em `vendor/agent-skills/skills/*/SKILL.md`

## Atualizar

```powershell
git -C vendor/agent-skills pull
```

Ou execute: `scripts/update-agent-skills.ps1`

## Instalar de novo (se apagou vendor/)

```powershell
git clone --depth 1 https://github.com/addyosmani/agent-skills.git vendor/agent-skills
```

## Maestro + equipe (integrado)

O **Agent Starter Kit** está em `.agents/` (Maestro, Architect, Coder, Reviewer, Contextualizer).

- Boot: `AGENTS.md` → `.agents/personas/maestro.md`
- Cursor: `.cursor/rules/maestro.mdc` (always on)
- Dispatch: `.agents/skills/dispatch.md`
- Memória de sessão: `.memory/` (gitignored)

Diga no chat: *"Cumpra o AGENTS.md"* ou peça uma tarefa — o Maestro delega para a equipe nesta mesma sessão.
