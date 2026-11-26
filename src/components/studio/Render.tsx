"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { GpLogo } from "@/components/brand/GpLogo";
import { AurumLogo } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { fundById } from "@/lib/data";
import { gpById } from "@/lib/gps";
import { date, money, moneyShort, pct } from "@/lib/format";
import { periodName } from "@/lib/reporting/figures";
import { STATUS_TEXT, fmt, type Metric, type ReportData } from "@/lib/studio/data";
import type { Block, Page, Report } from "@/lib/studio/model";
import { AllocationChart, DeploymentChart, FlowsChart, NavChart, UtilizationChart, type ChartTheme } from "./charts";

/** A4 at 96 dpi. */
export const PAGE_W = 794;
export const PAGE_H = 1123;

export type Look = {
  primary: string;
  secondary: string;
  ink: string;
  muted: string;
  rule: string;
  paper: string;
  serif: string;
  sans: string;
  heading: string;
  body: string;
  owner: string;
  logo: (tone: "light" | "dark", h: number) => ReactNode;
  chart: ChartTheme;
};

const SERIF = '"Source Serif 4 Variable", Georgia, serif';
const SANS = '"Hanken Grotesk Variable", "Helvetica Neue", Arial, sans-serif';

/** The report's own look: the manager's identity (white label) or the administrator's, independent of the editor theme. */
export function useLook(report: Pick<Report, "fundId" | "design">): Look {
  const { brand } = useBrand();
  const fund = fundById(report.fundId)!;
  const gp = gpById(fund.gpId)!;
  const mgr = report.design.brand === "manager";
  const primary = mgr ? gp.brand.primary : brand.colors.ink;
  const secondary = mgr ? gp.brand.secondary : brand.colors.metal;
  const ink = "#1b1f24";
  const muted = "#6a7079";
  const rule = "#e3ded5";
  const editorial = report.design.typography === "editorial";
  return {
    primary,
    secondary,
    ink,
    muted,
    rule,
    paper: "#ffffff",
    serif: SERIF,
    sans: SANS,
    heading: editorial ? SERIF : SANS,
    body: editorial ? SERIF : SANS,
    owner: mgr ? gp.name : brand.legalName,
    logo: (tone, h) =>
      mgr ? (
        <GpLogo gp={gp} height={gp.logo && gp.logo.width / gp.logo.height < 3 ? h * 1.6 : h} tone={tone} />
      ) : (
        <AurumLogo variant={tone === "dark" ? "white" : "dark"} height={h} />
      ),
    chart: { primary, secondary, ink, muted, rule, font: SANS },
  };
}

/* ───────── text with linked figures ───────── */

export function Linked({ text, data, onFigure }: { text: string; data: ReportData; onFigure?: (key: string) => void }) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{\{(\w+)\}\}$/);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        const mt = data.metrics[m[1]];
        if (!mt) return <Fragment key={i}>{p}</Fragment>;
        const v = <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(mt)}</span>;
        return onFigure ? (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFigure(m[1]);
            }}
            className="-mx-[1px] rounded-[2px] px-[1px] underline decoration-[#9aa3ad] decoration-dotted decoration-1 underline-offset-[3px] hover:bg-[#eef0f3]"
          >
            {v}
          </button>
        ) : (
          <Fragment key={i}>{v}</Fragment>
        );
      })}
    </>
  );
}

/* ───────── blocks ───────── */

export type Mode = "edit" | "print";
type Ctx = { report: Report; data: ReportData; look: Look; mode: Mode; pages: Page[]; onFigure?: (k: string) => void };

const label = (look: Look): CSSProperties => ({ fontFamily: look.sans, fontSize: 9.5, color: look.muted, letterSpacing: "0.01em" });
const th: CSSProperties = { textAlign: "left", fontWeight: 600, padding: "6px 8px 6px 0", fontSize: 9.5 };
const tdS: CSSProperties = { padding: "6px 8px 6px 0", fontSize: 10.5, verticalAlign: "top" };

function Placeholder({ look, children }: { look: Look; children: ReactNode }) {
  return <div style={{ border: `1px dashed ${look.rule}`, borderRadius: 3, padding: "12px 14px", fontFamily: look.sans, fontSize: 11, color: look.muted }}>{children}</div>;
}

