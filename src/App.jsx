import { useMemo, useState } from "react";

/** Base publicada da API REST lida pelo Painel de Inteligência (sem barra final). */
const ORCAMENTO_API_BASE = String(import.meta.env.VITE_ORCAMENTO_API_BASE || "").replace(/\/$/, "");
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  FileDown,
  FileInput,
  FileOutput,
  Fullscreen,
  LayoutDashboard,
  ListFilter,
  Plus,
  Printer,
  Receipt,
  Repeat2,
  Search,
  Settings2,
  SplitSquareHorizontal,
  Tags,
  Users,
} from "lucide-react";

const months = ["01/2026", "02/2026", "03/2026", "04/2026", "05/2026", "06/2026", "07/2026", "08/2026", "09/2026", "10/2026", "11/2026", "12/2026"];
const money = value => Number(value || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL", maximumFractionDigits:0 });
const compactMoney = value => Number(value || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL", notation:"compact", maximumFractionDigits:1 });
const pct = value => `${Number(value || 0).toFixed(1).replace(".", ",")}%`;

const companiesSeed = [
  { id:"2as", name:"2AS Inteligência Financeira", document:"12.345.678/0001-90", plan:"Completo", status:"Ativa", taxRegime:"Simples Nacional", modules:["operacao", "orcamento", "relatorios", "cadastros", "integracao"] },
  { id:"orcamento", name:"Cliente Orçamento", document:"22.111.333/0001-44", plan:"Orçamento", status:"Implantação", taxRegime:"Lucro Presumido", modules:["orcamento", "relatorios", "cadastros", "integracao"] },
];

const accountsSeed = [
  { id:"itau", group:"Bancos", name:"Itaú Principal", balance:826500 },
  { id:"c6", group:"Bancos", name:"C6 Reserva", balance:214000 },
  { id:"cartao", group:"Cartão de crédito", name:"Cartão Corporativo", balance:-62300 },
  { id:"recebiveis", group:"Recebíveis", name:"Agenda de recebíveis", balance:388000 },
];

const categoriesSeed = [
  { id:"receita", group:"Receitas", code:"1.01", name:"Receita de vendas", kind:"Receita" },
  { id:"gateway", group:"Deduções", code:"2.01", name:"Taxas e gateways", kind:"Dedução" },
  { id:"tributos", group:"Deduções", code:"2.02", name:"Tributos sobre receita", kind:"Automático" },
  { id:"professores", group:"Custos", code:"3.01", name:"Professores e produção", kind:"Custo" },
  { id:"marketing", group:"OPEX", code:"4.01", name:"Marketing e vendas", kind:"Despesa" },
  { id:"pessoas", group:"OPEX", code:"4.02", name:"Pessoas", kind:"Despesa" },
  { id:"tecnologia", group:"OPEX", code:"4.03", name:"Ferramentas e tecnologia", kind:"Despesa" },
  { id:"financeiro", group:"FINEX", code:"5.01", name:"Despesas financeiras", kind:"Despesa" },
  { id:"capex", group:"CAPEX", code:"6.01", name:"Investimentos", kind:"CAPEX" },
];

const centersSeed = [
  { id:"receita", name:"Receita", manager:"Comercial" },
  { id:"produto", name:"Produto e Ensino", manager:"Operação" },
  { id:"growth", name:"Growth", manager:"Marketing" },
  { id:"ops", name:"Gente e Operações", manager:"Administração" },
];

const budgetSeed = [
  { id:"b1", centerId:"receita", categoryId:"receita", line:"Assinaturas", driver:"Receita", automatic:false, values:[540000, 555000, 582000, 610000, 628000, 642000, 654000, 666000, 681000, 697000, 718000, 748000] },
  { id:"b2", centerId:"receita", categoryId:"gateway", line:"Gateway de pagamento", driver:"% Receita", automatic:true, values:[30240, 31080, 32592, 34160, 35168, 35952, 36624, 37296, 38136, 39032, 40208, 41888] },
  { id:"b3", centerId:"receita", categoryId:"tributos", line:"Simples Nacional", driver:"% Receita", automatic:true, values:[43200, 44400, 46560, 48800, 50240, 51360, 52320, 53280, 54480, 55760, 57440, 59840] },
  { id:"b4", centerId:"produto", categoryId:"professores", line:"Professores recorrentes", driver:"Produção", automatic:false, values:[165000, 171000, 178000, 186000, 193000, 202000, 208000, 215000, 224000, 233000, 244000, 258000] },
  { id:"b5", centerId:"growth", categoryId:"marketing", line:"Mídia paga", driver:"Campanha", automatic:false, values:[42000, 45000, 52000, 56000, 62000, 65000, 69000, 72000, 76000, 80000, 90000, 98000] },
  { id:"b6", centerId:"ops", categoryId:"pessoas", line:"Folha Operações", driver:"CLT/PJ", automatic:false, values:[82000, 82000, 84000, 84000, 86000, 86000, 88000, 88000, 90000, 90000, 93000, 93000] },
  { id:"b7", centerId:"ops", categoryId:"tecnologia", line:"Codex", driver:"Assinatura", automatic:false, values:[3200, 3200, 3200, 3200, 3600, 3600, 3600, 3600, 3800, 3800, 3800, 3800] },
];

const entriesSeed = [
  { id:"e1", type:"gain", status:"recebido", date:"2026-05-10", dueDate:"2026-05-10", competence:"2026-05", account:"Itaú Principal", contact:"Assinaturas B2C", categoryId:"receita", centerId:"receita", amount:628000, payment:"Cartão", document:"NF 9001", origin:"Manual", recurrence:"Único", installments:"1/1", tags:["receita", "cartão"], attachments:1, reviewed:true, reconciled:true, notes:"Receita consolidada do gateway.", allocation:[{ categoryId:"receita", centerId:"receita", percent:100, amount:628000 }] },
  { id:"e2", type:"expense", status:"a_pagar", date:"2026-05-18", dueDate:"2026-05-18", competence:"2026-05", account:"Cartão Corporativo", contact:"OpenAI", categoryId:"tecnologia", centerId:"ops", amount:-3600, payment:"Cartão", document:"INV-0526", origin:"Manual", recurrence:"Mensal", installments:"1/12", tags:["software"], attachments:1, reviewed:false, reconciled:false, notes:"Assinatura operacional.", allocation:[{ categoryId:"tecnologia", centerId:"ops", percent:100, amount:3600 }] },
  { id:"e3", type:"expense", status:"aprovar", date:"2026-05-22", dueDate:"2026-05-22", competence:"2026-05", account:"Itaú Principal", contact:"BCJ Agência", categoryId:"marketing", centerId:"growth", amount:-56000, payment:"Boleto", document:"BOL-171", origin:"Importado", recurrence:"Único", installments:"1/1", tags:["campanha"], attachments:2, reviewed:false, reconciled:false, notes:"Campanha de aquisição.", allocation:[{ categoryId:"marketing", centerId:"growth", percent:80, amount:44800 }, { categoryId:"marketing", centerId:"receita", percent:20, amount:11200 }] },
  { id:"e4", type:"expense", status:"pago", date:"2026-05-30", dueDate:"2026-05-30", competence:"2026-05", account:"Itaú Principal", contact:"Professores", categoryId:"professores", centerId:"produto", amount:-193000, payment:"PIX", document:"REC-77", origin:"Recorrente", recurrence:"Mensal", installments:"5/12", tags:["produção"], attachments:3, reviewed:true, reconciled:true, notes:"Folha de professores.", allocation:[{ categoryId:"professores", centerId:"produto", percent:100, amount:193000 }] },
  { id:"e5", type:"transfer", status:"transferido", date:"2026-05-31", dueDate:"2026-05-31", competence:"2026-05", account:"Itaú Principal -> C6 Reserva", contact:"Entre contas", categoryId:"financeiro", centerId:"ops", amount:75000, payment:"TED", document:"TRF-21", origin:"Manual", recurrence:"Único", installments:"1/1", tags:["reserva"], attachments:0, reviewed:true, reconciled:true, notes:"Reforço de reserva.", allocation:[{ categoryId:"financeiro", centerId:"ops", percent:100, amount:75000 }] },
];

const contactsSeed = {
  clientes:["Assinaturas B2C", "Projeto consultivo", "Cursos avulsos", "B2B Educação"],
  fornecedores:["OpenAI", "BCJ Agência", "Professores", "AWS", "Contabilidade 2AS"],
};

const statusLabel = {
  recebido:"Recebido",
  a_receber:"A receber",
  pago:"Pago",
  a_pagar:"A pagar",
  aprovar:"Aprovar",
  transferido:"Transferido",
};

function lineTotal(line) {
  return line.values.reduce((acc, value) => acc + value, 0);
}

function categoryOf(categories, id) {
  return categories.find(category => category.id === id);
}

function centerOf(centers, id) {
  return centers.find(center => center.id === id);
}

function IconButton({ icon, children, active = false, onClick, tone = "" }) {
  const ButtonIcon = icon;
  return <button className={`${active ? "btn primary" : "btn"} ${tone}`} onClick={onClick} type="button"><ButtonIcon size={15} /> {children}</button>;
}

function TopMenu({ page, setPage }) {
  const items = [
    ["overview", "VISÃO GERAL"],
    ["entries", "LANÇAMENTOS"],
    ["reports", "RELATÓRIOS"],
    ["budget", "ORÇAMENTO"],
    ["clients", "CLIENTES"],
    ["suppliers", "FORNECEDORES"],
  ];
  return (
    <nav className="top-menu">
      {items.map(([id, label]) => (
        <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)} type="button">{label}</button>
      ))}
    </nav>
  );
}

