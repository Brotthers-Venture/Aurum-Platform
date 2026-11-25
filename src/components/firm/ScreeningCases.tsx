"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Lock } from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { DiscussButton } from "@/components/spine/Spine";
import { FIRM } from "@/lib/firm-colors";
import { fundById } from "@/lib/data";
import { canFirstReview, canSecondApprove, firstReview, loadCases, secondApproval, type Decision, type ScreeningCase } from "@/lib/screening";
import { ActionButton, Card, GhostButton, Pill, field } from "./kit";

const C = FIRM.compliance;
const DECISIONS: Decision[] = ["Clear — false positive", "Escalate to counsel", "Reject"];
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

export function useCases() {
  const [cases, setCases] = useState<ScreeningCase[]>([]);
  useEffect(() => {
    const read = () => setCases(loadCases());
    read();
    window.addEventListener("aurum-screening", read);
    return () => window.removeEventListener("aurum-screening", read);
  }, []);
  return cases;
}

/** Subscription screening: one case per submitted subscription, four eyes on every match. */
export function ScreeningCases({ flash }: { flash: (t: string) => void }) {
  const cases = useCases();
  const { role, user } = usePreviewRole();
  const [draft, setDraft] = useState<Record<string, { decision: Decision; note: string }>>({});
  const open = cases.filter((c) => c.status === "Needs review" || c.status === "Awaiting second approver");
  const done = cases.filter((c) => !open.includes(c));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[14px] font-semibold text-ink-900">Subscription screening</h2>
        <span className="text-[12px] text-stone-500">
          Opened automatically when an investor submits · first review by the Compliance Officer, second approval by the Head of Fund Services
        </span>
      </div>
      {open.map((c) => {
        const d = draft[c.id] ?? { decision: DECISIONS[0], note: "" };
        const mine = c.first?.by === user.name;
        return (
          <Card key={c.id} className="p-5" >
            <div id={c.id} className="flex flex-wrap items-start gap-4">
              <div className="w-14 text-center">
                <div className="num text-[22px] font-semibold text-ink-900">{c.matches[0]?.score ?? "—"}</div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-stone-400">match</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink-900">{c.subject}</span>
                  {c.matches[0] && <Pill tone={c.matches[0].kind === "Sanctions" ? "bad" : "warn"}>{c.matches[0].kind}</Pill>}
                  <Pill tone="gold">{c.status}</Pill>
                </div>
                <div className="text-[12px] text-stone-500">
                  Subscription {c.subscriptionId.toUpperCase()} · {fundById(c.fundId)?.shortName} · {c.matches[0]?.list} · match on {c.matches[0]?.name}
                </div>
                <div className="mt-1 text-[12.5px] text-stone-700">{c.matches[0]?.note}</div>
              </div>
              <div className="flex items-center gap-2">
                <DiscussButton refTo={{ kind: "subscription", id: c.subscriptionId }} label={c.subject} title={`${c.subject} — screening`} />
                <Link href={`/admin/fund/onboarding/${c.subscriptionId}`} className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-[12.5px] font-semibold text-ink-900 hover:bg-stone-100">
                  Subscription <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            {/* four eyes */}
            <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 md:grid-cols-2">
              <div className={cx("rounded-[8px] border p-3", c.first ? "border-stone-200 bg-stone-25" : "border-stone-300")}>
                <div className="text-[11.5px] font-semibold text-stone-500">1 · First review — Compliance Officer</div>
                {c.first ? (
                  <div className="mt-1.5 text-[12.5px]">
                    <div className="font-medium text-ink-900">
                      <Check size={12} className="mr-1 inline" />
                      {c.first.decision}
                    </div>
                    <div className="text-stone-600">{c.first.note}</div>
                    <div className="mt-1 text-[11px] text-stone-500">
                      {c.first.by} · {when(c.first.at)}
                    </div>
                  </div>
                ) : canFirstReview(role) ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {DECISIONS.map((x) => (
                        <button
                          key={x}
                          onClick={() => setDraft((m) => ({ ...m, [c.id]: { ...d, decision: x } }))}
                          className={cx("rounded-[6px] border px-2 py-1 text-[12px]", d.decision === x ? "border-ink-900 bg-white font-semibold text-ink-900" : "border-stone-200 text-stone-600 hover:border-stone-300")}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={d.note}
                      onChange={(e) => setDraft((m) => ({ ...m, [c.id]: { ...d, note: e.target.value } }))}
                      placeholder="Reason — what was checked and why (required)"
                      className={cx(field, "h-auto py-2")}
                    />
                    <ActionButton
                      color={C}
                      disabled={d.note.trim().length < 10}
                      onClick={() => {
                        firstReview(c, user.name, d.decision, d.note.trim());
                        flash(`First review recorded — ${c.subject} now waits for the second approver`);
                      }}
                    >
                      Record first review
                    </ActionButton>
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-stone-500">
                    <Lock size={12} /> Waiting for the Compliance Officer.
                  </p>
                )}
              </div>

              <div className={cx("rounded-[8px] border p-3", c.first ? "border-stone-300" : "border-dashed border-stone-200")}>
                <div className="text-[11.5px] font-semibold text-stone-500">2 · Second approval — Head of Fund Services</div>
                {!c.first ? (
                  <p className="mt-1.5 text-[12px] text-stone-500">Opens after the first review.</p>
                ) : mine ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-stone-500">
                    <Lock size={12} /> You recorded the first review, so someone else must approve it.
                  </p>
                ) : canSecondApprove(role) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ActionButton
                      color={C}
                      onClick={() => {
                        const n = secondApproval(c, user.name, true);
                        flash(`${c.subject}: ${n.status.toLowerCase()} — written back to the subscription`);
                      }}
                    >
                      Approve: {c.first.decision.split(" —")[0].toLowerCase()}
                    </ActionButton>
                    <GhostButton
                      onClick={() => {
                        secondApproval(c, user.name, false, "Needs more evidence");
                        flash(`${c.subject} sent back to Compliance`);
                      }}
                    >
                      Send back
                    </GhostButton>
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-stone-500">
                    <Lock size={12} /> Waiting for the Head of Fund Services.
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      {!open.length && <Card className="px-5 py-4 text-[12.5px] text-stone-500">No subscription is waiting on screening.</Card>}
      {done.length > 0 && (
        <details className="rounded-[10px] border border-stone-200 bg-white px-5 py-3 text-[12.5px]">
          <summary className="cursor-pointer font-medium text-ink-900">{done.length} closed cases</summary>
          <ul className="mt-2 divide-y divide-stone-100">
            {done.map((c) => (
              <li key={c.id} id={c.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-ink-900">{c.subject}</span>
                <span className="text-stone-500">{c.result === "No match" ? "No match · cleared automatically" : `${c.first?.by} → ${c.second?.by}`}</span>
                <Pill tone={c.status === "Cleared" ? "good" : "bad"}>{c.status}</Pill>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
