"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleDashed, Clock, FileText, Hourglass, Lock, Minus, Pencil, X } from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { Figures, Meter, PageHead, StatusPill, td, th, tr } from "@/components/gp/GpKit";
import { Panel } from "@/components/workspace/LegendWorkspace";
import { funds } from "@/lib/data";
import { date, money } from "@/lib/format";
import { CURRENT_PERIOD, periodDue, periodName, prevPeriod, type Period } from "@/lib/reporting/figures";
import { STATUS_LABEL, actions, getClose, useReporting } from "@/lib/reporting/store";
import { LetterEditor, LetterView } from "./Letter";
import { StatementPaper } from "./Statement";
import { deriveClose, useClose, type Step, type StepState } from "./useClose";

const TODAY = "2026-11-26";
const daysTo = (d: string) => Math.round((Date.parse(d) - Date.parse(TODAY)) / 86_400_000);
const dueText = (d: string) => {
  const n = daysTo(d);
  return n > 1 ? `due ${date(d)} (in ${n} days)` : n === 1 ? `due tomorrow, ${date(d)}` : n === 0 ? "due today" : `${-n} days overdue`;
};
const PERIODS: Period[] = [CURRENT_PERIOD, prevPeriod(CURRENT_PERIOD)];
const btn = "inline-flex h-9 items-center gap-2 rounded-[8px] px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const primary = cx(btn, "bg-brand text-brand-ink hover:opacity-90");
const secondary = cx(btn, "border border-stone-200 text-ink-900 hover:bg-stone-100");

function useWho() {
  return usePreviewRole().member.name;
}

/* ───────────────────────── board ───────────────────────── */

