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
- Repositório GitHub: [github.com/2as-inteligencia-financeira/painel-2as-orcamento](https://github.com/2as-inteligencia-financeira/painel-2as-orcamento) (deploy conectado ao projeto **2as-orcamento**).

### Domínio

Produção canônica: **https://orcamento.2asfinancas.com** (adicione em Vercel → Domains → CNAME conforme orientação).

O host **`https://2as-orcamento.vercel.app`** recebe redirect **308** permanente para o domínio acima (`vercel.json`).

### Variáveis de ambiente (produção)

| Variável | Uso |
|----------|-----|
| `VITE_ORCAMENTO_API_BASE` | Opcional — prefixo da API quando existir. |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | **Opcional mas recomendado:** copie do projeto **luniq-hub** na Vercel (mesmas chaves do Hub). Com as duas definidas, o app ativa login + SSO ao abrir a partir do [Hub](https://app.2asfinancas.com/dashboard). Se **não** existirem, o build abre o módulo em modo demo (sem tela de login). |

Para o menu “Módulo Orçamento” no painel de inteligência financeira: defina **`VITE_URL_MODULO_ORCAMENTO`** = `https://orcamento.2asfinancas.com` no projeto **luniq-painel** (e no **luniq-hub**).
