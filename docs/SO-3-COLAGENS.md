# Só 3 colagens — sem editar arquivo

Se você não sabe usar o `.env`, faça **só isto**:

## 1. Abrir o terminal no Cursor

1. Menu **Terminal** → **New Terminal** (ou Ctrl+`)
2. Digite e aperte Enter:

```bash
cd "c:\projeto dabliu\dabliu"
npm run configurar
```

## 2. Seguir as perguntas na tela

O script pede para você abrir o Supabase. Quando apertar Enter, ele pede **3 colagens**:

1. **Project URL**
2. **anon public**
3. **service_role** (no site, clique **Reveal** antes de copiar)

Cole cada uma e aperte Enter.

## 3. Onde copiar no site (imagem mental)

```
Supabase
 └── seu projeto
      └── ⚙️ Project Settings (engrenagem)
           └── API
                ├── Project URL          ← 1ª colagem
                └── Project API keys
                     ├── anon  public    ← 2ª colagem
                     └── service_role   ← 3ª colagem (Reveal)
```

## 4. Um clique no site no final

**Authentication** → **Providers** → **Email** → desligar **Confirm email** → **Save**.

## 5. Abrir o app

```bash
npm run dev
```

---

Se travar em algum passo, diga no chat **em qual número parou** (ex: “não acho a engrenagem”).
