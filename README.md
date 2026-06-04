# DABLIU

Sistema de gestão de layouts, produção, ponto e insumos (React + Vite + TypeScript).

## Desenvolvimento

```bash
npm install
npm run dev
```

Abre em **http://localhost:3000/**

## Publicar (GitHub + Vercel)

Passo a passo completo: **[docs/DEPLOY-GITHUB-VERCEL.md](docs/DEPLOY-GITHUB-VERCEL.md)**

Resumo: suba o repo no GitHub → importe na Vercel → configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` → ajuste URLs no Supabase Auth.

## Agentes (Cursor)

- **AGENTS.md** — instruções para o agente neste repo
- **Agent Skills** — `vendor/agent-skills/` ([addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)), modo ativo via `.cursor/rules/`
- Documentação: `docs/ADDY-AGENT-SKILLS.md`
- Atualizar skills: `powershell scripts/update-agent-skills.ps1`

## Docs

- **`CHANGELOG.md`** — log enumerado de alterações (`CHG-NNN`) para triagem de bugs
- `docs/FEATURE-MAP.md` — funcionalidades
- `docs/DATABASE.md` — Supabase

---

# React + TypeScript + Vite (template)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
