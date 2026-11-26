"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { GpLogo } from "@/components/brand/GpLogo";
import { AurumLogo } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { fundById } from "@/lib/data";
import { gpById } from "@/lib/gps";
import { fmt, type Metric, type ReportData } from "@/lib/studio/data";
import { WORDS, formatter, metricLabel, metricMethod, metricSource, type Fmt, type Locale, type Words } from "@/lib/studio/i18n";
import type { Block, Page, Report } from "@/lib/studio/model";
import { templateTitle } from "@/lib/studio/templates";
import { AllocationChart, BridgeChart, DeploymentChart, FlowsChart, JCurveChart, NavChart, UtilizationChart, type ChartTheme } from "./charts";

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
  /** the administrator's legal and short names, for the attribution line */
  admin: string;
  adminShort: string;
  logo: (tone: "light" | "dark", h: number) => ReactNode;
  chart: ChartTheme;
  locale: Locale;
  f: Fmt;
  w: Words;
};

const SERIF = '"Source Serif 4 Variable", Georgia, serif';
const SANS = '"Hanken Grotesk Variable", "Helvetica Neue", Arial, sans-serif';

/**
 * The report's own look: the manager's identity (white label) or the administrator's, independent of the editor
 * theme, in the report's language. Family reports always carry the administrator's (the family office's) identity.
 */
export function useLook(report: Pick<Report, "fundId" | "design"> & Partial<Pick<Report, "locale">>): Look {
  const { brand } = useBrand();
  const fund = fundById(report.fundId);
  const gp = fund ? gpById(fund.gpId) : undefined;
  const mgr = report.design.brand === "manager" && !!gp;
  const primary = mgr ? gp!.brand.primary : brand.colors.ink;
  const secondary = mgr ? gp!.brand.secondary : brand.colors.metal;
  const ink = "#1b1f24";
  const muted = "#6a7079";
  const rule = "#e3ded5";
  const editorial = report.design.typography === "editorial";
  const locale = report.locale ?? "en";
  const f = formatter(locale);
  const w = WORDS[locale];
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
    owner: (mgr ? gp!.name : brand.legalName).replace(/\.$/, ""),
    admin: brand.legalName,
    adminShort: brand.name,
    logo: (tone, h) =>
      mgr ? (
        <GpLogo gp={gp!} height={gp!.logo && gp!.logo.width / gp!.logo.height < 3 ? h * 1.6 : h} tone={tone} />
      ) : (
        <AurumLogo variant={tone === "dark" ? "white" : "dark"} height={h} />
      ),
    chart: { primary, secondary, ink, muted, rule, font: SANS, f, w: w.chart },
    locale,
    f,
    w,
  };
}

/* ───────── rich text: linked figures, bold, italic and footnotes ───────── */

const TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\{\{\w+\}\}|\^\[[^\]]+\])/g;
type Tok = { k: "text" | "bold" | "italic" | "figure"; v: string } | { k: "note"; v: string; n: number };

/** Split text into tokens; footnotes are numbered from `start` in the order they appear. */
function tokenize(text: string, start = 1): Tok[] {
  let n = start;
  return text
    .split(TOKEN)
    .filter(Boolean)
    .map((p): Tok => {
      if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return { k: "bold", v: p.slice(2, -2) };
      if (p.startsWith("^[") && p.endsWith("]")) return { k: "note", v: p.slice(2, -1), n: n++ };
      if (/^\{\{\w+\}\}$/.test(p)) return { k: "figure", v: p.slice(2, -2) };
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return { k: "italic", v: p.slice(1, -1) };
      return { k: "text", v: p };
    });
}

/** Footnotes on a page, in order, and the first number each block uses. */
export function footnotesOf(blocks: Block[]) {
  const start: Record<string, number> = {};
  const list: { n: number; text: string }[] = [];
  for (const b of blocks) {
    if (b.type !== "paragraph") continue;
    start[b.id] = list.length + 1;
    for (const t of tokenize(b.text, list.length + 1)) if (t.k === "note") list.push({ n: t.n, text: t.v });
  }
  return { start, list };
}

