/**
 * Report Studio — the nine templates. Each builds pages of typed blocks from the subject's records and the period's
 * data, in English or Brazilian Portuguese. Figures are never written into the text: paragraphs carry {{keys}} that the
 * renderer fills from the data layer, so a template never states a number it can't trace to the books.
 */
import { fundById } from "@/lib/data";
import type { Period } from "@/lib/reporting/figures";
import type { ReportData } from "./data";
import { formatter, type Locale } from "./i18n";
import type { Block, Page, TemplateId } from "./model";

type Opts = { subjectId: string; period: Period; data: ReportData; signer: string; locale: Locale; investorId?: string };

/** The document's title, as on the cover and in the running header. */
export function templateTitle(t: TemplateId, locale: Locale = "en") {
  const en: Record<TemplateId, string> = {
    "quarterly-fund": "Quarterly Report",
    "annual-fund": "Annual Report",
    "capital-account": "Capital Account Statement",
    "portfolio-performance": "Portfolio Performance",
    "family-wealth": "Consolidated Wealth Report",
    factsheet: "Factsheet",
    "capital-activity": "Capital Activity Report",
    "gp-management": "Management Report",
    "investor-letter": "Letter to Partners",
  };
  const pt: Record<TemplateId, string> = {
    "quarterly-fund": "Relatório Trimestral",
    "annual-fund": "Relatório Anual",
    "capital-account": "Extrato da Conta de Capital",
    "portfolio-performance": "Desempenho da Carteira",
    "family-wealth": "Relatório Patrimonial Consolidado",
    factsheet: "Lâmina",
    "capital-activity": "Relatório de Movimentação de Capital",
    "gp-management": "Relatório Gerencial",
    "investor-letter": "Carta aos Cotistas",
  };
  return (locale === "pt" ? pt : en)[t];
}

/** Manager-supplied narrative for the demo funds; elsewhere commentary is left for the manager. */
const NARRATIVE: Record<string, Record<Locale, { commentary: string; updates: string[] }>> = {
  "stx-brazil-housing": {
    en: {
      commentary:
        "The quarter was defined by steady execution across the portfolio. Phase I unit sales completed ahead of schedule, allowing the fund’s first distribution to partners, while construction of phase II remained on budget. We continue to see strong demand for affordable housing in our target metropolitan regions.",
      // in the order of the holdings (largest cost first): phase I, land and permits, phase II
      updates: [
        "All units were delivered and the final sales closed in September, generating the fund’s first distribution.",
        "Permits for the remaining plots were confirmed during the quarter; site preparation begins in the first quarter of next year.",
        "Structural works reached the fourth floor; the project remains on schedule and within budget.",
      ],
    },
    pt: {
      commentary:
        "O trimestre foi marcado pela execução consistente em toda a carteira. As vendas das unidades da fase I foram concluídas antes do previsto, permitindo a primeira distribuição aos cotistas, e as obras da fase II seguiram dentro do orçamento. A demanda por habitação econômica nas regiões metropolitanas em que atuamos continua forte.",
      updates: [
        "Todas as unidades foram entregues e as últimas vendas foram concluídas em setembro, gerando a primeira distribuição do fundo.",
        "As licenças dos lotes restantes foram confirmadas no trimestre; a preparação dos terrenos começa no primeiro trimestre do próximo ano.",
        "A estrutura chegou ao quarto pavimento; o projeto segue dentro do cronograma e do orçamento.",
      ],
    },
  },
};

const ADMIN_SIGNER = "Luiza Andrade";

export function buildTemplate(t: TemplateId, o: Opts): Page[] {
  switch (t) {
    case "quarterly-fund":
      return quarterly(o);
    case "annual-fund":
      return annual(o);
    case "capital-account":
      return capitalAccount(o);
    case "portfolio-performance":
      return portfolio(o);
    case "family-wealth":
      return family(o);
    case "factsheet":
      return factsheet(o);
    case "capital-activity":
      return activity(o);
    case "gp-management":
      return management(o);
    case "investor-letter":
      return letter(o);
  }
}

/* ───────── shared pieces ───────── */

const tr = (l: Locale) => (en: string, pt: string) => (l === "pt" ? pt : en);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function cover(t: TemplateId, o: Opts, subtitle?: string): Page {
  const f = formatter(o.locale);
  return {
    id: "p-cover",
    title: tr(o.locale)("Cover", "Capa"),
    blocks: [{ id: "cover", type: "cover", title: templateTitle(t, o.locale), subtitle: subtitle ?? cap(f.quarterWords(o.period)) }],
  };
}

