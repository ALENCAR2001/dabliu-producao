# CHANGELOG — DABLIU JEANS

Log **enumerado** de alterações relevantes para triagem de bugs. Ao reportar um problema, cite o **ID** (ex.: `[CHG-012]`).

---

## Como usar na triagem de bugs

1. Reproduza o bug e anote tela/ação (login, ponto, layouts, etc.).
2. Procure neste arquivo por funcionalidade ou arquivo afetado.
3. Se souber data aproximada, confira entradas próximas no tempo.
4. Novas alterações devem **acrescentar** uma linha com próximo ID disponível (não editar IDs antigos).

**Convenção de IDs:** `CHG-NNN` — numeração sequencial no projeto.

---

## Entradas

### [CHG-001] — Login rápido por funcionário (nome + PIN)

| Campo | Valor |
|-------|--------|
| **Escopo** | UX login funcionário |
| **Arquivos principais** | `src/components/login/FuncionarioQuickLogin.tsx`, `src/pages/Login.tsx`, `src/context/AuthContext.tsx`, `src/services/userService.ts`, `src/utils/usersStorage.ts`, `src/data/users.ts` |
| **Comportamento** | Escolha Funcionário → grid de nomes → PIN; “entrada rápida” pelo último usuário. |
| **Riscos de regressão** | Lista vazia se `userService`/storage corrompido; PIN 4–6 dígitos. |

### [CHG-002] — Admin: Acessos da equipe (PIN, impressão)

| Campo | Valor |
|-------|--------|
| **Escopo** | Administração |
| **Arquivos principais** | `src/components/admin/UsuariosAdminSection.tsx`, `src/pages/Administracao.tsx` |
| **Comportamento** | Ver/alterar PIN, gerar PIN, reset padrão, impressão de lista. |
| **Riscos de regressão** | Modo nuvem vs local (ver [CHG-004]). |

### [CHG-003] — Listas de funcionários via `userService`

| Campo | Valor |
|-------|--------|
| **Escopo** | Dashboard, Ponto Admin |
| **Arquivos principais** | `src/pages/Dashboard.tsx`, `src/pages/PontoAdmin.tsx` → `listFuncionariosAsync` / `userService` |
| **Comportamento** | Fonte única de usuários (local ou nuvem conforme config). |
| **Riscos de regressão** | Carregamento assíncrono; estado inicial vazio até `useEffect`. |

### [CHG-004] — Supabase Auth (login na nuvem) — opcional

| Campo | Valor |
|-------|--------|
| **Escopo** | Autenticação, RLS, perfis |
| **Arquivos principais** | `src/services/authService.ts`, `src/context/AuthContext.tsx`, `src/lib/supabase.ts`, `supabase/auth_schema.sql`, `supabase/functions/admin-update-password/index.ts`, `scripts/seed-supabase-auth.mjs`, `scripts/setup-cloud.mjs`, `docs/AUTH-SUPABASE.md` |
| **Comportamento** | Com `VITE_SUPABASE_*` válido, sessão Supabase + perfis; sem isso, fallback local. |
| **Riscos de regressão** | Função Edge ausente → alterar PIN na nuvem falha; Confirm email ligado → login bloqueado; RLS negando leitura de tabelas. |

### [CHG-005] — Marca / nome oficial “DABLIU JEANS”

| Campo | Valor |
|-------|--------|
| **Escopo** | Branding UI + dados legados |
| **Arquivos principais** | `src/config/brand.ts` (`APP_NAME`, `COMPANY_MARCA`, `normalizeMarca`), `src/App.tsx`, `src/pages/Login.tsx`, `index.html`, `src/components/admin/UsuariosAdminSection.tsx`, `src/pages/Layouts.tsx`, `src/utils/layoutStorage.ts`, `src/utils/productionStorage.ts`, `src/utils/exportRelatorios.ts` (prefixo CSV) |
| **Comportamento** | Nome exibido “DABLIU JEANS”; marcas antigas `W` / `DABLIU` normalizadas ao carregar layouts/produção. |
| **Riscos de regressão** | Filtros salvos com string antiga podem precisar refresh; CSVs com novo prefixo `dabliu-jeans-`. |

### [CHG-008] — Scripts e docs de setup Supabase (assistente)

| Campo | Valor |
|-------|--------|
| **Escopo** | Onboarding técnico |
| **Arquivos principais** | `scripts/configurar-supabase.mjs`, `scripts/configurar-supabase.ps1`, `CONFIGURAR-DABLIU.bat`, `supabase/setup_completo.sql` (merge schema + auth), `docs/SETUP-RAPIDO.md`, `docs/CRIAR-PROJETO-SUPABASE.md`, `docs/SO-3-COLAGENS.md`, `docs/SEM-TELA-PRETA.md`, `docs/ONDE-CLICAR.md` |
| **Comportamento** | Facilitar `.env`, seed, SQL. |
| **Riscos de regressão** | Placeholders no `.env` se não preenchido. |