export function QuarterBoard() {
  const s = useReporting();
  const router = useRouter();
  const params = useSearchParams();
  const who = useWho();
  const period = (PERIODS.find((p) => p === params.get("period")) ?? CURRENT_PERIOD) as Period;
  const rows = useMemo(
    () =>
      funds
        .map((f) => deriveClose(s, f.id, period))
        .filter((r) => r.close)
        .sort((a, b) => order(a.close!.status) - order(b.close!.status) || a.fund.name.localeCompare(b.fund.name)),
    [s, period],
  );
  const count = (st: string) => rows.filter((r) => r.close!.status === st).length;
  const due = periodDue(period);
  const href = (fundId: string) => `/admin/fund/quarter-close/${fundId}?period=${period}`;

  return (
    <div>
      <PageHead
        eyebrow="Reporting"
        title="Quarter close"
        meta={
          <>
            {periodName(period)} reporting to investors, {period === CURRENT_PERIOD ? dueText(due) : `due ${date(due)}`}. Every figure is linked to the books and every package is
            checked, reviewed and approved by the manager before it is published.
          </>
        }
        action={
          <div className="inline-flex rounded-[9px] border border-stone-200 p-0.5" role="tablist" aria-label="Quarter">
            {PERIODS.map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={p === period}
                onClick={() => router.replace(`/admin/fund/quarter-close?period=${p}`)}
                className={cx("h-8 rounded-[7px] px-3 text-[13px] font-semibold", p === period ? "bg-stone-100 text-ink-900" : "text-stone-500 hover:text-ink-900")}
              >
                {periodName(p)}
              </button>
            ))}
          </div>
        }
      />
      <div className="space-y-2">
        <Figures
          items={[
            { label: "Not started", value: String(count("not_started")) },
            { label: "Preparing", value: String(count("preparing")) },
            { label: "In review or with the manager", value: String(count("in_review") + count("with_gp")) },
            { label: "Approved", value: String(count("approved")) },
            { label: "Published", value: `${count("published")} of ${rows.length}` },
          ]}
        />
        <Panel title={`Funds · ${rows.length}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Fund</th>
                  <th className={th}>Status</th>
                  <th className={cx(th, "w-[150px]")}>Progress</th>
                  <th className={th}>Next step</th>
                  <th className={th}>Checks</th>
                  <th className={cx(th, "text-right")} />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const c = r.close!;
                  const doneN = r.steps.filter((x) => x.state === "done").length;
                  const next = r.steps.find((x) => x.state !== "done");
                  const started = c.status !== "not_started";
                  return (
                    <tr key={r.fund.id} className={cx(tr, started && "cursor-pointer")} onClick={() => started && router.push(href(r.fund.id))}>
                      <td className={td}>
                        {started ? (
                          <Link href={href(r.fund.id)} className="font-semibold text-ink-900 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {r.fund.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-ink-900">{r.fund.name}</span>
                        )}
                        <div className="text-[11.5px] text-stone-500">{r.gp.shortName}</div>
                      </td>
                      <td className={td}>
                        <StatusPill value={STATUS_LABEL[c.status]} />
                      </td>
                      <td className={td}>
                        {started ? (
                          <div className="flex items-center gap-2">
                            <Meter value={doneN / r.steps.length} />
                            <span className="tnum w-8 text-right text-[11.5px] text-stone-500">
                              {doneN}/{r.steps.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className={cx(td, "max-w-[320px]")}>
                        {!started ? (
                          <span className="text-stone-600">
                            {getClose(s, r.fund.id, prevPeriod(period))?.blocks.length ? `Roll forward from ${periodName(prevPeriod(period))}` : "Start from the standard letter"}
                          </span>
                        ) : next ? (
                          <>
                            <div className="truncate text-ink-900">{next.title}</div>
                            <div className="truncate text-[11.5px] text-stone-500">
                              {next.owner === "Manager" ? `${r.gp.shortName} · ` : ""}
                              {next.detail}
                            </div>
                          </>
                        ) : (
                          <span className="text-stone-600">Published {date(c.published!.at.slice(0, 10))}</span>
                        )}
                      </td>
                      <td className={td}>
                        {!started ? (
                          <span className="text-stone-400">—</span>
                        ) : r.failing.length ? (
                          <span className="inline-flex items-center gap-1 text-negative">
                            <X size={13} /> {r.failing.length} failing
                          </span>
                        ) : r.bookChecksPass ? (
                          <span className="inline-flex items-center gap-1 text-up-ink">
                            <Check size={13} /> Tie out
                          </span>
                        ) : null}
                      </td>
                      <td className={cx(td, "text-right")}>
                        {started ? (
                          <ArrowRight size={14} className="inline text-stone-400" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.start(r.fund.id, period, who);
                              router.push(href(r.fund.id));
                            }}
                            className="h-7 rounded-[7px] border border-stone-200 px-2.5 text-[12px] font-semibold text-ink-900 hover:bg-stone-100"
                          >
                            Start close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
const order = (s: string) => ["with_gp", "in_review", "approved", "preparing", "not_started", "published"].indexOf(s);

/* ───────────────────────── one fund ───────────────────────── */

type Tab = "overview" | "letter" | "statements" | "checks" | "activity";
const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["letter", "Investor letter"],
  ["statements", "Statements"],
  ["checks", "Tie-out checks"],
  ["activity", "Activity"],
];

export function CloseWorkspace({ fundId }: { fundId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const who = useWho();
  const period = (PERIODS.find((p) => p === params.get("period")) ?? CURRENT_PERIOD) as Period;
  const tab = (TABS.find(([t]) => t === params.get("tab"))?.[0] ?? "overview") as Tab;
  const d = useClose(fundId, period);
  const store = useReporting();
  const go = (t: Tab) => router.replace(`${path}?period=${period}${t === "overview" ? "" : `&tab=${t}`}`, { scroll: false });
  const { fund, gp, close } = d;

  if (!close)
    return (
      <div>
        <BackLink period={period} />
        <PageHead title={fund.name} meta={`Nothing to report for ${periodName(period)}: no capital has been called yet.`} />
      </div>
    );

  const head = (
    <>
      <BackLink period={period} />
      <PageHead
        eyebrow={`${gp.shortName} · ${periodName(period)} close`}
        title={fund.name}
        meta={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill value={STATUS_LABEL[close.status]} />
            <span>Reports {close.status === "published" ? `published ${date(close.published!.at.slice(0, 10))}` : dueText(periodDue(period))}</span>
            {close.rolledFrom && <span>Rolled forward from {periodName(close.rolledFrom)}</span>}
          </span>
        }
      />
    </>
  );

  if (close.status === "not_started") {
    const prev = getClose(store, fundId, prevPeriod(period));
    return (
      <div>
        {head}
        <Panel title="Start the close" bodyClass="px-5 py-5">
          <p className="max-w-[640px] text-[13px] leading-relaxed text-stone-600">
            {prev?.blocks.length
              ? `The ${periodName(period)} package starts from ${periodName(prev.period)}: the investor letter is carried over with its wording, and every linked figure moves to ${periodName(period)} automatically. Changes against last quarter are shown when you review it.`
              : "The package starts from the standard investor letter. Every figure in it is linked to the books for the quarter."}
          </p>
          <button onClick={() => actions.start(fundId, period, who)} className={cx(primary, "mt-4")}>
            {prev?.blocks.length ? `Roll forward from ${periodName(prev.period)}` : "Start the close"}
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      {head}
      <NextAction d={d} who={who} onTab={go} />
      <div className="mb-3 mt-4 flex gap-1 overflow-x-auto border-b border-stone-200" role="tablist" aria-label="Close sections">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => go(t)}
            className={cx("relative h-10 shrink-0 px-3 text-[13px] font-semibold transition-colors", tab === t ? "text-ink-900" : "text-stone-500 hover:text-ink-900")}
          >
            {label}
            {t === "checks" && d.failing.length > 0 && <span className="tnum ml-1.5 rounded-full bg-neg-line/40 px-1.5 text-[11px] text-negative">{d.failing.length}</span>}
            {t === "letter" && d.openComments.length > 0 && (
              <span className="tnum ml-1.5 rounded-full bg-stone-100 px-1.5 text-[11px] text-stone-600">{d.openComments.length}</span>
            )}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--d-accent)]" />}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview d={d} who={who} onTab={go} />}
      {tab === "letter" && <LetterTab d={d} who={who} />}
      {tab === "statements" && <StatementsTab d={d} who={who} />}
      {tab === "checks" && <ChecksTab d={d} />}
      {tab === "activity" && <ActivityTab d={d} />}
    </div>
  );
}

function BackLink({ period }: { period: Period }) {
  return (
    <Link href={`/admin/fund/quarter-close?period=${period}`} className="mb-1 inline-flex items-center gap-1.5 px-2 pt-2 text-[12.5px] text-d-text-3 hover:text-d-text">
      <ArrowLeft size={13} /> Quarter close
    </Link>
  );
}

type D = ReturnType<typeof deriveClose>;

/** The one thing to do next, stated plainly, with the button that does it. */
function NextAction({ d, who, onTab }: { d: D; who: string; onTab: (t: Tab) => void }) {
  const { close, gp, fund } = d;
  const c = close!;
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const p = c.period;
  const gpView = `/gp/${gp.id}/reports`;
  let tone: "act" | "wait" | "warn" | "done" = "act";
  let text: ReactNode;
  let buttons: ReactNode = null;

  if (c.status === "published") {
    tone = "done";
    text = `Published to investors on ${date(c.published!.at.slice(0, 10))} by ${c.published!.by}. The letter, the quarterly report and each partner’s statement are in the investor portal.`;
    buttons = (
      <Link href={`/investor/${gp.id}/documents`} className={secondary}>
        View as an investor <ArrowRight size={14} />
      </Link>
    );
  } else if (d.stale.length && c.snapshot && c.status !== "preparing") {
    tone = "warn";
    text = `${d.stale.length} linked figure${d.stale.length > 1 ? "s" : ""} changed after the package was reviewed. Check them before it goes further${c.status === "approved" ? " — the manager will need to approve again" : ""}.`;
    buttons = (
      <>
        <button onClick={() => onTab("letter")} className={secondary}>
          See what changed
        </button>
        <button onClick={() => actions.acceptChanges(fund.id, p, who)} className={primary}>
          Accept the new figures
        </button>
      </>
    );
  } else if (c.status === "in_review") {
    text = (
      <>
        Review the package — letter, quarterly report, {d.partners.length} statements and the checks — then send it to {gp.shortName} for approval.
        {d.openComments.length > 0 && (
          <span className="mt-1 block text-[12.5px] text-gold-700">
            Resolve the {d.openComments.length} open comment{d.openComments.length > 1 ? "s" : ""} in the letter first, or request changes.
          </span>
        )}
      </>
    );
    buttons = asking ? null : (
      <>
        <button onClick={() => setAsking(true)} className={secondary}>
          Request changes
        </button>
        <button onClick={() => actions.approveReview(fund.id, p, who)} className={primary} disabled={d.openComments.length > 0}>
          Approve and send to {gp.shortName}
        </button>
      </>
    );
  } else if (c.status === "with_gp") {
    tone = "wait";
    text = `Waiting for ${gp.shortName} to approve the package in their portal. Sent on ${date(c.reviewed!.at.slice(0, 10))}.`;
    buttons = (
      <Link href={gpView} className={secondary}>
        Preview the manager’s view <ArrowRight size={14} />
      </Link>
    );
  } else if (c.status === "approved") {
    text = `Approved by ${c.gpApproved!.by} on ${date(c.gpApproved!.at.slice(0, 10))}. Publishing sends the letter, the report and every statement to the investor portal together.`;
    buttons = (
      <button onClick={() => actions.publish(fund.id, p, who)} className={primary} disabled={d.failing.length > 0}>
        Publish to investors
      </button>
    );
  } else if (!c.booksClosed) {
    text = `Close the ${periodName(p)} books so the figures stop moving.`;
    buttons = (
      <button onClick={() => actions.closeBooks(fund.id, p, who)} className={primary}>
        <Lock size={14} /> Close the books
      </button>
    );
  } else if (c.request.status === "not_sent") {
    text = `Ask ${gp.shortName} for the portfolio’s fair value at ${periodName(p)} end and their commentary for the letter.`;
    buttons = (
      <button onClick={() => actions.sendRequest(fund.id, p, who, addDays(TODAY, 7))} className={primary}>
        Send the request to {gp.shortName}
      </button>
    );
  } else if (c.request.status === "sent") {
    tone = "wait";
    text = `Waiting for ${gp.shortName} to answer the valuation request, ${dueText(c.request.due!)}. Meanwhile you can generate statements and work on the letter.`;
    buttons = (
      <Link href={gpView} className={secondary}>
        Preview the manager’s view <ArrowRight size={14} />
      </Link>
    );
  } else if (c.request.status === "submitted") {
    const diff = (c.request.fairValue ?? 0) - (c.request.carrying ?? 0);
    text = (
      <>
        {gp.shortName} answered: fair value {money(c.request.fairValue!, fund.currency)} against a carrying value of {money(c.request.carrying!, fund.currency)}
        {Math.abs(diff) >= 0.01 ? ` — posting it changes NAV by ${money(diff, fund.currency)}.` : " — no change to NAV."}
      </>
    );
    buttons = asking ? null : (
      <>
        <button onClick={() => setAsking(true)} className={secondary}>
          Return to {gp.shortName}
        </button>
        <button onClick={() => actions.postValuation(fund.id, p, who)} className={primary}>
          Post the valuation
        </button>
      </>
    );
  } else if (!d.bookChecksPass) {
    tone = "warn";
    text = `${d.failing.length} tie-out check${d.failing.length > 1 ? "s" : ""} fail. The package can’t go to review until the books tie out.`;
    buttons = (
      <button onClick={() => onTab("checks")} className={secondary}>
        See the checks
      </button>
    );
  } else if (!c.statements) {
    text = `Generate a capital account statement for each of the ${d.partners.length} partners.`;
    buttons = (
      <button onClick={() => actions.generateStatements(fund.id, p, who, d.partners.length)} className={primary}>
        Generate {d.partners.length} statements
      </button>
    );
  } else if (d.openComments.length) {
    text = `Resolve ${d.openComments.length} open comment${d.openComments.length > 1 ? "s" : ""} in the investor letter before sending it for review.`;
    buttons = (
      <button onClick={() => onTab("letter")} className={secondary}>
        Open the letter
      </button>
    );
  } else {
    text = "Everything is ready: the books tie out, the valuation is posted and the statements are generated. Read the letter once more, then send the package for review.";
    buttons = (
      <>
        <button onClick={() => onTab("letter")} className={secondary}>
          Read the letter
        </button>
        <button onClick={() => actions.sendForReview(fund.id, p, who)} className={primary}>
          Send for review
        </button>
      </>
    );
  }

  const icon = tone === "done" ? <Check size={16} /> : tone === "wait" ? <Hourglass size={16} /> : tone === "warn" ? <AlertTriangle size={16} /> : <ArrowRight size={16} />;
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-[12px] border bg-white px-5 py-4",
        tone === "warn" ? "border-attn-line" : tone === "done" ? "border-up-line" : "border-stone-200",
      )}
      aria-label="Next step"
    >
      <span
        aria-hidden
        className={cx(
          "absolute inset-y-0 left-0 w-[3px]",
          tone === "warn" ? "bg-gold-500" : tone === "done" ? "bg-[var(--color-up)]" : tone === "wait" ? "bg-stone-300" : "bg-[var(--d-accent)]",
        )}
      />
      {c.changesRequested && c.status === "preparing" && (
        <p className="mb-2 rounded-[8px] bg-stone-100/70 px-3 py-2 text-[12.5px] text-stone-700">
          <span className="font-semibold text-ink-900">{c.changesRequested.by}</span> requested changes on {date(c.changesRequested.at.slice(0, 10))}: “{c.changesRequested.note}”
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-[min(100%,340px)] flex-1 items-start gap-3">
          <span className={cx("mt-0.5 shrink-0", tone === "warn" ? "text-gold-700" : tone === "done" ? "text-up-ink" : "text-stone-500")}>{icon}</span>
          <div className="min-w-0">
            <div className="text-[12px] text-stone-500">{tone === "done" ? "Complete" : tone === "wait" ? "Waiting" : "Next step"}</div>
            <div className="mt-0.5 text-[14px] leading-snug text-ink-900">{text}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{buttons}</div>
      </div>
      {asking && (
        <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-stone-100 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            autoFocus
            placeholder={c.status === "in_review" ? "What needs to change?" : `Tell ${gp.shortName} what to correct`}
            aria-label="Note"
            className="min-w-[260px] flex-1 resize-none rounded-[8px] border border-stone-200 bg-transparent px-3 py-2 text-[13px] text-ink-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
          />
          <button onClick={() => setAsking(false)} className={secondary}>
            Cancel
          </button>
          <button
            disabled={!note.trim()}
            onClick={() => {
              if (c.status === "in_review") actions.requestChanges(fund.id, p, who, "aurum", note.trim());
              else actions.returnRequest(fund.id, p, who, note.trim());
              setNote("");
              setAsking(false);
            }}
            className={primary}
          >
            {c.status === "in_review" ? "Send back to preparer" : `Return to ${gp.shortName}`}
          </button>
        </div>
      )}
    </section>
  );
}
const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

const STATE_ICON: Record<StepState, ReactNode> = {
  done: <Check size={13} />,
  current: <ArrowRight size={13} />,
  waiting: <Clock size={13} />,
  blocked: <AlertTriangle size={13} />,
  todo: <CircleDashed size={13} />,
};

function Checklist({ steps }: { steps: Step[] }) {
  return (
    <ol>
      {steps.map((s, i) => (
        <li key={s.id} className="relative flex gap-3.5 px-4 py-3">
          {i < steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[27px] top-[38px] w-px bg-stone-200" />}
          <span
            className={cx(
              "z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
              s.state === "done"
                ? "border-up-line bg-[color-mix(in_oklab,var(--color-up)_14%,transparent)] text-up-ink"
                : s.state === "current"
                  ? "border-[var(--d-accent)] text-[var(--d-accent)]"
                  : s.state === "blocked"
                    ? "border-attn-line text-gold-700"
                    : s.state === "waiting"
                      ? "border-stone-300 text-stone-500"
                      : "border-stone-200 text-stone-400",
            )}
          >
            {STATE_ICON[s.state]}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className={cx("text-[13px] font-semibold", s.state === "todo" ? "text-stone-500" : "text-ink-900")}>{s.title}</span>
              <span className="text-[11.5px] text-stone-500">{s.owner}</span>
            </div>
            <div className="mt-0.5 text-[12.5px] text-stone-600">{s.detail}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Overview({ d, who, onTab }: { d: D; who: string; onTab: (t: Tab) => void }) {
  const { close, fund, gp, figures } = d;
  const c = close!;
  const m = (v: number) => money(v, fund.currency);
  const [adj, setAdj] = useState({ amount: "", memo: "" });
  const editable = c.status !== "published";
  return (
    <div className="grid items-start gap-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Panel title="Checklist">
        <Checklist steps={d.steps} />
      </Panel>
      <div className="space-y-2">
        <Panel title="The package">
          <ul>
            {[
              { label: "Investor letter", detail: `${d.figures.nav.label} ${m(figures.nav.value as number)} · linked figures`, onClick: () => onTab("letter") },
              { label: "Quarterly report", detail: "Performance, NAV and cash flows", href: `/report/${fund.id}` },
              {
                label: "Capital account statements",
                detail: c.statements ? `${d.partners.length} generated` : `${d.partners.length} partners · not generated yet`,
                onClick: () => onTab("statements"),
              },
            ].map((x) => {
              const body = (
                <>
                  <FileText size={15} className="shrink-0 text-stone-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">{x.label}</span>
                    <span className="block truncate text-[11.5px] text-stone-500">{x.detail}</span>
                  </span>
                  <ArrowRight size={14} className="text-stone-400" />
                </>
              );
              const cls = "flex w-full items-center gap-3 border-b border-stone-100 px-4 py-3 text-left text-[12.5px] last:border-0 hover:bg-stone-100/60";
              return (
                <li key={x.label}>
                  {x.href ? (
                    <Link href={x.href} className={cls}>
                      {body}
                    </Link>
                  ) : (
                    <button onClick={x.onClick} className={cls}>
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Valuation from the manager" bodyClass="px-4 py-3">
          <dl className="text-[12.5px]">
            {[
              [
                "Status",
                c.request.status === "not_sent"
                  ? "Not requested"
                  : c.request.status === "sent"
                    ? `Requested · ${dueText(c.request.due!)}`
                    : c.request.status === "submitted"
                      ? "Answered · not posted"
                      : "Posted",
              ],
              ...(c.request.fairValue !== undefined
                ? [
                    ["Fair value from " + gp.shortName, m(c.request.fairValue)],
                    ["Carrying value", m(c.request.carrying!)],
                    ["Difference", m(c.request.fairValue - c.request.carrying!)],
                  ]
                : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 border-b border-stone-100 py-2 last:border-0">
                <dt className="text-stone-500">{k}</dt>
                <dd className="tnum text-right text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          {c.request.commentary && <p className="mt-2 rounded-[8px] bg-stone-100/70 px-3 py-2 text-[12.5px] leading-relaxed text-stone-700">“{c.request.commentary}”</p>}
          {c.adjustments.length > 0 && (
            <ul className="mt-3 space-y-1 text-[12.5px]">
              {c.adjustments.map((a, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="text-stone-600">{a.memo}</span>
                  <span className="tnum text-ink-900">{m(a.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          {c.request.status === "posted" && editable && (
            <details className="mt-3 text-[12.5px]">
              <summary className="cursor-pointer font-semibold text-ink-900">Post a further adjustment</summary>
              <p className="mt-1.5 text-stone-500">
                For a late valuation change. Linked figures update everywhere; if the package was already reviewed it is flagged for another look.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={adj.amount}
                  onChange={(e) => setAdj({ ...adj, amount: e.target.value })}
                  inputMode="decimal"
                  placeholder="Amount, e.g. -150000"
                  aria-label="Adjustment amount"
                  className="h-8 w-40 rounded-[7px] border border-stone-200 bg-transparent px-2.5 text-ink-900 placeholder:text-stone-400 focus:outline-none"
                />
                <input
                  value={adj.memo}
                  onChange={(e) => setAdj({ ...adj, memo: e.target.value })}
                  placeholder="Reason"
                  aria-label="Reason"
                  className="h-8 min-w-[160px] flex-1 rounded-[7px] border border-stone-200 bg-transparent px-2.5 text-ink-900 placeholder:text-stone-400 focus:outline-none"
                />
                <button
                  disabled={!Number(adj.amount.replace(/[, ]/g, "")) || !adj.memo.trim()}
                  onClick={() => {
                    actions.postAdjustment(fund.id, c.period, who, Number(adj.amount.replace(/[, ]/g, "")), adj.memo.trim());
                    setAdj({ amount: "", memo: "" });
                  }}
                  className="h-8 rounded-[7px] border border-stone-200 px-3 font-semibold text-ink-900 hover:bg-stone-100 disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </details>
          )}
        </Panel>
        {c.booksClosed && editable && c.status === "preparing" && (
          <button onClick={() => actions.reopenBooks(fund.id, c.period, who)} className="px-2 text-[12px] text-stone-500 underline-offset-2 hover:text-ink-900 hover:underline">
            Reopen the books
          </button>
        )}
      </div>
    </div>
  );
}

function LetterTab({ d, who }: { d: D; who: string }) {
  const [editing, setEditing] = useState(false);
  const c = d.close!;
  const canEdit = c.status === "preparing";
  if (editing)
    return (
      <LetterEditor
        blocks={c.blocks}
        figures={d.figures}
        onCancel={() => setEditing(false)}
        onSave={(b) => {
          actions.saveBlocks(d.fund.id, c.period, who, b);
          setEditing(false);
        }}
      />
    );
  return (
    <LetterView
      close={c}
      gp={d.gp}
      figures={d.figures}
      prevFigures={d.prevFigures}
      stale={d.stale}
      side="aurum"
      onComment={(t, text) => actions.comment(d.fund.id, c.period, who, "aurum", t, text)}
      onReply={(id, text) => actions.reply(d.fund.id, c.period, who, "aurum", id, text)}
      onResolve={(id) => actions.resolve(d.fund.id, c.period, who, id)}
      aside={
        <div className="border-b border-stone-100 px-4 py-3">
          {canEdit ? (
            <button onClick={() => setEditing(true)} className={cx(secondary, "w-full justify-center")}>
              <Pencil size={14} /> Edit the wording
            </button>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-stone-500">
              <Lock size={12} className="mr-1 inline" />
              The wording is locked while the package is {c.status === "published" ? "published" : "in review"}. Request changes to edit it.
            </p>
          )}
          {d.stale.length > 0 && <p className="mt-2 text-[12.5px] text-gold-700">Highlighted figures changed after review.</p>}
        </div>
      }
    />
  );
}

function StatementsTab({ d, who }: { d: D; who: string }) {
  const c = d.close!;
  const [view, setView] = useState<string | null>(null);
  const m = (v: number) => money(v, d.fund.currency);
  const sum = (k: "openNav" | "contributions" | "distributions" | "result" | "nav") => d.partners.reduce((a, p) => a + p[k], 0);
  const nav = d.figures.nav.value as number;
  const ties = Math.abs(sum("nav") - nav) < 1;
  const row = d.partners.find((p) => p.investorId === view);
  return (
    <div className="space-y-2">
      <Panel
        title={`Capital account statements · ${d.partners.length}`}
        aside={
          !c.statements ? (
            <button
              onClick={() => actions.generateStatements(d.fund.id, c.period, who, d.partners.length)}
              className="rounded-[7px] bg-brand px-2.5 py-1 text-[12px] font-semibold text-brand-ink"
            >
              Generate all
            </button>
          ) : (
            <span className="text-[12px] text-stone-500">
              Generated {date(c.statements.at.slice(0, 10))} by {c.statements.by}
              {c.published ? ` · published ${date(c.published.at.slice(0, 10))}` : ""}
            </span>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[12.5px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Partner</th>
                <th className={cx(th, "text-right")}>Opening capital</th>
                <th className={cx(th, "text-right")}>Contributions</th>
                <th className={cx(th, "text-right")}>Distributions</th>
                <th className={cx(th, "text-right")}>Net result</th>
                <th className={cx(th, "text-right")}>Closing capital</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {d.partners.map((p) => (
                <tr key={p.investorId} className={tr}>
                  <td className={cx(td, "font-semibold text-ink-900")}>{p.name}</td>
                  <td className={cx(td, "tnum text-right text-stone-600")}>{m(p.openNav)}</td>
                  <td className={cx(td, "tnum text-right text-stone-600")}>{m(p.contributions)}</td>
                  <td className={cx(td, "tnum text-right text-stone-600")}>{m(-p.distributions)}</td>
                  <td className={cx(td, "tnum text-right text-stone-600")}>{m(p.result)}</td>
                  <td className={cx(td, "tnum text-right text-ink-900")}>{m(p.nav)}</td>
                  <td className={cx(td, "text-right")}>
                    <button
                      onClick={() => setView(p.investorId)}
                      disabled={!c.statements}
                      title={c.statements ? undefined : "Generate the statements first"}
                      className="rounded-[6px] px-2 py-0.5 text-[12px] font-semibold text-ink-900 hover:bg-stone-100 disabled:text-stone-400"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-stone-200 font-semibold">
                <td className={cx(td, "text-ink-900")}>Total</td>
                <td className={cx(td, "tnum text-right")}>{m(sum("openNav"))}</td>
                <td className={cx(td, "tnum text-right")}>{m(sum("contributions"))}</td>
                <td className={cx(td, "tnum text-right")}>{m(-sum("distributions"))}</td>
                <td className={cx(td, "tnum text-right")}>{m(sum("result"))}</td>
                <td className={cx(td, "tnum text-right")}>{m(sum("nav"))}</td>
                <td className={td} />
              </tr>
            </tbody>
          </table>
        </div>
        <p className={cx("flex items-center gap-1.5 border-t border-stone-100 px-4 py-2.5 text-[12px]", ties ? "text-up-ink" : "text-negative")}>
          {ties ? <Check size={13} /> : <X size={13} />} Closing capital {ties ? "equals" : "does not equal"} the fund’s net asset value of {m(nav)}.
        </p>
      </Panel>
      {row && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setView(null)}>
          <div
            className="drawer-in scroll-quiet h-full w-full max-w-[860px] overflow-y-auto bg-d-bg px-6 py-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Statement for ${row.name}`}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[14px] font-semibold text-d-text">Statement preview</span>
              <button onClick={() => setView(null)} aria-label="Close the preview" className="ml-auto rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
                <X size={16} />
              </button>
            </div>
            <StatementPaper gp={d.gp} fundName={d.fund.name} currency={d.fund.currency} period={c.period} row={row} />
          </div>
        </div>
      )}
    </div>
  );
}

