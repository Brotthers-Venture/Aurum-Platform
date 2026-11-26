/**
 * Report Studio — the report's language. The page chrome, figure labels, table headings, chart labels and number,
 * currency and date formats follow the report's locale (English or Brazilian Portuguese). Text a person writes is
 * never machine-translated: templates create their text in the chosen language, and edited text stays as written.
 */
import type { Period } from "@/lib/reporting/figures";
import type { ValueStatus } from "./data";

export type Locale = "en" | "pt";
export const LOCALES: [Locale, string][] = [
  ["en", "English"],
  ["pt", "Português (Brasil)"],
];

type Cur = "USD" | "BRL";
const SYM: Record<Locale, Record<Cur, string>> = { en: { USD: "$", BRL: "R$ " }, pt: { USD: "US$ ", BRL: "R$ " } };
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const ORD_EN = ["first", "second", "third", "fourth"];
const ORD_PT = ["primeiro", "segundo", "terceiro", "quarto"];

export type Fmt = {
  locale: Locale;
  num: (v: number, digits?: number) => string;
  money: (v: number, cur: Cur) => string;
  short: (v: number, cur: Cur) => string;
  pct: (v: number, digits?: number) => string;
  mult: (v: number) => string;
  /** dates in tables and captions */
  date: (iso: string) => string;
  /** dates in running text and on the cover */
  dateLong: (iso: string) => string;
  /** "Q3 2026" / "3T 2026" */
  period: (p: Period) => string;
  /** "third quarter of 2026" / "terceiro trimestre de 2026" */
  quarterWords: (p: Period) => string;
};

const fmts = new Map<Locale, Fmt>();
export function formatter(locale: Locale = "en"): Fmt {
  const hit = fmts.get(locale);
  if (hit) return hit;
  const tag = locale === "pt" ? "pt-BR" : "en-US";
  const nf = (d: number) => new Intl.NumberFormat(tag, { minimumFractionDigits: d, maximumFractionDigits: d });
  const num = (v: number, d = 0) => nf(d).format(v);
  const money = (v: number, cur: Cur) => {
    const s = `${SYM[locale][cur]}${num(Math.abs(v))}`;
    return v < 0 ? `(${s})` : s;
  };
  const short = (v: number, cur: Cur) => {
    const a = Math.abs(v);
    const [n, d, u] =
      a >= 1e9
        ? [a / 1e9, 2, locale === "pt" ? " bi" : "B"]
        : a >= 1e6
          ? [a / 1e6, 1, locale === "pt" ? " mi" : "M"]
          : a >= 1e3
            ? [a / 1e3, 0, locale === "pt" ? " mil" : "K"]
            : [a, 0, ""];
    return `${v < 0 ? "−" : ""}${SYM[locale][cur]}${num(n as number, d as number)}${u}`;
  };
  const split = (p: Period) => p.split("-Q").map(Number) as [number, number];
  const f: Fmt = {
    locale,
    num,
    money,
    short,
    pct: (v, d = 1) => (Number.isFinite(v) ? `${num(v * 100, d)}%` : "—"),
    mult: (v) => (Number.isFinite(v) ? `${num(v, 2)}x` : "—"),
    date: (iso) => {
      if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
      const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
      return locale === "pt" ? `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}` : `${MONTHS_EN[m - 1]} ${d}, ${y}`;
    },
    dateLong: (iso) => {
      if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
      const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
      return locale === "pt" ? `${d} de ${MONTHS_PT[m - 1]} de ${y}` : `${MONTHS_EN[m - 1]} ${d}, ${y}`;
    },
    period: (p) => {
      const [y, q] = split(p);
      return locale === "pt" ? `${q}T ${y}` : `Q${q} ${y}`;
    },
    quarterWords: (p) => {
      const [y, q] = split(p);
      return locale === "pt" ? `${ORD_PT[q - 1]} trimestre de ${y}` : `${ORD_EN[q - 1]} quarter of ${y}`;
    },
  };
  fmts.set(locale, f);
  return f;
}