function overview(o: Opts) {
  const fund = fundById(o.subjectId)!;
  const [what, where] = fund.strategy.split(" — ");
  if (o.locale === "pt")
    return `{{fund}} é um veículo ${fund.legalForm} domiciliado em ${fund.domicile}, safra ${fund.vintage}, gerido por {{gp}} e administrado pela Aurum Asset Management. Estratégia: ${what}${where ? ` (${where})` : ""}.`;
  const focus = `${what.charAt(0).toLowerCase()}${what.slice(1)}${where ? ` in ${where}` : ""}`;
  return `{{fund}} invests in ${focus}. It is a ${fund.legalForm.toLowerCase()} domiciled in ${fund.domicile}, of vintage ${fund.vintage}, managed by {{gp}} and administered by Aurum Asset Management.`;
}

function disclosures(o: Opts, audience: "lps" | "gp" | "prospective" | "family" | "partner" = "lps"): Block {
  const L = tr(o.locale);
  const who = {
    lps: L("the limited partners of the fund", "os cotistas do fundo"),
    partner: L("the partner to whom it is addressed", "o cotista a quem se destina"),
    gp: L("the general partner and its officers", "o gestor e seus diretores"),
    prospective: L("professional investors", "investidores profissionais"),
    family: L("the family and its advisers", "a família e seus assessores"),
  }[audience];
  return {
    id: "nd-disc",
    type: "disclosures",
    text:
      audience === "family"
        ? L(
            `This report is confidential and intended solely for ${who}. Values are converted into US dollars at indicative rates; private assets are carried at their latest recorded valuation, which may differ from the price at which they could be sold. It is not tax or legal advice.`,
            `Este relatório é confidencial e destina-se exclusivamente a ${who}. Os valores são convertidos para dólares americanos a taxas indicativas; ativos privados constam pela última avaliação registrada, que pode diferir do preço de venda. Não constitui assessoria fiscal ou jurídica.`,
          )
        : L(
            `This report is confidential and intended solely for ${who}. It does not constitute an offer to sell or a solicitation of an offer to buy any security. Past performance is not indicative of future results. Valuations of unrealized investments are estimates and may differ from the values ultimately realized.`,
            `Este relatório é confidencial e destina-se exclusivamente a ${who}. Não constitui oferta de venda nem solicitação de oferta de compra de qualquer valor mobiliário. Rentabilidade passada não é garantia de rentabilidade futura. As avaliações de investimentos não realizados são estimativas e podem diferir dos valores efetivamente realizados.`,
          ),
  };
}

function basis(o: Opts): Block {
  const L = tr(o.locale);
  return {
    id: "nd-basis",
    type: "notes",
    title: L("Basis of preparation", "Base de preparação"),
    text: L(
      `Figures are prepared by the fund administrator from the fund’s books as of the period end, in ${o.data.currency}. Net asset value is the sum of the partners’ capital accounts. Performance measures are net of management fees, fund expenses and carried interest where applicable.`,
      `Os valores são preparados pela administradora a partir dos livros do fundo na data-base, em ${o.data.currency}. O patrimônio líquido é a soma das contas de capital dos cotistas. Os indicadores de desempenho são líquidos de taxa de gestão, despesas do fundo e taxa de performance, quando aplicável.`,
    ),
  };
}

function signature(o: Opts): Block {
  const L = tr(o.locale);
  const fund = fundById(o.subjectId);
  return {
    id: "nd-sig",
    type: "signature",
    signers: [
      { name: o.signer, role: fund ? L(`${fund.manager}, general partner`, `${fund.manager}, gestor`) : "" },
      { name: ADMIN_SIGNER, role: L("Head of Fund Services, Aurum Asset Management", "Diretora de Serviços Fiduciários, Aurum Asset Management") },
    ],
  };
}

function commentary(o: Opts, id = "summary-c"): Block {
  const fund = fundById(o.subjectId)!;
  return {
    id,
    type: "commentary",
    supplied: "manager",
    author: o.signer,
    role: tr(o.locale)(`On behalf of ${fund.manager}`, `Em nome de ${fund.manager}`),
    text: NARRATIVE[o.subjectId]?.[o.locale].commentary ?? "",
  };
}

function updates(o: Opts): Block {
  const story = NARRATIVE[o.subjectId]?.[o.locale];
  return { id: "iu-u", type: "holdings", updates: Object.fromEntries(o.data.holdings.map((h, i) => [h.name, story?.updates[i] ?? ""])) };
}

/* ───────── 1. Quarterly fund report ───────── */

