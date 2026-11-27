"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, FileText, ShieldCheck, X } from "lucide-react";
import { cx } from "@/components/ui";
import { Figures, PageHead, StatusPill, td, th, tr } from "@/components/gp/GpKit";
import { Panel } from "@/components/workspace/LegendWorkspace";
import { funds } from "@/lib/data";
import { date, money } from "@/lib/format";
import { CURRENT_PERIOD, carryingValue, periodEnd, periodName, type Period } from "@/lib/reporting/figures";
import { CERTIFICATION, STATUS_LABEL, actions, fundAdjustments, useReporting } from "@/lib/reporting/store";
import { LetterView } from "./Letter";
import { StatementPaper } from "./Statement";
import { deriveClose, useClose } from "./useClose";

/** The signed-in manager's name, provided by the GP shell. */
export const GpUserContext = createContext<{ name: string }>({ name: "Manager" });
const useGpName = () => useContext(GpUserContext).name;

const btn = "inline-flex h-9 items-center gap-2 rounded-[8px] px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const primary = cx(btn, "bg-brand text-brand-ink hover:opacity-90");
const secondary = cx(btn, "border border-stone-200 text-ink-900 hover:bg-stone-100");

export type GpTask = { id: string; title: string; detail: string; href: string };

/** What the quarter close needs from this manager right now: answers to send and packages to approve. */
export function useGpCloseTasks(gpId: string): GpTask[] {
  const s = useReporting();
  return useMemo(() => {
    const out: GpTask[] = [];
    for (const f of funds.filter((x) => x.gpId === gpId)) {
      const d = deriveClose(s, f.id, CURRENT_PERIOD);
      const c = d.close;
      if (!c) continue;
      if (c.request.status === "sent")
        out.push({
          id: `req-${f.id}`,
          title: `${f.shortName} — ${periodName(CURRENT_PERIOD)} valuation`,
          detail: `Fair value and commentary requested by your administrator · due ${date(c.request.due!)}`,
          href: `/gp/${gpId}/reports#close`,
        });
      if (c.status === "with_gp")
        out.push({
          id: `ok-${f.id}`,
          title: `${f.shortName} — ${periodName(CURRENT_PERIOD)} reporting package`,
          detail: "Letter, quarterly report and statements · ready for your approval",
          href: `/gp/${gpId}/reports/${f.id}`,
        });
    }
    return out;
  }, [s, gpId]);
}

/* ───────── on the manager's Reports page ───────── */

