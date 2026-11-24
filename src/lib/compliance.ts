/**
 * Compliance — Aurum's regulatory calendar, policies, training, screening reviews and access reviews.
 * Deadlines here are illustrative sample entries; real dates come from counsel and the regulators.
 */

export type DeadlineStatus = "Upcoming" | "In progress" | "Filed" | "Overdue";
export type Deadline = { id: string; title: string; authority: string; entity: string; due: string; owner: string; status: DeadlineStatus; recurrence: string };
export type Policy = { id: string; name: string; version: string; owner: string; lastReviewed: string; nextReview: string; attested: number };
export type Course = { id: string; name: string; due: string };
export type TrainingRow = { person: string; role: string; status: Record<string, "Complete" | "Due" | "Overdue"> };
export type Alert = { id: string; subject: string; context: string; kind: "PEP" | "Sanctions" | "Adverse media"; list: string; score: number; raised: string; status: "Needs review" | "Cleared" | "Escalated"; firstReviewer?: string; note?: string };
export type AccessReview = { id: string; system: string; users: number; reviewer: string; due: string; status: "Not started" | "In progress" | "Complete"; findings: number };

export const deadlines: Deadline[] = [
  { id: "c1", title: "Register of directors update — new subsidiary", authority: "BVI Registry", entity: "Altamira Holdings", due: "2026-11-21", owner: "Bianca Freitas", status: "Overdue", recurrence: "On change" },
  { id: "c2", title: "CVM periodic report", authority: "CVM (Brazil)", entity: "FIP Horizonte", due: "2026-12-10", owner: "Rafael Mendes", status: "In progress", recurrence: "Monthly" },
  { id: "c3", title: "Annual AML risk assessment", authority: "Internal (AML program)", entity: "Aurum", due: "2026-12-15", owner: "Carla Nogueira", status: "In progress", recurrence: "Annual" },
  { id: "c4", title: "Annual compliance training", authority: "Internal", entity: "All staff", due: "2026-12-15", owner: "Carla Nogueira", status: "In progress", recurrence: "Annual" },
  { id: "c5", title: "Quarterly user access review", authority: "Internal (SOC 1 control)", entity: "Aurum", due: "2026-12-31", owner: "Carla Nogueira", status: "In progress", recurrence: "Quarterly" },
  { id: "c6", title: "State notice filings", authority: "State securities regulators", entity: "Cascade Real Estate Fund I", due: "2027-01-08", owner: "Olivia Brandt", status: "Upcoming", recurrence: "Per offering" },
  { id: "c7", title: "Annual returns — 14 entities", authority: "Cayman Registrar", entity: "Cayman vehicles", due: "2027-01-31", owner: "Bianca Freitas", status: "In progress", recurrence: "Annual" },
  { id: "c8", title: "SOC 1 Type II report", authority: "Independent auditor", entity: "Aurum", due: "2027-02-28", owner: "Carla Nogueira", status: "Upcoming", recurrence: "Annual" },
  { id: "c9", title: "Investor tax packages (K-1)", authority: "IRS", entity: "US vehicles", due: "2027-03-15", owner: "Rafael Mendes", status: "Upcoming", recurrence: "Annual" },
  { id: "c10", title: "Form ADV annual amendment", authority: "SEC", entity: "Strlex Capital Group (client)", due: "2027-03-31", owner: "Luiza Andrade", status: "Upcoming", recurrence: "Annual" },
  { id: "c11", title: "Florida annual report", authority: "Florida Division of Corporations", entity: "Aurum", due: "2027-05-01", owner: "Bianca Freitas", status: "Upcoming", recurrence: "Annual" },
  { id: "c12", title: "Q3 investor statements delivered", authority: "LPA obligation", entity: "All vehicles", due: "2026-11-14", owner: "Luiza Andrade", status: "Filed", recurrence: "Quarterly" },
];

export const policies: Policy[] = [
  { id: "p1", name: "AML / KYC program", version: "4.2", owner: "Carla Nogueira", lastReviewed: "2026-03-01", nextReview: "2027-03-01", attested: 92 },
  { id: "p2", name: "Code of ethics", version: "3.1", owner: "Managing Partner", lastReviewed: "2026-01-15", nextReview: "2027-01-15", attested: 100 },
  { id: "p3", name: "Information security", version: "2.4", owner: "Carla Nogueira", lastReviewed: "2025-11-30", nextReview: "2026-11-30", attested: 85 },
  { id: "p4", name: "Business continuity", version: "2.0", owner: "Managing Partner", lastReviewed: "2025-12-10", nextReview: "2026-12-10", attested: 85 },
  { id: "p5", name: "Vendor management", version: "1.1", owner: "Carla Nogueira", lastReviewed: "2025-10-01", nextReview: "2026-10-01", attested: 77 },
  { id: "p6", name: "Records retention", version: "1.3", owner: "Carla Nogueira", lastReviewed: "2026-06-01", nextReview: "2027-06-01", attested: 100 },
  { id: "p7", name: "Valuation policy", version: "2.2", owner: "Luiza Andrade", lastReviewed: "2026-04-15", nextReview: "2027-04-15", attested: 100 },
  { id: "p8", name: "Privacy & data protection", version: "1.2", owner: "Carla Nogueira", lastReviewed: "2026-02-20", nextReview: "2027-02-20", attested: 92 },
];

