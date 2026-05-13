import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Download } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const REALIZED_THRU = 5; // índices 0-4 têm realizado (Jan-Mai)

const fmt  = v => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2});
const fmtN = v => Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const cmp  = v => { const n = Number(v||0); if(Math.abs(n)>=1e6) return `R$ ${(n/1e6).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} mi`; if(Math.abs(n)>=1e3) return `R$ ${(n/1e3).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})} mil`; return fmt(n); };
const pct  = (a,b) => !b ? "–" : `${((a/b-1)*100).toFixed(1).replace(".",",")}%`;
const uid  = () => Math.random().toString(36).slice(2,9);
const sumV = v => (v??[]).reduce((a,x)=>a+(+x||0),0);

// ─── Seções fixas ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id:"receitas",          label:"Receitas",          kind:"income"  },
  { id:"despesas_fixas",    label:"Despesas Fixas",    kind:"expense" },
  { id:"despesas_variaveis",label:"Despesas Variáveis",kind:"expense" },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
const SEED_VERSIONS = [
  { id:"v1", year:2026, name:"Base 2026",    status:"active" },
  { id:"v2", year:2026, name:"Revisado Q2",  status:"draft"  },
];

const SEED_AREAS = [
  { id:"a1",  vId:"v1", sId:"receitas",           name:"Faturamento" },
  { id:"a2",  vId:"v1", sId:"despesas_fixas",     name:"Revenue Ops" },
  { id:"a3",  vId:"v1", sId:"despesas_fixas",     name:"Acadêmico" },
  { id:"a4",  vId:"v1", sId:"despesas_fixas",     name:"Tecnologia" },
  { id:"a5",  vId:"v1", sId:"despesas_fixas",     name:"Operações & Financeiro" },
  { id:"a6",  vId:"v1", sId:"despesas_fixas",     name:"Infraestrutura e Desp. Adm." },
  { id:"a7",  vId:"v1", sId:"despesas_fixas",     name:"FINEX" },
  { id:"a8",  vId:"v1", sId:"despesas_variaveis", name:"Revenue Ops Variável" },
  { id:"a9",  vId:"v1", sId:"despesas_variaveis", name:"Acadêmico Variável" },
  { id:"a10", vId:"v1", sId:"despesas_variaveis", name:"FINEX Variável" },
  { id:"a11", vId:"v1", sId:"despesas_variaveis", name:"Devoluções" },
  { id:"a12", vId:"v1", sId:"despesas_variaveis", name:"Tributos" },
];

const SEED_GROUPS = [
  { id:"g1",  aId:"a2", name:"CRO",                    mgr:"" },
  { id:"g2",  aId:"a2", name:"Marketing",               mgr:"" },
  { id:"g3",  aId:"a2", name:"Jornalismo",              mgr:"" },
  { id:"g4",  aId:"a2", name:"Suporte",                 mgr:"" },
  { id:"g5",  aId:"a2", name:"Vendas",                  mgr:"" },
  { id:"g6",  aId:"a2", name:"Ferramentas Rev Ops",     mgr:"" },
  { id:"g7",  aId:"a2", name:"Mídia",                   mgr:"" },
  { id:"g8",  aId:"a2", name:"Diversos Rev Ops",        mgr:"" },
  { id:"g9",  aId:"a3", name:"Pessoas Acadêmico",       mgr:"" },
  { id:"g10", aId:"a3", name:"Professores",             mgr:"" },
  { id:"g11", aId:"a3", name:"Ferramentas Acadêmico",   mgr:"" },
  { id:"g12", aId:"a3", name:"Diversos Acadêmico",      mgr:"" },
  { id:"g13", aId:"a4", name:"CTO",                     mgr:"" },
  { id:"g14", aId:"a4", name:"Pessoas Tecnologia",      mgr:"" },
  { id:"g15", aId:"a4", name:"Ferramentas Tecnologia",  mgr:"" },
  { id:"g16", aId:"a5", name:"Pessoas Op & Fin",        mgr:"" },
  { id:"g17", aId:"a5", name:"Audiovisual",             mgr:"" },
  { id:"g18", aId:"a5", name:"Benefícios",              mgr:"" },
  { id:"g19", aId:"a5", name:"Ferramentas Op & Fin",    mgr:"" },
  { id:"g20", aId:"a6", name:"Estrutura",               mgr:"" },
  { id:"g21", aId:"a6", name:"Serviços Profissionais",  mgr:"" },
  { id:"g22", aId:"a6", name:"Diversos Infra",          mgr:"" },
  { id:"g23", aId:"a7", name:"Bancos",                  mgr:"" },
  { id:"g24", aId:"a8", name:"Suporte Variável",        mgr:"" },
  { id:"g25", aId:"a8", name:"Vendas Variável",         mgr:"" },
  { id:"g26", aId:"a8", name:"Afiliados",               mgr:"" },
  { id:"g27", aId:"a9", name:"Professores Variável",    mgr:"" },
  { id:"g28", aId:"a10",name:"Pagar.me",                mgr:"" },
];