function quarterly(o: Opts): Page[] {
  const L = tr(o.locale);
  const hasDist = o.data.distributions.length > 0;
  return [
    cover("quarterly-fund", o),
    {
      id: "p-summary",
      title: L("Executive summary", "Resumo executivo"),
      blocks: [
        { id: "summary-h", type: "heading", kicker: "01", text: L("Executive summary", "Resumo executivo") },
        {
          id: "summary-p",
          type: "paragraph",
          text: L(
            "At the end of {{period_name}}, {{fund}} reported a net asset value of {{nav}}. Partners have contributed {{called}} of {{commitments}} committed, and the fund has returned {{distributed}} to date.",
            "Ao final do {{period_name}}, o {{fund}} registrou patrimônio líquido de {{nav}}. Os cotistas integralizaram {{called}} de {{commitments}} comprometidos, e o fundo distribuiu {{distributed}} até a data.",
          ),
        },
        { id: "summary-k", type: "kpis", keys: ["nav", "net_irr", "tvpi", "dpi"] },
        commentary(o),
        { id: "toc", type: "toc" },
      ],
    },
    {
      id: "p-overview",
      title: L("Fund overview", "Visão geral do fundo"),
      blocks: [
        { id: "ov-h", type: "heading", kicker: "02", text: L("Fund overview", "Visão geral do fundo") },
        { id: "ov-p", type: "paragraph", text: overview(o) },
        { id: "ov-t", type: "table", table: "terms", title: L("Key terms", "Principais termos") },
        { id: "ov-k", type: "kpis", keys: ["commitments", "called", "unfunded", "lps"] },
        {
          id: "ov-c",
          type: "chart",
          chart: "utilization",
          title: L("Commitment utilization", "Utilização do compromisso"),
          caption: L("Paid-in capital as a share of commitments at each quarter end.", "Capital integralizado como parcela dos compromissos ao fim de cada trimestre."),
        },
      ],
    },
    {
      id: "p-performance",
      title: L("Fund performance", "Desempenho do fundo"),
      blocks: [
        { id: "pf-h", type: "heading", kicker: "03", text: L("Fund performance", "Desempenho do fundo") },
        {
          id: "pf-c",
          type: "chart",
          chart: "nav",
          title: L("Net asset value and paid-in capital", "Patrimônio líquido e capital integralizado"),
          caption: L("Quarter-end net asset value against cumulative contributions.", "Patrimônio líquido ao fim de cada trimestre comparado às integralizações acumuladas."),
        },
        { id: "pf-t", type: "table", table: "performance", title: L("Performance summary", "Resumo de desempenho") },
        {
          id: "pf-p",
          type: "paragraph",
          text: L(
            "Net performance is calculated from partner cash flows after fees and expenses. The net result for the quarter was {{q_pnl}}, including a change in unrealized value of {{q_unrealized}}.",
            "O desempenho líquido é calculado a partir dos fluxos de caixa dos cotistas, após taxas e despesas. O resultado líquido do trimestre foi de {{q_pnl}}, incluindo variação não realizada de {{q_unrealized}}.",
          ),
        },
      ],
    },
    {
      id: "p-activity",
      title: L("Capital activity", "Movimentação de capital"),
      blocks: [
        { id: "ca-h", type: "heading", kicker: "04", text: L("Capital activity", "Movimentação de capital") },
        { id: "ca-k", type: "kpis", keys: ["q_called", "q_distributed", "called", "distributed"] },
        {
          id: "ca-c",
          type: "chart",
          chart: "flows",
          title: L("Contributions and distributions by quarter", "Integralizações e distribuições por trimestre"),
          caption: L("Capital called (above the line) and distributed (below) in each quarter.", "Capital chamado (acima da linha) e distribuído (abaixo) em cada trimestre."),
        },
        { id: "ca-t", type: "table", table: "calls", title: L("Capital calls", "Chamadas de capital") },
        ...(hasDist ? [{ id: "ca-d", type: "table" as const, table: "distributions" as const, title: L("Distributions", "Distribuições") }] : []),
      ],
    },
    {
      id: "p-portfolio",
      title: L("Portfolio allocation", "Alocação da carteira"),
      blocks: [
        { id: "po-h", type: "heading", kicker: "05", text: L("Portfolio allocation", "Alocação da carteira") },
        { id: "po-k", type: "kpis", keys: ["investments_cost", "unrealized", "cash", "nav"] },
        {
          id: "po-c",
          type: "chart",
          chart: "allocation",
          title: L("Investments at cost", "Investimentos ao custo"),
          caption: L("Share of capital invested, by investment, at cost.", "Participação no capital investido, por investimento, ao custo."),
        },
        { id: "po-t", type: "table", table: "holdings" },
        { id: "po-x", type: "exposure", dimension: "geography" },
      ],
    },
    {
      id: "p-updates",
      title: L("Investment updates", "Atualização dos investimentos"),
      blocks: [{ id: "iu-h", type: "heading", kicker: "06", text: L("Investment updates", "Atualização dos investimentos") }, updates(o)],
    },
    {
      id: "p-notes",
      title: L("Notes and disclosures", "Notas e informações"),
      blocks: [
        { id: "nd-h", type: "heading", kicker: "07", text: L("Financial notes and disclosures", "Notas e informações importantes") },
        basis(o),
        { id: "nd-src", type: "table", table: "sources", title: L("Data sources", "Fontes dos dados") },
        disclosures(o),
        signature(o),
      ],
    },
  ];
}