function Header({ company, companies, setCompany, page, setPage, setModal }) {
  return (
    <header className="app-header">
      <div className="header-main">
        <button className="brand-mark" onClick={() => setPage("admin")} type="button">
          <span>2</span>AS
          <small>INTELIGÊNCIA FINANCEIRA</small>
        </button>
        <TopMenu page={page} setPage={setPage} />
        <div className="header-actions">
          <select value={company.id} onChange={event => setCompany(companies.find(item => item.id === event.target.value))}>
            {companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="link-btn" onClick={() => setPage("settings")} type="button">CONFIGURAÇÕES</button>
          <button className="link-btn" type="button">AJUDA</button>
        </div>
      </div>
      <div className="quickbar">
        <IconButton icon={FileOutput} tone="danger" onClick={() => setModal("expense")}>REGISTRAR GASTO</IconButton>
        <IconButton icon={FileInput} tone="success" onClick={() => setModal("gain")}>REGISTRAR GANHO</IconButton>
        <IconButton icon={ArrowLeftRight} tone="info" onClick={() => setModal("transfer")}>REGISTRAR TRANSFERÊNCIA</IconButton>
        <IconButton icon={Database}>IMPORTAR REGISTROS</IconButton>
        <IconButton icon={CheckCircle2}>CONCILIAÇÃO</IconButton>
      </div>
    </header>
  );
}

function Dashboard({ accounts, entries, budget, categories, centers }) {
  const receivable = entries.filter(entry => entry.amount > 0 && entry.status !== "recebido").reduce((acc, entry) => acc + entry.amount, 0);
  const payable = Math.abs(entries.filter(entry => entry.amount < 0 && entry.status !== "pago").reduce((acc, entry) => acc + entry.amount, 0));
  const balance = accounts.reduce((acc, account) => acc + account.balance, 0);
  const revenueMay = entries.filter(entry => entry.amount > 0 && entry.competence === "2026-05").reduce((acc, entry) => acc + entry.amount, 0);
  const expenseMay = Math.abs(entries.filter(entry => entry.amount < 0 && entry.competence === "2026-05").reduce((acc, entry) => acc + entry.amount, 0));
  const plannedRevenue = budget.filter(line => categoryOf(categories, line.categoryId)?.kind === "Receita").reduce((acc, line) => acc + line.values[4], 0);
  const plannedExpenses = budget.filter(line => categoryOf(categories, line.categoryId)?.kind !== "Receita").reduce((acc, line) => acc + line.values[4], 0);

  return (
    <main className="page">
      <PageTitle title="Visão geral" subtitle="Saldos, pendências, resultado previsto e leitura por categoria." />
      <div className="dashboard-layout">
        <Panel title="Saldos" action={`${accounts.length} contas`}>
          <GroupedList
            rows={accounts.map(account => ({ group:account.group, name:account.name, value:money(account.balance), negative:account.balance < 0 }))}
          />
          <div className="panel-total"><span>Total</span><strong>{money(balance)}</strong></div>
        </Panel>
        <Panel title="Contas a pagar" action={money(payable)}>
          <EntryMiniList entries={entries.filter(entry => entry.amount < 0 && entry.status !== "pago")} categories={categories} action="Pagar" />
        </Panel>
        <Panel title="Contas a receber" action={money(receivable)}>
          <EntryMiniList entries={entries.filter(entry => entry.amount > 0 && entry.status !== "recebido")} categories={categories} action="Receber" />
        </Panel>
        <Panel title="Resumo financeiro de Maio" action="Caixa">
          <SummaryRows rows={[
            ["Saldo atual das contas", money(balance)],
            ["Total de contas a pagar", money(payable)],
            ["Total de contas a receber", money(receivable)],
            ["Resultado previsto", money(balance + receivable - payable)],
          ]} />
        </Panel>
        <Panel title="Planejamento financeiro de Maio" action="Orçamento">
          <SummaryRows rows={[
            ["Receita prevista", money(plannedRevenue)],
            ["Receita realizada", money(revenueMay)],
            ["Despesas previstas", money(plannedExpenses)],
            ["Despesas realizadas", money(expenseMay)],
          ]} />
          <Progress label="Receita" value={(revenueMay / plannedRevenue) * 100} />
          <Progress label="Despesas" value={(expenseMay / plannedExpenses) * 100} warn />
        </Panel>
        <Panel title="Despesas por categoria de Maio" action="Analítico">
          <GroupedList
            rows={categories.filter(category => category.kind !== "Receita").map(category => {
              const total = Math.abs(entries.filter(entry => entry.categoryId === category.id).reduce((acc, entry) => acc + Math.min(entry.amount, 0), 0));
              return { group:category.group, name:category.name, value:money(total) };
            }).filter(row => row.value !== money(0))}
          />
        </Panel>
        <Panel title="Últimos lançamentos" action="Ver todos" wide>
          <DataTable
            columns={["Data", "Categoria", "Descrição", "Centro", "Valor"]}
            rows={entries.map(entry => [
              entry.date,
              categoryOf(categories, entry.categoryId)?.name,
              entry.contact,
              centerOf(centers, entry.centerId)?.name,
              <strong key={entry.id} className={entry.amount < 0 ? "negative" : "positive"}>{money(entry.amount)}</strong>,
            ])}
          />
        </Panel>
      </div>
    </main>
  );
}

function EntriesPage({ entries, setEntries, categories, centers, setModal }) {
  const [status, setStatus] = useState("todos");
  const [mode, setMode] = useState("Caixa");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const [openActionId, setOpenActionId] = useState(null);
  const filtered = entries.filter(entry => {
    const statusOk = status === "todos" || entry.status === status;
    const typeOk = typeFilter === "todos" || entry.type === typeFilter;
    return statusOk && typeOk;
  });
  const balanceBefore = -3811840.6;
  const rowsWithBalance = filtered.reduce((acc, entry) => {
    const previous = acc.length ? acc[acc.length - 1].balance : balanceBefore;
    return [...acc, { ...entry, balance:previous + entry.amount }];
  }, []);
  const totals = {
    openPayable:Math.abs(entries.filter(entry => ["a_pagar", "aprovar"].includes(entry.status)).reduce((acc, entry) => acc + Math.min(entry.amount, 0), 0)),
    openReceivable:entries.filter(entry => entry.status === "a_receber").reduce((acc, entry) => acc + Math.max(entry.amount, 0), 0),
    paid:Math.abs(entries.filter(entry => ["pago", "recebido"].includes(entry.status)).reduce((acc, entry) => acc + entry.amount, 0)),
    review:entries.filter(entry => !entry.reviewed).length,
  };
  const periodGain = filtered.filter(entry => entry.amount > 0 && entry.type !== "transfer").reduce((acc, entry) => acc + entry.amount, 0);
  const periodExpense = filtered.filter(entry => entry.amount < 0).reduce((acc, entry) => acc + entry.amount, 0);
  const periodResult = periodGain + periodExpense;
  const duplicateEntry = entry => {
    setEntries(prev => [{ ...entry, id:`e-${Date.now()}`, status:entry.type === "gain" ? "a_receber" : entry.type === "expense" ? "a_pagar" : "transferido", reviewed:false, reconciled:false, document:`${entry.document}-CÓPIA` }, ...prev]);
    setOpenActionId(null);
  };
  const deleteEntry = entry => {
    setEntries(prev => prev.filter(item => item.id !== entry.id));
    setOpenActionId(null);
  };
  const rowActionLabel = entry => {
    if (["pago", "recebido", "transferido"].includes(entry.status)) return "Recibo";
    if (entry.type === "gain") return "Receber";
    if (entry.type === "transfer") return "Transferir";
    return "Pagar";
  };

  return (
    <main className="page">
      <PageTitle title="Lançamentos" subtitle="Base transacional do sistema: receitas, despesas, agendamentos, baixas, recorrências e transferências." />
      <div className="page-toolbar">
        <IconButton icon={FileOutput} tone="danger" onClick={() => setModal("expense")}>REGISTRAR GASTO</IconButton>
        <IconButton icon={FileInput} tone="success" onClick={() => setModal("gain")}>REGISTRAR GANHO</IconButton>
        <IconButton icon={ArrowLeftRight} tone="info" onClick={() => setModal("transfer")}>REGISTRAR TRANSFERÊNCIA</IconButton>
        <IconButton icon={Database}>IMPORTAR REGISTROS</IconButton>
        <IconButton icon={CheckCircle2}>CONCILIAÇÃO</IconButton>
      </div>
      <Panel>
        <div className="granatum-tabs">
          <button className="filter-tab" type="button">Meus filtros</button>
          <button className="filter-tab active" type="button">Todos</button>
          <span className="locked-link">Bloquear lançamentos</span>
        </div>
        <div className="cashline">
          <div className="segmented">
            {["Caixa", "Competência"].map(item => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)} type="button">{item}</button>)}
          </div>
          <div className="date-switch">
            <button type="button">‹</button>
            <strong>11/05/2026</strong>
            <button type="button">›</button>
          </div>
          <div className="period-switch">
            {["Dia", "Semana", "Mês", "Ano", "Hoje"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item} type="button">{item}</button>)}
          </div>
          <select defaultValue="Todas as contas"><option>Todas as contas</option><option>Itaú Principal</option><option>Cartão Corporativo</option></select>
          <select defaultValue="Todos os centros"><option>Todos os centros de custo</option>{centers.map(center => <option key={center.id}>{center.name}</option>)}</select>
          <button className="btn"><ListFilter size={15} /> Mais filtros</button>
          <button className="btn icon-only"><Search size={15} /></button>
        </div>
        <div className="bulkbar">
          <button type="button">Selecionar todos</button>
          <button type="button">Pagar/Receber</button>
          <button type="button">Transferir</button>
          <button type="button">Editar</button>
          <button type="button">Excluir</button>
          <span />
          <button type="button">Exportar</button>
          <button type="button">Imprimir</button>
        </div>
        <div className="entry-tabs compact">
            {[
              ["todos", "Todos"],
              ["expense", "Gastos"],
              ["gain", "Ganhos"],
              ["transfer", "Transferências"],
            ].map(([id, label]) => <button key={id} className={typeFilter === id ? "active" : ""} onClick={() => setTypeFilter(id)} type="button">{label}</button>)}
          <select value={status} onChange={event => setStatus(event.target.value)}>
            <option value="todos">Todos os status</option>
            {Object.entries(statusLabel).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div className="entry-kpis compact">
          <Metric label="A pagar / aprovar" value={money(totals.openPayable)} />
          <Metric label="A receber" value={money(totals.openReceivable)} />
          <Metric label="Baixados" value={money(totals.paid)} positive />
          <Metric label="Pendentes de revisão" value={String(totals.review)} />
        </div>
        <div className="ledger-table granatum-like">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>C. Custo/Lucro</th>
                <th>Cliente/Fornecedor</th>
                <th></th>
                <th>Valor</th>
                <th>Saldo</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="previous-balance">
                <td></td>
                <td colSpan={7}>Saldo anterior a 11 de Maio de 2026</td>
                <td>{money(balanceBefore)}</td>
                <td></td>
                <td></td>
              </tr>
              {rowsWithBalance.map(entry => (
                <tr key={entry.id} className={selectedId === entry.id ? "selected-row" : ""} onClick={() => setSelectedId(entry.id)}>
                  <td><input type="checkbox" /></td>
                  <td><strong>{entry.dueDate.slice(8, 10)} Mai</strong></td>
                  <td><span className={`category-tag tag-${entry.categoryId}`}>{categoryOf(categories, entry.categoryId)?.name}</span></td>
                  <td>
                    <a>{entry.contact}</a>
                    <small>{entry.document} · {entry.installments} · {entry.recurrence}</small>
                    <span className={`entry-status status-${entry.status}`}>{statusLabel[entry.status]}</span>
                  </td>
                  <td>{centerOf(centers, entry.centerId)?.name}</td>
                  <td>{entry.contact}</td>
                  <td>{entry.recurrence !== "Único" && <span className="repeat-badge">{entry.recurrence}</span>}</td>
                  <td><strong className={entry.amount < 0 ? "negative" : "positive"}>{money(entry.amount)}</strong></td>
                  <td>{selectedId === entry.id ? money(entry.balance) : ""}</td>
                  <td>
                    <button className="row-action" onClick={event => {
                      event.stopPropagation();
                      if (["pago", "recebido", "transferido"].includes(entry.status)) setModal({ mode:"receipt", entryId:entry.id });
                      else setModal({ mode:"settle", entryId:entry.id });
                    }} type="button">{rowActionLabel(entry)}</button>
                  </td>
                  <td className="row-menu-cell">
                    <button className="row-menu" onClick={event => {
                      event.stopPropagation();
                      setOpenActionId(openActionId === entry.id ? null : entry.id);
                    }} type="button">⋮</button>
                    {openActionId === entry.id && (
                      <div className="row-actions-menu">
                        <button onClick={event => { event.stopPropagation(); setModal({ mode:"edit", entryId:entry.id }); setOpenActionId(null); }} type="button">Editar lançamento</button>
                        {!["pago", "recebido", "transferido"].includes(entry.status) && <button onClick={event => { event.stopPropagation(); setModal({ mode:"settle", entryId:entry.id }); setOpenActionId(null); }} type="button">{entry.type === "gain" ? "Receber lançamento" : entry.type === "transfer" ? "Transferir lançamento" : "Pagar lançamento"}</button>}
                        <button onClick={event => { event.stopPropagation(); setModal({ mode:"receipt", entryId:entry.id }); setOpenActionId(null); }} type="button">Recibo</button>
                        <button onClick={event => { event.stopPropagation(); duplicateEntry(entry); }} type="button">Duplicar lançamento</button>
                        <button className="danger-action" onClick={event => { event.stopPropagation(); deleteEntry(entry); }} type="button">Excluir lançamento</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="period-summary">
          <div><span>Resumo do período</span></div>
          <div><span>Total de ganhos</span><strong className="positive">{money(periodGain)}</strong></div>
          <div><span>Total de gastos</span><strong className="negative">{money(periodExpense)}</strong></div>
          <div><span>Resultado do período</span><strong className={periodResult < 0 ? "negative" : "positive"}>{money(periodResult)}</strong></div>
          <div><span>Saldo previsto em 11 de Maio de 2026</span><strong>{money(balanceBefore + periodResult)}</strong></div>
        </div>
      </Panel>
      <div className="entry-schema-note">
        <strong>Campos que viram banco:</strong> empresa, tipo, status, vencimento, baixa, competência, categoria, centro, contato, conta, forma de pagamento, recorrência, parcela, valor, saldo calculado, anexos, origem, revisão e conciliação.
      </div>
    </main>
  );
}

function BudgetPage({ budget, setBudget, categories, centers, company }) {
  const [view, setView] = useState("Agrupar por mês");
  const revenue = budget.filter(line => categoryOf(categories, line.categoryId)?.kind === "Receita").reduce((acc, line) => acc + lineTotal(line), 0);
  const expenses = budget.filter(line => categoryOf(categories, line.categoryId)?.kind !== "Receita").reduce((acc, line) => acc + lineTotal(line), 0);

  const updateValue = (lineId, index, value) => {
    setBudget(prev => prev.map(line => line.id === lineId ? { ...line, values:line.values.map((item, valueIndex) => valueIndex === index ? Number(value) || 0 : item) } : line));
  };

  const addLine = centerId => {
    setBudget(prev => [...prev, { id:`b${prev.length + 1}`, centerId, categoryId:centerId === "receita" ? "receita" : "tecnologia", line:"Nova linha", driver:"Manual", automatic:false, values:months.map(() => 0) }]);
  };

  return (
    <main className="page">
      <PageTitle title="Orçamento" subtitle="Orçamento anual com previsto, realizado e diferença por mês, categoria e centro." />
      <div className="page-toolbar">
        <IconButton icon={Plus}>CRIAR ORÇAMENTO</IconButton>
        <select defaultValue="2026"><option>2026</option><option>Forecast 2026</option><option>Base 2027</option></select>
        <select defaultValue="Caixa"><option>Caixa</option><option>Competência</option></select>
        <select value={view} onChange={event => setView(event.target.value)}><option>Agrupar por mês</option><option>Trimestral</option><option>Semestral</option><option>Anual</option><option>YTD</option></select>
        <IconButton icon={Fullscreen}>Tela cheia</IconButton>
        <IconButton icon={FileDown}>Exportar CSV</IconButton>
        <IconButton icon={Printer}>Imprimir</IconButton>
      </div>
      <div className="metrics-row">
        <Metric label="Receita orçada" value={money(revenue)} />
        <Metric label="Despesas orçadas" value={money(expenses)} />
        <Metric label="Saldo final previsto" value={money(revenue - expenses)} positive />
        <Metric label="Regime tributário" value={company.taxRegime} />
      </div>
      <Panel>
        <div className="budget-board">
          {centers.map(center => {
            const lines = budget.filter(line => line.centerId === center.id);
            return (
              <section className="budget-group" key={center.id}>
                <div className="budget-group-head">
                  <div><strong>{center.name}</strong><span>{center.manager}</span></div>
                  <button className="btn" onClick={() => addLine(center.id)} type="button"><Plus size={15} /> Linha</button>
                </div>
                <table className="budget-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Linha</th>
                      <th>Driver</th>
                      {months.map(month => <th key={month}>{month}</th>)}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => (
                      <tr key={line.id} className={line.automatic ? "auto-row" : ""}>
                        <td>
                          <select value={line.categoryId} onChange={event => setBudget(prev => prev.map(item => item.id === line.id ? { ...item, categoryId:event.target.value } : item))}>
                            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                          </select>
                          <small>{categoryOf(categories, line.categoryId)?.group}</small>
                        </td>
                        <td><input value={line.line} onChange={event => setBudget(prev => prev.map(item => item.id === line.id ? { ...item, line:event.target.value } : item))} /></td>
                        <td><span className={line.automatic ? "pill amber" : "pill"}>{line.driver}</span></td>
                        {line.values.map((value, index) => (
                          <td key={`${line.id}-${months[index]}`}>
                            <div className="triple-cell">
                              <input disabled={line.automatic} value={value} onChange={event => updateValue(line.id, index, event.target.value)} />
                              <small>Real. {compactMoney(value * .92)}</small>
                              <small>Dif. {compactMoney(value * -.08)}</small>
                            </div>
                          </td>
                        ))}
                        <td className="total">{money(lineTotal(line))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}

function ReportsPage({ budget, categories }) {
  const receita = budget.filter(line => categoryOf(categories, line.categoryId)?.kind === "Receita").reduce((acc, line) => acc + lineTotal(line), 0);
  const deducoes = budget.filter(line => ["gateway", "tributos"].includes(line.categoryId)).reduce((acc, line) => acc + lineTotal(line), 0);
  const custos = budget.filter(line => categoryOf(categories, line.categoryId)?.kind === "Custo").reduce((acc, line) => acc + lineTotal(line), 0);
  const opex = budget.filter(line => categoryOf(categories, line.categoryId)?.group === "OPEX").reduce((acc, line) => acc + lineTotal(line), 0);
  const receitaLiquida = receita - deducoes;
  const lucroBruto = receitaLiquida - custos;
  const ebitda = lucroBruto - opex;

  return (
    <main className="page">
      <PageTitle title="Relatórios" subtitle="Fluxo de caixa, categorias, centros de custo/lucro, analítico e DRE." />
      <div className="report-tabs">
        {["Fluxo de Caixa / Competência", "Lançamentos por Categoria", "Centros de Custo/Lucro", "Receitas x Despesas", "Relatório Analítico", "DRE"].map(item => <button key={item} type="button">{item}</button>)}
      </div>
      <div className="metrics-row">
        <Metric label="Margem bruta" value={pct((lucroBruto / receitaLiquida) * 100)} />
        <Metric label="Margem EBITDA" value={pct((ebitda / receitaLiquida) * 100)} />
        <Metric label="Margem líquida" value={pct((ebitda / receitaLiquida) * 100)} />
        <Metric label="Resultado" value={money(ebitda)} positive />
      </div>
      <Panel title="DRE sintética" action="Forecast 2026">
        <DataTable
          columns={["Conta", "Valor", "% Receita líquida"]}
          rows={[
            ["Receita bruta", money(receita), pct((receita / receitaLiquida) * 100)],
            ["(-) Deduções e tributos", money(-deducoes), pct((-deducoes / receitaLiquida) * 100)],
            ["Receita líquida", money(receitaLiquida), "100,0%"],
            ["(-) Custos", money(-custos), pct((-custos / receitaLiquida) * 100)],
            ["Lucro bruto", money(lucroBruto), pct((lucroBruto / receitaLiquida) * 100)],
            ["(-) OPEX", money(-opex), pct((-opex / receitaLiquida) * 100)],
            ["EBITDA", money(ebitda), pct((ebitda / receitaLiquida) * 100)],
            ["Lucro líquido", money(ebitda), pct((ebitda / receitaLiquida) * 100)],
          ]}
        />
      </Panel>
    </main>
  );
}

function RegistryPage({ title, type, categories, setCategories, centers, setCenters, contacts }) {
  if (type === "clients" || type === "suppliers") {
    const rows = contacts[type === "clients" ? "clientes" : "fornecedores"].map((name, index) => [name, index % 2 ? "Ativo" : "Em implantação", "Sem pendências"]);
    return <main className="page"><PageTitle title={title} subtitle="Cadastro usado nos lançamentos, cobranças e relatórios." /><Panel><DataTable columns={["Nome", "Status", "Observação"]} rows={rows} /></Panel></main>;
  }

  return (
    <main className="page">
      <PageTitle title="Configurações" subtitle="Categorias, contas, centros de custo/lucro, formas de pagamento, tags e documentos." />
      <div className="settings-grid">
        <Panel title="Categorias">
          <DataTable
            columns={["Código", "Nome", "Grupo", "Tipo"]}
            rows={categories.map(category => [
              category.code,
              <input key={`${category.id}-name`} value={category.name} onChange={event => setCategories(prev => prev.map(item => item.id === category.id ? { ...item, name:event.target.value } : item))} />,
              category.group,
              category.kind,
            ])}
          />
          <button className="btn add-line" onClick={() => setCategories(prev => [...prev, { id:`cat-${prev.length + 1}`, group:"OPEX", code:`9.${prev.length + 1}`, name:"Nova categoria", kind:"Despesa" }])} type="button"><Plus size={15} /> Nova categoria</button>
        </Panel>
        <Panel title="Centros de Custo/Lucro">
          <DataTable
            columns={["Centro", "Responsável"]}
            rows={centers.map(center => [
              <input key={`${center.id}-name`} value={center.name} onChange={event => setCenters(prev => prev.map(item => item.id === center.id ? { ...item, name:event.target.value } : item))} />,
              center.manager,
            ])}
          />
          <button className="btn add-line" onClick={() => setCenters(prev => [...prev, { id:`center-${prev.length + 1}`, name:"Novo centro", manager:"Responsável" }])} type="button"><Plus size={15} /> Novo centro</button>
        </Panel>
      </div>
    </main>
  );
}

function AdminPage({ companies, setCompanies, company, setCompany }) {
  const toggleModule = (companyId, module) => {
    setCompanies(prev => prev.map(item => {
      if (item.id !== companyId) return item;
      const modules = item.modules.includes(module) ? item.modules.filter(active => active !== module) : [...item.modules, module];
      const updated = { ...item, modules };
      if (company.id === item.id) setCompany(updated);
      return updated;
    }));
  };

  return (
    <main className="page">
      <PageTitle title="Administração 2AS" subtitle="Visão do criador do produto: empresas, planos, módulos liberados e integração com inteligência." />
      <div className="admin-grid">
        {companies.map(item => (
          <Panel key={item.id} title={item.name} action={item.plan}>
            <SummaryRows rows={[["CNPJ", item.document], ["Status", item.status], ["Regime", item.taxRegime]]} />
            <div className="module-chips">
              {["operacao", "orcamento", "relatorios", "cadastros", "integracao"].map(module => (
                <button key={module} className={item.modules.includes(module) ? "chip on" : "chip"} onClick={() => toggleModule(item.id, module)} type="button">{module}</button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </main>
  );
}

function IntegrationPage() {
  const base = ORCAMENTO_API_BASE;
  const rows = [
    ["GET", "/api/v1/companies", "empresas, plano e módulos"],
    ["GET", "/api/v1/accounts", "contas, saldos e grupos"],
    ["GET", "/api/v1/entries", "lançamentos revisados"],
    ["GET", "/api/v1/budgets", "orçamento, realizado e diferença"],
    ["GET", "/api/v1/dre", "DRE sintética e analítica"],
    ["POST", "/api/v1/webhooks/intelligence-sync", "notificação de atualização"],
  ];
  return (
    <main className="page">
      <PageTitle title="Integração" subtitle="Contrato de API entre o módulo de orçamento 2AS e o Painel de Inteligência Financeira." />
      {base && (
        <Panel title="Ambiente configurado" action="VITE_ORCAMENTO_API_BASE">
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>Prefixo atual: <code>{base}</code></p>
        </Panel>
      )}
      <Panel title="Endpoints MVP" action="Read API">
        <div className="endpoint-grid">
          {rows.map(([method, path, desc]) => (
            <div className="endpoint" key={path}><b>{method}</b><code>{base ? `${base}${path}` : path}</code><span>{desc}</span></div>
          ))}
        </div>
      </Panel>
    </main>
  );
}

function EntryModal({ type, onClose, onSave, categories, centers }) {
  const mode = typeof type === "object" ? type.mode : "create";
  const sourceEntry = typeof type === "object" ? type.entry : null;
  const normalizedType = sourceEntry?.type || type;
  const modalType = sourceEntry?.type || normalizedType;
  const isTransfer = normalizedType === "transfer";
  const [draft, setDraft] = useState({
    status:sourceEntry?.status || (isTransfer ? "transferido" : modalType === "expense" ? "a_pagar" : "a_receber"),
    account:sourceEntry?.account || (isTransfer ? "Itaú Principal -> C6 Reserva" : "Itaú Principal"),
    date:sourceEntry?.date || "2026-05-31",
    dueDate:sourceEntry?.dueDate || "2026-05-31",
    competence:sourceEntry?.competence || "2026-05",
    contact:sourceEntry?.contact || (isTransfer ? "Entre contas" : modalType === "expense" ? "Novo fornecedor" : "Novo cliente"),
    categoryId:sourceEntry?.categoryId || (modalType === "expense" ? "tecnologia" : "receita"),
    centerId:sourceEntry?.centerId || (modalType === "expense" ? "ops" : "receita"),
    amount:Math.abs(sourceEntry?.amount || 1000),
    payment:sourceEntry?.payment || "PIX",
    document:sourceEntry?.document || "",
    recurrence:sourceEntry?.recurrence || "Único",
    installments:sourceEntry?.installments || "1/1",
    origin:sourceEntry?.origin || "Manual",
    notes:sourceEntry?.notes || "",
    attachments:sourceEntry?.attachments || 0,
    reconciled:sourceEntry?.reconciled || false,
    reviewed:sourceEntry?.reviewed || false,
  });

  const title = mode === "receipt"
    ? "Recibo do lançamento"
    : mode === "settle"
      ? sourceEntry?.type === "gain" ? "Receber lançamento" : sourceEntry?.type === "transfer" ? "Transferir lançamento" : "Pagar lançamento"
      : mode === "edit"
        ? "Editar lançamento"
        : isTransfer ? "Registrar transferência" : modalType === "expense" ? "Registrar gasto" : "Registrar ganho";
  const statusOptions = isTransfer ? ["transferido"] : modalType === "expense" ? ["pago", "a_pagar", "aprovar"] : ["recebido", "a_receber"];
  const settledStatus = modalType === "gain" ? "recebido" : modalType === "transfer" ? "transferido" : "pago";

  const save = () => {
    const sign = modalType === "expense" ? -1 : 1;
    onSave({
      id:sourceEntry?.id || `e-${Date.now()}`,
      type:isTransfer ? "transfer" : modalType === "expense" ? "expense" : "gain",
      ...draft,
      status:mode === "settle" ? settledStatus : draft.status,
      amount:isTransfer ? Number(draft.amount) : sign * Math.abs(Number(draft.amount) || 0),
      tags:sourceEntry?.tags || [],
      attachments:draft.attachments,
      reconciled:mode === "settle" ? true : draft.reconciled,
      reviewed:mode === "settle" ? true : draft.reviewed,
      origin:mode === "settle" && draft.origin === "Manual" ? "Baixado manualmente" : draft.origin,
      allocation:[{ categoryId:draft.categoryId, centerId:draft.centerId, percent:100, amount:Math.abs(Number(draft.amount) || 0) }],
    });
  };

  const readOnly = mode === "receipt";

  return (
    <div className="modal-backdrop">
      <section className={`modal ${mode === "receipt" ? "receipt-modal" : ""}`}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {sourceEntry && <p>{statusLabel[sourceEntry.status]} · {sourceEntry.document} · {sourceEntry.recurrence}</p>}
          </div>
          <button className="link-btn" onClick={onClose} type="button">Voltar sem salvar</button>
        </div>
        {mode === "receipt" && (
          <div className="receipt-sheet">
            <div><span>Descrição</span><strong>{draft.contact}</strong></div>
            <div><span>Valor</span><strong>{money(modalType === "expense" ? -draft.amount : draft.amount)}</strong></div>
            <div><span>Conta</span><strong>{draft.account}</strong></div>
            <div><span>Baixa</span><strong>{draft.dueDate}</strong></div>
            <div><span>Categoria</span><strong>{categories.find(category => category.id === draft.categoryId)?.name}</strong></div>
            <div><span>Centro</span><strong>{centers.find(center => center.id === draft.centerId)?.name}</strong></div>
          </div>
        )}
        <div className="modal-tabs">
          <button className="active" type="button">{mode === "settle" ? "Baixa" : "Dados principais"}</button>
          <button type="button"><SplitSquareHorizontal size={14} /> Rateio</button>
          <button type="button"><Repeat2 size={14} /> Recorrência</button>
          <button type="button"><CalendarDays size={14} /> Histórico</button>
        </div>
        <div className="modal-grid">
          <label>Status<select disabled={readOnly || mode === "settle"} value={mode === "settle" ? settledStatus : draft.status} onChange={event => setDraft(prev => ({ ...prev, status:event.target.value }))}>{statusOptions.map(status => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
          <label>Na conta<input disabled={readOnly} value={draft.account} onChange={event => setDraft(prev => ({ ...prev, account:event.target.value }))} /></label>
          <label>{mode === "settle" ? "Data da baixa" : "Vencimento"}<input disabled={readOnly} value={draft.dueDate} onChange={event => setDraft(prev => ({ ...prev, dueDate:event.target.value, date:event.target.value }))} /></label>
          <label>Competência<input disabled={readOnly} value={draft.competence} onChange={event => setDraft(prev => ({ ...prev, competence:event.target.value }))} /></label>
          <label>Descrição<input disabled={readOnly} value={draft.contact} onChange={event => setDraft(prev => ({ ...prev, contact:event.target.value }))} /></label>
          <label>Valor<input disabled={readOnly} value={draft.amount} onChange={event => setDraft(prev => ({ ...prev, amount:event.target.value }))} /></label>
          {!isTransfer && <label>Categoria<select disabled={readOnly} value={draft.categoryId} onChange={event => setDraft(prev => ({ ...prev, categoryId:event.target.value }))}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
          <label>Centro de custo/lucro<select disabled={readOnly} value={draft.centerId} onChange={event => setDraft(prev => ({ ...prev, centerId:event.target.value }))}>{centers.map(center => <option key={center.id} value={center.id}>{center.name}</option>)}</select></label>
          <label>Forma de pagamento<input disabled={readOnly} value={draft.payment} onChange={event => setDraft(prev => ({ ...prev, payment:event.target.value }))} /></label>
          <label>Número do documento<input disabled={readOnly} value={draft.document} onChange={event => setDraft(prev => ({ ...prev, document:event.target.value }))} /></label>
          <label>Recorrência<select disabled={readOnly || mode === "settle"} value={draft.recurrence} onChange={event => setDraft(prev => ({ ...prev, recurrence:event.target.value }))}><option>Único</option><option>Mensal</option><option>Semanal</option><option>Anual</option></select></label>
          <label>Parcelas<input disabled={readOnly || mode === "settle"} value={draft.installments} onChange={event => setDraft(prev => ({ ...prev, installments:event.target.value }))} /></label>
        </div>
        <div className="allocation-editor">
          <div>
            <strong>Rateio do lançamento</strong>
            <span>Categoria e centro de custo/lucro podem ser divididos antes de alimentar relatórios.</span>
          </div>
          <div className="allocation-row editor">
            <span>{categories.find(category => category.id === draft.categoryId)?.name || "Transferência"}</span>
            <strong>{centers.find(center => center.id === draft.centerId)?.name}</strong>
            <b>100%</b>
            <em>{money(draft.amount)}</em>
          </div>
        </div>
        <div className="modal-notes">
          <label>Observações<textarea disabled={readOnly} value={draft.notes} onChange={event => setDraft(prev => ({ ...prev, notes:event.target.value }))} placeholder="Anotações internas, anexos e identificador externo entram aqui." /></label>
        </div>
        <div className="modal-audit">
          <span>{draft.attachments} anexo(s)</span>
          <span>{mode === "settle" ? "Será conciliado na baixa" : draft.reconciled ? "Conciliado" : "Conciliação pendente"}</span>
          <span>{draft.reviewed ? "Revisado" : "Revisão pendente"}</span>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose} type="button">Cancelar</button>
          {mode !== "receipt" && <button className="btn primary" onClick={save} type="button">{mode === "settle" ? title : "Salvar"}</button>}
          {mode === "create" && <button className="btn primary subtle" onClick={save} type="button">Salvar e adicionar outra</button>}
          {mode === "receipt" && <button className="btn primary" type="button">Imprimir recibo</button>}
        </div>
      </section>
    </div>
  );
}

function PageTitle({ title, subtitle }) {
  return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div></div>;
}

function Panel({ title, action, children, wide = false }) {
  return (
    <section className={wide ? "panel wide" : "panel"}>
      {(title || action) && <div className="panel-head"><h2>{title}</h2>{action && <span>{action}</span>}</div>}
      <div className="panel-body">{children}</div>
    </section>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function GroupedList({ rows }) {
  return <div className="grouped-list">{rows.map((row, index) => <div className="list-row" key={`${row.name}-${index}`}><span>{row.group}</span><strong>{row.name}</strong><b className={row.negative ? "negative" : ""}>{row.value}</b></div>)}</div>;
}

function EntryMiniList({ entries, categories, action }) {
  return <div className="entry-mini">{entries.map(entry => <div className="mini-row" key={entry.id}><span>{entry.date}</span><strong>{entry.contact}<small>{categoryOf(categories, entry.categoryId)?.name}</small></strong><b>{money(Math.abs(entry.amount))}</b><button type="button">{action}</button></div>)}</div>;
}

function SummaryRows({ rows }) {
  return <div className="summary-rows">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function Progress({ label, value, warn = false }) {
  return <div className="progress-line"><div><span>{label}</span><b>{pct(value)}</b></div><em><i className={warn ? "warn" : ""} style={{ width:`${Math.min(value, 100)}%` }} /></em></div>;
}

function Metric({ label, value, positive = false }) {
  return <div className="metric"><span>{label}</span><strong className={positive ? "positive" : ""}>{value}</strong></div>;
}

export default function App() {
  const [companies, setCompanies] = useState(companiesSeed);
  const [company, setCompany] = useState(companiesSeed[0]);
  const [page, setPage] = useState("overview");
  const [accounts] = useState(accountsSeed);
  const [categories, setCategories] = useState(categoriesSeed);
  const [centers, setCenters] = useState(centersSeed);
  const [budget, setBudget] = useState(budgetSeed);
  const [entries, setEntries] = useState(entriesSeed);
  const [modal, setModal] = useState(null);

  const activeModal = modal && typeof modal === "object"
    ? { ...modal, entry:entries.find(entry => entry.id === modal.entryId) }
    : modal;

  const pageNode = useMemo(() => {
    if (page === "overview") return <Dashboard accounts={accounts} entries={entries} budget={budget} categories={categories} centers={centers} />;
    if (page === "entries") return <EntriesPage entries={entries} setEntries={setEntries} categories={categories} centers={centers} setModal={setModal} />;
    if (page === "budget") return <BudgetPage budget={budget} setBudget={setBudget} categories={categories} centers={centers} company={company} />;
    if (page === "reports") return <ReportsPage budget={budget} categories={categories} />;
    if (page === "clients") return <RegistryPage title="Clientes" type="clients" contacts={contactsSeed} />;
    if (page === "suppliers") return <RegistryPage title="Fornecedores" type="suppliers" contacts={contactsSeed} />;
    if (page === "settings") return <RegistryPage type="settings" categories={categories} setCategories={setCategories} centers={centers} setCenters={setCenters} contacts={contactsSeed} />;
    if (page === "admin") return <AdminPage companies={companies} setCompanies={setCompanies} company={company} setCompany={setCompany} />;
    if (page === "integration") return <IntegrationPage />;
    return null;
  }, [accounts, budget, categories, centers, companies, company, entries, page]);

  const saveEntry = entry => {
    setEntries(prev => prev.some(item => item.id === entry.id)
      ? prev.map(item => item.id === entry.id ? entry : item)
      : [entry, ...prev]);
    setModal(null);
  };

  return (
    <div className="granatum-shell">
      <Header company={company} companies={companies} setCompany={setCompany} page={page} setPage={setPage} setModal={setModal} />
      {pageNode}
      <button className="integration-pill" onClick={() => setPage("integration")} type="button"><Tags size={15} /> API para Painel de Inteligência</button>
      {activeModal && <EntryModal type={activeModal} onClose={() => setModal(null)} onSave={saveEntry} categories={categories} centers={centers} />}
    </div>
  );
}