// pt: 'a' = parent é área  |  'g' = parent é grupo
const SEED_LINES = [
  // ── Receitas ──────────────────────────────────────────────────────────────
  { id:"l1",   pid:"a1",  pt:"a", name:"Assinaturas",                    v:[680000,680000,392000,392000,392000,392000,392000,200000,200000,200000,200000,200000] },
  { id:"l2",   pid:"a1",  pt:"a", name:"Cursos",                         v:[300000,300000,192000,192000,192000,192000,192000,120000,120000,120000,120000,120000] },
  { id:"l3",   pid:"a1",  pt:"a", name:"Módulos",                        v:[20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,20000] },
  // ── Revenue Ops ───────────────────────────────────────────────────────────
  { id:"l4",   pid:"g1",  pt:"g", name:"Vinicius Souza",                 v:[28000,28000,28000,28000,28000,10000,10000,10000,10000,10000,10000,10000] },
  { id:"l5",   pid:"g2",  pt:"g", name:"Hugo Rocha (Head Marketing)",    v:[0,0,0,7815,12875,12875,0,0,0,0,0,0] },
  { id:"l6",   pid:"g2",  pt:"g", name:"Matheus Martins (Product Mgr)",  v:[0,0,0,7258,12500,12500,0,0,0,0,0,0] },
  { id:"l7",   pid:"g2",  pt:"g", name:"BCJ Agência (Mídia)",            v:[0,10000,10000,10000,10000,10000,0,0,0,0,0,0] },
  { id:"l8",   pid:"g2",  pt:"g", name:"Tamires (Designer)",             v:[0,0,0,0,5000,0,0,0,0,0,0,0] },
  { id:"l9",   pid:"g2",  pt:"g", name:"Pivotto (Designer Freela)",      v:[0,6000,6000,6000,6000,0,0,0,0,0,0,0] },
  { id:"l10",  pid:"g2",  pt:"g", name:"Jaqueline Schaefer (Social)",    v:[5500,5500,5500,5500,5500,3000,3000,3000,3000,3000,3000,3000] },
  { id:"l11",  pid:"g2",  pt:"g", name:"Victor Manuel (Growth)",         v:[0,3500,3500,3500,3500,3000,3000,3000,3000,3000,3000,3000] },
  { id:"l12",  pid:"g2",  pt:"g", name:"Eduardo Edson (Growth Jr.)",     v:[0,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000] },
  { id:"l13",  pid:"g2",  pt:"g", name:"Vivian Larrat",                  v:[6956,6956,6956,6956,6956,6956,6956,6956,0,0,0,0] },
  { id:"l14",  pid:"g2",  pt:"g", name:"Veronica Cavalcante",            v:[2782,2782,2782,2782,2782,2782,2782,2782,2782,2782,0,0] },
  { id:"l15",  pid:"g2",  pt:"g", name:"Bruno Dantas (Head Growth)",     v:[0,0,7500,7500,0,0,0,0,0,0,0,0] },
  { id:"l16",  pid:"g2",  pt:"g", name:"Gabriel Coppola (Head Mkt)",     v:[2419,15000,15000,15000,0,0,0,0,0,0,0,0] },
  { id:"l17",  pid:"g2",  pt:"g", name:"Tiago Valente (Designer Jr.)",   v:[0,0,7000,0,0,0,0,0,0,0,0,0] },
  { id:"l18",  pid:"g2",  pt:"g", name:"João",                           v:[5564,5564,0,0,0,0,0,0,0,0,0,0] },
  { id:"l19",  pid:"g2",  pt:"g", name:"Serenna Alves",                  v:[10500,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l20",  pid:"g2",  pt:"g", name:"Raiane",                         v:[10444,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l21",  pid:"g2",  pt:"g", name:"William Porto",                  v:[6500,6500,0,0,0,0,0,0,0,0,0,0] },
  { id:"l22",  pid:"g2",  pt:"g", name:"Vitor Netto",                    v:[9484,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l23",  pid:"g2",  pt:"g", name:"Luis Gustavo",                   v:[3500,1750,0,0,0,0,0,0,0,0,0,0] },
  { id:"l24",  pid:"g2",  pt:"g", name:"Andrew",                         v:[3000,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l25",  pid:"g3",  pt:"g", name:"Victor Gammaro",                 v:[16000,16000,16000,9500,9500,5000,5000,5000,5000,5000,5000,5000] },
  { id:"l26",  pid:"g3",  pt:"g", name:"Barbara Macedo",                 v:[2226,2226,2226,2226,2226,2226,0,0,0,0,0,0] },
  { id:"l27",  pid:"g3",  pt:"g", name:"Rebeca Kemilly",                 v:[4173,4173,4173,4173,4173,4173,0,0,0,0,0,0] },
  { id:"l28",  pid:"g3",  pt:"g", name:"João Carlos Santos",             v:[1055,1055,1055,2400,1055,0,0,0,0,0,0,0] },
  { id:"l29",  pid:"g3",  pt:"g", name:"Natalia Pires",                  v:[4173,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l30",  pid:"g3",  pt:"g", name:"Bonificação Natalia",            v:[1000,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l31",  pid:"g4",  pt:"g", name:"Beatriz Reis Froes",             v:[2161,2161,2161,2161,0,0,0,0,0,0,0,0] },
  { id:"l32",  pid:"g4",  pt:"g", name:"Marcos Moreira Junior",          v:[4312,4312,4312,4312,0,0,0,0,0,0,0,0] },
  { id:"l33",  pid:"g4",  pt:"g", name:"Bruna Alves Bezerra",            v:[2161,2161,2161,0,0,0,0,0,0,0,0,0] },
  { id:"l34",  pid:"g5",  pt:"g", name:"Thiago Sampaio",                 v:[0,14000,14000,14000,14000,14000,0,0,0,0,0,0] },
  { id:"l35",  pid:"g5",  pt:"g", name:"Diego Araujo Silva",             v:[2504,2504,2504,2504,2504,2504,0,0,0,0,0,0] },
  { id:"l36",  pid:"g5",  pt:"g", name:"Matheus Alves Ferreira",         v:[0,0,0,3500,3500,3500,3500,3500,3500,3500,3500,3500] },
  { id:"l37",  pid:"g5",  pt:"g", name:"Anyele Araújo Silva",            v:[0,0,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000] },
  { id:"l38",  pid:"g5",  pt:"g", name:"Ana Monteiro",                   v:[0,0,0,3500,3500,3500,0,0,0,0,0,0] },
  { id:"l39",  pid:"g5",  pt:"g", name:"Vitor Gonçalves",                v:[2504,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l40",  pid:"g6",  pt:"g", name:"Insider",                        v:[0,30000,30000,30000,40000,28000,28000,28000,28000,28000,28000,28000] },
  { id:"l41",  pid:"g6",  pt:"g", name:"Anthropic - Direcao OS",         v:[0,0,8000,8000,6000,0,0,0,0,0,0,0] },
  { id:"l42",  pid:"g6",  pt:"g", name:"ADOO",                           v:[1990,1990,1990,2338,2338,0,0,0,0,0,0,0] },
  { id:"l43",  pid:"g6",  pt:"g", name:"Pipedrive (CRM)",                v:[0,2000,2000,2000,2500,250,250,250,250,250,250,250] },
  { id:"l44",  pid:"g6",  pt:"g", name:"Pipedrive VOIP",                 v:[0,0,0,0,700,250,250,250,250,250,250,250] },
  { id:"l45",  pid:"g6",  pt:"g", name:"Timesline AI",                   v:[0,0,0,0,800,250,250,250,250,250,250,250] },
  { id:"l46",  pid:"g6",  pt:"g", name:"Adobe",                          v:[450,450,450,450,0,0,0,0,0,0,0,0] },
  { id:"l47",  pid:"g6",  pt:"g", name:"Framer",                         v:[600,600,600,600,2000,350,350,350,350,350,350,350] },
  { id:"l48",  pid:"g6",  pt:"g", name:"Claude Max (Growth)",            v:[550,550,550,550,1100,1100,1100,1100,1100,1100,1100,1100] },
  { id:"l49",  pid:"g6",  pt:"g", name:"Claude Max (Growth2)",           v:[0,0,0,1100,0,0,0,0,0,0,0,0] },
  { id:"l50",  pid:"g6",  pt:"g", name:"MLabs",                          v:[0,300,300,300,300,300,300,300,300,300,300,300] },
  { id:"l51",  pid:"g6",  pt:"g", name:"Higsfield.AI",                   v:[0,0,300,300,500,500,500,500,500,500,500,500] },
  { id:"l52",  pid:"g6",  pt:"g", name:"Figma",                          v:[0,300,300,300,700,280,280,280,280,280,280,280] },
  { id:"l53",  pid:"g6",  pt:"g", name:"VMix",                           v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l54",  pid:"g6",  pt:"g", name:"Canva",                          v:[135,135,135,135,135,0,0,0,0,0,0,0] },
  { id:"l55",  pid:"g6",  pt:"g", name:"Capcut",                         v:[0,100,100,100,100,0,0,0,0,0,0,0] },
  { id:"l56",  pid:"g6",  pt:"g", name:"Envato",                         v:[0,100,100,100,100,0,0,0,0,0,0,0] },
  { id:"l57",  pid:"g6",  pt:"g", name:"Sendflow",                       v:[0,0,277,277,277,277,277,277,0,0,0,0] },
  { id:"l58",  pid:"g6",  pt:"g", name:"N8N",                            v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l59",  pid:"g6",  pt:"g", name:"Freepik",                        v:[200,200,0,0,500,0,0,0,0,0,0,0] },
  { id:"l60",  pid:"g6",  pt:"g", name:"Gamma App",                      v:[0,0,0,0,300,200,200,200,200,200,200,200] },
  { id:"l61",  pid:"g6",  pt:"g", name:"Bee Free",                       v:[0,0,0,0,150,150,150,150,150,150,150,150] },
  { id:"l62",  pid:"g6",  pt:"g", name:"Claude AI (Blog)",               v:[120,200,200,200,0,0,0,0,0,0,0,0] },
  { id:"l63",  pid:"g6",  pt:"g", name:"Claude AI (Copy)",               v:[120,200,200,200,0,0,0,0,0,0,0,0] },
  { id:"l64",  pid:"g6",  pt:"g", name:"Chat GPT (Mariana)",             v:[340,340,340,340,340,340,340,340,340,340,340,340] },
  { id:"l65",  pid:"g6",  pt:"g", name:"Manychat",                       v:[8000,8000,8000,0,0,0,0,0,0,0,0,0] },
  { id:"l66",  pid:"g6",  pt:"g", name:"Webflow",                        v:[1300,1300,1300,1300,1300,0,0,0,0,0,0,0] },
  { id:"l67",  pid:"g7",  pt:"g", name:"Google Bruto",                   v:[22600,22600,22600,22600,22600,22600,0,0,0,0,0,0] },
  { id:"l68",  pid:"g7",  pt:"g", name:"Google Imposto",                 v:[2938,2938,2938,2938,2938,2938,0,0,0,0,0,0] },
  { id:"l69",  pid:"g7",  pt:"g", name:"Facebook",                       v:[20000,20000,20000,20000,20000,20000,0,0,0,0,0,0] },
  { id:"l70",  pid:"g7",  pt:"g", name:"Facebook Imposto",               v:[2600,2600,2600,2600,2600,2600,0,0,0,0,0,0] },
  { id:"l71",  pid:"g7",  pt:"g", name:"Outras",                         v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l72",  pid:"g8",  pt:"g", name:"Aulas e Eventos",                v:[24000,24000,24000,24000,24000,0,0,0,0,0,0,0] },
  { id:"l73",  pid:"g8",  pt:"g", name:"Consultorias",                   v:[5000,5000,5000,5000,5000,0,0,0,0,0,0,0] },
  // ── Acadêmico ─────────────────────────────────────────────────────────────
  { id:"l74",  pid:"g9",  pt:"g", name:"Helder da Costa Silva",          v:[3798,3798,3798,3798,3798,3798,0,0,0,0,0,0] },
  { id:"l75",  pid:"g9",  pt:"g", name:"Daniel Mota Polatto",            v:[0,0,2100,2100,2100,2100,0,0,0,0,0,0] },
  { id:"l76",  pid:"g9",  pt:"g", name:"Lucas Araujo de Oliveira",       v:[3339,3339,3339,3339,3339,3339,0,0,0,0,0,0] },
  { id:"l77",  pid:"g9",  pt:"g", name:"Mateus de Barcelos Silva",       v:[8956,8956,8956,8956,8956,8956,3000,3000,3000,3000,3000,3000] },
  { id:"l78",  pid:"g9",  pt:"g", name:"Matheus Cardoso dos Santos",     v:[3060,3060,3060,3060,3060,3060,0,0,0,0,0,0] },
  { id:"l79",  pid:"g9",  pt:"g", name:"Nayara Lauane de Araujo",        v:[3060,3060,3060,3060,3060,3060,0,0,0,0,0,0] },
  { id:"l80",  pid:"g9",  pt:"g", name:"Serenna Tharyne Alves",          v:[0,10500,10500,10500,10500,10500,0,0,0,0,0,0] },
  { id:"l81",  pid:"g9",  pt:"g", name:"Jessica Nere",                   v:[2679,2679,0,0,0,0,0,0,0,0,0,0] },
  { id:"l82",  pid:"g9",  pt:"g", name:"Livia Maria Santos",             v:[3339,3339,3339,0,0,0,0,0,0,0,0,0] },
  { id:"l83",  pid:"g10", pt:"g", name:"Produção de Conteúdo",           v:[10000,10000,10000,10000,10000,5000,5000,5000,5000,5000,5000,5000] },
  { id:"l84",  pid:"g10", pt:"g", name:"Aulas Exclusivas",               v:[2000,2000,2000,2000,2000,500,500,500,500,500,500,500] },
  { id:"l85",  pid:"g10", pt:"g", name:"Fórum de Dúvidas",               v:[1000,1000,1000,1000,300,300,300,300,300,300,300,300] },
  { id:"l86",  pid:"g10", pt:"g", name:"Jose Maria (Fixo)",              v:[10000,10000,10000,10000,10000,0,0,0,0,0,0,0] },
  { id:"l87",  pid:"g10", pt:"g", name:"Marcel Guimarães (Fixo)",        v:[11000,11000,11000,11000,11000,0,0,0,0,0,0,0] },
  { id:"l88",  pid:"g10", pt:"g", name:"Nathalia Masson (Fixo)",         v:[20000,20000,20000,20000,20000,0,0,0,0,0,0,0] },
  { id:"l89",  pid:"g11", pt:"g", name:"Claude AI (Acadêmico)",          v:[150,150,150,150,150,0,0,0,0,0,0,0] },
  { id:"l90",  pid:"g11", pt:"g", name:"Tutory",                         v:[5000,5000,5000,5000,5000,3500,3500,3500,3500,3500,3500,3500] },
  { id:"l91",  pid:"g12", pt:"g", name:"Turma dos Feras (TCU)",          v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  // ── Tecnologia ────────────────────────────────────────────────────────────
  { id:"l92",  pid:"g13", pt:"g", name:"Raphael Fuzaitte",               v:[30000,30000,30000,30000,30000,30000,10000,10000,10000,10000,10000,10000] },
  { id:"l93",  pid:"g14", pt:"g", name:"William Sutero",                 v:[5000,5000,5000,5000,5000,5000,0,0,0,0,0,0] },
  { id:"l94",  pid:"g15", pt:"g", name:"Amazon",                         v:[55000,55000,55000,55000,55000,30000,30000,30000,30000,30000,30000,30000] },
  { id:"l95",  pid:"g15", pt:"g", name:"Lovable",                        v:[300,300,300,300,300,0,0,0,0,0,0,0] },
  { id:"l96",  pid:"g15", pt:"g", name:"MongoDB",                        v:[5500,5500,5500,5500,5500,4000,4000,4000,4000,4000,4000,4000] },
  { id:"l97",  pid:"g15", pt:"g", name:"Hevo Data",                      v:[1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800] },
  { id:"l98",  pid:"g15", pt:"g", name:"Bitbucket",                      v:[120,120,120,120,120,0,0,0,0,0,0,0] },
  { id:"l99",  pid:"g15", pt:"g", name:"GitHub",                         v:[80,80,80,80,80,0,0,0,0,0,0,0] },
  { id:"l100", pid:"g15", pt:"g", name:"NPM",                            v:[50,50,50,50,50,0,0,0,0,0,0,0] },
  { id:"l101", pid:"g15", pt:"g", name:"Claude",                         v:[0,0,0,550,550,0,0,0,0,0,0,0] },
  { id:"l102", pid:"g15", pt:"g", name:"Open.AI",                        v:[300,300,300,300,300,0,0,0,0,0,0,0] },
  // ── Operações & Financeiro ────────────────────────────────────────────────
  { id:"l103", pid:"g16", pt:"g", name:"Anderson Almeida de Santana",    v:[8500,8500,8500,8500,8500,8500,7700,7700,7700,7700,7700,7700] },
  { id:"l104", pid:"g16", pt:"g", name:"Luiz Henrique Lima Morais",      v:[3478,3478,3478,3478,3478,0,0,0,0,0,0,0] },
  { id:"l105", pid:"g16", pt:"g", name:"Samuel - Controller",            v:[0,0,8800,8800,8800,0,0,0,0,0,0,0] },
  { id:"l106", pid:"g16", pt:"g", name:"Jessica Caetano",                v:[2161,2161,2161,2161,2161,0,0,0,0,0,0,0] },
  { id:"l107", pid:"g17", pt:"g", name:"Thiago Moura",                   v:[9056,9056,9056,9056,9056,9056,5000,5000,5000,5000,5000,5000] },
  { id:"l108", pid:"g17", pt:"g", name:"Operadores Freelancer",          v:[1000,1000,1000,0,0,0,0,0,0,0,0,0] },
  { id:"l109", pid:"g18", pt:"g", name:"Vale Alimentação (Caju)",        v:[16169,16169,11685,11685,11685,1400,1400,1400,1400,1400,1400,1400] },
  { id:"l110", pid:"g18", pt:"g", name:"Plano de Saúde",                 v:[2500,2500,2500,2500,2500,0,0,0,0,0,0,0] },
  { id:"l111", pid:"g18", pt:"g", name:"Auxílio Home Office",            v:[3065,2660,2660,1485,1485,0,0,0,0,0,0,0] },
  { id:"l112", pid:"g18", pt:"g", name:"Total Pass",                     v:[2841,2841,2841,2841,2841,2841,0,0,0,0,0,0] },
  { id:"l113", pid:"g19", pt:"g", name:"ClickUp (30 licenças)",          v:[0,3000,3000,3000,3000,0,0,0,0,0,0,0] },
  { id:"l114", pid:"g19", pt:"g", name:"Bitwarden",                      v:[0,0,0,0,600,0,0,0,0,0,0,0] },
  { id:"l115", pid:"g19", pt:"g", name:"Claude Times",                   v:[220,220,220,220,2750,0,0,0,0,0,0,0] },
  { id:"l116", pid:"g19", pt:"g", name:"Claude Max Team",                v:[0,0,0,0,3180,0,0,0,0,0,0,0] },
  { id:"l117", pid:"g19", pt:"g", name:"Granatum",                       v:[269,269,269,269,299,299,299,299,299,299,299,299] },
  { id:"l118", pid:"g19", pt:"g", name:"Nota Gateway",                   v:[420,420,420,420,420,420,420,420,420,420,420,420] },
  { id:"l119", pid:"g19", pt:"g", name:"Pluga",                          v:[359,359,359,359,359,0,0,0,0,0,0,0] },
  { id:"l120", pid:"g19", pt:"g", name:"Google Workspace",               v:[2895,2895,2895,2895,2895,2895,2895,800,800,800,800,800] },
  { id:"l121", pid:"g19", pt:"g", name:"Notion",                         v:[2000,2000,2000,2000,2000,0,0,0,0,0,0,0] },
  { id:"l122", pid:"g19", pt:"g", name:"Slack",                          v:[1400,1400,1400,1400,1400,1400,0,0,0,0,0,0] },
  { id:"l123", pid:"g19", pt:"g", name:"Pipefy",                         v:[800,800,800,800,800,0,0,0,0,0,0,0] },
  { id:"l124", pid:"g19", pt:"g", name:"Zapsign",                        v:[40,40,40,40,40,40,40,40,40,40,40,40] },
  { id:"l125", pid:"g19", pt:"g", name:"Oitchau",                        v:[132,132,132,132,132,132,0,0,0,0,0,0] },
  // ── Infraestrutura ────────────────────────────────────────────────────────
  { id:"l126", pid:"g20", pt:"g", name:"Aluguel",                        v:[9300,9700,9600,9600,5800,0,0,0,0,0,0,0] },
  { id:"l127", pid:"g20", pt:"g", name:"Telefone",                       v:[942,942,942,942,942,942,0,0,0,0,0,0] },
  { id:"l128", pid:"g20", pt:"g", name:"Material Uso e Consumo",         v:[500,500,500,500,500,500,0,0,0,0,0,0] },
  { id:"l129", pid:"g21", pt:"g", name:"Polla Contadores",               v:[5500,5500,5500,5500,5500,3500,3500,3500,3500,3500,3500,3500] },
  { id:"l130", pid:"g21", pt:"g", name:"Estrela Neto Advogados",         v:[5000,6626,6626,6626,6626,7016,7016,7016,7016,7016,7016,7016] },
  { id:"l131", pid:"g21", pt:"g", name:"LLRR Advogados",                 v:[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000] },
  { id:"l132", pid:"g22", pt:"g", name:"Confraternizações e Eventos",    v:[1250,1250,1250,1250,0,0,0,0,0,0,0,0] },
  { id:"l133", pid:"g22", pt:"g", name:"Hospedagens e Viagens",          v:[20000,20000,20000,20000,0,0,0,0,0,0,0,0] },
  { id:"l134", pid:"g22", pt:"g", name:"Manutenções e Reparos",          v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l135", pid:"g22", pt:"g", name:"Outras Despesas",                v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  // ── FINEX ─────────────────────────────────────────────────────────────────
  { id:"l136", pid:"g23", pt:"g", name:"Banco Bradesco",                 v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l137", pid:"g23", pt:"g", name:"Banco Itaú",                     v:[19378,19378,19378,0,0,0,0,0,0,0,0,0] },
  { id:"l138", pid:"g23", pt:"g", name:"Banco Sofisa",                   v:[80105,80105,80105,80105,80105,80105,80105,80105,80105,80105,80105,80105] },
  { id:"l139", pid:"g23", pt:"g", name:"Banco Daycoval",                 v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l140", pid:"g23", pt:"g", name:"Tarifas Bancárias",              v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l141", pid:"g23", pt:"g", name:"Renegociações",                  v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l142", pid:"g23", pt:"g", name:"Juros e Multas",                 v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  // ── Revenue Ops Variável ──────────────────────────────────────────────────
  { id:"l143", pid:"g24", pt:"g", name:"Marcos Moreira - Variável",      v:[5466,11678,0,0,0,0,0,0,0,0,0,0] },
  { id:"l144", pid:"g24", pt:"g", name:"Beatriz Reis - Variável",        v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l145", pid:"g24", pt:"g", name:"Bruna Bezerra - Variável",       v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l146", pid:"g25", pt:"g", name:"Diego Araujo - Variável",        v:[5504,1430,302,1054,938,0,0,0,0,0,0,0] },
  { id:"l147", pid:"g25", pt:"g", name:"Anyele Araújo",                  v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l148", pid:"g25", pt:"g", name:"Matheus Ferreira",               v:[0,0,0,0,0,0,0,0,0,0,0,0] },
  { id:"l149", pid:"g26", pt:"g", name:"Anyele - Bônus",                 v:[800,800,800,800,800,0,0,0,0,0,0,0] },
  { id:"l150", pid:"g26", pt:"g", name:"Fabiana - Bônus",                v:[800,800,800,800,800,0,0,0,0,0,0,0] },
  { id:"l151", pid:"g26", pt:"g", name:"Lais - Bônus",                   v:[800,800,800,800,800,0,0,0,0,0,0,0] },
  { id:"l152", pid:"g26", pt:"g", name:"Anyele - Variável",              v:[4652,2084,3009,2497,2814,0,0,0,0,0,0,0] },
  { id:"l153", pid:"g26", pt:"g", name:"Fabiana - Variável",             v:[5485,2057,2700,2083,4171,0,0,0,0,0,0,0] },
  { id:"l154", pid:"g26", pt:"g", name:"Lais - Variável",                v:[6254,2469,1891,2614,3187,0,0,0,0,0,0,0] },
  // ── Acadêmico Variável ────────────────────────────────────────────────────
  { id:"l155", pid:"g27", pt:"g", name:"Elaboração de Recursos",         v:[6000,6000,6000,6000,6000,0,0,0,0,0,0,0] },
  { id:"l156", pid:"g27", pt:"g", name:"Correção Discursivas",           v:[500,500,500,500,500,0,0,0,0,0,0,0] },
  { id:"l157", pid:"g27", pt:"g", name:"Programa Passe",                 v:[20000,20000,20000,20000,20000,4000,4000,4000,4000,4000,4000,4000] },
  { id:"l158", pid:"g27", pt:"g", name:"Mentores",                       v:[41000,41000,41000,41000,41000,4000,4000,4000,4000,4000,4000,4000] },
  { id:"l159", pid:"g27", pt:"g", name:"Royalties - Cursos",             v:[16000,16000,16000,16000,16000,3000,3000,3000,3000,3000,3000,3000] },
  { id:"l160", pid:"g27", pt:"g", name:"Royalties - Assinaturas",        v:[24000,24000,24000,24000,24000,3200,3200,3200,3200,3200,3200,3200] },
  // ── FINEX Variável ────────────────────────────────────────────────────────
  { id:"l161", pid:"g28", pt:"g", name:"Taxa de Antecipação",            v:[100000,100000,100000,100000,34000,34000,34000,34000,34000,34000,34000,34000] },
  { id:"l162", pid:"g28", pt:"g", name:"Taxa de Operação",               v:[25000,25000,25000,25000,8500,8500,8500,8500,8500,8500,8500,8500] },
  // ── Devoluções ────────────────────────────────────────────────────────────
  { id:"l163", pid:"a11", pt:"a", name:"Cancelamentos",                  v:[100000,100000,100000,100000,34000,34000,34000,34000,34000,34000,34000,34000] },
  // ── Tributos ──────────────────────────────────────────────────────────────
  { id:"l164", pid:"a12", pt:"a", name:"IRPJ",                           v:[4271,0,0,1258,0,0,951,1265,2350,2350,2767,2767] },
  { id:"l165", pid:"a12", pt:"a", name:"CSLL",                           v:[2258,0,0,755,0,0,571,759,1410,1410,1660,1660] },
];

const SEED_ACTUALS = {
  l1:[505390,135889,232384,128666,67431,0,0,0,0,0,0,0], l2:[236335,123888,151724,89765,26325,0,0,0,0,0,0,0],
  l3:[18724,10502,11305,8224,2592,0,0,0,0,0,0,0],
  l4:[28000,28000,28000,28000,0,0,0,0,0,0,0,0],
  l5:[0,0,0,7815,0,0,0,0,0,0,0,0], l6:[0,0,0,7258,0,0,0,0,0,0,0,0],
  l7:[0,10000,10000,10000,0,0,0,0,0,0,0,0], l8:[0,0,0,0,0,0,0,0,0,0,0,0],
  l9:[0,1286,6000,6000,0,0,0,0,0,0,0,0], l10:[0,1786,5000,5000,0,0,0,0,0,0,0,0],
  l11:[1355,3500,3500,3500,0,0,0,0,0,0,0,0], l12:[0,429,2000,2000,0,0,0,0,0,0,0,0],
  l13:[6956,6956,6956,6956,0,0,0,0,0,0,0,0], l14:[2049,0,0,0,0,0,0,0,0,0,0,0],
  l15:[0,0,7500,0,0,0,0,0,0,0,0,0], l16:[2419,15000,15000,15000,0,0,0,0,0,0,0,0],
  l17:[0,1286,6000,0,0,0,0,0,0,0,0,0], l18:[5564,5564,5564,5564,0,0,0,0,0,0,0,0],
  l19:[0,10500,10500,10500,0,0,0,0,0,0,0,0], l20:[10444,0,0,0,0,0,0,0,0,0,0,0],
  l21:[6500,1161,0,0,0,0,0,0,0,0,0,0], l22:[9484,0,0,0,0,0,0,0,0,0,0,0],
  l23:[3500,1750,0,0,0,0,0,0,0,0,0,0], l24:[3000,0,0,0,0,0,0,0,0,0,0,0],
  l25:[16000,16000,16000,16000,0,0,0,0,0,0,0,0], l26:[2226,2226,2226,2226,0,0,0,0,0,0,0,0],
  l27:[4173,4173,4173,4173,0,0,0,0,0,0,0,0], l28:[1033,1055,1055,1033,0,0,0,0,0,0,0,0],
  l29:[4173,0,0,0,0,0,0,0,0,0,0,0], l30:[600,0,0,0,0,0,0,0,0,0,0,0],
  l31:[2161,2161,2161,2161,0,0,0,0,0,0,0,0], l32:[4312,4312,4312,8368,0,0,0,0,0,0,0,0],
  l33:[2161,2161,1898,0,0,0,0,0,0,0,0,0], l34:[0,14000,14000,14000,0,0,0,0,0,0,0,0],
  l35:[2504,2504,2504,2504,0,0,0,0,0,0,0,0], l36:[0,0,0,2597,0,0,0,0,0,0,0,0],
  l37:[0,0,1032,2000,0,0,0,0,0,0,0,0], l38:[0,0,0,2032,0,0,0,0,0,0,0,0],
  l39:[4048,0,0,0,0,0,0,0,0,0,0,0],
  l40:[0,26871,26871,26871,0,0,0,0,0,0,0,0], l41:[5,27,9926,2953,0,0,0,0,0,0,0,0],
  l42:[1990,1990,1990,1990,0,0,0,0,0,0,0,0], l43:[0,0,2404,0,0,0,0,0,0,0,0,0],
  l44:[0,0,0,0,0,0,0,0,0,0,0,0], l45:[0,0,0,556,0,0,0,0,0,0,0,0],
  l46:[779,779,779,0,0,0,0,0,0,0,0,0], l47:[217,933,3069,0,0,0,0,0,0,0,0,0],
  l48:[796,1659,1250,788,0,0,0,0,0,0,0,0], l49:[0,0,0,0,0,0,0,0,0,0,0,0],
  l50:[0,0,50,50,0,0,0,0,0,0,0,0], l51:[0,273,276,0,0,0,0,0,0,0,0,0],
  l52:[0,215,1475,0,0,0,0,0,0,0,0,0], l53:[0,0,0,0,0,0,0,0,0,0,0,0],
  l54:[135,135,189,189,0,0,0,0,0,0,0,0], l55:[0,0,0,0,0,0,0,0,0,0,0,0],
  l56:[0,0,179,0,0,0,0,0,0,0,0,0], l57:[0,0,507,0,0,0,0,0,0,0,0,0],
  l58:[0,0,0,0,0,0,0,0,0,0,0,0], l59:[186,187,185,0,0,0,0,0,0,0,0,0],
  l60:[0,0,104,0,0,0,0,0,0,0,0,0], l61:[0,0,0,0,0,0,0,0,0,0,0,0],
  l62:[114,114,114,0,0,0,0,0,0,0,0,0], l63:[114,110,110,0,0,0,0,0,0,0,0,0],
  l64:[386,386,320,0,0,0,0,0,0,0,0,0], l65:[4865,2185,1251,0,0,0,0,0,0,0,0,0],
  l66:[1847,1154,636,1143,0,0,0,0,0,0,0,0],
  l67:[6290,5739,37549,0,0,0,0,0,0,0,0,0], l68:[0,0,0,0,0,0,0,0,0,0,0,0],
  l69:[64096,2599,16675,0,0,0,0,0,0,0,0,0], l70:[0,0,0,0,0,0,0,0,0,0,0,0],
  l71:[0,0,0,0,0,0,0,0,0,0,0,0],
  l72:[12885,4320,1876,0,0,0,0,0,0,0,0,0], l73:[0,0,0,0,0,0,0,0,0,0,0,0],
  l74:[3798,3798,3798,3798,0,0,0,0,0,0,0,0], l75:[0,0,2100,2100,0,0,0,0,0,0,0,0],
  l76:[3339,3339,3339,3339,0,0,0,0,0,0,0,0], l77:[8956,8956,8956,8956,0,0,0,0,0,0,0,0],
  l78:[3060,3060,3060,3060,0,0,0,0,0,0,0,0], l79:[3060,3060,3060,3060,0,0,0,0,0,0,0,0],
  l80:[0,10500,10500,10500,0,0,0,0,0,0,0,0], l81:[2679,1519,0,0,0,0,0,0,0,0,0,0],
  l82:[3339,4139,0,0,0,0,0,0,0,0,0,0],
  l83:[9458,10532,2930,3687,117,0,0,0,0,0,0,0], l84:[1719,1850,2810,0,0,0,0,0,0,0,0,0],
  l85:[188,148,80,0,0,0,0,0,0,0,0,0], l86:[10000,10000,10000,10000,0,0,0,0,0,0,0,0],
  l87:[11000,11000,11000,11000,0,0,0,0,0,0,0,0], l88:[20000,20000,20000,20000,0,0,0,0,0,0,0,0],
  l89:[0,0,0,0,0,0,0,0,0,0,0,0], l90:[4099,3556,2639,0,0,0,0,0,0,0,0,0],
  l91:[0,0,0,0,0,0,0,0,0,0,0,0],
  l92:[30000,30000,30000,30000,0,0,0,0,0,0,0,0], l93:[5000,5000,5000,5000,0,0,0,0,0,0,0,0],
  l94:[38810,38785,36757,40253,0,0,0,0,0,0,0,0], l95:[139,134,134,0,0,0,0,0,0,0,0,0],
  l96:[5018,3935,4410,4890,0,0,0,0,0,0,0,0], l97:[1633,1599,1615,1644,0,0,0,0,0,0,0,0],
  l98:[103,99,98,98,0,0,0,0,0,0,0,0], l99:[0,0,0,0,0,0,0,0,0,0,0,0],
  l100:[39,38,38,38,0,0,0,0,0,0,0,0], l101:[0,0,0,550,0,0,0,0,0,0,0,0],
  l102:[0,0,0,0,0,0,0,0,0,0,0,0],
  l103:[8500,8500,8500,8500,0,0,0,0,0,0,0,0], l104:[3478,3478,3478,0,0,0,0,0,0,0,0,0],
  l105:[0,0,8800,8800,0,0,0,0,0,0,0,0], l106:[2161,2255,2255,0,0,0,0,0,0,0,0,0],
  l107:[9056,9056,9056,9056,0,0,0,0,0,0,0,0], l108:[600,400,0,0,0,0,0,0,0,0,0,0],
  l109:[16169,11685,11119,9321,0,0,0,0,0,0,0,0], l110:[2495,2495,2495,2495,0,0,0,0,0,0,0,0],
  l111:[3065,2660,1485,1485,0,0,0,0,0,0,0,0], l112:[2994,2994,2841,2841,0,0,0,0,0,0,0,0],
  l113:[520,923,1509,0,0,0,0,0,0,0,0,0], l114:[0,0,0,0,0,0,0,0,0,0,0,0],
  l115:[0,0,0,0,0,0,0,0,0,0,0,0], l116:[0,0,0,0,0,0,0,0,0,0,0,0],
  l117:[269,269,269,299,0,0,0,0,0,0,0,0], l118:[420,420,420,420,0,0,0,0,0,0,0,0],
  l119:[359,359,359,359,0,0,0,0,0,0,0,0], l120:[2880,2880,2895,0,0,0,0,0,0,0,0,0],
  l121:[1737,1486,1377,0,0,0,0,0,0,0,0,0], l122:[1171,1045,965,1026,0,0,0,0,0,0,0,0],
  l123:[717,756,712,0,0,0,0,0,0,0,0,0], l124:[40,40,40,0,0,0,0,0,0,0,0,0],
  l125:[132,132,132,0,0,0,0,0,0,0,0,0],
  l126:[10434,10266,10080,9000,0,0,0,0,0,0,0,0], l127:[0,0,0,0,0,0,0,0,0,0,0,0],
  l128:[390,150,300,0,0,0,0,0,0,0,0,0], l129:[5622,5193,5193,5193,0,0,0,0,0,0,0,0],
  l130:[5000,5000,5000,5000,0,0,0,0,0,0,0,0], l131:[0,0,0,0,0,0,0,0,0,0,0,0],
  l132:[0,0,0,0,0,0,0,0,0,0,0,0], l133:[0,7397,0,0,0,0,0,0,0,0,0,0],
  l134:[0,0,0,0,0,0,0,0,0,0,0,0], l135:[400,2045,7234,5940,0,0,0,0,0,0,0,0],
  l136:[0,0,0,0,0,0,0,0,0,0,0,0], l137:[0,0,0,0,0,0,0,0,0,0,0,0],
  l138:[0,0,0,0,0,0,0,0,0,0,0,0], l139:[0,0,0,0,0,0,0,0,0,0,0,0],
  l140:[250,550,0,300,0,0,0,0,0,0,0,0], l141:[0,0,0,0,0,0,0,0,0,0,0,0],
  l142:[6003,7005,2446,0,0,0,0,0,0,0,0,0],
  l143:[5466,1109,667,0,0,0,0,0,0,0,0,0], l144:[30,0,0,0,0,0,0,0,0,0,0,0],
  l145:[70,0,0,0,0,0,0,0,0,0,0,0], l146:[6392,1952,479,0,0,0,0,0,0,0,0,0],
  l147:[0,0,0,0,0,0,0,0,0,0,0,0], l148:[0,0,0,0,0,0,0,0,0,0,0,0],
  l149:[800,800,0,0,0,0,0,0,0,0,0,0], l150:[800,0,0,0,0,0,0,0,0,0,0,0],
  l151:[800,0,0,0,0,0,0,0,0,0,0,0], l152:[1036,492,3232,0,0,0,0,0,0,0,0,0],
  l153:[754,116,2259,0,0,0,0,0,0,0,0,0], l154:[608,223,0,0,0,0,0,0,0,0,0,0],
  l155:[0,0,200,0,0,0,0,0,0,0,0,0], l156:[0,1671,0,0,0,0,0,0,0,0,0,0],
  l157:[15147,13462,14631,11764,10453,9794,4769,3794,3179,2262,1386,1139],
  l158:[34944,29331,22906,17697,12497,10431,8742,5242,4200,2600,1675,1075],
  l159:[6328,5266,4510,0,0,0,0,0,0,0,0,0], l160:[15333,12608,12150,0,0,0,0,0,0,0,0,0],
  l161:[56585,19181,30711,19814,0,0,0,0,0,0,0,0], l162:[16206,10319,10812,5622,0,0,0,0,0,0,0,0],
  l163:[95680,19584,38537,11982,419,0,0,0,0,0,0,0],
  l164:[4326,0,0,0,0,0,0,0,0,0,0,0], l165:[2277,0,0,0,0,0,0,0,0,0,0,0],
};

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ version, versions, setVersion, view, setView, sessionEmail, onSignOut }) {
  return (
    <header className="app-header">
      <div className="header-main">
        <div className="brand-mark">
          <span>2</span>AS<small>ORÇAMENTO</small>
        </div>
        <nav className="top-menu">
          {[["budget","ORÇAMENTO"],["realized","REALIZADO"],["comparison","ORÇADO × REALIZADO"],["summary","RESUMO POR ÁREA"]].map(([id,label]) => (
            <button key={id} className={view===id?"active":""} onClick={()=>setView(id)} type="button">{label}</button>
          ))}
        </nav>
        <div className="header-actions">
          <select value={version.id} onChange={e=>setVersion(versions.find(v=>v.id===e.target.value))}>
            {versions.map(v=><option key={v.id} value={v.id}>{v.year} · {v.name}{v.status==="draft"?" (rascunho)":""}</option>)}
          </select>
          {sessionEmail && <><span className="header-user-email">{sessionEmail}</span><button className="link-btn" onClick={onSignOut} type="button">SAIR</button></>}
        </div>
      </div>
    </header>
  );
}

// ─── BudgetPage ───────────────────────────────────────────────────────────────
function BudgetPage({ version, areas, setAreas, groups, setGroups, lines, setLines }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const toggle = id => setCollapsed(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const addArea = sId => setAreas(p=>[...p,{id:uid(),vId:version.id,sId,name:"Nova área"}]);
  const delArea = id => { setAreas(p=>p.filter(a=>a.id!==id)); setGroups(p=>p.filter(g=>g.aId!==id)); setLines(p=>p.filter(l=>!(l.pid===id&&l.pt==="a"))); };
  const renameArea = (id,name) => setAreas(p=>p.map(a=>a.id===id?{...a,name}:a));

  const addGroup = aId => setGroups(p=>[...p,{id:uid(),aId,name:"Novo grupo",mgr:""}]);
  const delGroup = id => { setGroups(p=>p.filter(g=>g.id!==id)); setLines(p=>p.filter(l=>!(l.pid===id&&l.pt==="g"))); };
  const renameGroup = (id,k,val) => setGroups(p=>p.map(g=>g.id===id?{...g,[k]:val}:g));

  const addLine = (pid,pt) => setLines(p=>[...p,{id:uid(),pid,pt,name:"Nova linha",v:Array(12).fill(0)}]);
  const delLine = id => setLines(p=>p.filter(l=>l.id!==id));
  const renameLine = (id,name) => setLines(p=>p.map(l=>l.id===id?{...l,name}:l));
  const setVal = (id,i,val) => setLines(p=>p.map(l=>l.id===id?{...l,v:l.v.map((x,j)=>j===i?(+val||0):x)}:l));

  const vAreas  = areas.filter(a=>a.vId===version.id);
  const totArea = (aId) => {
    const direct = lines.filter(l=>l.pid===aId&&l.pt==="a").reduce((s,l)=>s+sumV(l.v),0);
    const viaGroups = groups.filter(g=>g.aId===aId).reduce((s,g)=>s+lines.filter(l=>l.pid===g.id&&l.pt==="g").reduce((ss,l)=>ss+sumV(l.v),0),0);
    return direct+viaGroups;
  };

  return (
    <main className="page">
      <div className="page-title">
        <div><h1>Orçamento</h1><p>Planejamento anual por área, grupo e linha de custo · {version.year} · {version.name}</p></div>
        <button className="btn" type="button"><Download size={14}/> Exportar CSV</button>
      </div>
      <div className="bt-wrapper">
        {/* sticky header */}
        <div className="bt-head">
          <div className="bt-label-col">Área / Linha de custo</div>
          <div className="bt-scroll-area">
            {MONTHS.map(m=><div className="bt-month-col" key={m}>{m}</div>)}
            <div className="bt-total-col">Total anual</div>
            <div className="bt-actions-col"/>
          </div>
        </div>

        {SECTIONS.map(sec=>{
          const secAreas = vAreas.filter(a=>a.sId===sec.id);
          return (
            <div className="bt-section" key={sec.id}>
              <div className="bt-section-header">
                <div className="bt-label-col"><span>{sec.label}</span></div>
                <div className="bt-scroll-area">
                  {MONTHS.map((_,i)=>{
                    const tot = secAreas.flatMap(a=>[
                      ...lines.filter(l=>l.pid===a.id&&l.pt==="a"),
                      ...groups.filter(g=>g.aId===a.id).flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g"))
                    ]).reduce((s,l)=>s+(+l.v[i]||0),0);
                    return <div className="bt-month-col" key={i}>{fmtN(tot)}</div>;
                  })}
                  <div className="bt-total-col"><em>{fmt(secAreas.reduce((s,a)=>s+totArea(a.id),0))}</em></div>
                  <div className="bt-actions-col"/>
                </div>
              </div>

              {secAreas.map(area=>{
                const areaGroups = groups.filter(g=>g.aId===area.id);
                const directLines = lines.filter(l=>l.pid===area.id&&l.pt==="a");
                const aCollapsed = collapsed.has(area.id);
                return (
                  <div className="bt-area" key={area.id}>
                    {/* Area header */}
                    <div className="bt-area-header">
                      <div className="bt-label-col">
                        <button className="bt-chevron" onClick={()=>toggle(area.id)} type="button">
                          {aCollapsed?<ChevronRight size={14}/>:<ChevronDown size={14}/>}
                        </button>
                        <input className="bt-name-input area-name" value={area.name} onChange={e=>renameArea(area.id,e.target.value)} />
                      </div>
                      <div className="bt-scroll-area">
                        {MONTHS.map((_,i)=>{
                          const tot = [
                            ...directLines,
                            ...areaGroups.flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g"))
                          ].reduce((s,l)=>s+(+l.v[i]||0),0);
                          return <div className="bt-month-col mono dim" key={i}>{fmtN(tot)}</div>;
                        })}
                        <div className="bt-total-col mono">{fmt(totArea(area.id))}</div>
                        <div className="bt-actions-col">
                          <button className="bt-icon-btn add" title="Novo grupo" onClick={()=>addGroup(area.id)} type="button"><Plus size={12}/></button>
                          <button className="bt-icon-btn del" title="Excluir área" onClick={()=>delArea(area.id)} type="button"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    </div>

                    {!aCollapsed && (<>
                      {/* Groups */}
                      {areaGroups.map(grp=>{
                        const gLines = lines.filter(l=>l.pid===grp.id&&l.pt==="g");
                        const gCollapsed = collapsed.has(grp.id);
                        return (
                          <div className="bt-group" key={grp.id}>
                            <div className="bt-group-header">
                              <div className="bt-label-col">
                                <button className="bt-chevron" onClick={()=>toggle(grp.id)} type="button">
                                  {gCollapsed?<ChevronRight size={13}/>:<ChevronDown size={13}/>}
                                </button>
                                <input className="bt-name-input group-name" value={grp.name} onChange={e=>renameGroup(grp.id,"name",e.target.value)} />
                                <input className="bt-mgr-input" value={grp.mgr} onChange={e=>renameGroup(grp.id,"mgr",e.target.value)} placeholder="Responsável" />
                              </div>
                              <div className="bt-scroll-area">
                                {MONTHS.map((_,i)=>(
                                  <div className="bt-month-col mono dim" key={i}>{fmtN(gLines.reduce((s,l)=>s+(+l.v[i]||0),0))}</div>
                                ))}
                                <div className="bt-total-col mono">{fmt(gLines.reduce((s,l)=>s+sumV(l.v),0))}</div>
                                <div className="bt-actions-col">
                                  <button className="bt-icon-btn add" title="Nova linha" onClick={()=>addLine(grp.id,"g")} type="button"><Plus size={12}/></button>
                                  <button className="bt-icon-btn del" title="Excluir grupo" onClick={()=>delGroup(grp.id)} type="button"><Trash2 size={12}/></button>
                                </div>
                              </div>
                            </div>

                            {!gCollapsed && gLines.map(line=>(
                              <LineRow key={line.id} line={line} onRename={renameLine} onVal={setVal} onDel={delLine} />
                            ))}

                            {!gCollapsed && (
                              <div className="bt-add-row">
                                <button onClick={()=>addLine(grp.id,"g")} type="button"><Plus size={11}/> Nova linha</button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Direct lines (sem grupo) */}
                      {directLines.map(line=>(
                        <LineRow key={line.id} line={line} onRename={renameLine} onVal={setVal} onDel={delLine} direct />
                      ))}

                      <div className="bt-add-row area-add">
                        <button onClick={()=>addGroup(area.id)} type="button"><Plus size={11}/> Novo grupo</button>
                        <button onClick={()=>addLine(area.id,"a")} type="button"><Plus size={11}/> Nova linha direta</button>
                      </div>
                    </>)}
                  </div>
                );
              })}

              <div className="bt-add-area">
                <button onClick={()=>addArea(sec.id)} type="button"><Plus size={12}/> Nova área</button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function ValInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value || ""));
  useEffect(() => { if (!editing) setRaw(String(value || "")); }, [value, editing]);
  return (
    <input
      className="bt-val-input"
      value={editing ? raw : (value ? fmtN(value) : "")}
      placeholder="0"
      onFocus={() => { setEditing(true); setRaw(String(value || "")); }}
      onBlur={() => { setEditing(false); onChange(raw); }}
      onChange={e => setRaw(e.target.value)}
    />
  );
}

function LineRow({ line, onRename, onVal, onDel, direct=false }) {
  return (
    <div className={`bt-line${direct?" direct":""}`}>
      <div className="bt-label-col">
        <span className="bt-line-indent"/>
        <input className="bt-name-input line-name" value={line.name} onChange={e=>onRename(line.id,e.target.value)} />
      </div>
      <div className="bt-scroll-area">
        {line.v.map((val,i)=>(
          <div className="bt-month-col" key={i}>
            <ValInput value={val} onChange={v=>onVal(line.id,i,v)} />
          </div>
        ))}
        <div className="bt-total-col mono strong">{fmt(sumV(line.v))}</div>
        <div className="bt-actions-col">
          <button className="bt-icon-btn del" onClick={()=>onDel(line.id)} type="button"><Trash2 size={12}/></button>
        </div>
      </div>
    </div>
  );
}

// ─── RealizedPage ─────────────────────────────────────────────────────────────
function RealizedPage({ version, areas, groups, lines, actuals, setActuals }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const toggle = id => setCollapsed(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});

  const setActual = (lineId, i, val) =>
    setActuals(prev => ({
      ...prev,
      [lineId]: (prev[lineId] ?? Array(12).fill(0)).map((x,j) => j===i ? (+val||0) : x),
    }));

  const lineActual = id => actuals[id] ?? Array(12).fill(0);
  const sumGroup = (gId) => lines.filter(l=>l.pid===gId&&l.pt==="g").reduce((s,l)=>s+sumV(lineActual(l.id)),0);
  const sumArea  = (aId) => {
    const direct = lines.filter(l=>l.pid===aId&&l.pt==="a").reduce((s,l)=>s+sumV(lineActual(l.id)),0);
    const viaGroups = groups.filter(g=>g.aId===aId).reduce((s,g)=>s+sumGroup(g.id),0);
    return direct+viaGroups;
  };

  const vAreas = areas.filter(a=>a.vId===version.id);

  return (
    <main className="page">
      <div className="page-title">
        <div><h1>Realizado</h1><p>Lançamentos realizados por área e linha de custo · {version.year} · acum. até {MONTHS[REALIZED_THRU-1]}</p></div>
        <button className="btn" type="button"><Download size={14}/> Exportar CSV</button>
      </div>
      <div className="bt-wrapper">
        <div className="bt-head">
          <div className="bt-label-col">Área / Linha de custo</div>
          <div className="bt-scroll-area">
            {MONTHS.map((m,i)=><div className="bt-month-col" key={m} style={i>=REALIZED_THRU?{opacity:.35}:{}}>{m}</div>)}
            <div className="bt-total-col">Total realiz.</div>
            <div className="bt-actions-col"/>
          </div>
        </div>

        {SECTIONS.map(sec=>{
          const secAreas = vAreas.filter(a=>a.sId===sec.id);
          return (
            <div className="bt-section" key={sec.id}>
              <div className="bt-section-header">
                <div className="bt-label-col"><span>{sec.label}</span></div>
                <div className="bt-scroll-area">
                  {MONTHS.map((_,i)=>{
                    const tot = secAreas.flatMap(a=>[
                      ...lines.filter(l=>l.pid===a.id&&l.pt==="a"),
                      ...groups.filter(g=>g.aId===a.id).flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g"))
                    ]).reduce((s,l)=>s+(+lineActual(l.id)[i]||0),0);
                    return <div className="bt-month-col" key={i} style={i>=REALIZED_THRU?{opacity:.35}:{}}>{tot?fmtN(tot):""}</div>;
                  })}
                  <div className="bt-total-col"><em>{fmt(secAreas.reduce((s,a)=>s+sumArea(a.id),0))}</em></div>
                  <div className="bt-actions-col"/>
                </div>
              </div>

              {secAreas.map(area=>{
                const areaGroups = groups.filter(g=>g.aId===area.id);
                const directLines = lines.filter(l=>l.pid===area.id&&l.pt==="a");
                const aCollapsed = collapsed.has(area.id);
                return (
                  <div className="bt-area" key={area.id}>
                    <div className="bt-area-header">
                      <div className="bt-label-col">
                        <button className="bt-chevron" onClick={()=>toggle(area.id)} type="button">
                          {aCollapsed?<ChevronRight size={14}/>:<ChevronDown size={14}/>}
                        </button>
                        <strong>{area.name}</strong>
                      </div>
                      <div className="bt-scroll-area">
                        {MONTHS.map((_,i)=>{
                          const tot=[...directLines,...areaGroups.flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g"))].reduce((s,l)=>s+(+lineActual(l.id)[i]||0),0);
                          return <div className="bt-month-col mono dim" key={i} style={i>=REALIZED_THRU?{opacity:.35}:{}}>{tot?fmtN(tot):""}</div>;
                        })}
                        <div className="bt-total-col mono">{fmt(sumArea(area.id))}</div>
                        <div className="bt-actions-col"/>
                      </div>
                    </div>

                    {!aCollapsed && (<>
                      {areaGroups.map(grp=>{
                        const gLines = lines.filter(l=>l.pid===grp.id&&l.pt==="g");
                        const gCollapsed = collapsed.has(grp.id);
                        return (
                          <div className="bt-group" key={grp.id}>
                            <div className="bt-group-header">
                              <div className="bt-label-col">
                                <button className="bt-chevron" onClick={()=>toggle(grp.id)} type="button">
                                  {gCollapsed?<ChevronRight size={13}/>:<ChevronDown size={13}/>}
                                </button>
                                <span>{grp.name}</span>
                              </div>
                              <div className="bt-scroll-area">
                                {MONTHS.map((_,i)=>{
                                  const tot=gLines.reduce((s,l)=>s+(+lineActual(l.id)[i]||0),0);
                                  return <div className="bt-month-col mono dim" key={i} style={i>=REALIZED_THRU?{opacity:.35}:{}}>{tot?fmtN(tot):""}</div>;
                                })}
                                <div className="bt-total-col mono">{fmt(sumGroup(grp.id))}</div>
                                <div className="bt-actions-col"/>
                              </div>
                            </div>
                            {!gCollapsed && gLines.map(line=>{
                              const act = lineActual(line.id);
                              return (
                                <div className="bt-line" key={line.id}>
                                  <div className="bt-label-col">
                                    <span className="bt-line-indent"/>
                                    <span className="line-label">{line.name}</span>
                                  </div>
                                  <div className="bt-scroll-area">
                                    {act.map((val,i)=>(
                                      <div className="bt-month-col" key={i} style={i>=REALIZED_THRU?{opacity:.35}:{}}>
                                        <ValInput value={val} onChange={v=>setActual(line.id,i,v)} />
                                      </div>
                                    ))}
                                    <div className="bt-total-col mono strong">{fmt(sumV(act))}</div>
                                    <div className="bt-actions-col"/>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      {directLines.map(line=>{
                        const act = lineActual(line.id);
                        return (
                          <div className="bt-line direct" key={line.id}>
                            <div className="bt-label-col">
                              <span className="bt-line-indent"/>
                              <span className="line-label">{line.name}</span>
                            </div>
                            <div className="bt-scroll-area">
                              {act.map((val,i)=>(
                                <div className="bt-month-col" key={i} style={i>=REALIZED_THRU?{opacity:.35}:{}}>
                                  <ValInput value={val} onChange={v=>setActual(line.id,i,v)} />
                                </div>
                              ))}
                              <div className="bt-total-col mono strong">{fmt(sumV(act))}</div>
                              <div className="bt-actions-col"/>
                            </div>
                          </div>
                        );
                      })}
                    </>)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </main>
  );
}

// ─── ComparisonPage ───────────────────────────────────────────────────────────
function ComparisonPage({ version, areas, groups, lines, actuals }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const toggle = id => setCollapsed(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});

  const vAreas = areas.filter(a=>a.vId===version.id);

  const lineActual = (lineId) => actuals[lineId] ?? Array(12).fill(0);
  const sumActual  = (lineIds) => lineIds.reduce((s,id)=>s+sumV(lineActual(id)),0);
  const sumBudget  = (lineIds) => lineIds.reduce((s,id)=>s+sumV(lines.find(l=>l.id===id)?.v??[]),0);

  const diffClass = (b,r) => !r||!b?"":r>b?"over":"under";

  return (
    <main className="page">
      <div className="page-title">
        <div><h1>Orçado × Realizado</h1><p>Comparativo acumulado até {MONTHS[REALIZED_THRU-1]} · {version.year} · {version.name}</p></div>
      </div>
      <div className="bt-wrapper comparison">
        <div className="bt-head">
          <div className="bt-label-col">Área / Linha de custo</div>
          <div className="bt-scroll-area">
            <div className="bt-cmp-pair hdr"><span>Orçado anual</span><span>Realizado</span><span>Δ</span></div>
            {MONTHS.slice(0,REALIZED_THRU).map(m=>(
              <div className="bt-cmp-pair hdr" key={m}><span>{m} Orç.</span><span>{m} Real.</span><span>%</span></div>
            ))}
          </div>
        </div>

        {SECTIONS.map(sec=>{
          const secAreas = vAreas.filter(a=>a.sId===sec.id);
          const secLines = secAreas.flatMap(a=>{
            const gs = groups.filter(g=>g.aId===a.id).flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g").map(l=>l.id));
            const dl = lines.filter(l=>l.pid===a.id&&l.pt==="a").map(l=>l.id);
            return [...gs,...dl];
          });
          return (
            <div className="bt-section" key={sec.id}>
              <div className="bt-section-header">
                <div className="bt-label-col"><span>{sec.label}</span></div>
                <div className="bt-scroll-area">
                  <div className={`bt-cmp-pair ${diffClass(sumBudget(secLines),sumActual(secLines))}`}>
                    <span>{fmtN(sumBudget(secLines))}</span>
                    <span>{sumActual(secLines)?fmtN(sumActual(secLines)):"–"}</span>
                    <span className="diff">{pct(sumActual(secLines),sumBudget(secLines))}</span>
                  </div>
                  {Array.from({length:REALIZED_THRU},(_,mi)=>{
                    const mo = secLines.reduce((s,id)=>s+(+lines.find(l=>l.id===id)?.v[mi]||0),0);
                    const mr = secLines.reduce((s,id)=>s+(+lineActual(id)[mi]||0),0);
                    return (
                      <div className={`bt-cmp-pair ${diffClass(mo,mr)}`} key={mi}>
                        <span>{mo?fmtN(mo):"–"}</span>
                        <span>{mr?fmtN(mr):"–"}</span>
                        <span className="diff">{pct(mr,mo)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {secAreas.map(area=>{
                const areaGroups = groups.filter(g=>g.aId===area.id);
                const directLines = lines.filter(l=>l.pid===area.id&&l.pt==="a");
                const aLineIds = [...areaGroups.flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g").map(l=>l.id)),...directLines.map(l=>l.id)];
                const aOrc = sumBudget(aLineIds);
                const aReal= sumActual(aLineIds);
                const aCol  = collapsed.has(area.id);
                return (
                  <div className="bt-area" key={area.id}>
                    <div className="bt-area-header">
                      <div className="bt-label-col">
                        <button className="bt-chevron" onClick={()=>toggle(area.id)} type="button">
                          {aCol?<ChevronRight size={14}/>:<ChevronDown size={14}/>}
                        </button>
                        <strong>{area.name}</strong>
                      </div>
                      <div className="bt-scroll-area">
                        <div className={`bt-cmp-pair ${diffClass(aOrc,aReal)}`}>
                          <span>{fmtN(aOrc)}</span>
                          <span>{aReal?fmtN(aReal):"–"}</span>
                          <span className="diff">{pct(aReal,aOrc)}</span>
                        </div>
                        {Array.from({length:REALIZED_THRU},(_,mi)=>{
                          const mo = aLineIds.reduce((s,id)=>s+(+lines.find(l=>l.id===id)?.v[mi]||0),0);
                          const mr = aLineIds.reduce((s,id)=>s+(+lineActual(id)[mi]||0),0);
                          return (
                            <div className={`bt-cmp-pair ${diffClass(mo,mr)}`} key={mi}>
                              <span>{mo?fmtN(mo):"–"}</span>
                              <span>{mr?fmtN(mr):"–"}</span>
                              <span className="diff">{pct(mr,mo)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {!aCol && (<>
                      {areaGroups.map(grp=>{
                        const gLines = lines.filter(l=>l.pid===grp.id&&l.pt==="g");
                        const gIds = gLines.map(l=>l.id);
                        const gOrc = sumBudget(gIds); const gReal = sumActual(gIds);
                        const gCol = collapsed.has(grp.id);
                        return (
                          <div className="bt-group" key={grp.id}>
                            <div className="bt-group-header">
                              <div className="bt-label-col">
                                <button className="bt-chevron" onClick={()=>toggle(grp.id)} type="button">
                                  {gCol?<ChevronRight size={13}/>:<ChevronDown size={13}/>}
                                </button>
                                <span className="group-name">{grp.name}</span>
                              </div>
                              <div className="bt-scroll-area">
                                <div className={`bt-cmp-pair ${diffClass(gOrc,gReal)}`}>
                                  <span>{fmtN(gOrc)}</span>
                                  <span>{gReal?fmtN(gReal):"–"}</span>
                                  <span className="diff">{pct(gReal,gOrc)}</span>
                                </div>
                                {Array.from({length:REALIZED_THRU},(_,mi)=>{
                                  const mo = gIds.reduce((s,id)=>s+(+lines.find(l=>l.id===id)?.v[mi]||0),0);
                                  const mr = gIds.reduce((s,id)=>s+(+lineActual(id)[mi]||0),0);
                                  return (
                                    <div className={`bt-cmp-pair ${diffClass(mo,mr)}`} key={mi}>
                                      <span>{mo?fmtN(mo):"–"}</span><span>{mr?fmtN(mr):"–"}</span><span className="diff">{pct(mr,mo)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {!gCol && gLines.map(line=>{
                              const act = lineActual(line.id);
                              const totV = sumV(line.v), totA = sumV(act);
                              return (
                                <div className="bt-line" key={line.id}>
                                  <div className="bt-label-col"><span className="bt-line-indent"/><span className="line-label">{line.name}</span></div>
                                  <div className="bt-scroll-area">
                                    <div className={`bt-cmp-pair ${diffClass(totV,totA)}`}>
                                      <span>{totV?fmtN(totV):"–"}</span>
                                      <span>{totA?fmtN(totA):"–"}</span>
                                      <span className="diff">{pct(totA,totV)}</span>
                                    </div>
                                    {Array.from({length:REALIZED_THRU},(_,mi)=>(
                                      <div className={`bt-cmp-pair ${diffClass(line.v[mi],act[mi])}`} key={mi}>
                                        <span>{line.v[mi]?fmtN(line.v[mi]):"–"}</span>
                                        <span>{act[mi]?fmtN(act[mi]):"–"}</span>
                                        <span className="diff">{pct(act[mi],line.v[mi])}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      {directLines.map(line=>{
                        const act = lineActual(line.id);
                        const totV = sumV(line.v), totA = sumV(act);
                        return (
                          <div className="bt-line direct" key={line.id}>
                            <div className="bt-label-col"><span className="bt-line-indent"/><span className="line-label">{line.name}</span></div>
                            <div className="bt-scroll-area">
                              <div className={`bt-cmp-pair ${diffClass(totV,totA)}`}>
                                <span>{totV?fmtN(totV):"–"}</span><span>{totA?fmtN(totA):"–"}</span><span className="diff">{pct(totA,totV)}</span>
                              </div>
                              {Array.from({length:REALIZED_THRU},(_,mi)=>(
                                <div className={`bt-cmp-pair ${diffClass(line.v[mi],act[mi])}`} key={mi}>
                                  <span>{line.v[mi]?fmtN(line.v[mi]):"–"}</span>
                                  <span>{act[mi]?fmtN(act[mi]):"–"}</span>
                                  <span className="diff">{pct(act[mi],line.v[mi])}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </main>
  );
}

// ─── SummaryPage ──────────────────────────────────────────────────────────────
function SummaryPage({ version, areas, groups, lines, actuals }) {
  const vAreas = areas.filter(a=>a.vId===version.id);
  const lineActual = id => actuals[id] ?? Array(12).fill(0);

  const rows = useMemo(()=>SECTIONS.map(sec=>{
    const secAreas = vAreas.filter(a=>a.sId===sec.id);
    const areaRows = secAreas.map(area=>{
      const gLineIds = groups.filter(g=>g.aId===area.id).flatMap(g=>lines.filter(l=>l.pid===g.id&&l.pt==="g").map(l=>l.id));
      const dLineIds = lines.filter(l=>l.pid===area.id&&l.pt==="a").map(l=>l.id);
      const all = [...gLineIds,...dLineIds];
      const orc = all.reduce((s,id)=>s+sumV(lines.find(l=>l.id===id)?.v??[]),0);
      const real= all.reduce((s,id)=>s+sumV(lineActual(id)),0);
      return { id:area.id, name:area.name, orc, real, aderencia: orc?real/orc:0 };
    });
    const totOrc = areaRows.reduce((s,r)=>s+r.orc,0);
    const totReal = areaRows.reduce((s,r)=>s+r.real,0);
    return { sec, areaRows, totOrc, totReal };
  }),[vAreas,groups,lines,actuals]);

  const grandOrc  = rows.filter(r=>r.sec.kind==="expense").reduce((s,r)=>s+r.totOrc,0);
  const grandReal = rows.filter(r=>r.sec.kind==="expense").reduce((s,r)=>s+r.totReal,0);
  const recOrc    = rows.find(r=>r.sec.id==="receitas")?.totOrc??0;
  const recReal   = rows.find(r=>r.sec.id==="receitas")?.totReal??0;

  return (
    <main className="page">
      <div className="page-title">
        <div><h1>Resumo por Área</h1><p>Totais orçados e realizados · acumulado até {MONTHS[REALIZED_THRU-1]} · {version.year}</p></div>
      </div>
      <div className="summary-kpis">
        <KPI label="Receita orçada"   value={fmt(recOrc)}   />
        <KPI label="Receita realizada" value={fmt(recReal)}  positive />
        <KPI label="Despesas orçadas" value={fmt(grandOrc)} />
        <KPI label="Despesas realizadas" value={fmt(grandReal)} />
        <KPI label="Resultado orçado" value={fmt(recOrc-grandOrc)} positive />
        <KPI label="Resultado realizado" value={fmt(recReal-grandReal)} positive />
      </div>
      {rows.map(({sec,areaRows,totOrc,totReal})=>(
        <div className="summary-section" key={sec.id}>
          <div className="summary-section-header">
            <span>{sec.label}</span>
            <span>{fmt(totOrc)}</span>
            <span>{fmt(totReal)}</span>
            <span/>
          </div>
          <table className="summary-table">
            <thead>
              <tr><th>Área</th><th>Orçado anual</th><th>Realizado acum.</th><th>Aderência</th><th>Barra</th></tr>
            </thead>
            <tbody>
              {areaRows.map(r=>(
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="mono">{fmt(r.orc)}</td>
                  <td className="mono">{fmt(r.real)}</td>
                  <td className={`mono ${r.aderencia>1?"over":r.aderencia>0.9?"":"under"}`}>{(r.aderencia*100).toFixed(1).replace(".",",")}%</td>
                  <td><div className="adh-bar"><div className={r.aderencia>1?"fill over":"fill"} style={{width:`${Math.min(r.aderencia,1)*100}%`}}/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}

function KPI({ label, value, positive=false }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={positive?"positive":""}>{value}</strong>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App({ sessionEmail=null, onSignOut=null }={}) {
  const [versions] = useState(SEED_VERSIONS);
  const [version, setVersion] = useState(SEED_VERSIONS[0]);
  const [areas,   setAreas]   = useState(SEED_AREAS);
  const [groups,  setGroups]  = useState(SEED_GROUPS);
  const [lines,   setLines]   = useState(SEED_LINES);
  const [actuals, setActuals] = useState(SEED_ACTUALS);
  const [view,    setView]    = useState("budget");

  return (
    <div className="granatum-shell">
      <Header version={version} versions={versions} setVersion={setVersion} view={view} setView={setView} sessionEmail={sessionEmail} onSignOut={onSignOut} />
      {view==="budget"     && <BudgetPage     version={version} areas={areas} setAreas={setAreas} groups={groups} setGroups={setGroups} lines={lines} setLines={setLines} />}
      {view==="realized"   && <RealizedPage   version={version} areas={areas} groups={groups} lines={lines} actuals={actuals} setActuals={setActuals} />}
      {view==="comparison" && <ComparisonPage version={version} areas={areas} groups={groups} lines={lines} actuals={actuals} />}
      {view==="summary"    && <SummaryPage    version={version} areas={areas} groups={groups} lines={lines} actuals={actuals} />}
    </div>
  );
}