/* ───────── 2. Annual fund report ───────── */

function annual(o: Opts): Page[] {
  const L = tr(o.locale);
  const f = formatter(o.locale);
  const yearEnd = o.period.endsWith("Q4");
  const fund = fundById(o.subjectId)!;
  return [
    cover(
      "annual-fund",
      o,
      yearEnd
        ? L(`Year ended ${f.dateLong(o.data.asOf)}`, `Exercício encerrado em ${f.dateLong(o.data.asOf)}`)
        : L(`Year to ${f.dateLong(o.data.asOf)}`, `Ano até ${f.dateLong(o.data.asOf)}`),
    ),
    {
      id: "p-letter",
      title: L("The year in review", "O ano em revisão"),
      blocks: [
        { id: "an-h", type: "heading", kicker: "01", text: L("The year in review", "O ano em revisão") },
        commentary(o, "an-c"),
        {
          id: "an-p",
          type: "paragraph",
          text: L(
            `At ${f.dateLong(o.data.asOf)}, {{fund}} reported a net asset value of {{nav}}, a TVPI of {{tvpi}} and a DPI of {{dpi}}. Partners have paid in {{called}} of {{commitments}} committed.${yearEnd ? "" : " The year is not yet complete: figures are to the end of {{period_name}}.^[The annual report is drawn up to the latest closed quarter until the fourth quarter is closed and audited.]"}`,
            `Em ${f.dateLong(o.data.asOf)}, o {{fund}} registrou patrimônio líquido de {{nav}}, TVPI de {{tvpi}} e DPI de {{dpi}}. Os cotistas integralizaram {{called}} de {{commitments}} comprometidos.${yearEnd ? "" : " O exercício ainda não terminou: os valores vão até o fim do {{period_name}}.^[O relatório anual é preparado até o último trimestre fechado, até que o quarto trimestre seja fechado e auditado.]"}`,
          ),
        },
        { id: "toc", type: "toc" },
      ],
    },
    {
      id: "p-glance",
      title: L("The year at a glance", "O ano em números"),
      blocks: [
        { id: "gl-h", type: "heading", kicker: "02", text: L("The year at a glance", "O ano em números") },
        { id: "gl-k", type: "kpis", keys: ["nav", "net_irr", "tvpi", "dpi"] },
        { id: "gl-c", type: "chart", chart: "nav", title: L("Net asset value and paid-in capital", "Patrimônio líquido e capital integralizado") },
        {
          id: "gl-j",
          type: "chart",
          chart: "jcurve",
          title: L("Cumulative net cash flow to partners", "Fluxo de caixa líquido acumulado dos cotistas"),
          caption: L("Distributions less contributions, cumulative, at each quarter end.", "Distribuições menos integralizações, acumuladas, ao fim de cada trimestre."),
        },
      ],
    },
    {
      id: "p-statements",
      title: L("Financial statements", "Demonstrações financeiras"),
      blocks: [
        { id: "fs-h", type: "heading", kicker: "03", text: L("Financial statements", "Demonstrações financeiras") },
        { id: "fs-b", type: "table", table: "balance", title: L("Assets, liabilities and partners’ capital", "Ativos, passivos e patrimônio dos cotistas") },
        { id: "fs-o", type: "table", table: "operations", title: L("Statement of operations", "Demonstração do resultado") },
        {
          id: "fs-n",
          type: "notes",
          title: L("Unaudited", "Não auditado"),
          text: /^pending/i.test(fund.auditor)
            ? L(
                "These statements are drawn from the fund’s ledger and are unaudited. The fund’s auditor has not been appointed yet; audited statements follow once it is.",
                "Estas demonstrações são extraídas dos livros do fundo e não foram auditadas. O auditor do fundo ainda não foi nomeado; as demonstrações auditadas serão emitidas após a nomeação.",
              )
            : L(
                `These statements are drawn from the fund’s ledger and are unaudited. The audited financial statements are issued separately by ${fund.auditor}.`,
                `Estas demonstrações são extraídas dos livros do fundo e não foram auditadas. As demonstrações auditadas são emitidas separadamente por ${fund.auditor}.`,
              ),
        },
      ],
    },
    {
      id: "p-partners",
      title: L("Partners’ capital", "Capital dos cotistas"),
      blocks: [
        { id: "pc-h", type: "heading", kicker: "04", text: L("Partners’ capital", "Capital dos cotistas") },
        { id: "pc-k", type: "kpis", keys: ["commitments", "called", "unfunded", "lps"] },
        { id: "pc-t", type: "table", table: "partners" },
      ],
    },
    {
      id: "p-activity",
      title: L("Capital activity", "Movimentação de capital"),
      blocks: [
        { id: "ca-h", type: "heading", kicker: "05", text: L("Capital activity", "Movimentação de capital") },
        { id: "ca-c", type: "chart", chart: "flows", title: L("Contributions and distributions by quarter", "Integralizações e distribuições por trimestre") },
        { id: "ca-t", type: "table", table: "calls", title: L("Capital calls", "Chamadas de capital") },
        { id: "ca-d", type: "table", table: "distributions", title: L("Distributions", "Distribuições") },
      ],
    },
    {
      id: "p-portfolio",
      title: L("Portfolio", "Carteira"),
      blocks: [
        { id: "po-h", type: "heading", kicker: "06", text: L("Portfolio", "Carteira") },
        { id: "po-c", type: "chart", chart: "allocation", title: L("Investments at cost", "Investimentos ao custo") },
        { id: "po-t", type: "table", table: "holdings" },
      ],
    },
    {
      id: "p-updates",
      title: L("Investment updates", "Atualização dos investimentos"),
      blocks: [{ id: "iu-h", type: "heading", kicker: "07", text: L("Investment updates", "Atualização dos investimentos") }, updates(o)],
    },
    {
      id: "p-notes",
      title: L("Notes and disclosures", "Notas e informações"),
      blocks: [
        { id: "nd-h", type: "heading", kicker: "08", text: L("Notes and disclosures", "Notas e informações importantes") },
        basis(o),
        { id: "nd-src", type: "table", table: "sources", title: L("Data sources", "Fontes dos dados") },
        disclosures(o),
        signature(o),
      ],
    },
  ];
}