function ChecksTab({ d }: { d: D }) {
  return (
    <Panel title="Tie-out checks" aside={<span className="text-[12px] text-stone-500">Run on every change · as of {date(d.figures.period_end.value as string)}</span>}>
      <ul>
        {d.checks.map((k) => (
          <li key={k.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 border-b border-stone-100 px-4 py-3 last:border-0">
            <span
              className={cx(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                k.status === "pass" ? "border-up-line text-up-ink" : k.status === "fail" ? "border-neg-line text-negative" : "border-stone-200 text-stone-400",
              )}
              aria-label={k.status}
            >
              {k.status === "pass" ? <Check size={13} /> : k.status === "fail" ? <X size={13} /> : k.status === "waiting" ? <Clock size={13} /> : <Minus size={13} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink-900">{k.label}</div>
              <div className="mt-0.5 text-[12.5px] text-stone-600">{k.detail}</div>
            </div>
            <div className="tnum text-right text-[12px] text-stone-600">
              {k.expected && (
                <div>
                  Expected <span className="text-ink-900">{k.expected}</span>
                </div>
              )}
              {k.actual && (
                <div>
                  {k.expected ? (
                    <>
                      Found <span className="text-ink-900">{k.actual}</span>
                    </>
                  ) : (
                    k.actual
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ActivityTab({ d }: { d: D }) {
  const log = [...d.close!.log].reverse();
  return (
    <Panel title="Activity" aside={<span className="text-[12px] text-stone-500">Also recorded in the platform audit log</span>}>
      <ol>
        {log.map((e, i) => (
          <li key={i} className="flex gap-4 border-b border-stone-100 px-4 py-2.5 text-[12.5px] last:border-0">
            <span className="tnum w-[120px] shrink-0 text-stone-500">
              {date(e.at.slice(0, 10))} {e.at.slice(11, 16)}
            </span>
            <span className="min-w-0 flex-1 text-stone-700">
              <span className="font-semibold text-ink-900">{e.who}</span> — {e.what}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
