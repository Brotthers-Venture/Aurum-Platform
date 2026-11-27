"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, Lock, MessageSquare, ShieldCheck } from "lucide-react";
import { Button, Panel, Status, cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { ActivityFeed, DiscussButton } from "@/components/spine/Spine";
import { onboarding, type OnboardingSubmission } from "@/lib/data";
import { caseFor, gate, kycOf, seedEvents, setSubscriptionStatus, statusOf, type ScreeningCase } from "@/lib/screening";

/** Live subscription state: its screening case and status, re-read whenever either changes in this browser. */
function useSubmission(id: string) {
  const o = onboarding.find((x) => x.id === id) as OnboardingSubmission;
  const [state, setState] = useState<{ c?: ScreeningCase; status: OnboardingSubmission["status"] }>({ c: undefined, status: o.status });
  useEffect(() => {
    const read = () => setState({ c: caseFor(id), status: statusOf(o) });
    read();
    window.addEventListener("aurum-screening", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("aurum-screening", read);
      window.removeEventListener("storage", read);
    };
  }, [id, o]);
  return { o, ...state };
}

export function LiveStatus({ id }: { id: string }) {
  const { status } = useSubmission(id);
  return <Status value={status} />;
}

/** Approve / countersign, blocked while screening is not cleared (four eyes, owner decision 25 Nov 2026). */
export function SubmissionActions({ id }: { id: string }) {
  const { o, c, status } = useSubmission(id);
  const { user } = usePreviewRole();
  const block = gate(o, c);
  const canApprove = status === "Submitted" && !block;
  const canCountersign = status === "Approved" && !block;
  return (
    <div className="flex items-center gap-2">
      <DiscussButton refTo={{ kind: "subscription", id }} label={o.investorName} title={`${o.investorName} — subscription`} />
      <Button variant="secondary">
        <MessageSquare size={14} strokeWidth={1.8} /> Request changes
      </Button>
      {status === "Countersigned" ? (
        <span className="inline-flex h-9 items-center gap-1.5 px-2 text-[13px] font-semibold text-ink-900">
          <Check size={15} /> Accepted
        </span>
      ) : status === "Approved" ? (
        <Button variant="gold" disabled={!canCountersign} title={block ?? undefined} onClick={() => setSubscriptionStatus(o, "Countersigned", user.name)}>
          {block && <Lock size={13} />} Countersign & accept
        </Button>
      ) : (
        <Button
          disabled={!canApprove}
          title={block ?? (status !== "Submitted" ? `The subscription is ${status.toLowerCase()}.` : undefined)}
          onClick={() => setSubscriptionStatus(o, "Approved", user.name)}
        >
          {block && <Lock size={13} />} Approve subscription
        </Button>
      )}
    </div>
  );
}

export function ScreeningBanner({ id }: { id: string }) {
  const { o, c } = useSubmission(id);
  const block = gate(o, c);
  if (!c || !block) return null;
  return (
    <div className="flex gap-3 border-l-2 border-negative bg-negative-bg px-4 py-3 text-[13px] text-ink-900">
      <AlertTriangle size={16} strokeWidth={1.8} className="mt-px shrink-0 text-negative" />
      <div className="flex-1">
        <span className="font-semibold">Approval and countersignature are locked.</span> {block}
      </div>
      <Link
        href={`/admin/compliance?tab=screening#${c.id}`}
        className="inline-flex shrink-0 items-center gap-1 self-start font-semibold text-ink-900 underline-offset-2 hover:underline"
      >
        Open the case <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}

const STEPS = (c: ScreeningCase) => [
  { label: "Screened", who: `${c.screened.length} people · ${c.result}`, done: true },
  {
    label: "First review · Compliance",
    who: c.result === "No match" ? "Not needed — no match" : c.first ? `${c.first.by} · ${c.first.decision}` : "Waiting",
    done: c.result === "No match" || !!c.first,
  },
  {
    label: "Second approval · Head of Fund Services",
    who: c.result === "No match" ? "Not needed — no match" : c.second?.confirmed ? c.second.by : "Waiting",
    done: c.result === "No match" || !!c.second?.confirmed,
  },
];

export function ScreeningAside({ id }: { id: string }) {
  const { o, c } = useSubmission(id);
  return (
    <>
      <Panel
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} strokeWidth={1.8} style={{ color: "var(--module-compliance, #9B2F3F)" }} /> Screening
          </span>
        }
        actions={c ? <Status value={kycOf(o, c)} /> : undefined}
      >
        {!c ? (
          <p className="text-[12.5px] text-stone-500">Screening runs automatically when the investor submits.</p>
        ) : (
          <>
            <ol className="space-y-2.5">
              {STEPS(c).map((s) => (
                <li key={s.label} className="flex gap-2.5">
                  <span className={cx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", s.done ? "bg-ink-900 text-white" : "border border-stone-300")}>
                    {s.done && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium text-ink-900">{s.label}</span>
                    <span className="block text-[11.5px] text-stone-500">{s.who}</span>
                  </span>
                </li>
              ))}
            </ol>
            {c.matches.length > 0 && (
              <div className="mt-3 rounded-[6px] border border-stone-200 bg-stone-25 px-3 py-2 text-[12px]">
                <div className="font-medium text-ink-900">
                  {c.matches[0].kind} · {c.matches[0].name} · score {c.matches[0].score}
                </div>
                <div className="text-stone-500">{c.matches[0].list}</div>
              </div>
            )}
            <Link
              href={`/admin/compliance?tab=screening#${c.id}`}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-900 underline-offset-2 hover:underline"
            >
              Open in Compliance <ArrowUpRight size={13} />
            </Link>
          </>
        )}
      </Panel>
      <Panel title="Activity">
        <ActivityFeed refTo={{ kind: "subscription", id }} seed={seedEvents()} limit={8} />
      </Panel>
    </>
  );
}

type SectionState = "complete" | "attention" | "incomplete";
/** The KYC section follows the screening case once one exists. */
function useKycState(id: string, server: SectionState): SectionState {
  const { c } = useSubmission(id);
  if (!c) return server;
  return c.status === "Cleared" ? "complete" : "attention";
}
export function KycSectionMark({ id, server }: { id: string; server: SectionState }) {
  const st = useKycState(id, server);
  return (
    <span
      className={cx(
        "flex h-5 w-5 items-center justify-center rounded-full",
        st === "complete" ? "bg-positive" : st === "attention" ? "bg-caution" : "border border-stone-300 bg-stone-100",
      )}
    >
      {st === "complete" ? (
        <Check size={13} strokeWidth={2.5} className="text-white" />
      ) : st === "attention" ? (
        <AlertTriangle size={12} strokeWidth={2.2} className="text-white" />
      ) : null}
    </span>
  );
}
export function KycSectionLabel({ id, server }: { id: string; server: SectionState }) {
  const st = useKycState(id, server);
  return <span className="text-stone-500">{st === "complete" ? "Complete" : st === "attention" ? "Needs attention" : "Awaiting investor"}</span>;
}
/** A person's screening result, updated by the case (a reviewed match shows who cleared it). */
export function PersonScreening({ id, value }: { id: string; value: string }) {
  const { c } = useSubmission(id);
  if (value !== "Potential match" || !c) return <Status value={value} />;
  if (c.status === "Cleared") return <Status value="Clear" className="whitespace-normal" />;
  return <Status value={c.status === "Escalated" || c.status === "Rejected" ? c.status : "Potential match"} />;
}