/** Page and table wording, by language. */
export const WORDS = {
  en: {
    status: { final: "Final", preliminary: "Preliminary", estimated: "Estimated", unavailable: "Unavailable", illustrative: "Illustrative" } as Record<ValueStatus, string>,
    confidential: "Confidential",
    reportingPeriod: "Reporting period",
    asOf: "as of",
    asOfCap: "As of",
    nav: "Net asset value",
    netWorth: "Net worth",
    preparedFor: "Prepared for",
    lps: "The limited partners",
    family: "The family",
    gp: "The general partner",
    prospective: "Prospective investors",
    administeredBy: (n: string) => `Administered by ${n}`,
    preparedBy: (owner: string, admin: string) => `Prepared by ${admin} as fund administrator for ${owner}.`,
    preparedByFamily: (owner: string) => `Prepared by ${owner} for the family and its advisers.`,
    figuresAre: (s: ValueStatus) => `Figures are ${s} until the quarter is closed.`,
    importantInfo: "Important information",
    commentarySupplied: "Commentary is supplied by the investment manager.",
    theManager: "The manager",
    suppliedByManager: "Commentary supplied by the investment manager",
    suppliedByAdmin: "Prepared by the administrator",
    source: (d: string) => `Source: fund ledger, as of ${d}.`,
    sourceFamily: (d: string) => `Source: custodian statements and recorded valuations, as of ${d}.`,
    inThisReport: "In this report",
    name: "Name",
    total: "Total",
    measure: "Measure",
    value: "Value",
    basis: "Basis",
    notAvailable: "Not available —",
    call: "Call",
    notice: "Notice",
    purpose: "Purpose",
    amount: "Amount",
    noCalls: (d: string) => `No capital calls up to ${d}.`,
    noDist: (d: string) => `No distributions up to ${d}.`,
    date: "Date",
    type: "Type",
    sourceH: "Source",
    investment: "Investment",
    firstInvested: "First invested",
    cost: "Cost",
    shareOfCost: "Share of cost",
    figure: "Figures",
    asOfH: "As of",
    statusH: "Status",
    costOf: (v: string) => `Cost ${v}`,
    ofInvested: (v: string) => `${v} of capital invested`,
    since: (d: string) => `Since ${d}`,
    partner: "Partner",
    commitment: "Commitment",
    paidIn: "Paid-in",
    unfunded: "Unfunded",
    distributed: "Distributed",
    share: "Share",
    quarter: "Quarter",
    fees: "Management fees",
    expenses: "Fund expenses",
    thisYear: (y: number) => `Year to date ${y}`,
    sinceInception: "Since inception",
    assetClass: "Asset class",
    resultYtd: "Result year to date",
    entity: "Entity",
    kind: "Form",
    where: "Jurisdiction",
    netHeld: "Net held directly",
    lender: "Lender",
    rate: "Rate",
    matures: "Matures",
    noLiabilities: "No borrowing is recorded.",
    exposure: { sector: "Sector", geography: "Region", currency: "Currency" } as Record<string, string>,
    exposureOf: (d: string) => `Exposure by ${d.toLowerCase()}`,
    statement: {
      title: "Capital account",
      opening: (d: string) => `Capital account at ${d}`,
      contributions: "Contributions",
      distributions: "Distributions",
      result: "Allocated net result",
      closing: (d: string) => `Capital account at ${d}`,
      position: "Commitment and position",
      shareOf: "Share of the fund",
      unknown: "This report is not addressed to a partner of the fund. Choose the partner on the report.",
    },
    digital: {
      figuresAsOf: (d: string) => `figures as of ${d}`,
      documents: "Documents",
      documentsFor: (n: string) => `Notices, statements and reports for ${n} referred to in this report.`,
      noDocs: "No other documents yet.",
      open: "Open",
      pdf: "PDF edition",
      more: "Show all rows",
      less: "Show less",
    },
    lines: {
      cash: "Cash and cash equivalents",
      investments_cost: "Investments, at cost",
      unrealized: "Unrealized appreciation",
      receivable: "Capital contributions receivable",
      total_assets: "Total assets",
      liabilities: "Liabilities",
      partners_capital: "Partners’ capital",
      income: "Investment income",
      realized: "Net realized gain",
      unrealized_change: "Net change in unrealized appreciation",
      fees: "Management fees",
      expenses: "Fund expenses",
      organizational: "Organizational costs",
      net_result: "Net result",
    } as Record<string, string>,
    terms: {
      "Legal form": "Legal form",
      Domicile: "Domicile",
      Vintage: "Vintage",
      Strategy: "Strategy",
      Currency: "Currency",
      "Target size": "Target size",
      "Management fee": "Management fee",
      "Carried interest": "Carried interest",
      "Preferred return": "Preferred return",
      Term: "Term",
      Auditor: "Auditor",
      Administrator: "Administrator",
    } as Record<string, string>,
    chart: {
      navAria: "Net asset value and paid-in capital by quarter",
      nav: "NAV",
      paidIn: "Paid-in",
      utilAria: "Commitment utilization by quarter",
      flowsAria: "Contributions and distributions by quarter",
      contributions: "Contributions",
      distributions: "Distributions",
      allocAria: "Investments at cost",
      bridgeAria: "Net asset value bridge for the quarter",
      open: "Opening NAV",
      result: "Net result",
      close: "Closing NAV",
      jAria: "Cumulative net cash flow to partners by quarter",
      net: "Net cash flow",
      twoQuarters: "Two or more quarters are needed to draw this chart.",
      noHoldings: "No investments are recorded yet.",
      noBridge: "The quarter’s opening position isn’t available.",
      noCommitments: "No commitments recorded yet.",
      noActivity: "No capital activity in the periods shown.",
    },
  },
  pt: {
    status: { final: "Final", preliminary: "Preliminar", estimated: "Estimado", unavailable: "Indisponível", illustrative: "Ilustrativo" } as Record<ValueStatus, string>,
    confidential: "Confidencial",
    reportingPeriod: "Período",
    asOf: "em",
    asOfCap: "Posição em",
    nav: "Patrimônio líquido",
    netWorth: "Patrimônio líquido",
    preparedFor: "Destinado a",
    lps: "Os cotistas",
    family: "A família",
    gp: "O gestor",
    prospective: "Potenciais investidores",
    administeredBy: (n: string) => `Administrado por ${n}`,
    preparedBy: (owner: string, admin: string) => `Preparado por ${admin}, administradora do fundo, para ${owner}.`,
    preparedByFamily: (owner: string) => `Preparado por ${owner} para a família e seus assessores.`,
    figuresAre: (s: ValueStatus) =>
      `Os valores são ${({ preliminary: "preliminares", estimated: "estimados", illustrative: "ilustrativos" } as Record<string, string>)[s] ?? s} até o fechamento do trimestre.`,
    importantInfo: "Informações importantes",
    commentarySupplied: "Os comentários são fornecidos pelo gestor.",
    theManager: "O gestor",
    suppliedByManager: "Comentário fornecido pelo gestor",
    suppliedByAdmin: "Preparado pela administradora",
    source: (d: string) => `Fonte: livros do fundo, posição em ${d}.`,
    sourceFamily: (d: string) => `Fonte: extratos dos custodiantes e avaliações registradas, posição em ${d}.`,
    inThisReport: "Neste relatório",
    name: "Nome",
    total: "Total",
    measure: "Indicador",
    value: "Valor",
    basis: "Base de cálculo",
    notAvailable: "Indisponível —",
    call: "Chamada",
    notice: "Aviso",
    purpose: "Finalidade",
    amount: "Valor",
    noCalls: (d: string) => `Nenhuma chamada de capital até ${d}.`,
    noDist: (d: string) => `Nenhuma distribuição até ${d}.`,
    date: "Data",
    type: "Tipo",
    sourceH: "Origem",
    investment: "Investimento",
    firstInvested: "Primeiro aporte",
    cost: "Custo",
    shareOfCost: "Participação no custo",
    figure: "Indicadores",
    asOfH: "Data-base",
    statusH: "Situação",
    costOf: (v: string) => `Custo ${v}`,
    ofInvested: (v: string) => `${v} do capital investido`,
    since: (d: string) => `Desde ${d}`,
    partner: "Cotista",
    commitment: "Compromisso",
    paidIn: "Integralizado",
    unfunded: "A integralizar",
    distributed: "Distribuído",
    share: "Participação",
    quarter: "Trimestre",
    fees: "Taxa de gestão",
    expenses: "Despesas do fundo",
    thisYear: (y: number) => `No ano de ${y}`,
    sinceInception: "Desde o início",
    assetClass: "Classe de ativo",
    resultYtd: "Resultado no ano",
    entity: "Entidade",
    kind: "Forma",
    where: "Jurisdição",
    netHeld: "Valor líquido detido",
    lender: "Credor",
    rate: "Taxa",
    matures: "Vencimento",
    noLiabilities: "Não há endividamento registrado.",
    exposure: { sector: "Setor", geography: "Região", currency: "Moeda" } as Record<string, string>,
    exposureOf: (d: string) => `Exposição por ${d.toLowerCase()}`,
    statement: {
      title: "Conta de capital",
      opening: (d: string) => `Saldo em ${d}`,
      contributions: "Integralizações",
      distributions: "Distribuições",
      result: "Resultado líquido alocado",
      closing: (d: string) => `Saldo em ${d}`,
      position: "Compromisso e posição",
      shareOf: "Participação no fundo",
      unknown: "Este relatório não está endereçado a um cotista do fundo. Escolha o cotista no relatório.",
    },
    digital: {
      figuresAsOf: (d: string) => `valores em ${d}`,
      documents: "Documentos",
      documentsFor: (n: string) => `Avisos, extratos e relatórios do ${n} mencionados neste relatório.`,
      noDocs: "Ainda não há outros documentos.",
      open: "Abrir",
      pdf: "Edição em PDF",
      more: "Mostrar todas as linhas",
      less: "Mostrar menos",
    },
    lines: {
      cash: "Caixa e equivalentes",
      investments_cost: "Investimentos, ao custo",
      unrealized: "Valorização não realizada",
      receivable: "Integralizações a receber",
      total_assets: "Total do ativo",
      liabilities: "Passivos",
      partners_capital: "Patrimônio dos cotistas",
      income: "Receitas de investimentos",
      realized: "Ganho realizado líquido",
      unrealized_change: "Variação líquida não realizada",
      fees: "Taxa de gestão",
      expenses: "Despesas do fundo",
      organizational: "Custos de constituição",
      net_result: "Resultado líquido",
    } as Record<string, string>,
    terms: {
      "Legal form": "Forma jurídica",
      Domicile: "Domicílio",
      Vintage: "Safra",
      Strategy: "Estratégia",
      Currency: "Moeda",
      "Target size": "Captação-alvo",
      "Management fee": "Taxa de gestão",
      "Carried interest": "Taxa de performance",
      "Preferred return": "Retorno preferencial",
      Term: "Prazo",
      Auditor: "Auditor",
      Administrator: "Administradora",
    } as Record<string, string>,
    chart: {
      navAria: "Patrimônio líquido e capital integralizado por trimestre",
      nav: "PL",
      paidIn: "Integralizado",
      utilAria: "Utilização do compromisso por trimestre",
      flowsAria: "Integralizações e distribuições por trimestre",
      contributions: "Integralizações",
      distributions: "Distribuições",
      allocAria: "Investimentos ao custo",
      bridgeAria: "Evolução do patrimônio líquido no trimestre",
      open: "PL inicial",
      result: "Resultado",
      close: "PL final",
      jAria: "Fluxo de caixa líquido acumulado dos cotistas por trimestre",
      net: "Fluxo líquido",
      twoQuarters: "São necessários dois ou mais trimestres para este gráfico.",
      noHoldings: "Nenhum investimento registrado.",
      noBridge: "A posição inicial do trimestre não está disponível.",
      noCommitments: "Nenhum compromisso registrado.",
      noActivity: "Nenhuma movimentação de capital no período.",
    },
  },
};
export type Words = (typeof WORDS)["en"];