/** Text with linked figures, **bold**, *italic* and ^[footnotes]. */
export function Linked({ text, data, onFigure, f = formatter("en"), start = 1 }: { text: string; data: ReportData; onFigure?: (key: string) => void; f?: Fmt; start?: number }) {
  return (
    <>
      {tokenize(text, start).map((t, i) => {
        if (t.k === "text") return <Fragment key={i}>{t.v}</Fragment>;
        if (t.k === "bold")
          return (
            <strong key={i} style={{ fontWeight: 600 }}>
              <Linked text={t.v} data={data} onFigure={onFigure} f={f} />
            </strong>
          );
        if (t.k === "italic")
          return (
            <em key={i}>
              <Linked text={t.v} data={data} onFigure={onFigure} f={f} />
            </em>
          );
        if (t.k === "note")
          return (
            <sup key={i} style={{ fontSize: "0.68em", lineHeight: 0, marginLeft: 1, fontVariantNumeric: "tabular-nums" }}>
              {t.n}
            </sup>
          );
        const mt = data.metrics[t.v];
        if (!mt) return <Fragment key={i}>{`{{${t.v}}}`}</Fragment>;
        const v = <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(mt, { f })}</span>;
        return onFigure ? (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFigure(t.v);
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
export type Ctx = { report: Report; data: ReportData; look: Look; mode: Mode; pages: Page[]; onFigure?: (k: string) => void; notes?: Record<string, number> };

/** Footnotes at the foot of a page or a section. */
export function Footnotes({ list, c }: { list: { n: number; text: string }[]; c: Ctx }) {
  if (!list.length) return null;
  const { look } = c;
  return (
    <div style={{ marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${look.rule}`, fontFamily: look.sans, fontSize: 9, lineHeight: 1.55, color: look.muted }}>
      {list.map((x) => (
        <div key={x.n} style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, flex: "none", fontVariantNumeric: "tabular-nums" }}>{x.n}</span>
          <span>
            <Linked text={x.text} data={c.data} f={look.f} />
          </span>
        </div>
      ))}
    </div>
  );
}

const label = (look: Look): CSSProperties => ({ fontFamily: look.sans, fontSize: 9.5, color: look.muted, letterSpacing: "0.01em" });
const th: CSSProperties = { textAlign: "left", fontWeight: 600, padding: "6px 8px 6px 0", fontSize: 9.5 };
const tdS: CSSProperties = { padding: "6px 8px 6px 0", fontSize: 10.5, verticalAlign: "top" };

function Placeholder({ look, children }: { look: Look; children: ReactNode }) {
  return <div style={{ border: `1px dashed ${look.rule}`, borderRadius: 3, padding: "12px 14px", fontFamily: look.sans, fontSize: 11, color: look.muted }}>{children}</div>;
}

const mLabel = (mt: Metric | undefined, k: string, look: Look) => (mt ? metricLabel(mt.key, mt.label, look.locale) : k);

/** A figure's status, only where it differs from the report's own (the header already says "Preliminary"). */
function StatusTag({ mt, look, report }: { mt: Metric; look: Look; report: string }) {
  if (mt.status === "final" || mt.status === report) return null;
  return <span style={{ ...label(look), marginLeft: 6, fontSize: 8.5 }}>{look.w.status[mt.status]}</span>;
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
              {mLabel(mt, k, look)}
              {mt && <StatusTag mt={mt} look={look} report={data.status} />}
            </div>
            <div style={{ fontSize: 24, lineHeight: 1.15, marginTop: 6, color: look.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
              {fmt(mt, { short: true, f: look.f })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ head, rows, look, right = [], bold = [] }: { head: string[]; rows: ReactNode[][]; look: Look; right?: number[]; bold?: number[] }) {
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
          <tr key={ri} style={{ borderBottom: `1px solid ${bold.includes(ri) ? look.ink : look.rule}`, fontWeight: bold.includes(ri) ? 600 : undefined }}>
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

const nOrNa = (v: number | null | undefined, show: (n: number) => string) => (typeof v === "number" && Number.isFinite(v) ? show(v) : "n/a");

const prevQuarterEnd = (period: string) => {
  const [y, q] = period.split("-Q").map(Number);
  return q === 1 ? `${y - 1}-12-31` : `${y}-${["03-31", "06-30", "09-30"][q - 2]}`;
};

/** One partner's capital account for the quarter. */
function Statement({ c }: { c: Ctx }) {
  const { data, look, report } = c;
  const { f, w } = look;
  const p = data.partners.find((x) => x.investorId === report.investorId);
  if (!p) return <Placeholder look={look}>{w.statement.unknown}</Placeholder>;
  const m = (v: number) => f.money(v, data.currency);
  const head = (t: string) => <div style={{ fontFamily: look.sans, fontSize: 11, fontWeight: 600, color: look.ink, marginBottom: 8 }}>{t}</div>;
  return (
    <div style={{ display: "grid", gap: 26 }}>
      <div>
        {head(w.statement.title)}
        <Table
          look={look}
          head={["", w.amount]}
          right={[1]}
          bold={[4]}
          rows={[
            [w.statement.opening(f.date(prevQuarterEnd(report.period))), m(p.openNav)],
            [w.statement.contributions, m(p.contributions)],
            [w.statement.distributions, m(-p.distributions)],
            [w.statement.result, m(p.result)],
            [w.statement.closing(f.date(data.asOf)), m(p.nav)],
          ]}
        />
      </div>
      <div>
        {head(w.statement.position)}
        <Table
          look={look}
          head={["", w.amount]}
          right={[1]}
          rows={[
            [w.commitment, m(p.commitment)],
            [w.paidIn, m(p.called)],
            [w.unfunded, m(p.unfunded)],
            [w.distributed, m(p.distributed)],
            [w.statement.shareOf, f.pct(p.share, 2)],
          ]}
        />
      </div>
    </div>
  );
}

function ShareTable({ rows, head, c }: { rows: { name: string; usd: number; share: number }[]; head: string; c: Ctx }) {
  const { look, data } = c;
  const total = rows.reduce((s, r) => s + r.usd, 0);
  return (
    <Table
      look={look}
      head={[head, look.w.value, look.w.share]}
      right={[1, 2]}
      bold={[rows.length]}
      rows={[...rows.map((r) => [r.name, look.f.money(r.usd, data.currency), look.f.pct(r.share, 1)]), [look.w.total, look.f.money(total, data.currency), look.f.pct(1, 1)]]}
    />
  );
}

export function BlockView({ b, c }: { b: Block; c: Ctx }) {
  const { data, look, mode } = c;
  const { f, w } = look;
  const cur = data.currency;
  const m = (v: number) => f.money(v, cur);
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
          <Linked text={b.text} data={data} onFigure={c.onFigure} f={f} start={c.notes?.[b.id] ?? 1} />
        </p>
      );
    case "commentary":
      if (!b.text.trim())
        return mode === "edit" ? <Placeholder look={look}>Waiting for the manager’s commentary. It appears here, attributed to them, once supplied.</Placeholder> : null;
      return (
        <figure style={{ margin: 0, paddingLeft: 18, borderLeft: `2px solid ${look.primary}` }}>
          <blockquote style={{ margin: 0, fontFamily: look.serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.65, color: look.ink }}>{b.text}</blockquote>
          <figcaption style={{ marginTop: 10, fontFamily: look.sans, fontSize: 10, color: look.muted }}>
            <span style={{ color: look.ink, fontWeight: 600 }}>{b.author || w.theManager}</span>
            {b.role ? ` · ${b.role}` : ""} · {b.supplied === "manager" ? w.suppliedByManager : w.suppliedByAdmin}
          </figcaption>
        </figure>
      );
    case "kpis":
      return <Kpis keys={b.keys} c={c} />;
    case "chart": {
      const t = look.chart;
      const props = { s: data.series, t, currency: cur };
      const node =
        b.chart === "nav" ? (
          <NavChart {...props} />
        ) : b.chart === "utilization" ? (
          <UtilizationChart s={data.series} t={t} />
        ) : b.chart === "flows" ? (
          <FlowsChart {...props} />
        ) : b.chart === "deployment" ? (
          <DeploymentChart {...props} />
        ) : b.chart === "bridge" ? (
          <BridgeChart {...props} />
        ) : b.chart === "jcurve" ? (
          <JCurveChart {...props} />
        ) : (
          <AllocationChart h={data.holdings} t={t} currency={cur} />
        );
      return (
        <figure style={{ margin: 0 }}>
          {blockTitle(b.title)}
          {node}
          {b.caption && (
            <figcaption style={{ ...label(look), marginTop: 6 }}>
              {b.caption} {data.subject === "family" ? w.sourceFamily(f.date(data.asOf)) : w.source(f.date(data.asOf))}
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
                    <dt style={{ color: look.muted }}>{w.terms[k] ?? k}</dt>
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
            head={[w.measure, w.value, w.basis]}
            right={[1]}
            rows={keys
              .map((k) => data.metrics[k])
              .filter(Boolean)
              .map((mt) => {
                const method = metricMethod(mt.key, mt.method, look.locale);
                return [
                  mLabel(mt, mt.key, look),
                  fmt(mt, { f }),
                  mt.value === null ? (
                    <span style={{ color: look.muted }}>
                      {w.notAvailable} {method.charAt(0).toLowerCase() + method.slice(1)}
                    </span>
                  ) : (
                    <span style={{ color: look.muted }}>{method}</span>
                  ),
                ];
              })}
          />
        );
      } else if (b.table === "calls") {
        node = data.calls.length ? (
          <Table look={look} head={[w.call, w.notice, w.purpose, w.amount]} right={[3]} rows={data.calls.map((r) => [r.ref, f.date(r.notice), r.purpose, m(r.amount)])} />
        ) : (
          <Placeholder look={look}>{w.noCalls(f.date(data.asOf))}</Placeholder>
        );
      } else if (b.table === "distributions") {
        node = data.distributions.length ? (
          <Table look={look} head={[w.date, w.type, w.sourceH, w.amount]} right={[3]} rows={data.distributions.map((r) => [f.date(r.date), r.type, r.source, m(r.amount)])} />
        ) : (
          <Placeholder look={look}>{w.noDist(f.date(data.asOf))}</Placeholder>
        );
      } else if (b.table === "holdings") {
        node = (
          <Table
            look={look}
            head={[w.investment, w.firstInvested, w.cost, w.shareOfCost]}
            right={[2, 3]}
            bold={[data.holdings.length]}
            rows={[
              ...data.holdings.map((h) => [h.name, f.date(h.first), m(h.cost), f.pct(h.share, 1)]),
              [w.total, "", m(data.holdings.reduce((s, h) => s + h.cost, 0)), f.pct(1, 1)],
            ]}
          />
        );
      } else if (b.table === "balance" || b.table === "operations") {
        const lines = b.table === "balance" ? data.balance : data.operations;
        const ytd = b.table === "operations";
        node = lines.length ? (
          <Table
            look={look}
            head={ytd ? ["", w.thisYear(Number(data.period.slice(0, 4))), w.sinceInception] : ["", `${w.asOfH} ${f.date(data.asOf)}`]}
            right={ytd ? [1, 2] : [1]}
            bold={lines.map((l, i) => (l.total ? i : -1)).filter((i) => i >= 0)}
            rows={lines.map((l) => (ytd ? [w.lines[l.key] ?? l.key, nOrNa(l.ytd, m), m(l.itd)] : [w.lines[l.key] ?? l.key, m(l.itd)]))}
          />
        ) : (
          <Placeholder look={look}>n/a</Placeholder>
        );
      } else if (b.table === "partners") {
        const rows = data.partners;
        const sum = (k: "commitment" | "called" | "unfunded" | "nav") => rows.reduce((s, p) => s + p[k], 0);
        node = (
          <Table
            look={look}
            head={[w.partner, w.commitment, w.paidIn, w.unfunded, w.nav, w.share]}
            right={[1, 2, 3, 4, 5]}
            bold={[rows.length]}
            rows={[
              ...rows.map((p) => [p.name, m(p.commitment), m(p.called), m(p.unfunded), m(p.nav), f.pct(p.share, 1)]),
              [w.total, m(sum("commitment")), m(sum("called")), m(sum("unfunded")), m(sum("nav")), f.pct(1, 1)],
            ]}
          />
        );
      } else if (b.table === "fees") {
        node = (
          <Table
            look={look}
            head={[w.quarter, w.fees, w.expenses]}
            right={[1, 2]}
            rows={data.series.slice(-8).map((p) => [f.period(p.period), nOrNa(p.fees, m), nOrNa(p.expenses, m)])}
          />
        );
      } else if (b.table === "classes") {
        const cls = data.family?.classes ?? [];
        node = (
          <Table
            look={look}
            head={[w.assetClass, w.value, w.share, w.resultYtd]}
            right={[1, 2, 3]}
            bold={[cls.length]}
            rows={[
              ...cls.map((x) => [x.name, m(x.usd), f.pct(x.share, 1), m(x.ytd)]),
              [w.total, m(cls.reduce((s, x) => s + x.usd, 0)), f.pct(1, 1), m(cls.reduce((s, x) => s + x.ytd, 0))],
            ]}
          />
        );
      } else if (b.table === "entities") {
        node = <Table look={look} head={[w.entity, w.kind, w.where, w.netHeld]} right={[3]} rows={(data.family?.entities ?? []).map((e) => [e.name, e.kind, e.where, m(e.net)])} />;
      } else if (b.table === "liabilities") {
        const l = data.family?.liabilities ?? [];
        node = l.length ? (
          <Table look={look} head={[w.name, w.lender, w.rate, w.matures, w.amount]} right={[4]} rows={l.map((x) => [x.name, x.lender, x.rate, f.date(x.matures), m(x.usd)])} />
        ) : (
          <Placeholder look={look}>{w.noLiabilities}</Placeholder>
        );
      } else {
        // one row per source and status, listing the figures drawn from it
        const groups = new Map<string, Metric[]>();
        for (const mt of usedKeys(c.pages).map((k) => data.metrics[k])) {
          if (!mt || mt.kind === "text" || mt.kind === "date") continue;
          const g = `${mt.source}|${mt.status}|${mt.asOf}`;
          groups.set(g, [...(groups.get(g) ?? []), mt]);
        }
        node = (
          <Table
            look={look}
            head={[w.sourceH, w.figure, w.asOfH, w.statusH]}
            rows={[...groups.values()].map((ms) => [
              metricSource(ms[0].source, look.locale),
              <span key="f" style={{ color: look.muted }}>
                {ms.map((mt) => mLabel(mt, mt.key, look)).join(", ")}
              </span>,
              <span key="d" style={{ whiteSpace: "nowrap" }}>
                {f.date(ms[0].asOf)}
              </span>,
              w.status[ms[0].status],
            ])}
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
    case "statement":
      return <Statement c={c} />;
    case "holdings":
      return (
        <div style={{ display: "grid", gap: 18 }}>
          {data.holdings.map((h) => {
            const text = b.updates[h.name] ?? "";
            return (
              <article key={h.name} style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 22, borderTop: `1px solid ${look.rule}`, paddingTop: 12 }}>
                <div style={{ fontFamily: look.sans }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: look.ink, lineHeight: 1.35 }}>{h.name}</div>
                  <div style={{ ...label(look), marginTop: 6 }}>{w.costOf(f.short(h.cost, cur))}</div>
                  <div style={label(look)}>{w.ofInvested(f.pct(h.share, 0))}</div>
                  {h.first && <div style={label(look)}>{w.since(f.date(h.first))}</div>}
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
    case "exposure": {
      const fam = data.family;
      const rows = fam ? (b.dimension === "currency" ? fam.byCurrency : b.dimension === "geography" ? fam.byRegion : null) : null;
      if (rows?.length)
        return (
          <div>
            {blockTitle(w.exposureOf(w.exposure[b.dimension]))}
            <ShareTable rows={rows} head={w.exposure[b.dimension]} c={c} />
          </div>
        );
      return mode === "edit" ? (
        <Placeholder look={look}>
          {b.dimension === "sector" ? "Sector" : b.dimension === "geography" ? "Geographic" : "Currency"} exposure isn’t recorded for this {fam ? "family" : "fund"} yet, so nothing
          is shown. This block stays hidden in the published report until the data exists.
        </Placeholder>
      ) : null;
    }
    case "notes":
      return (
        <div>
          {blockTitle(b.title)}
          <p style={{ margin: 0, fontFamily: look.sans, fontSize: 10.5, lineHeight: 1.65, color: look.ink }}>
            <Linked text={b.text} data={data} f={f} />
          </p>
        </div>
      );
    case "disclosures":
      return (
        <div style={{ fontFamily: look.sans, fontSize: 9, lineHeight: 1.6, color: look.muted }}>
          <div style={{ fontWeight: 600, color: look.ink, marginBottom: 4, fontSize: 10 }}>{w.importantInfo}</div>
          {b.text}
          <div style={{ marginTop: 6 }}>{data.subject === "family" ? w.preparedByFamily(look.owner) : `${w.preparedBy(look.owner, look.admin)} ${w.commentarySupplied}`}</div>
        </div>
      );
    case "signature":
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(2, b.signers.length)}, 1fr)`, gap: 28, fontFamily: look.sans, paddingTop: 8 }}>
          {b.signers.map((s, i) => (
            <div key={i}>
              <div style={{ height: 36, borderBottom: `1px solid ${look.ink}` }} />
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: look.ink }}>{s.name || w.name}</div>
              <div style={label(look)}>{s.role}</div>
            </div>
          ))}
        </div>
      );
    case "toc": {
      const hasCover = c.pages[0]?.blocks.some((x) => x.type === "cover");
      const listed = hasCover ? c.pages.slice(1) : c.pages;
      return (
        <nav style={{ fontFamily: look.sans }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: look.ink, marginBottom: 6 }}>{w.inThisReport}</div>
          {listed.map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 10, borderBottom: `1px solid ${look.rule}`, padding: "5px 0", fontSize: 10.5, color: look.ink }}>
              <span style={{ width: 22, color: look.muted, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ flex: 1 }}>{p.title}</span>
              <span style={{ color: look.muted, fontVariantNumeric: "tabular-nums" }}>{i + (hasCover ? 2 : 1)}</span>
            </div>
          ))}
        </nav>
      );
    }
  }
}

