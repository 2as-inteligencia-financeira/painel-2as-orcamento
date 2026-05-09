# Módulo 2AS Orçamento - MVP

## Produto

App dedicado a autorização e acompanhamento de orçamento, separado do Painel de Inteligência. Registra cadastros, orçamento e realizado operacional; o painel de inteligência consome dados tratados via API para análise, DRE, margem, caixa e relatórios consolidados.

## Módulos do MVP

- Empresas: cadastro comercial, CNPJ, plano contratado, status de implantação.
- Módulos contratados: liberações por cliente, permitindo vender apenas orçamento ou pacote completo.
- Orçamento: plano de contas, áreas, plano orçamentário, linhas operacionais e dotações mensais.
- Realizado: lançamentos por competência, por linha operacional, área e plano de contas.
- Contas a pagar: fornecedor, categoria, vencimento, aprovação, pagamento e conciliação.
- Contas pagas: histórico de baixa, conta bancária, comprovante e conciliação.
- Contas a receber: cliente, cobrança, vencimento, status e previsão.
- Recebidos: baixa, liquidação, juros/descontos e conciliação.
- API do Painel: endpoints de leitura para previsto, realizado, títulos e dimensões.

## Banco de dados inicial

- companies
- company_modules
- users
- roles
- chart_accounts
- budget_areas
- budget_plans
- budget_lines
- budget_line_months
- actual_entries
- financial_titles
- payments
- receipts
- bank_accounts
- attachments
- audit_events
- api_tokens
- sync_jobs

## Integração com Painel de Inteligência

Endpoints pensados para leitura pelo painel:

- `GET /api/v1/companies`
- `GET /api/v1/budgets/:companyId`
- `GET /api/v1/actuals/:companyId`
- `GET /api/v1/financial-titles?companyId=&status=&type=`
- `POST /api/v1/webhooks/intelligence-sync`

O contrato deve preservar dimensões mínimas:

- empresa
- competência
- plano de contas
- área
- linha operacional
- previsto
- realizado
- status
- origem do dado
- data de atualização

## Próximo passo técnico

1. Definir backend e banco.
2. Criar autenticação multiempresa.
3. Persistir cadastro de empresas e módulos.
4. Persistir orçamento por linha e mês.
5. Criar endpoints de leitura para o painel.
6. Depois evoluir contas a pagar/receber com baixa e conciliação.