/** Figure labels in Portuguese; English labels come from the data layer. */
const METRIC_PT: Record<string, string> = {
  fund: "Nome do fundo",
  gp: "Gestor",
  quarter: "Trimestre",
  period_name: "Período",
  period_end: "Data-base",
  lps: "Cotistas",
  nav: "Patrimônio líquido",
  commitments: "Compromissos totais",
  called: "Capital integralizado",
  called_pct: "Parcela integralizada",
  unfunded: "Compromissos a integralizar",
  distributed: "Distribuições acumuladas",
  tvpi: "TVPI",
  dpi: "DPI",
  rvpi: "RVPI",
  moic: "MOIC (líquido)",
  net_irr: "TIR líquida",
  gross_irr: "TIR bruta",
  benchmark: "Retorno do benchmark",
  q_called: "Chamado no trimestre",
  q_distributed: "Distribuído no trimestre",
  q_pnl: "Resultado líquido no trimestre",
  q_unrealized: "Variação não realizada no trimestre",
  q_fees: "Taxa de gestão no trimestre",
  cash: "Caixa e equivalentes",
  investments_cost: "Investimentos ao custo",
  unrealized: "Valorização não realizada",
  fees_total: "Taxas de gestão acumuladas",
  expenses_total: "Despesas acumuladas",
  aua: "Ativos sob administração",
  net_worth: "Patrimônio líquido",
  gross_assets: "Ativos totais",
  liabilities_total: "Passivos",
  liquid: "Ativos líquidos",
  liquid_pct: "Parcela líquida",
  ytd_return: "Resultado dos investimentos no ano",
  ytd_flows: "Aportes e retiradas no ano",
  ytd_fx: "Efeito cambial no ano",
  ytd_change: "Variação no ano",
  entities: "Entidades",
  assets_count: "Ativos",
};

