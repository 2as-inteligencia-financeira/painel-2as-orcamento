# 2AS | Módulo de orçamento

Front-end em React e Vite para o fluxo de orçamento, implantado usualmente como segundo projeto na Vercel.

## Node

Projeto pensado para **Node 22** (`.nvmrc` + `engines` no `package.json`).

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build local

```bash
npm run build
```

## GitHub Actions

Push em `main` e pull requests executam lint e build (`npm ci`, `npm run lint`, `npm run build`).

## Vercel

- Framework **Vite**, output **`dist`**.
- O arquivo `vercel.json` garante SPA (rewrite para `/index.html` exceto `/api/*`) e cabeçalhos de segurança.
- Mantenha **Node.js Version 22.x** iguais ao painel principal.
- Envie apenas variáveis necessárias (ver `.env.example`).

Para o menu “Módulo Orçamento” no painel de inteligência financeira funcionar, a URL pública deste deploy deve constar como **`VITE_URL_MODULO_ORCAMENTO`** no projeto do painel principal.