/* ───────── 3. Capital account statement ───────── */

function capitalAccount(o: Opts): Page[] {
  const L = tr(o.locale);
  const f = formatter(o.locale);
  const partner = o.data.partners.find((p) => p.investorId === o.investorId);
  return [
    {
      id: "p-statement",
      title: L("Statement", "Extrato"),
      blocks: [
        { id: "st-h", type: "heading", text: templateTitle("capital-account", o.locale) },
        {
          id: "st-p",
          type: "paragraph",
          text: L(
            `Prepared for **${partner?.name ?? "the partner"}**, a limited partner of {{fund}}, for the ${f.quarterWords(o.period)}. Amounts are in ${o.data.currency} and are the partner’s share of the fund as recorded in its capital account.`,
            `Preparado para **${partner?.name ?? "o cotista"}**, cotista do {{fund}}, referente ao ${f.quarterWords(o.period)}. Valores em ${o.data.currency}, correspondentes à participação do cotista registrada em sua conta de capital.`,
          ),
        },
        { id: "st-s", type: "statement" },
      ],
    },
    {
      id: "p-fund",
      title: L("The fund", "O fundo"),
      blocks: [
        { id: "fd-h", type: "heading", text: L("The fund as a whole", "O fundo como um todo") },
        { id: "fd-k", type: "kpis", keys: ["nav", "tvpi", "dpi", "called_pct"] },
        { id: "fd-t", type: "table", table: "performance", title: L("Fund performance", "Desempenho do fundo") },
        disclosures(o, "partner"),
      ],
    },
  ];
}

/* ───────── 4. Portfolio performance ───────── */