/* ───────── pages ───────── */

/** The document's title for the running header: the cover's title, else the template's. */
export function docTitle(report: Pick<Report, "pages" | "template" | "locale">) {
  const cover = report.pages[0]?.blocks.find((b) => b.type === "cover") as Extract<Block, { type: "cover" }> | undefined;
  return cover?.title || templateTitle(report.template ?? "quarterly-fund", report.locale ?? "en");
}

function Cover({ c, block }: { c: Ctx; block: Extract<Block, { type: "cover" }> }) {
  const { look, data, report } = c;
  const { f, w } = look;
  const t = report.design.cover;
  const field = t === "field";
  const fg = field ? "#ffffff" : look.ink;
  const sub = field ? "rgba(255,255,255,0.72)" : look.muted;
  const family = data.subject === "family";
  const audience = family ? w.family : report.template === "gp-management" ? w.gp : w.lps;
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
          <div style={{ fontFamily: look.heading, fontSize: 21, color: fg, marginTop: 18, lineHeight: 1.3, maxWidth: 560 }}>{data.name}</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "28px 64px 48px", display: "flex", flexDirection: "column", fontFamily: look.sans }}>
        {t === "minimal" && <div style={{ height: 1, background: look.ink, marginBottom: 20 }} />}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            [w.reportingPeriod, family ? `${w.asOfCap} ${f.dateLong(data.asOf)}` : `${f.period(report.period)} · ${w.asOf} ${f.date(data.asOf)}`],
            family ? [w.netWorth, fmt(data.metrics.net_worth, { short: true, f })] : [w.nav, fmt(data.metrics.nav, { short: true, f })],
            [w.preparedFor, audience],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={label(look)}>{k}</div>
              <div style={{ fontSize: 13, color: look.ink, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <div style={{ ...label(look), maxWidth: 380, lineHeight: 1.5 }}>
            {w.confidential}. {family ? w.preparedByFamily(look.owner) : w.preparedBy(look.owner, look.admin)}
            {!family && data.status !== "final" && <> {w.figuresAre(data.status)}</>}
          </div>
          {report.design.brand === "manager" && !family && <div style={{ ...label(look), whiteSpace: "nowrap" }}>{w.administeredBy(look.adminShort)}</div>}
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
  const notes = footnotesOf(page.blocks);
  const c: Ctx = { report, data, look, mode, pages: report.pages, onFigure, notes: notes.start };
  const total = report.pages.length;
  const cover = page.blocks.find((b) => b.type === "cover") as Extract<Block, { type: "cover" }> | undefined;
  const { f, w } = look;
  const when = data.subject === "family" ? f.date(data.asOf) : f.period(report.period);
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
              gap: 16,
              fontFamily: look.sans,
              fontSize: 9,
              color: look.muted,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {index === 0 && <span style={{ flex: "none", display: "flex" }}>{look.logo("light", 16)}</span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.name}</span>
            </span>
            <span style={{ whiteSpace: "nowrap" }}>
              {when} · {docTitle(report)}
              {data.status !== "final" ? ` · ${w.status[data.status]}` : ""}
            </span>
          </header>
          <div ref={contentRef} style={{ position: "absolute", top: 72, left: 64, right: 64, bottom: 64, display: "flex", flexDirection: "column", gap: 28, overflow: "hidden" }}>
            {page.blocks.map((b) => {
              const node = <BlockView b={b} c={c} />;
              return <Fragment key={b.id}>{wrap ? wrap(b, node) : node}</Fragment>;
            })}
            <Footnotes list={notes.list} c={c} />
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
            <span>
              {w.confidential} · {look.owner}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {index + 1} / {total}
            </span>
          </footer>
        </>
      )}
    </section>
  );
}