export const courses: Course[] = [
  { id: "aml", name: "AML / KYC annual", due: "2026-12-15" },
  { id: "sec", name: "Security awareness", due: "2026-12-15" },
  { id: "ethics", name: "Code of ethics attestation", due: "2027-01-31" },
  { id: "privacy", name: "Data privacy", due: "2026-11-15" },
];

export const training: TrainingRow[] = [
  { person: "Luiza Andrade", role: "Head of Fund Services", status: { aml: "Complete", sec: "Complete", ethics: "Due", privacy: "Complete" } },
  { person: "Rafael Mendes", role: "Fund Accountant", status: { aml: "Due", sec: "Complete", ethics: "Due", privacy: "Complete" } },
  { person: "Juliana Teixeira", role: "Relationship Manager", status: { aml: "Due", sec: "Due", ethics: "Due", privacy: "Overdue" } },
  { person: "Carla Nogueira", role: "Compliance Officer", status: { aml: "Complete", sec: "Complete", ethics: "Complete", privacy: "Complete" } },
  { person: "Helena Costa", role: "Head of Family Office", status: { aml: "Complete", sec: "Due", ethics: "Due", privacy: "Complete" } },
  { person: "Noah Whitaker", role: "Head of Banking Operations", status: { aml: "Complete", sec: "Complete", ethics: "Due", privacy: "Complete" } },
  { person: "Priya Raman", role: "Head of Digital Assets", status: { aml: "Due", sec: "Complete", ethics: "Due", privacy: "Overdue" } },
  { person: "Olivia Brandt", role: "Head of Capital Markets", status: { aml: "Complete", sec: "Due", ethics: "Due", privacy: "Complete" } },
  { person: "Eduardo Sales", role: "Head of Corporate Services", status: { aml: "Complete", sec: "Complete", ethics: "Due", privacy: "Complete" } },
  { person: "Bianca Freitas", role: "Corporate Paralegal", status: { aml: "Due", sec: "Due", ethics: "Due", privacy: "Complete" } },
];

export const alerts: Alert[] = [
  { id: "al1", subject: "Ana & Rafael Monteiro", context: "Investor onboarding · Atlântico II", kind: "PEP", list: "Global PEP list", score: 78, raised: "2026-11-22", status: "Needs review", firstReviewer: "Carla Nogueira", note: "Possible match — date of birth differs" },
  { id: "al2", subject: "Kestrel Digital Assets Ltd.", context: "Sales prospect · Blockchain", kind: "Adverse media", list: "News screening", score: 54, raised: "2026-11-21", status: "Needs review" },
  { id: "al3", subject: "Paulo Ferreira", context: "Bank change request · Ferreira Holdings", kind: "Sanctions", list: "OFAC SDN", score: 41, raised: "2026-11-22", status: "Needs review" },
  { id: "al4", subject: "Helena M. Prado", context: "KYC refresh · STX-Anchor", kind: "PEP", list: "Global PEP list", score: 62, raised: "2026-11-15", status: "Cleared", firstReviewer: "Carla Nogueira", note: "Different person — confirmed by passport" },
  { id: "al5", subject: "Whitmore Advisory LLC", context: "Data room guest · Altamira", kind: "Adverse media", list: "News screening", score: 70, raised: "2026-11-18", status: "Escalated", firstReviewer: "Carla Nogueira", note: "Litigation article — sent to counsel" },
];

export const accessReviews: AccessReview[] = [
  { id: "ar1", system: "Aurum Platform — admin roles", users: 14, reviewer: "Managing Partner", due: "2026-12-31", status: "In progress", findings: 1 },
  { id: "ar2", system: "Bank portals (payments)", users: 6, reviewer: "Noah Whitaker", due: "2026-12-31", status: "Complete", findings: 0 },
  { id: "ar3", system: "General ledger", users: 5, reviewer: "Luiza Andrade", due: "2026-12-31", status: "Complete", findings: 0 },
  { id: "ar4", system: "Data rooms — external guests", users: 46, reviewer: "Carla Nogueira", due: "2026-12-31", status: "In progress", findings: 3 },
  { id: "ar5", system: "Email & file storage", users: 18, reviewer: "Carla Nogueira", due: "2026-12-31", status: "Not started", findings: 0 },
];

export const C_TODAY = "2026-11-24";
const days = (iso: string) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${C_TODAY}T12:00:00Z`)) / 86_400_000);
export const isOverdueDeadline = (d: Deadline) => d.status !== "Filed" && days(d.due) < 0;
export const policyDue = (p: Policy) => days(p.nextReview) <= 30;

export function complianceCounts() {
  return {
    due30: deadlines.filter((d) => d.status !== "Filed" && days(d.due) <= 30).length,
    overdue: deadlines.filter(isOverdueDeadline).length,
    policies: policies.filter(policyDue).length,
    trainingOverdue: training.reduce((t, r) => t + Object.values(r.status).filter((s) => s === "Overdue").length, 0),
    alerts: alerts.filter((a) => a.status === "Needs review").length,
    reviewsDone: accessReviews.filter((r) => r.status === "Complete").length,
    reviews: accessReviews.length,
  };
}