function portfolio(o: Opts): Page[] {
  const L = tr(o.locale);
  return [
    cover("portfolio-performance", o),
    {
      id: "p-returns",
      title: L("Returns", "Retornos"),
      blocks: [
        { id: "rt-h", type: "heading", kicker: "01", text: L("Returns", "Retornos") },
        { id: "rt-k", type: "kpis", keys: ["net_irr", "tvpi", "dpi", "moic"] },
        { id: "rt-t", type: "table", table: "performance", title: L("Performance summary", "Resumo de desempenho") },
        {
          id: "rt-b",
          type: "chart",
          chart: "bridge",
          title: L("Net asset value bridge for the quarter", "Evolução do patrimônio líquido no trimestre"),
          caption: L(
            "Opening and closing net asset value, with contributions, distributions and the net result between them.",
            "Patrimônio inicial e final, com integralizações, distribuições e o resultado líquido entre eles.",
          ),
        },
      ],
    },
    {
      id: "p-history",
      title: L("Valuation history", "Histórico de avaliação"),
      blocks: [
        { id: "hi-h", type: "heading", kicker: "02", text: L("Valuation history", "Histórico de avaliação") },
        { id: "hi-c", type: "chart", chart: "nav", title: L("Net asset value and paid-in capital", "Patrimônio líquido e capital integralizado") },
        {
          id: "hi-j",
          type: "chart",
          chart: "jcurve",
          title: L("Cumulative net cash flow to partners", "Fluxo de caixa líquido acumulado dos cotistas"),
          caption: L("Distributions less contributions, cumulative, at each quarter end.", "Distribuições menos integralizações, acumuladas, ao fim de cada trimestre."),
        },
      ],
    },
    {
      id: "p-investments",
      title: L("Investments", "Investimentos"),
      blocks: [
        { id: "in-h", type: "heading", kicker: "03", text: L("Investments", "Investimentos") },
        { id: "in-k", type: "kpis", keys: ["investments_cost", "unrealized", "cash"] },
        { id: "in-c", type: "chart", chart: "allocation", title: L("Investments at cost", "Investimentos ao custo") },
        { id: "in-t", type: "table", table: "holdings" },
      ],
    },
    {
      id: "p-updates",
      title: L("Investment updates", "Atualização dos investimentos"),
      blocks: [{ id: "iu-h", type: "heading", kicker: "04", text: L("Investment updates", "Atualização dos investimentos") }, updates(o)],
    },
    {
      id: "p-notes",
      title: L("Notes", "Notas"),
      blocks: [
        { id: "nd-h", type: "heading", kicker: "05", text: L("Method and sources", "Método e fontes") },
        {
          id: "nd-m",
          type: "notes",
          title: L("Method", "Método"),
          text: L(
            "Returns are net, from dated partner cash flows with net asset value as the terminal value. Gross, investment-level returns and benchmark comparisons are shown only when the underlying cash flows and a benchmark are recorded.",
            "Os retornos são líquidos, calculados a partir dos fluxos de caixa datados dos cotistas, com o patrimônio líquido como valor terminal. Retornos brutos por investimento e comparações com benchmark só são exibidos quando os fluxos e o benchmark estão registrados.",
          ),
        },
        { id: "nd-src", type: "table", table: "sources", title: L("Data sources", "Fontes dos dados") },
        disclosures(o),
      ],
    },
  ];
}

/* ───────── 5. Family office consolidated wealth ───────── */

function family(o: Opts): Page[] {
  const L = tr(o.locale);
  const f = formatter(o.locale);
  return [
    cover("family-wealth", o, L(`As of ${f.dateLong(o.data.asOf)}`, `Posição em ${f.dateLong(o.data.asOf)}`)),
    {
      id: "p-summary",
      title: L("Summary", "Resumo"),
      blocks: [
        { id: "fw-h", type: "heading", kicker: "01", text: L("Summary", "Resumo") },
        {
          id: "fw-p",
          type: "paragraph",
          text: L(
            "The {{fund}} held total assets of {{gross_assets}} and liabilities of {{liabilities_total}}, for a net worth of {{net_worth}}. Since 1 January the investment result was {{ytd_return}}, with {{ytd_flows}} of contributions and withdrawals and a currency effect of {{ytd_fx}}.^[Values in other currencies are converted into US dollars at indicative rates on the reporting date.]",
            "A {{fund}} detinha ativos totais de {{gross_assets}} e passivos de {{liabilities_total}}, com patrimônio líquido de {{net_worth}}. Desde 1º de janeiro, o resultado dos investimentos foi de {{ytd_return}}, com {{ytd_flows}} em aportes e retiradas e efeito cambial de {{ytd_fx}}.^[Valores em outras moedas são convertidos para dólares americanos a taxas indicativas na data-base.]",
          ),
        },
        { id: "fw-k", type: "kpis", keys: ["net_worth", "gross_assets", "liabilities_total", "liquid_pct"] },
        { id: "fw-k2", type: "kpis", keys: ["ytd_return", "ytd_flows", "ytd_fx", "ytd_change"] },
        { id: "toc", type: "toc" },
      ],
    },
    {
      id: "p-allocation",
      title: L("Allocation", "Alocação"),
      blocks: [
        { id: "al-h", type: "heading", kicker: "02", text: L("Allocation", "Alocação") },
        { id: "al-c", type: "chart", chart: "allocation", title: L("Assets by class", "Ativos por classe") },
        { id: "al-t", type: "table", table: "classes" },
      ],
    },
    {
      id: "p-exposure",
      title: L("Exposure", "Exposição"),
      blocks: [
        { id: "ex-h", type: "heading", kicker: "03", text: L("Currency and regional exposure", "Exposição por moeda e região") },
        { id: "ex-c", type: "exposure", dimension: "currency" },
        { id: "ex-r", type: "exposure", dimension: "geography" },
      ],
    },
    {
      id: "p-structure",
      title: L("Structure and borrowing", "Estrutura e endividamento"),
      blocks: [
        { id: "sb-h", type: "heading", kicker: "04", text: L("Structure and borrowing", "Estrutura e endividamento") },
        { id: "sb-e", type: "table", table: "entities", title: L("Holding structure", "Estrutura societária") },
        { id: "sb-l", type: "table", table: "liabilities", title: L("Borrowing", "Endividamento") },
      ],
    },
    {
      id: "p-notes",
      title: L("Notes", "Notas"),
      blocks: [
        { id: "nd-h", type: "heading", kicker: "05", text: L("Notes", "Notas") },
        {
          id: "nd-basis",
          type: "notes",
          title: L("Basis of preparation", "Base de preparação"),
          text: L(
            "Bankable assets are valued from custodian statements; private assets, property and direct holdings at their latest recorded valuation. Each position keeps its own valuation date in the family office records.",
            "Ativos financeiros são avaliados pelos extratos dos custodiantes; ativos privados, imóveis e participações diretas pela última avaliação registrada. Cada posição mantém sua própria data de avaliação nos registros do family office.",
          ),
        },
        { id: "nd-src", type: "table", table: "sources", title: L("Data sources", "Fontes dos dados") },
        disclosures(o, "family"),
        { id: "nd-sig", type: "signature", signers: [{ name: o.signer, role: o.data.family?.rm.split(", ").slice(1).join(", ") ?? "" }] },
      ],
    },
  ];
}