### [CHG-009] — UX de carregamento na rota protegida

| Campo | Valor |
|-------|--------|
| **Escopo** | Auth inicial (nuvem) |
| **Arquivos principais** | `src/components/RequireAuth.tsx`, `src/pages/Login.tsx` (`authReady`) |
| **Comportamento** | Evita redirect prematuro antes da sessão Supabase hidratar. |
| **Riscos de regressão** | Tela “Carregando…” se `authReady` nunca vira true (rede / config). |

### [CHG-010] — Cores de tinta dinâmicas + Gel/Relevo por cor

| Campo | Valor |
|-------|--------|
| **Escopo** | Insumos — tinta |
| **Arquivos principais** | `src/utils/tintaCoresCatalog.ts` (novo), `src/utils/tintaVariants.ts`, `src/utils/insumoCatalog.ts`, `src/types/insumos.ts`, `src/pages/Estoque.tsx`, `src/utils/dashboardInsumos.ts` |
| **Comportamento** | Botão **Nova cor** em Insumos; catálogo em `localStorage` (`dabliu-tinta-cores-v2`); cada cor sempre gera dois itens (Gel e Relevo, kg); itens vindos do banco atualizam o catálogo automaticamente (`syncTintaCatalogWithItems`). |
| **Riscos de regressão** | Catálogo local por navegador; nomes `"X gel"` herdados migram por `inferCor`; mínimos custom por id `tinta-{cor}-*` podem não existir no painel administrativo até cadastrados. |

### [CHG-011] — Remover cor de tinta customizada (admin / Insumos)

| Campo | Valor |
|-------|--------|
| **Escopo** | Insumos → Tinta |
| **Arquivos principais** | `src/utils/tintaCoresCatalog.ts` (lista de exclusão na sync `dabliu-tinta-cores-excluidos-v1`), `src/pages/Estoque.tsx` |
| **Comportamento** | Botão **Remover esta cor do catálogo** (cores que não são as 5 padrão): exclui Gel e Relevo no estoque (local/Supabase), tira a cor do catálogo e impede que ela reapareça só por causa de linhas velhas no banco. **Nova cor** com o mesmo nome limpa a exclusão. |
| **Riscos de regressão** | Exclusão por navegador; outro PC pode ainda listar a cor até remover ou limpar cache; mínimos salvos para `tinta-{id}-*` ficam órfãos (usar padrão `tinta-default`). |

### [CHG-012] — Amostra visual de cor no catálogo de tinta

| Campo | Valor |
|-------|--------|
| **Escopo** | Insumos (chips) + Dashboard (tabela tinta) |
| **Arquivos principais** | `src/utils/tintaCorVisual.ts` (novo), `src/pages/Estoque.tsx`, `src/components/dashboard/DashboardInsumos.tsx` |
| **Comportamento** | Bolinha com a cor real ao lado do nome; mapa de palavras (pt/en) + hue por hash para nomes sem match. |
| **Riscos de regressão** | Nome ambíguo pode casar com outra palavra do mapa; tons HSL fixos por id para custom “sem palavra”. |

### [CHG-013] — Ponto (equipe): “dias ok” sempre no resumo dos cards

| Campo | Valor |
|-------|--------|
| **Escopo** | Admin → Ponto (equipe) |
| **Arquivos principais** | `src/pages/PontoAdmin.tsx` |
| **Comportamento** | O mês carrega sempre com **todos** os funcionários; os cards contam dias ok/so entrada sobre esse conjunto. A seleção no combo e o clique no card só filtram a tabela, o calendário e o CSV exportado — não zeram mais o resumo dos outros. Ao abrir a tela, o padrão continua **Todos os funcionários** (não força mais o primeiro da lista só por carregar a equipe). |
| **Riscos de regressão** | Mês grande + muitos usuários: mais linhas por request/cliente único fetch (substitui N carregamentos parciais). |

### [CHG-014] — Meu ponto: total de horas extras no mês (após 18:00)

| Campo | Valor |
|-------|--------|
| **Escopo** | Funcionário → Meu ponto |
| **Arquivos principais** | `src/utils/pontoOvertime.ts` (novo), `src/pages/Ponto.tsx` |
| **Comportamento** | Abaixo da legenda do calendário do mês, painel **Horas extras**: soma automática por usuário do tempo trabalhado **depois das 18:00** em cada dia com entrada e saída; lista os dias com valor &gt; 0. |
| **Riscos de regressão** | Limite fixo 18h (não considera escala/folga); não soma dias só com entrada; virada de madrugada no mesmo registro não tratada. |

### [CHG-015] — Admin: horas extras de toda a equipe

| Campo | Valor |
|-------|--------|
| **Escopo** | Admin → Ponto (equipe) |
| **Arquivos principais** | `src/pages/PontoAdmin.tsx` (reutiliza `src/utils/pontoOvertime.ts`) |
| **Comportamento** | Painel **Horas extras da equipe** com total do mês e tabela por funcionário; cards mostram extra de cada um; ao selecionar funcionário, detalhe dia a dia; coluna **Extra** na tabela de registros. Mesma regra: após 18:00 com entrada e saída. |
| **Riscos de regressão** | Mesmas limitações de [CHG-014]; clique na linha da tabela de extras altera o filtro do funcionário. |

