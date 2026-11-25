/**
 * Compliance ↔ Onboarding (blueprint flow A).
 * A submitted subscription opens a screening case. No match clears automatically; a potential match needs two
 * people: a first review by the Compliance Officer and a second approval by the Head of Fund Services, never the
 * same person. The result writes back to the subscription, and nothing can be approved or countersigned while a
 * case is open (owner decision, 25 Nov 2026). KYC that expires within 30 days starts a refresh.
 */
import { investors, onboarding, type OnboardingStatus, type OnboardingSubmission } from "./data";
import { alerts } from "./compliance";
import type { RoleId } from "./access";
import { emit, type LedgerEvent, type Ref } from "./spine";

export type CaseStatus = "Needs review" | "Awaiting second approver" | "Cleared" | "Escalated" | "Rejected";
export type Decision = "Clear — false positive" | "Escalate to counsel" | "Reject";
export type Review = { by: string; at: string; decision: Decision; note: string };
export type Match = { name: string; kind: "PEP" | "Sanctions" | "Adverse media"; list: string; score: number; note: string };
export type ScreeningCase = {
  id: string;
  subscriptionId: string;
  subject: string;
  fundId: string;
  opened: string;
  result: "No match" | "Potential match";
  /** who was screened: the investor and its controlling people */
  screened: string[];
  matches: Match[];
  status: CaseStatus;
  first?: Review;
  second?: { by: string; at: string; confirmed: boolean; note?: string };
};

export const FIRST_REVIEWER_ROLE: RoleId = "compliance_officer";
export const SECOND_APPROVER_ROLE: RoleId = "fund_services_head";
export const canFirstReview = (r: RoleId) => r === FIRST_REVIEWER_ROLE || r === "platform_admin";
export const canSecondApprove = (r: RoleId) => r === SECOND_APPROVER_ROLE || r === "platform_admin";
export const KYC_REFRESH_DAYS = 30;
export const S_TODAY = "2026-11-24";

const SCREENED_FROM: OnboardingStatus[] = ["Submitted", "Changes requested", "Approved", "Countersigned"];
const peopleOf = (o: OnboardingSubmission) =>
  o.investorType === "Joint" ? o.investorName.replace(/^(.*) & (.*) (\S+)$/, "$1 $3|$2 $3").split("|") : [o.investorName, o.contactName];

function seedCase(o: OnboardingSubmission): ScreeningCase {
  const base = { id: `sc-${o.id}`, subscriptionId: o.id, subject: o.investorName, fundId: o.fundId, opened: `${o.lastActivity}T09:00:00Z`, screened: peopleOf(o) };
  if (o.kyc === "Potential match") {
    const al = alerts.find((a) => a.subject === o.investorName);
    return {
      ...base,
      result: "Potential match",
      matches: [{ name: "Rafael Monteiro", kind: al?.kind ?? "PEP", list: al?.list ?? "Global PEP list", score: al?.score ?? 78, note: al?.note ?? "Possible match" }],
      status: al?.firstReviewer ? "Awaiting second approver" : "Needs review",
      first: al?.firstReviewer
        ? { by: al.firstReviewer, at: `${al.raised}T16:20:00Z`, decision: "Clear — false positive", note: "Date of birth and nationality differ from the listed person; source of wealth documented." }
        : undefined,
    };
  }
  return { ...base, result: "No match", matches: [], status: "Cleared" };
}

const KEY = "aurum-screening-v1";
const OB_KEY = "aurum-onboarding-status-v1";
function readMap<T>(k: string): Record<string, T> {
  try {
    return JSON.parse(window.localStorage.getItem(k) ?? "{}") as Record<string, T>;
  } catch {
    return {};
  }
}
function writeMap<T>(k: string, v: Record<string, T>) {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
    window.dispatchEvent(new Event("aurum-screening"));
  } catch {
    /* storage unavailable */
  }
}

/** All screening cases: seeded from submissions, with changes made in this browser on top. */
export function loadCases(): ScreeningCase[] {
  const local = typeof window === "undefined" ? {} : readMap<ScreeningCase>(KEY);
  return onboarding.filter((o) => SCREENED_FROM.includes(o.status)).map((o) => local[`sc-${o.id}`] ?? seedCase(o));
}
export const caseFor = (subscriptionId: string) => loadCases().find((c) => c.subscriptionId === subscriptionId);
const saveCase = (c: ScreeningCase) => writeMap(KEY, { ...readMap<ScreeningCase>(KEY), [c.id]: c });

/** Subscription status, with approvals made in this browser on top. */
export function statusOf(o: OnboardingSubmission): OnboardingStatus {
  return (typeof window === "undefined" ? undefined : readMap<OnboardingStatus>(OB_KEY)[o.id]) ?? o.status;
}

/** What the subscription shows for KYC — always derived from its case. */
export function kycOf(o: OnboardingSubmission, c?: ScreeningCase): OnboardingSubmission["kyc"] | "Rejected" | "Escalated" {
  if (!c) return o.kyc;
  if (c.status === "Cleared") return "Clear";
  if (c.status === "Rejected") return "Rejected";
  if (c.status === "Escalated") return "Escalated";
  return "Potential match";
}

/** Why approval or countersignature is blocked, or null when it may proceed. */
export function gate(o: OnboardingSubmission, c?: ScreeningCase): string | null {
  if (!c) return "Screening has not run — the subscription must be submitted first.";
  if (c.status === "Cleared") return null;
  if (c.status === "Awaiting second approver") return `Screening match cleared by ${c.first?.by} — waiting for the second approver (Head of Fund Services).`;
  if (c.status === "Escalated") return "Screening match escalated to counsel. The subscription stays on hold until counsel responds.";
  if (c.status === "Rejected") return "Screening match confirmed — the subscription was rejected.";
  return "Screening returned a potential match. Compliance must review it, and a second person approve, before this can go further.";
}