/* ───────── 6. Factsheet ───────── */

function factsheet(o: Opts): Page[] {
  const L = tr(o.locale);
  return [
    {
      id: "p-factsheet",
      title: templateTitle("factsheet", o.locale),
      blocks: [
        { id: "fs-h", type: "heading", text: fundById(o.subjectId)!.name },
        { id: "fs-p", type: "paragraph", text: overview(o) },
        { id: "fs-k", type: "kpis", keys: ["nav", "commitments", "tvpi", "net_irr"] },
        { id: "fs-t", type: "table", table: "terms", title: L("Key terms", "Principais termos") },
        { id: "fs-c", type: "chart", chart: "nav", title: L("Net asset value and paid-in capital", "Patrimônio líquido e capital integralizado") },
        disclosures(o, "prospective"),
      ],
    },
  ];
}

/* ───────── 7. Capital activity ───────── */

function activity(o: Opts): Page[] {
  const L = tr(o.locale);
  return [
    {
      id: "p-quarter",
      title: L("The quarter", "O trimestre"),
      blocks: [
        { id: "ac-h", type: "heading", kicker: "01", text: templateTitle("capital-activity", o.locale) },
        {
          id: "ac-p",
          type: "paragraph",
          text: L(
            "In the {{quarter}}, {{fund}} called {{q_called}} and distributed {{q_distributed}}. Since inception partners have paid in {{called}}, or {{called_pct}} of commitments, leaving {{unfunded}} unfunded.",
            "No {{quarter}}, o {{fund}} chamou {{q_called}} e distribuiu {{q_distributed}}. Desde o início, os cotistas integralizaram {{called}}, ou {{called_pct}} dos compromissos, restando {{unfunded}} a integralizar.",
          ),
        },
        { id: "ac-k", type: "kpis", keys: ["q_called", "q_distributed", "called_pct", "unfunded"] },
        { id: "ac-c", type: "chart", chart: "flows", title: L("Contributions and distributions by quarter", "Integralizações e distribuições por trimestre") },
        { id: "ac-u", type: "chart", chart: "utilization", title: L("Commitment utilization", "Utilização do compromisso") },
      ],
    },
    {
      id: "p-detail",
      title: L("Calls and distributions", "Chamadas e distribuições"),
      blocks: [
        { id: "cd-h", type: "heading", kicker: "02", text: L("Calls and distributions", "Chamadas e distribuições") },
        { id: "cd-t", type: "table", table: "calls", title: L("Capital calls", "Chamadas de capital") },
        { id: "cd-d", type: "table", table: "distributions", title: L("Distributions", "Distribuições") },
      ],
    },
    {
      id: "p-partners",
      title: L("By partner", "Por cotista"),
      blocks: [{ id: "bp-h", type: "heading", kicker: "03", text: L("By partner", "Por cotista") }, { id: "bp-t", type: "table", table: "partners" }, disclosures(o)],
    },
  ];
}

/* ───────── 8. GP management report ───────── */

