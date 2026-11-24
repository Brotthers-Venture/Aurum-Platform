"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, FileText, FileUp, Lock, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button, Panel, Progress, Status, cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import type { ExtractedTerm, LpaReview } from "@/lib/lpa/review";
import { date, dateTime } from "@/lib/format";

type Decision =
  | { kind: "approved"; by: string }
  | { kind: "edited"; by: string; value: string; source: string }
  | { kind: "rejected"; by: string; note: string }
  | { kind: "reading"; by: string; index: number; note: string }
  | { kind: "confirmed_absent"; by: string };

type Stage = "aurum_review" | "gp_confirmation" | "applied";

const groups: ExtractedTerm["group"][] = ["Fund & term", "Share classes", "Management fee", "Distribution waterfall", "Closings & equalization", "Expenses"];

export function EconomicsReview({ review, fundName }: { review: LpaReview; fundName: string }) {
  const { user, can } = usePreviewRole();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [stage, setStage] = useState<Stage>("aurum_review");
  const [aurumApprover, setAurumApprover] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ value: "", source: "", note: "", reading: 0 });

  const isPreparer = user.name === review.preparedBy;
  const isGp = user.title === "GP principal";
  const canDecide = stage === "aurum_review" && can("economics.approve") && !isPreparer && !isGp;
  const canConfirm = stage === "gp_confirmation" && isGp && can("economics.approve") && user.name !== aurumApprover;

  const decided = review.terms.filter((t) => decisions[t.key]).length;
  const rejected = review.terms.filter((t) => decisions[t.key]?.kind === "rejected").length;
  const allDecided = decided === review.terms.length;
  const counts = {
    extracted: review.terms.filter((t) => t.status === "extracted").length,
    notFound: review.terms.filter((t) => t.status === "not_found").length,
    ambiguous: review.terms.filter((t) => t.status === "ambiguous").length,
    impacts: review.terms.filter((t) => t.impact).length,
  };

  const decide = (key: string, d: Decision) => {
    setDecisions((x) => ({ ...x, [key]: d }));
    setEditing(null);
  };

  const approveAllVerified = () => {
    const next = { ...decisions };
    review.terms.forEach((t) => {
      if (!next[t.key] && t.status === "extracted" && t.verification === "verified") next[t.key] = { kind: "approved", by: user.name };
    });
    setDecisions(next);
  };

  const whyBlocked = isPreparer
    ? `You ran this review. Under the four-eyes rule another approver must decide each term.`
    : isGp && stage === "aurum_review"
      ? "Aurum reviews each term first; you confirm the result."
      : !can("economics.approve")
        ? "Your role can view the review but cannot approve fund economics."
        : null;

  return (
    <div className="space-y-6">
      <Link href={`/admin/fund/funds/${review.fundId}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> {fundName}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="eyebrow">Fund economics · version {review.version}</div>
          <h1 className="mt-2 flex items-center gap-3 text-[26px] font-semibold tracking-[-0.015em]">
            LPA review
            <Status value={stage === "applied" ? "Completed" : stage === "gp_confirmation" ? "GP consent" : "Pending review"} />
          </h1>
          <p className="mt-1.5 max-w-[720px] text-[14px] text-stone-600">
            Economic terms read from the fund documents. Every value quotes its source clause; anything the documents do not state
            is left blank. Nothing applies until Aurum and the GP have both approved.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!can("economics.prepare")}>
            <FileUp size={14} strokeWidth={1.8} /> Upload document
          </Button>
          <Button variant="secondary" disabled={!can("economics.prepare")}>
            <RotateCcw size={14} strokeWidth={1.8} /> Re-run review
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {whyBlocked && stage !== "applied" && (
            <div className="flex items-start gap-3 border-l-2 border-ink-900 bg-white px-4 py-3 text-[13px]">
              <Lock size={15} strokeWidth={1.8} className="mt-px shrink-0" />
              <span>
                <span className="font-semibold">Viewing as {user.title}.</span> {whyBlocked}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-stone-200 bg-stone-200 md:grid-cols-4">
            {[
              ["Extracted with source", counts.extracted, "text-ink-900"],
              ["Not found in documents", counts.notFound, "text-stone-600"],
              ["Conflicting clauses", counts.ambiguous, "text-caution"],
              ["Change current setup", counts.impacts, "text-info"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">{l}</div>
                <div className={cx("num mt-1 text-[22px] font-medium", c as string)}>{v}</div>
              </div>
            ))}
          </div>

          {canDecide && (
            <div className="flex items-center justify-between rounded-[4px] border border-stone-200 bg-white px-4 py-3 text-[13px]">
              <span className="text-stone-600">
                Each verified term still needs your approval. Not-found and conflicting terms must be decided one by one.
              </span>
              <Button size="sm" variant="secondary" onClick={approveAllVerified}>
                Approve all verified terms
              </Button>
            </div>
          )}

          {groups.map((g) => {
            const terms = review.terms.filter((t) => t.group === g);
            if (!terms.length) return null;
            return (
              <Panel key={g} title={g} flush>
                <ul className="divide-y divide-stone-100">
                  {terms.map((t) => {
                    const d = decisions[t.key];
                    const open = editing === t.key;
                    return (
                      <li key={t.key} className="px-5 py-4">
                        <div className="flex items-start gap-4">
                          <div className="w-[190px] shrink-0">
                            <div className="text-[13px] font-semibold">{t.label}</div>
                            <div className="mt-1">
                              {t.status === "extracted" && <Status value="Sourced" />}
                              {t.status === "not_found" && <Status value="Not found in LPA" />}
                              {t.status === "ambiguous" && <Status value="Conflicting clauses" />}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            {t.status === "extracted" && (
                              <>
                                <div className="text-[14px] font-semibold text-ink-900">
                                  {d?.kind === "edited" ? (
                                    <>
                                      <span className="mr-2 text-stone-400 line-through">{t.value}</span>
                                      {d.value}
                                    </>
                                  ) : (
                                    t.value
                                  )}
                                </div>
                                <blockquote className="mt-1.5 border-l-2 border-gold-400 pl-3 font-serif text-[13px] leading-relaxed text-stone-600">
                                  {t.quote}
                                </blockquote>
                                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-stone-500">
                                  <span className="font-mono">
                                    {t.clause} · p. {t.page}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-positive">
                                    <ShieldCheck size={12} strokeWidth={2} /> Quote verified in document
                                  </span>
                                </div>
                              </>
                            )}
                            {t.status === "not_found" && (
                              <div className="text-[13px] text-stone-600">
                                The documents do not state this term. It stays blank unless an approver enters it with a source.
                                {d?.kind === "edited" && (
                                  <div className="mt-1.5 text-[14px] font-semibold text-ink-900">
                                    {d.value} <span className="font-mono text-[11px] font-normal text-stone-500">· source: {d.source}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {t.status === "ambiguous" && (
                              <div className="space-y-2">
                                {t.readings!.map((r, i) => (
                                  <div
                                    key={i}
                                    className={cx(
                                      "rounded-[3px] border p-3",
                                      d?.kind === "reading" && d.index === i ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-200",
                                    )}
                                  >
                                    <div className="text-[13px] font-semibold">
                                      Reading {i + 1}: {r.value}
                                    </div>
                                    <blockquote className="mt-1 font-serif text-[13px] text-stone-600">{r.quote}</blockquote>
                                    <div className="mt-1 font-mono text-[11px] text-stone-500">
                                      {r.clause} · p. {r.page}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {t.impact && (
                              <div className="mt-2.5 flex gap-2 rounded-[3px] bg-info-bg px-3 py-2 text-[12px] text-info">
                                <CircleAlert size={14} strokeWidth={1.8} className="mt-px shrink-0" />
                                {t.impact}
                              </div>
                            )}

                            {open && (
                              <div className="mt-3 space-y-2 rounded-[3px] border border-stone-200 bg-stone-25 p-3">
                                {t.status === "ambiguous" ? (
                                  <>
                                    <div className="flex gap-2">
                                      {t.readings!.map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() => setDraft({ ...draft, reading: i })}
                                          className={cx("h-8 rounded-[3px] border px-3 text-[12px] font-semibold", draft.reading === i ? "border-ink-900 bg-ink-900 text-white" : "border-stone-300 bg-white")}
                                        >
                                          Apply reading {i + 1}
                                        </button>
                                      ))}
                                    </div>
                                    <input
                                      className="h-9 w-full rounded-[3px] border border-stone-300 px-3 text-[13px]"
                                      placeholder="Basis for the decision (required) — e.g. confirmed with fund counsel on…"
                                      value={draft.note}
                                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                        Cancel
                                      </Button>
                                      <Button size="sm" disabled={!draft.note.trim()} onClick={() => decide(t.key, { kind: "reading", by: user.name, index: draft.reading, note: draft.note })}>
                                        Record decision
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <input
                                      className="h-9 w-full rounded-[3px] border border-stone-300 px-3 text-[13px]"
                                      placeholder="Value"
                                      value={draft.value}
                                      onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                                    />
                                    <input
                                      className="h-9 w-full rounded-[3px] border border-stone-300 px-3 text-[13px]"
                                      placeholder="Source (required) — document, clause and page"
                                      value={draft.source}
                                      onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        disabled={!draft.value.trim() || !draft.source.trim()}
                                        onClick={() => decide(t.key, { kind: "edited", by: user.name, value: draft.value, source: draft.source })}
                                      >
                                        Save with source
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="w-[190px] shrink-0 text-right">
                            {d ? (
                              <div className="text-[12px]">
                                <div
                                  className={cx(
                                    "inline-flex items-center gap-1 font-semibold",
                                    d.kind === "rejected" ? "text-negative" : "text-positive",
                                  )}
                                >
                                  {d.kind === "rejected" ? <X size={13} strokeWidth={2.4} /> : <Check size={13} strokeWidth={2.4} />}
                                  {d.kind === "approved" && "Approved"}
                                  {d.kind === "edited" && "Corrected"}
                                  {d.kind === "rejected" && "Rejected"}
                                  {d.kind === "reading" && `Reading ${d.index + 1} applied`}
                                  {d.kind === "confirmed_absent" && "Left blank"}
                                </div>
                                <div className="text-stone-500">{d.by}</div>
                                {canDecide && (
                                  <button
                                    className="mt-1 text-[11px] text-stone-500 underline-offset-2 hover:underline"
                                    onClick={() =>
                                      setDecisions((x) => {
                                        const n = { ...x };
                                        delete n[t.key];
                                        return n;
                                      })
                                    }
                                  >
                                    Undo
                                  </button>
                                )}
                              </div>
                            ) : canDecide ? (
                              <div className="flex flex-col items-end gap-1.5">
                                {t.status === "extracted" && (
                                  <>
                                    <Button size="sm" onClick={() => decide(t.key, { kind: "approved", by: user.name })}>
                                      <Check size={13} strokeWidth={2.4} /> Approve
                                    </Button>
                                    <div className="flex gap-3 text-[12px]">
                                      <button
                                        className="font-medium text-stone-600 hover:text-ink-900"
                                        onClick={() => {
                                          setDraft({ value: t.value ?? "", source: `${t.clause}, p. ${t.page}`, note: "", reading: 0 });
                                          setEditing(t.key);
                                        }}
                                      >
                                        Correct
                                      </button>
                                      <button className="font-medium text-negative" onClick={() => decide(t.key, { kind: "rejected", by: user.name, note: "" })}>
                                        Reject
                                      </button>
                                    </div>
                                  </>
                                )}
                                {t.status === "not_found" && (
                                  <>
                                    <Button size="sm" variant="secondary" onClick={() => decide(t.key, { kind: "confirmed_absent", by: user.name })}>
                                      Confirm not in LPA
                                    </Button>
                                    <button
                                      className="text-[12px] font-medium text-stone-600 hover:text-ink-900"
                                      onClick={() => {
                                        setDraft({ value: "", source: "", note: "", reading: 0 });
                                        setEditing(t.key);
                                      }}
                                    >
                                      Enter with source
                                    </button>
                                  </>
                                )}
                                {t.status === "ambiguous" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setDraft({ value: "", source: "", note: "", reading: 0 });
                                      setEditing(t.key);
                                    }}
                                  >
                                    Decide reading
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[12px] text-stone-400">Awaiting approver</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            );
          })}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Panel title="Approval">
            <div className="flex items-baseline justify-between">
              <span className="num text-[22px] font-medium">
                {decided}/{review.terms.length}
              </span>
              <span className="text-[12px] text-stone-500">terms decided</span>
            </div>
            <Progress value={decided / review.terms.length} className="mt-2" />
            <ol className="mt-5 space-y-3 text-[13px]">
              {[
                ["Prepared", `${review.preparedBy} · ${dateTime(review.preparedAt)}`, true],
                ["Aurum review", aurumApprover ? `${aurumApprover} · term by term` : "Head of Fund Services or delegate", stage !== "aurum_review"],
                ["GP confirmation", stage === "applied" ? "Marcus Hale · GP principal" : "GP principal", stage === "applied"],
                ["Applied to fund", stage === "applied" ? "Classes, fees and waterfall updated" : "Not yet applied", stage === "applied"],
              ].map(([s, w, done], i) => (
                <li key={s as string} className="flex gap-3">
                  <span
                    className={cx(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                      done ? "bg-ink-900 text-white" : "border border-stone-300 text-stone-400",
                    )}
                  >
                    {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{s}</span>
                    <span className="block text-[12px] text-stone-500">{w}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-stone-100 pt-4">
              {stage === "aurum_review" && (
                <>
                  <Button
                    className="w-full"
                    disabled={!canDecide || !allDecided || rejected > 0}
                    onClick={() => {
                      setAurumApprover(user.name);
                      setStage("gp_confirmation");
                    }}
                  >
                    Approve and send to GP
                  </Button>
                  <p className="mt-2 text-[11px] text-stone-500">
                    {rejected > 0
                      ? `${rejected} term${rejected > 1 ? "s" : ""} rejected — re-run the review or correct with a source before approving.`
                      : !allDecided
                        ? `${review.terms.length - decided} terms still need a decision.`
                        : "Ready for approval."}
                  </p>
                </>
              )}
              {stage === "gp_confirmation" && (
                <>
                  <Button className="w-full" variant="gold" disabled={!canConfirm} onClick={() => setStage("applied")}>
                    Confirm and apply as GP
                  </Button>
                  <p className="mt-2 text-[11px] text-stone-500">
                    {canConfirm ? "Applies version 2 from Sep 29, 2023." : "Switch to the GP principal role (top right) to confirm."}
                  </p>
                </>
              )}
              {stage === "applied" && (
                <div className="flex items-start gap-2 text-[12px] text-positive">
                  <ShieldCheck size={15} strokeWidth={1.8} className="mt-px shrink-0" />
                  Applied. Both approvals, every decision and its source are in the audit log.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Documents reviewed" flush>
            <ul className="divide-y divide-stone-100">
              {review.documents.map((d) => (
                <li key={d.id} className="flex gap-3 px-5 py-3">
                  <FileText size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-stone-400" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{d.name}</span>
                    <span className="block text-[11px] text-stone-500">
                      {d.kind} · {date(d.date)} · {d.pages} pp.
                    </span>
                    <span className={cx("block text-[11px]", d.kind === "Side letter" ? "text-caution" : "text-stone-500")}>{d.scope}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Versions" flush>
            <ul className="divide-y divide-stone-100">
              {review.history.map((h) => (
                <li key={h.version} className="px-5 py-3 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      v{h.version} · {h.label}
                    </span>
                    <Status
                      value={
                        h.version === review.version
                          ? stage === "applied"
                            ? "Completed"
                            : "Pending review"
                          : stage === "applied"
                            ? "Superseded"
                            : "Completed"
                      }
                    />
                  </div>
                  <div className="text-[12px] text-stone-500">
                    Effective {date(h.effective)} · {h.version === review.version && stage === "applied" ? `${aurumApprover} · Marcus Hale (GP)` : h.approvedBy}
                  </div>
                </li>
              ))}
            </ul>
            <p className="border-t border-stone-100 px-5 py-3 text-[11px] text-stone-500">
              Earlier periods keep the economics in force at the time; a new version applies from its effective date.
            </p>
          </Panel>

          <div className="flex gap-2 px-1 text-[11px] leading-relaxed text-stone-500">
            <Sparkles size={13} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            Read by {review.model}, then checked in a second pass that each quote appears verbatim and supports the value.
          </div>
        </aside>
      </div>
    </div>
  );
}
