---
shortDescription: Ativa skills de engenharia do addyosmani/agent-skills (vendor) — descoberta, mapeamento e leitura obrigatória.
usedBy: [all]
relatedTo: [cursor, agent-skills]
version: 0.1.0
lastUpdated: 2026-05-26
---

## Purpose

Este projeto inclui o pacote [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) em `vendor/agent-skills/`. São workflows de engenharia de produção (spec, plan, build, test, review, ship) em Markdown. O Maestro e todos os personas devem **consultar e seguir** o skill aplicável antes de implementar trabalho não trivial — em paralelo às regras e skills nativas deste kit.

## Path base

```
vendor/agent-skills/skills/<skill-name>/SKILL.md
```

Atualizar o clone:

```bash
git -C vendor/agent-skills pull
```

No Windows (PowerShell): `git -C vendor/agent-skills pull`

## Modo ativo (obrigatório quando habilitado)

1. **Antes de codificar** tarefas não triviais, leia `vendor/agent-skills/skills/using-agent-skills/SKILL.md`.
2. Se existir skill para a fase/intenção, **leia o SKILL.md completo** e siga o procedimento — não resuma nem pule etapas.
3. Skills deste kit (boot, dispatch, review-loop) **continuam valendo** — addy skills complementam, não substituem commandments/edicts nem o dispatch do Maestro.

## Mapeamento rápido (intenção → skill)

| Situação | Skill (`vendor/agent-skills/skills/...`) |
|----------|----------------------------------------|
| Pedido vago / descobrir requisitos | `interview-me` ou `idea-refine` |
| Nova feature / spec antes do código | `spec-driven-development` |
| Quebrar spec em tarefas | `planning-and-task-breakdown` |
| Implementar (vários arquivos) | `incremental-implementation` |
| UI / React / front | `frontend-ui-engineering` |
| API / contratos | `api-and-interface-design` |
| Testes / TDD | `test-driven-development` |
| Bug / falha | `debugging-and-error-recovery` |
| Review antes de merge | `code-review-and-quality` |
| Segurança | `security-and-hardening` |
| Performance | `performance-optimization` |
| Simplificar código | `code-simplification` |
| Git / commits | `git-workflow-and-versioning` |
| Deploy / release | `shipping-and-launch` |
| Contexto do agente caiu | `context-engineering` |

## Integração com personas (Maestro)

- **Architect** — pode usar `spec-driven-development`, `planning-and-task-breakdown`, `api-and-interface-design`.
- **Coder** — `incremental-implementation`, `test-driven-development`, `frontend-ui-engineering`, `source-driven-development`.
- **Reviewer** — `code-review-and-quality`, `security-and-hardening`, `code-simplification` (além dos skills nativos `code-quality-review`, etc.).
- **Maestro** — no boot, após `skills/boot.md`, confirmar que `vendor/agent-skills` existe; em dispatches, incluir no brief: *"Follow vendor/agent-skills/skills/&lt;name&gt;/SKILL.md when applicable."*

## Guardrails

- Não carregar os 23 skills de uma vez no contexto — só o meta-skill + o skill da tarefa atual.
- Se `vendor/agent-skills` não existir, avisar o usuário e rodar: `git clone --depth 1 https://github.com/addyosmani/agent-skills.git vendor/agent-skills`
- Não contradizer `rules/commandments/` deste kit; em conflito, commandments vencem.