/** A figure's status, only where it differs from the report's own (the header already says "Preliminary"). */
function StatusTag({ mt, look, report }: { mt: Metric; look: Look; report: string }) {
  if (mt.status === "final" || mt.status === report) return null;
  return <span style={{ ...label(look), marginLeft: 6, fontSize: 8.5 }}>{STATUS_TEXT[mt.status]}</span>;
}

function Kpis({ keys, c }: { keys: string[]; c: Ctx }) {
  const { data, look } = c;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, keys.length)}, 1fr)`, borderTop: `1px solid ${look.ink}`, fontFamily: look.sans }}>
      {keys.map((k, i) => {
        const mt = data.metrics[k];
        return (
          <div key={k} style={{ padding: "10px 12px 2px", paddingLeft: i ? 12 : 0, borderLeft: i ? `1px solid ${look.rule}` : undefined }}>
            <div style={label(look)}>
              {mt?.label ?? k}
              {mt && <StatusTag mt={mt} look={look} report={data.status} />}
            </div>
            <div style={{ fontSize: 24, lineHeight: 1.15, marginTop: 6, color: look.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
              {fmt(mt, { short: true })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ head, rows, look, right = [] }: { head: string[]; rows: ReactNode[][]; look: Look; right?: number[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: look.sans, color: look.ink }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${look.ink}` }}>
          {head.map((h, i) => (
            <th key={h + i} style={{ ...th, color: look.muted, textAlign: right.includes(i) ? "right" : "left", paddingRight: i === head.length - 1 ? 0 : 8 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} style={{ borderBottom: `1px solid ${look.rule}` }}>
            {r.map((cell, ci) => (
              <td key={ci} style={{ ...tdS, textAlign: right.includes(ci) ? "right" : "left", fontVariantNumeric: "tabular-nums", paddingRight: ci === r.length - 1 ? 0 : 8 }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function usedKeys(pages: Page[]) {
  const keys = new Set<string>();
  for (const p of pages)
    for (const b of p.blocks) {
      if (b.type === "paragraph") for (const m of b.text.matchAll(/\{\{(\w+)\}\}/g)) keys.add(m[1]);
      if (b.type === "kpis") b.keys.forEach((k) => keys.add(k));
      if (b.type === "table" && b.table === "performance") ["net_irr", "tvpi", "dpi", "rvpi", "moic", "gross_irr", "benchmark"].forEach((k) => keys.add(k));
    }
  return [...keys];
}

function BlockView({ b, c }: { b: Block; c: Ctx }) {
  const { data, look, mode } = c;
  const cur = data.currency;
  const m = (v: number) => money(v, cur);
  const blockTitle = (t?: string) =>
    t ? <div style={{ fontFamily: look.sans, fontSize: 11, fontWeight: 600, color: look.ink, marginBottom: 8, letterSpacing: "0.005em" }}>{t}</div> : null;

  switch (b.type) {
    case "cover":
      return null; // drawn by the cover page itself
    case "heading":
      return (
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, borderBottom: `1px solid ${look.rule}`, paddingBottom: 10 }}>
          {b.kicker && <span style={{ fontFamily: look.sans, fontSize: 11, color: look.primary, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{b.kicker}</span>}
          <h2 style={{ fontFamily: look.heading, fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", color: look.ink, lineHeight: 1.15, margin: 0 }}>{b.text}</h2>
        </div>
      );
    case "paragraph":
      return (
        <p style={{ fontFamily: look.body, fontSize: 12.5, lineHeight: 1.7, color: look.ink, margin: 0 }}>
          <Linked text={b.text} data={data} onFigure={c.onFigure} />
        </p>
      );
    case "commentary":
      if (!b.text.trim())
        return mode === "edit" ? <Placeholder look={look}>Waiting for the manager’s commentary. It appears here, attributed to them, once supplied.</Placeholder> : null;
      return (
        <figure style={{ margin: 0, paddingLeft: 18, borderLeft: `2px solid ${look.primary}` }}>
          <blockquote style={{ margin: 0, fontFamily: look.serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.65, color: look.ink }}>{b.text}</blockquote>
          <figcaption style={{ marginTop: 10, fontFamily: look.sans, fontSize: 10, color: look.muted }}>
            <span style={{ color: look.ink, fontWeight: 600 }}>{b.author || "The manager"}</span>
            {b.role ? ` · ${b.role}` : ""} · {b.supplied === "manager" ? "Commentary supplied by the investment manager" : "Prepared by the administrator"}
          </figcaption>
        </figure>
      );
    case "kpis":
      return <Kpis keys={b.keys} c={c} />;
    case "chart": {
      const t = look.chart;
      const node =
        b.chart === "nav" ? (
          <NavChart s={data.series} t={t} currency={cur} />
        ) : b.chart === "utilization" ? (
          <UtilizationChart s={data.series} t={t} />
        ) : b.chart === "flows" ? (
          <FlowsChart s={data.series} t={t} currency={cur} />
        ) : b.chart === "deployment" ? (
          <DeploymentChart s={data.series} t={t} currency={cur} />
        ) : (
          <AllocationChart h={data.holdings} t={t} currency={cur} />
        );
      return (
        <figure style={{ margin: 0 }}>
          {blockTitle(b.title)}
          {node}
          {b.caption && (
            <figcaption style={{ ...label(look), marginTop: 6 }}>
              {b.caption} Source: fund ledger, as of {date(data.asOf)}.
            </figcaption>
          )}
        </figure>
      );
    }
    case "table": {
      let node: ReactNode;
      if (b.table === "terms") {
        const half = Math.ceil(data.terms.length / 2);
        node = (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 28, fontFamily: look.sans }}>
            {[data.terms.slice(0, half), data.terms.slice(half)].map((col, ci) => (
              <dl key={ci} style={{ margin: 0 }}>
                {col.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${look.rule}`, padding: "6px 0", fontSize: 10.5 }}>
                    <dt style={{ color: look.muted }}>{k}</dt>
                    <dd style={{ margin: 0, color: look.ink, textAlign: "right" }}>{v}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
        );
      } else if (b.table === "performance") {
        const keys = ["net_irr", "tvpi", "dpi", "rvpi", "moic", "gross_irr", "benchmark"];
        node = (
          <Table
            look={look}
            head={["Measure", "Value", "Basis"]}
            right={[1]}
            rows={keys.map((k) => {
              const mt = data.metrics[k];
              return [
                mt.label,
                fmt(mt),
                mt.value === null ? (
                  <span style={{ color: look.muted }}>Not available — {mt.method.charAt(0).toLowerCase() + mt.method.slice(1)}</span>
                ) : (
                  <span style={{ color: look.muted }}>{mt.method}</span>
                ),
              ];
            })}
          />
        );
      } else if (b.table === "calls") {
        node = data.calls.length ? (
          <Table look={look} head={["Call", "Notice", "Purpose", "Amount"]} right={[3]} rows={data.calls.map((r) => [r.ref, date(r.notice), r.purpose, m(r.amount)])} />
        ) : (
          <Placeholder look={look}>No capital calls up to {date(data.asOf)}.</Placeholder>
        );
      } else if (b.table === "distributions") {
        node = data.distributions.length ? (
          <Table look={look} head={["Date", "Type", "Source", "Amount"]} right={[3]} rows={data.distributions.map((r) => [date(r.date), r.type, r.source, m(r.amount)])} />
        ) : (
          <Placeholder look={look}>No distributions up to {date(data.asOf)}.</Placeholder>
        );
      } else if (b.table === "holdings") {
        node = (
          <Table
            look={look}
            head={["Investment", "First invested", "Cost", "Share of cost"]}
            right={[2, 3]}
            rows={[
              ...data.holdings.map((h) => [h.name, date(h.first), m(h.cost), pct(h.share, 1)]),
              [<b key="t">Total</b>, "", <b key="c">{m(data.holdings.reduce((s, h) => s + h.cost, 0))}</b>, <b key="s">100.0%</b>],
            ]}
          />
        );
      } else {
        const keys = usedKeys(c.pages);
        node = (
          <Table
            look={look}
            head={["Figure", "Source", "As of", "Status"]}
            rows={keys
              .map((k) => data.metrics[k])
              .filter((mt) => mt && mt.kind !== "text" && mt.kind !== "date")
              .map((mt) => [mt.label, mt.source, date(mt.asOf), STATUS_TEXT[mt.status]])}
          />
        );
      }
      return (
        <div>
          {blockTitle(b.title)}
          {node}
        </div>
      );
    }
    case "holdings":
      return (
        <div style={{ display: "grid", gap: 18 }}>
          {data.holdings.map((h) => {
            const text = b.updates[h.name] ?? "";
            return (
              <article key={h.name} style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 22, borderTop: `1px solid ${look.rule}`, paddingTop: 12 }}>
                <div style={{ fontFamily: look.sans }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: look.ink, lineHeight: 1.35 }}>{h.name}</div>
                  <div style={{ ...label(look), marginTop: 6 }}>Cost {moneyShort(h.cost, cur)}</div>
                  <div style={label(look)}>{pct(h.share, 0)} of capital invested</div>
                  <div style={label(look)}>Since {date(h.first)}</div>
                </div>
                <div style={{ fontFamily: look.body, fontSize: 12, lineHeight: 1.65, color: text ? look.ink : look.muted }}>
                  {text || (mode === "edit" ? "Waiting for the manager’s update on this investment." : "")}
                </div>
              </article>
            );
          })}
          {mode === "edit" && <div style={label(look)}>Updates are supplied by the investment manager; cost and share come from the fund ledger.</div>}
        </div>
      );
    case "exposure":
      return mode === "edit" ? (
        <Placeholder look={look}>
          {b.dimension === "sector" ? "Sector" : b.dimension === "geography" ? "Geographic" : "Currency"} exposure isn’t recorded for this fund yet, so nothing is shown. This block
          stays hidden in the published report until the data exists.
        </Placeholder>
      ) : null;
    case "notes":
      return (
        <div>
          {blockTitle(b.title)}
          <p style={{ margin: 0, fontFamily: look.sans, fontSize: 10.5, lineHeight: 1.65, color: look.ink }}>{b.text}</p>
        </div>
      );
    case "disclosures":
      return (
        <div style={{ fontFamily: look.sans, fontSize: 9, lineHeight: 1.6, color: look.muted }}>
          <div style={{ fontWeight: 600, color: look.ink, marginBottom: 4, fontSize: 10 }}>Important information</div>
          {b.text}
          <div style={{ marginTop: 6 }}>
            Prepared by Aurum Asset Management as fund administrator for {look.owner.replace(/\.$/, "")}. Commentary is supplied by the investment manager.
          </div>
        </div>
      );
    case "signature":
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${b.signers.length}, 1fr)`, gap: 28, fontFamily: look.sans, paddingTop: 8 }}>
          {b.signers.map((s, i) => (
            <div key={i}>
              <div style={{ height: 36, borderBottom: `1px solid ${look.ink}` }} />
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: look.ink }}>{s.name || "Name"}</div>
              <div style={label(look)}>{s.role}</div>
            </div>
          ))}
        </div>
      );
    case "toc":
      return (
        <nav style={{ fontFamily: look.sans }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: look.ink, marginBottom: 6 }}>In this report</div>
          {c.pages.slice(1).map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 10, borderBottom: `1px solid ${look.rule}`, padding: "5px 0", fontSize: 10.5, color: look.ink }}>
              <span style={{ width: 22, color: look.muted, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ flex: 1 }}>{p.title}</span>
              <span style={{ color: look.muted, fontVariantNumeric: "tabular-nums" }}>{i + 2}</span>
            </div>
          ))}
        </nav>
      );
  }
}

/* ───────── pages ───────── */

function Cover({ c, block }: { c: Ctx; block: Extract<Block, { type: "cover" }> }) {
  const { look, data, report } = c;
  const fund = fundById(report.fundId)!;
  const t = report.design.cover;
  const field = t === "field";
  const fg = field ? "#ffffff" : look.ink;
  const sub = field ? "rgba(255,255,255,0.72)" : look.muted;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: look.paper }}>
      <div
        style={{
          flex: field ? "0 0 64%" : "0 0 58%",
          background: field ? look.primary : look.paper,
          padding: "64px 64px 52px",
          display: "flex",
          flexDirection: "column",
          borderBottom: t === "light" ? `6px solid ${look.primary}` : undefined,
        }}
      >
        <div>{look.logo(field ? "dark" : "light", 30)}</div>
        <div style={{ marginTop: "auto" }}>
          <div style={{ fontFamily: look.sans, fontSize: 12, color: sub, letterSpacing: "0.01em" }}>{block.subtitle}</div>
          <h1
            style={{ fontFamily: look.heading, fontSize: t === "minimal" ? 52 : 60, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.02, color: fg, margin: "10px 0 0" }}
          >
            {block.title}
          </h1>
          <div style={{ fontFamily: look.heading, fontSize: 21, color: fg, marginTop: 18, lineHeight: 1.3, maxWidth: 560 }}>{fund.name}</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "28px 64px 48px", display: "flex", flexDirection: "column", fontFamily: look.sans }}>
        {t === "minimal" && <div style={{ height: 1, background: look.ink, marginBottom: 20 }} />}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            ["Reporting period", `${periodName(report.period)} · as of ${date(data.asOf)}`],
            ["Net asset value", fmt(data.metrics.nav, { short: true })],
            ["Prepared for", "The limited partners"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={label(look)}>{k}</div>
              <div style={{ fontSize: 13, color: look.ink, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <div style={{ ...label(look), maxWidth: 380, lineHeight: 1.5 }}>
            Confidential. Prepared by Aurum Asset Management as fund administrator for {look.owner.replace(/\.$/, "")}.
            {data.status !== "final" && <> Figures are {STATUS_TEXT[data.status].toLowerCase()} until the quarter is closed.</>}
          </div>
          {report.design.brand === "manager" && <div style={{ ...label(look), whiteSpace: "nowrap" }}>Administered by Aurum</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * One page of the report. `wrap` lets the editor add selection and controls around each block without the renderer
 * knowing about editing.
 */
export function ReportPage({
  report,
  data,
  page,
  index,
  look,
  mode,
  wrap,
  onFigure,
  contentRef,
}: {
  report: Report;
  data: ReportData;
  page: Page;
  index: number;
  look: Look;
  mode: Mode;
  wrap?: (b: Block, node: ReactNode) => ReactNode;
  onFigure?: (k: string) => void;
  contentRef?: (el: HTMLDivElement | null) => void;
}) {
  const c: Ctx = { report, data, look, mode, pages: report.pages, onFigure };
  const total = report.pages.length;
  const cover = page.blocks.find((b) => b.type === "cover") as Extract<Block, { type: "cover" }> | undefined;
  return (
    <section
      className="report-sheet"
      style={{ position: "relative", width: PAGE_W, height: PAGE_H, background: look.paper, color: look.ink, overflow: "hidden", flex: "none" }}
      aria-label={`Page ${index + 1}: ${page.title}`}
    >
      {cover ? (
        wrap ? (
          wrap(
            cover,
            <div style={{ position: "relative", width: PAGE_W, height: PAGE_H }}>
              <Cover c={c} block={cover} />
            </div>,
          )
        ) : (
          <Cover c={c} block={cover} />
        )
      ) : (
        <>
          <header
            style={{
              position: "absolute",
              top: 30,
              left: 64,
              right: 64,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: look.sans,
              fontSize: 9,
              color: look.muted,
            }}
          >
            <span>{fundById(report.fundId)!.name}</span>
            <span>
              {periodName(report.period)} Quarterly Report{data.status !== "final" ? ` · ${STATUS_TEXT[data.status]}` : ""}
            </span>
          </header>
          <div ref={contentRef} style={{ position: "absolute", top: 72, left: 64, right: 64, bottom: 64, display: "flex", flexDirection: "column", gap: 28, overflow: "hidden" }}>
            {page.blocks.map((b) => {
              const node = <BlockView b={b} c={c} />;
              return <Fragment key={b.id}>{wrap ? wrap(b, node) : node}</Fragment>;
            })}
          </div>
          <footer
            style={{
              position: "absolute",
              bottom: 28,
              left: 64,
              right: 64,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: look.sans,
              fontSize: 9,
              color: look.muted,
              borderTop: `1px solid ${look.rule}`,
              paddingTop: 8,
            }}
          >
            <span>Confidential · {look.owner.replace(/\.$/, "")}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {index + 1} / {total}
            </span>
          </footer>
        </>
      )}
    </section>
  );
}