const refs = (c: ScreeningCase): { ref: Ref; related: Ref[] } => {
  const inv = investors.find((i) => i.name === c.subject);
  return { ref: { kind: "screening", id: c.id }, related: [{ kind: "subscription", id: c.subscriptionId }, ...(inv ? [{ kind: "investor" as const, id: inv.id }] : [])] };
};

export function firstReview(c: ScreeningCase, by: string, decision: Decision, note: string) {
  const next: ScreeningCase = { ...c, status: "Awaiting second approver", first: { by, at: new Date().toISOString(), decision, note }, second: undefined };
  saveCase(next);
  emit({ actor: by, type: "screening.first_review", ...refs(c), text: `screening of ${c.subject}: first review by ${by} — ${decision.toLowerCase()}. Waiting for the second approver.` });
  return next;
}

export function secondApproval(c: ScreeningCase, by: string, confirmed: boolean, note?: string) {
  if (!c.first) throw new Error("No first review");
  if (c.first.by === by) throw new Error("The first reviewer cannot also approve");
  const final: CaseStatus = !confirmed ? "Needs review" : c.first.decision === "Reject" ? "Rejected" : c.first.decision === "Escalate to counsel" ? "Escalated" : "Cleared";
  const next: ScreeningCase = { ...c, status: final, second: { by, at: new Date().toISOString(), confirmed, note } };
  if (!confirmed) next.first = undefined;
  saveCase(next);
  emit({
    actor: by,
    type: confirmed ? `screening.${final.toLowerCase()}` : "screening.returned",
    ...refs(c),
    text: confirmed
      ? `screening of ${c.subject} ${final === "Cleared" ? "cleared" : final === "Escalated" ? "escalated to counsel" : "rejected"} — ${c.first.by} and ${by} (four eyes). KYC on the subscription is now ${final === "Cleared" ? "Clear" : final}.`
      : `screening of ${c.subject} sent back to Compliance by ${by}${note ? `: ${note}` : ""}.`,
  });
  return next;
}

export function setSubscriptionStatus(o: OnboardingSubmission, status: OnboardingStatus, by: string) {
  writeMap(OB_KEY, { ...readMap<OnboardingStatus>(OB_KEY), [o.id]: status });
  const inv = investors.find((i) => i.name === o.investorName);
  emit({
    actor: by,
    type: `onboarding.${status === "Approved" ? "approved" : "countersigned"}`,
    ref: { kind: "subscription", id: o.id },
    related: inv ? [{ kind: "investor", id: inv.id }] : [],
    text: status === "Approved" ? `${o.investorName} subscription approved by ${by}.` : `${o.investorName} subscription countersigned and accepted by ${by}.`,
    visibility: status === "Countersigned" ? "client" : "internal",
  });
}

/** History that existed before this browser: submissions and screening results, so feeds are never empty. */
export function seedEvents(): LedgerEvent[] {
  return onboarding
    .filter((o) => SCREENED_FROM.includes(o.status))
    .flatMap((o) => {
      const c = seedCase(o);
      const sub: Ref = { kind: "subscription", id: o.id };
      const scr: Ref = { kind: "screening", id: c.id };
      const out: LedgerEvent[] = [
        { id: `seed-sub-${o.id}`, at: `${o.lastActivity}T08:40:00Z`, actor: o.contactName, type: "onboarding.submitted", ref: sub, related: [scr], text: `${o.contactName} submitted subscription documents for ${o.investorName}.`, visibility: "internal" },
        {
          id: `seed-scr-${o.id}`,
          at: `${o.lastActivity}T09:00:00Z`,
          actor: "Screening",
          type: c.result === "No match" ? "screening.cleared" : "screening.opened",
          ref: scr,
          related: [sub],
          text:
            c.result === "No match"
              ? `screening of ${o.investorName} and its controlling people returned no match — cleared automatically.`
              : `screening of ${o.investorName} returned a potential ${c.matches[0]?.kind} match (${c.matches[0]?.score}) — case opened in Compliance.`,
          visibility: "internal",
        },
      ];
      if (c.first) out.push({ id: `seed-fr-${o.id}`, at: c.first.at, actor: c.first.by, type: "screening.first_review", ref: scr, related: [sub], text: `screening of ${o.investorName}: first review by ${c.first.by} — ${c.first.decision.toLowerCase()}. Waiting for the second approver.`, visibility: "internal" });
      return out;
    });
}

/* ───────────────────────── KYC refresh ───────────────────────── */

/** When each investor's KYC lapses (sample dates; in production from the KYC provider). */
const KYC_EXPIRES: Record<string, string> = { "inv-prado": "2026-12-15", "inv-vasconcelos": "2027-02-20" };
export type KycRefresh = { investorId: string; name: string; expires: string; days: number; owner: string };
export function kycRefreshes(): KycRefresh[] {
  const day = (iso: string) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${S_TODAY}T12:00:00Z`)) / 86_400_000);
  return investors
    .filter((i) => KYC_EXPIRES[i.id] && day(KYC_EXPIRES[i.id]) <= KYC_REFRESH_DAYS)
    .map((i) => ({ investorId: i.id, name: i.name, expires: KYC_EXPIRES[i.id], days: day(KYC_EXPIRES[i.id]), owner: i.relationshipManager }));
}