---

### [CHG-016] — Aba Relatório financeiro (entradas, saídas, lucro, insumos)

| Campo | Valor |
|-------|--------|
| **Escopo** | Admin → Financeiro (`/financeiro`) |
| **Arquivos principais** | `src/pages/RelatorioFinanceiro.tsx`, `src/types/financeiro.ts`, `src/services/financeiroService.ts`, `src/utils/financeiroResumo.ts`, `src/utils/financeiroStorage.ts`, `src/utils/exportRelatorios.ts`, `src/App.tsx` |
| **Comportamento** | Lançamentos de **entrada** (receita) e **saída** (despesa geral ou **gasto de insumo** por categoria: cola, tinta, fita, emulsão, desgravador, solvente). Resumo do mês: entradas, saídas, **lucro** (entradas − saídas), breakdown de gastos por insumo. Export CSV. Dados em `localStorage` (`dabliu-financeiro-v1`). |
| **Riscos de regressão** | Valores só no navegador até integrar Supabase; não desconta estoque automaticamente; “entrada/saída” aqui é financeiro (diferente do ponto). |

---

### [CHG-017] — Logo DABLIU JEANS na interface

| Campo | Valor |
|-------|--------|
| **Escopo** | Marca / login / menu |
| **Arquivos principais** | `public/brand/logo.png`, `src/components/BrandLogo.tsx`, `src/config/brand.ts`, `src/App.tsx`, `src/pages/Login.tsx`, `src/components/login/FuncionarioQuickLogin.tsx`, `index.html` |
| **Comportamento** | Logo no menu lateral, tela de login (admin e funcionário) e favicon; filtro claro em fundos escuros. Substituir `public/brand/logo.png` para atualizar a arte. |
| **Riscos de regressão** | Logo preta original pode sumir em fundo claro (app é tema escuro); arquivo ausente volta ao texto `DABLIU JEANS`. |

---

### [CHG-018] — Correção logo (quadrado branco)

| Campo | Valor |
|-------|--------|
| **Escopo** | Marca / login / menu |
| **Arquivos principais** | `public/brand/logo.svg` (novo), `src/components/BrandLogo.tsx`, removido filtro CSS `invert` |
| **Comportamento** | PNG original é preto sobre preto; `invert` virava quadrado branco. Passa a usar **SVG** prateado com fundo transparente. `logo.png` mantido como referência; para usar a arte exata, enviar PNG com **fundo transparente** e trocar `BRAND_LOGO_URL` em `brand.ts`. |
| **Riscos de regressão** | SVG é aproximação vetorial da marca, não pixel-perfect do arquivo enviado. |

---

### [CHG-019] — Fase 1: visão do mês + rotina + status nuvem (Dashboard)

| Campo | Valor |
|-------|--------|
| **Escopo** | Dashboard + Administração |
| **Arquivos principais** | `DashboardVisaoMes.tsx`, `DashboardModoDados.tsx`, `DashboardRotinaDia.tsx`, `dashboardMesResumo.ts`, `sistemaConfig.ts`, `NuvemSetupSection.tsx`, `Dashboard.tsx` |
| **Comportamento** | Painel **Visão do mês**: peças, entradas, saídas, lucro; valor médio/peça para receita estimada. **Rotina de hoje** (checklist). **Dados da equipe** (local vs nuvem por módulo). Admin: bloco **Nuvem (Fase 1)**. |
| **Riscos de regressão** | Financeiro ainda só localStorage; lucro estimado depende de valor médio/peça opcional. |

---

### [CHG-020] — Ponto: só registra no dia + pedido de ajuda ao admin

| Campo | Valor |
|-------|--------|
| **Escopo** | Meu ponto + Ponto (equipe) |
| **Arquivos principais** | `pontoRules.ts`, `pontoAjudaService.ts`, `Ponto.tsx`, `PontoAdmin.tsx`, `pontoService.ts`, `MonthCalendarGrid.tsx` |
| **Comportamento** | Funcionário **só salva o ponto de hoje** (validação no app e no serviço). Calendário: dias passados só consulta. Botão **Preciso de ajuda** para dias esquecidos → aviso ao admin. Admin vê pedidos pendentes e marca **Resolvido** após contato. |
| **Riscos de regressão** | Pedidos em `localStorage` por navegador; admin em outro PC não vê até nuvem futura. |

---

## Próximo ID sugerido

`CHG-021` — usar na próxima alteração documentada.

---

## Legenda rápida

| Tag | Significado |
|-----|-------------|
| UX | Interface / fluxo |
| Auth | Login / sessão |
| Data | Storage / banco / migração visual de dados |
| DevEx | Ferramentas de desenvolvimento / rede |