export function metricLabel(key: string, english: string, locale: Locale = "en") {
  if (locale === "en") return english;
  if (key === "aua") return `${METRIC_PT.aua}${english.includes("(") ? ` ${english.slice(english.indexOf("("))}` : ""}`;
  return METRIC_PT[key] ?? english;
}

/** Portuguese for the calculation notes shown in the performance table. */
const METHOD_PT: Record<string, string> = {
  net_irr:
    "Taxa interna de retorno anualizada sobre integralizações e distribuições datadas, com o patrimônio líquido como valor terminal. Não exibida para fundos com menos de três meses.",
  gross_irr: "Requer fluxos de caixa e avaliações por investimento, ainda não registrados para este fundo.",
  tvpi: "(Patrimônio líquido + distribuições acumuladas) ÷ capital integralizado.",
  dpi: "Distribuições acumuladas ÷ capital integralizado.",
  rvpi: "Patrimônio líquido ÷ capital integralizado.",
  moic: "(Patrimônio líquido + distribuições) ÷ capital integralizado, líquido de taxas e despesas.",
  benchmark: "Nenhum benchmark configurado para este fundo.",
};
export const metricMethod = (key: string, english: string, locale: Locale = "en") => (locale === "pt" ? (METHOD_PT[key] ?? english) : english);

const SOURCE_PT: [RegExp, string][] = [
  [/^Fund ledger and capital accounts.*/, "Livros e contas de capital do fundo, administrados pela Aurum"],
  [/^Fund record$/, "Cadastro do fundo"],
  [/^Partner cash flows.*/, "Fluxos de caixa dos cotistas nas contas de capital"],
  [/^Investment-level cash flows$/, "Fluxos de caixa por investimento"],
  [/^Ledger accounts? (.*)$/, "Contas contábeis $1"],
  [/^Benchmark provider$/, "Provedor de benchmark"],
];
export function metricSource(english: string, locale: Locale = "en") {
  if (locale === "en") return english;
  for (const [re, pt] of SOURCE_PT) if (re.test(english)) return english.replace(re, pt).replace(" and ", " e ");
  return english;
}