export function GpCloseSection({ gpId }: { gpId: string }) {
  const s = useReporting();
  const who = useGpName();
  const rows = useMemo(
    () =>
      funds
        .filter((f) => f.gpId === gpId)
        .map((f) => deriveClose(s, f.id, CURRENT_PERIOD))
        .filter((d) => d.close && d.close.status !== "not_started"),
    [s, gpId],
  );
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return null;
  return (
    <div id="close" className="scroll-mt-4">
      <Panel title={`${periodName(CURRENT_PERIOD)} reporting`} aside={<span className="text-[12px] text-stone-500">Prepared by your administrator</span>}>
        <ul>
          {rows.map((d) => {
            const c = d.close!;
            const asking = c.request.status === "sent";
            const approving = c.status === "with_gp";
            return (
              <li key={d.fund.id} className="border-b border-stone-100 last:border-0">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ink-900">{d.fund.name}</div>
                    <div className="mt-0.5 text-[12px] text-stone-500">
                      {asking
                        ? `Your administrator asks for the portfolio’s fair value at ${date(periodEnd(CURRENT_PERIOD))} and your commentary · due ${date(c.request.due!)}`
                        : approving
                          ? `Ready for your approval · reviewed by ${c.reviewed!.by} on ${date(c.reviewed!.at.slice(0, 10))}`
                          : c.status === "published"
                            ? `Published to investors on ${date(c.published!.at.slice(0, 10))}`
                            : c.status === "approved"
                              ? `You approved it on ${date(c.gpApproved!.at.slice(0, 10))} · your administrator will publish it`
                              : c.request.status === "submitted" || c.request.status === "posted"
                                ? "Your answer was received · your administrator is preparing the package"
                                : "Your administrator is preparing the package"}
                    </div>
                  </div>
                  <StatusPill value={asking ? "Waiting for you" : approving ? "Your approval" : STATUS_LABEL[c.status]} />
                  {asking && (
                    <button onClick={() => setOpen(open === d.fund.id ? null : d.fund.id)} className={primary}>
                      {open === d.fund.id ? "Close" : "Answer"}
                    </button>
                  )}
                  {(approving || c.status === "approved" || c.status === "published") && (
                    <Link href={`/gp/${gpId}/reports/${d.fund.id}`} className={approving ? primary : secondary}>
                      {approving ? "Review and approve" : "Open"} <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
                {asking && open === d.fund.id && <ValuationForm fundId={d.fund.id} period={CURRENT_PERIOD} who={who} onDone={() => setOpen(null)} />}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function ValuationForm({ fundId, period, who, onDone }: { fundId: string; period: Period; who: string; onDone: () => void }) {
  const s = useReporting();
  const fund = funds.find((f) => f.id === fundId)!;
  const carrying = carryingValue(fundId, period, fundAdjustments(s, fundId, period));
  const [value, setValue] = useState(String(Math.round(carrying)));
  const [text, setText] = useState("");
  const n = Number(value.replace(/[, ]/g, ""));
  const ok = Number.isFinite(n) && n >= 0 && value.trim() !== "" && text.trim().length >= 20;
  return (
    <div className="border-t border-stone-100 bg-stone-100/40 px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <label className="block text-[12.5px]">
          <span className="font-semibold text-ink-900">Portfolio fair value at {date(periodEnd(period))}</span>
          <span className="mt-0.5 block text-stone-500">
            Carrying value in the books: <span className="tnum text-ink-900">{money(carrying, fund.currency)}</span>
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            aria-label="Fair value"
            className="tnum mt-2 h-9 w-full rounded-[8px] border border-stone-200 bg-white px-3 text-[13.5px] text-ink-900 focus:border-stone-300 focus:outline-none"
          />
          {Number.isFinite(n) && Math.abs(n - carrying) >= 1 && (
            <span className="tnum mt-1 block text-stone-600">Difference from the books: {money(n - carrying, fund.currency)}</span>
          )}
        </label>
        <label className="block text-[12.5px]">
          <span className="font-semibold text-ink-900">Commentary for the investor letter</span>
          <span className="mt-0.5 block text-stone-500">Appears in the letter as written, under your name. At least a couple of sentences.</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            aria-label="Commentary"
            placeholder="How the portfolio performed this quarter, notable events, and the outlook."
            className="mt-2 w-full resize-y rounded-[8px] border border-stone-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-ink-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!ok}
          onClick={() => {
            actions.submitRequest(fundId, period, who, n, text.trim());
            onDone();
          }}
          className={primary}
        >
          Send to your administrator
        </button>
        <span className="text-[12px] text-stone-500">Your administrator posts the valuation and tells you if anything is unclear.</span>
      </div>
    </div>
  );
}

/* ───────── review and approve one package ───────── */

export function GpCloseReview({ gpId, fundId }: { gpId: string; fundId: string }) {
  const who = useGpName();
  const d = useClose(fundId, CURRENT_PERIOD);
  const [agree, setAgree] = useState(false);
  const [changes, setChanges] = useState<string | null>(null);
  const [view, setView] = useState<string | null>(null);
  const { close, fund, gp, figures } = d;
  const back = (
    <Link href={`/gp/${gpId}/reports`} className="mb-1 inline-flex items-center gap-1.5 px-2 pt-2 text-[12.5px] text-d-text-3 hover:text-d-text">
      <ArrowLeft size={13} /> Reports
    </Link>
  );
  if (!close || close.status === "not_started" || close.status === "preparing" || close.status === "in_review")
    return (
      <div>
        {back}
        <PageHead
          eyebrow={`${periodName(CURRENT_PERIOD)} reporting`}
          title={fund.name}
          meta="Your administrator is preparing this package. You’ll be asked to approve it when it’s ready."
        />
      </div>
    );
  const m = (v: number) => money(v, fund.currency);
  const row = d.partners.find((p) => p.investorId === view);
  const bookChecks = d.checks.filter((k) => !["current"].includes(k.id));
  return (
    <div>
      {back}
      <PageHead
        eyebrow={`${periodName(CURRENT_PERIOD)} reporting package`}
        title={fund.name}
        meta={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill value={close.status === "with_gp" ? "Your approval" : STATUS_LABEL[close.status]} />
            <span>Reviewed by {close.reviewed?.by ?? "your administrator"}</span>
          </span>
        }
      />
      <div className="space-y-2">
        <Figures
          items={[
            { label: "Net asset value", value: m(figures.nav.value as number), note: `As of ${date(periodEnd(CURRENT_PERIOD))}` },
            { label: "Paid-in capital", value: m(figures.called.value as number) },
            { label: "Distributions to date", value: m(figures.distributed.value as number) },
            { label: "TVPI · DPI", value: `${(figures.tvpi.value as number).toFixed(2)}x · ${(figures.dpi.value as number).toFixed(2)}x` },
            { label: "Checks", value: `${bookChecks.filter((k) => k.status === "pass").length} of ${bookChecks.length}`, note: "Tie-out checks passed" },
          ]}
        />

        {close.status === "with_gp" && (
          <section className="relative overflow-hidden rounded-[12px] border border-stone-200 bg-white px-5 py-4" aria-label="Your approval">
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[var(--d-accent-fill)]" />
            <div className="flex items-start gap-3">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--d-accent)]" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-ink-900">Approve the package for release to investors</div>
                <p className="mt-1 text-[13px] text-stone-600">
                  Read the letter and spot-check a statement below. Approving records your certification; your administrator then publishes it.
                </p>
                {d.stale.length > 0 ? (
                  <p className="mt-3 rounded-[8px] border border-attn-line px-3 py-2 text-[12.5px] text-gold-700">
                    Some figures changed after your administrator’s review. They are checking them; you’ll be able to approve once they have.
                  </p>
                ) : changes === null ? (
                  <>
                    <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-[8px] border border-stone-200 px-3 py-2.5 text-[12.5px] leading-relaxed text-stone-700">
                      <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[var(--d-accent)]" />
                      <span>{CERTIFICATION}</span>
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button disabled={!agree} onClick={() => actions.gpApprove(fundId, CURRENT_PERIOD, who)} className={primary}>
                        <Check size={14} /> Approve as {who}
                      </button>
                      <button onClick={() => setChanges("")} className={secondary}>
                        Request changes
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-3">
                    <textarea
                      value={changes}
                      onChange={(e) => setChanges(e.target.value)}
                      rows={3}
                      autoFocus
                      aria-label="What should change"
                      placeholder="What should change before it goes to investors?"
                      className="w-full resize-none rounded-[8px] border border-stone-200 bg-transparent px-3 py-2 text-[13px] text-ink-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        disabled={!changes.trim()}
                        onClick={() => {
                          actions.requestChanges(fundId, CURRENT_PERIOD, who, "gp", changes.trim());
                          setChanges(null);
                        }}
                        className={primary}
                      >
                        Send to your administrator
                      </button>
                      <button onClick={() => setChanges(null)} className={secondary}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {close.status !== "with_gp" && (
          <section className="flex items-center gap-3 rounded-[12px] border border-up-line bg-white px-5 py-4 text-[13px] text-ink-900">
            <Check size={16} className="text-up-ink" />
            {close.status === "published"
              ? `Published to investors on ${date(close.published!.at.slice(0, 10))}.`
              : `You approved this package on ${date(close.gpApproved!.at.slice(0, 10))}. Your administrator will publish it to investors.`}
          </section>
        )}

        <h2 className="px-2 pt-4 text-[15px] font-semibold text-d-text">Investor letter</h2>
        <LetterView
          close={close}
          gp={gp}
          figures={figures}
          prevFigures={d.prevFigures}
          stale={d.stale}
          side="gp"
          onComment={(t, text) => actions.comment(fundId, CURRENT_PERIOD, who, "gp", t, text)}
          onReply={(id, text) => actions.reply(fundId, CURRENT_PERIOD, who, "gp", id, text)}
        />

        <h2 className="px-2 pt-4 text-[15px] font-semibold text-d-text">Statements and checks</h2>
        <div className="grid items-start gap-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title={`Capital account statements · ${d.partners.length}`}>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Partner</th>
                  <th className={cx(th, "text-right")}>Closing capital</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {d.partners.map((p) => (
                  <tr key={p.investorId} className={tr}>
                    <td className={cx(td, "font-semibold text-ink-900")}>{p.name}</td>
                    <td className={cx(td, "tnum text-right")}>{m(p.nav)}</td>
                    <td className={cx(td, "text-right")}>
                      <button onClick={() => setView(p.investorId)} className="rounded-[6px] px-2 py-0.5 text-[12px] font-semibold text-ink-900 hover:bg-stone-100">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Tie-out checks">
            <ul>
              {bookChecks.map((k) => (
                <li key={k.id} className="flex items-start gap-3 border-b border-stone-100 px-4 py-2.5 text-[12.5px] last:border-0">
                  <span className={cx("mt-0.5", k.status === "pass" ? "text-up-ink" : k.status === "fail" ? "text-negative" : "text-stone-400")}>
                    {k.status === "pass" ? <Check size={14} /> : k.status === "fail" ? <X size={14} /> : <Clock size={14} />}
                  </span>
                  <span className="text-ink-900">{k.label}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <p className="flex items-center gap-1.5 px-2 pt-2 text-[12px] text-d-text-3">
          <FileText size={13} /> The quarterly report is part of the package:{" "}
          <a href={d.report ? `/report-studio/${d.report.id}` : `/report/${fundId}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-d-text">
            open it
          </a>
          .
        </p>
      </div>
      {row && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setView(null)}>
          <div
            className="drawer-in scroll-quiet h-full w-full max-w-[860px] overflow-y-auto bg-d-bg px-6 py-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Statement for ${row.name}`}
          >
            <div className="mb-4 flex items-center">
              <span className="text-[14px] font-semibold text-d-text">Statement preview</span>
              <button onClick={() => setView(null)} aria-label="Close the preview" className="ml-auto rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
                <X size={16} />
              </button>
            </div>
            <StatementPaper gp={gp} fundName={fund.name} currency={fund.currency} period={CURRENT_PERIOD} row={row} />
          </div>
        </div>
      )}
    </div>
  );
}