function management(o: Opts): Page[] {
  const L = tr(o.locale);
  return [
    cover("gp-management", o),
    {
      id: "p-operations",
      title: L("Fund operations", "Operações do fundo"),
      blocks: [
        { id: "op-h", type: "heading", kicker: "01", text: L("Fund operations", "Operações do fundo") },
        {
          id: "op-p",
          type: "paragraph",
          text: L(
            "{{fund}} closed the {{quarter}} with a net asset value of {{nav}} across {{lps}} limited partners. Across the manager’s funds in the same currency, assets under administration were {{aua}}.",
            "O {{fund}} encerrou o {{quarter}} com patrimônio líquido de {{nav}} e {{lps}} cotistas. Considerando os fundos do gestor na mesma moeda, os ativos sob administração somavam {{aua}}.",
          ),
        },
        { id: "op-k", type: "kpis", keys: ["aua", "nav", "commitments", "lps"] },
        { id: "op-c", type: "chart", chart: "deployment", title: L("Capital deployment", "Alocação de capital") },
      ],
    },
    {
      id: "p-economics",
      title: L("Fees and expenses", "Taxas e despesas"),
      blocks: [
        { id: "ec-h", type: "heading", kicker: "02", text: L("Fees and expenses", "Taxas e despesas") },
        { id: "ec-k", type: "kpis", keys: ["q_fees", "fees_total", "expenses_total"] },
        { id: "ec-t", type: "table", table: "fees", title: L("By quarter", "Por trimestre") },
        {
          id: "ec-n",
          type: "notes",
          title: L("Carried interest", "Taxa de performance"),
          text: L(
            "Carried interest is not accrued in the books yet. It is shown here once the distribution waterfall has been run and posted.",
            "A taxa de performance ainda não está provisionada nos livros. Ela será exibida aqui quando a cascata de distribuição for calculada e lançada.",
          ),
        },
      ],
    },
    {
      id: "p-results",
      title: L("Results", "Resultados"),
      blocks: [
        { id: "rs-h", type: "heading", kicker: "03", text: L("Results", "Resultados") },
        { id: "rs-o", type: "table", table: "operations", title: L("Statement of operations", "Demonstração do resultado") },
        { id: "rs-b", type: "table", table: "balance", title: L("Assets, liabilities and partners’ capital", "Ativos, passivos e patrimônio dos cotistas") },
      ],
    },
    {
      id: "p-investors",
      title: L("Investor base", "Base de cotistas"),
      blocks: [{ id: "ib-h", type: "heading", kicker: "04", text: L("Investor base", "Base de cotistas") }, { id: "ib-t", type: "table", table: "partners" }, disclosures(o, "gp")],
    },
  ];
}

/* ───────── 9. Investor letter ───────── */

function letter(o: Opts): Page[] {
  const L = tr(o.locale);
  const fund = fundById(o.subjectId)!;
  const f = formatter(o.locale);
  return [
    {
      id: "p-letter",
      title: L("Letter", "Carta"),
      blocks: [
        { id: "lt-h", type: "heading", text: L(`Letter to partners, ${f.period(o.period)}`, `Carta aos cotistas, ${f.period(o.period)}`) },
        { id: "lt-o", type: "paragraph", text: L("Dear partners,", "Prezados cotistas,") },
        {
          id: "lt-p",
          type: "paragraph",
          text: L(
            "We are pleased to report on {{fund}} for the {{quarter}}. At the period end the fund’s net asset value was {{nav}}, with a TVPI of {{tvpi}}. During the quarter we called {{q_called}} and distributed {{q_distributed}}.",
            "Temos o prazer de apresentar o {{fund}} referente ao {{quarter}}. Na data-base, o patrimônio líquido do fundo era de {{nav}}, com TVPI de {{tvpi}}. No trimestre, chamamos {{q_called}} e distribuímos {{q_distributed}}.",
          ),
        },
        commentary(o, "lt-c"),
        {
          id: "lt-close",
          type: "paragraph",
          text: L(
            "Thank you for your continued trust. The full quarterly report, with the fund’s financial information, is available in the investor portal.",
            "Agradecemos a confiança. O relatório trimestral completo, com as informações financeiras do fundo, está disponível no portal do investidor.",
          ),
        },
        { id: "lt-sig", type: "signature", signers: [{ name: o.signer, role: L(`${fund.manager}, general partner`, `${fund.manager}, gestor`) }] },
      ],
    },
    {
      id: "p-figures",
      title: L("Key figures", "Números do trimestre"),
      blocks: [
        { id: "kf-h", type: "heading", text: L("Key figures", "Números do trimestre") },
        { id: "kf-k", type: "kpis", keys: ["nav", "net_irr", "tvpi", "dpi"] },
        { id: "kf-t", type: "table", table: "performance", title: L("Performance summary", "Resumo de desempenho") },
        disclosures(o),
      ],
    },
  ];
}
