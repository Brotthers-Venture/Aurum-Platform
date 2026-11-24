/**
 * Project plans — the detailed, spreadsheet-style side of the PMO: topics and tasks with owners,
 * the party responsible, dependencies, deliverables, deadlines and notes. "Holds up" and "days left"
 * are computed, never typed. Structure follows the private placement tracker Aurum already runs.
 */
export const PLAN_TODAY = "2026-11-24";

export type PlanStatus = "Not started" | "In progress" | "Completed" | "Blocked" | "On hold";
export type PlanPriority = "High" | "Medium" | "Low";
export type Party = { id: string; name: string; contact: string; color: string };

export type PlanRow = {
  id: string; // "1" for a topic, "1.2" for a task, "1.2.1" for a subtask
  title: string;
  party: string; // Party id
  owner?: string;
  dependsOn: string[];
  priority?: PlanPriority;
  status?: PlanStatus;
  start?: string;
  deadline?: string;
  deliverable?: string;
  notes?: string;
  comments?: { by: string; at: string; text: string }[];
  files?: string[];
};

export type Plan = {
  id: string;
  solution: string; // Solution id — every plan lives in one solution's workspace
  folder: string | null; // PlanFolder id, or null for the solution's top level
  name: string;
  vehicle: string;
  owner: string;
  parties: Party[];
  rows: PlanRow[];
};

export const STATUSES: PlanStatus[] = ["Not started", "In progress", "Completed", "Blocked", "On hold"];
export const PRIORITIES: PlanPriority[] = ["High", "Medium", "Low"];

const T = (id: string, title: string, party: string, p: Partial<PlanRow> = {}): PlanRow => ({ id, title, party, dependsOn: [], ...p });

export const plans: Plan[] = [
  {
    id: "stx-bahf-pp",
    solution: "fund",
    folder: "f-stx-bahf",
    name: "STX-BAHF I — Private Placement",
    vehicle: "STX-Brazil Affordable Housing Fund I, LP",
    owner: "Luca Ott (Aurum)",
    parties: [
      { id: "aurum", name: "Aurum", contact: "Luca Ott", color: "#B8975A" },
      { id: "strlex", name: "Strlex Capital", contact: "Darci Welter", color: "#191E31" },
      { id: "castle", name: "Castle Placement", contact: "Castle Placement", color: "#3558C0" },
      { id: "mazal", name: "Mazal Group", contact: "Mazal Group", color: "#8A4A9E" },
    ],
    rows: [
      T("1", "Fund constitution", "strlex"),
      T("1.1", "Certificate of Limited Partnership (Delaware) filed", "strlex", { owner: "Darci Welter", priority: "High", status: "Completed", deliverable: "Delaware Certificate of LP", notes: "Filed." }),
      T("1.2", "Federal EIN obtained for the Fund", "strlex", { owner: "Darci Welter", dependsOn: ["1.1"], priority: "High", status: "Completed", deliverable: "IRS EIN confirmation letter", notes: "Obtained." }),
      T("1.3", "Limited Partnership Agreement (LPA)", "strlex", { owner: "Darci Welter", dependsOn: ["1.2"], priority: "High", status: "Not started", start: "2026-10-01", deadline: "2026-10-08", deliverable: "Executed LPA" }),
      T("1.4", "Legal Entity Identifier (LEI) for the Fund", "aurum", { owner: "Luca Ott", dependsOn: ["1.3"], priority: "High", status: "Not started", start: "2026-11-08", deadline: "2026-11-11", deliverable: "LEI certificate (GLEIF)" }),
      T("1.5", "SEC EDGAR access — CIK", "aurum", { owner: "Luca Ott", dependsOn: ["1.4"], priority: "High", status: "Not started", start: "2026-11-11", deadline: "2026-11-14", deliverable: "CIK and EDGAR access codes" }),
      T("1.6", "Open PNC bank account", "aurum", { owner: "Luca Ott", dependsOn: ["1.5"], priority: "High", status: "Not started", start: "2026-11-14", deadline: "2026-11-20", deliverable: "Account opening confirmation", notes: "Everything downstream waits on the account." }),

      T("2", "Aurum placement & administration cost", "aurum"),
      T("2.1", "Drummond accounting price", "aurum", { owner: "Luca Ott", priority: "High", status: "Not started", start: "2026-10-07", deadline: "2026-10-09" }),
      T("2.2", "Auditor", "aurum", { owner: "Luca Ott", priority: "High", status: "Not started", start: "2026-10-12", deadline: "2026-10-15" }),
      T("2.3", "Other platform", "aurum", { owner: "Luca Ott", priority: "High", status: "In progress", start: "2026-10-07", deadline: "2026-10-09" }),

      T("3", "Private placement due diligence", "aurum"),
      T("3.1", "Strlex Capital Group — Excel DD", "aurum", { owner: "Luca Ott", priority: "High", status: "Not started", start: "2026-10-07", deadline: "2026-10-09" }),
      T("3.2", "BAH Fund — Excel DD", "aurum", { owner: "Luca Ott", priority: "High", status: "Completed", start: "2026-10-07", deadline: "2026-10-09" }),
      T("3.3", "Word document DD", "aurum", { owner: "Luca Ott", priority: "High", status: "Completed", start: "2026-10-09", deadline: "2026-10-16" }),
      T("3.4", "Virtual data room", "aurum", { owner: "Luca Ott", dependsOn: ["4.2"], priority: "High", status: "In progress", start: "2026-10-09", deadline: "2026-10-17" }),
      T("3.5", "Approval memo", "aurum", { owner: "Luca Ott", dependsOn: ["3.1", "3.2", "3.3"], priority: "High", status: "Not started", start: "2026-10-09", deadline: "2026-10-17" }),

      T("4", "Placement materials", "castle"),
      T("4.1", "Castle review and feedback on materials", "castle", { owner: "Castle Placement", priority: "Medium", status: "Completed", start: "2026-10-03", deadline: "2026-10-06", deliverable: "Castle written feedback", notes: "Track follow-ups here." }),
      T("4.2", "Prepare VDR", "castle", { owner: "Castle Placement", dependsOn: ["4.1"], priority: "High", status: "Completed", start: "2026-10-06", deadline: "2026-10-10", deliverable: "VDR index" }),

      T("5", "Project pipeline", "mazal"),
      T("5.1", "Provide pipeline of the R$4 billion in projects mentioned", "mazal", { owner: "Mazal Group", priority: "High", status: "Completed", start: "2026-09-30", deadline: "2026-10-07", deliverable: "Pipeline schedule", notes: "Requested from Mazal." }),
      T("5.2", "Strlex review of the Mazal pipeline", "strlex", { owner: "Darci Welter", dependsOn: ["5.1"], priority: "Medium", status: "In progress", start: "2026-10-08", deadline: "2026-11-28", deliverable: "Pipeline review notes" }),

      T("6", "Strlex — George", "strlex"),
      T("6.1", "Bring the corporate website in line with the Advisers Act and SEC rules, including disclaimers and compliance disclosures", "strlex", { owner: "George", priority: "High", status: "Not started", start: "2026-10-07", deadline: "2026-10-21", deliverable: "Updated website with compliance disclosures" }),
      T("6.2", "Create Tony’s corporate email", "strlex", { owner: "George", priority: "High", status: "Completed", start: "2026-10-07", deadline: "2026-10-09" }),
      T("6.3", "Share bio", "strlex", { owner: "George", priority: "High", status: "Completed", start: "2026-10-07", deadline: "2026-10-09" }),
      T("6.4", "Provide 3 commercial references", "strlex", { owner: "George", priority: "High", status: "Not started", start: "2026-10-07", deadline: "2026-10-09", deliverable: "First and last name, title, relationship, email, phone for each" }),

      T("7", "Strlex — Antonio Maciel", "strlex"),
      T("7.1", "Provide 3 commercial references", "strlex", { owner: "Tony", priority: "High", status: "Not started", start: "2026-10-07", deadline: "2026-10-09", deliverable: "First and last name, title, relationship, email, phone for each" }),
    ],
  },
];

/* ───────────────────────── folders ───────────────────────── */

/** Folders nest without limit: a folder's parent is another folder, or null for the solution's top level. */
export type PlanFolder = { id: string; name: string; solution: string; parent: string | null };

export const planFolders: PlanFolder[] = [
  { id: "f-strlex", name: "Strlex Capital", solution: "fund", parent: null },
  { id: "f-stx-bahf", name: "STX-BAHF I", solution: "fund", parent: "f-strlex" },
  { id: "f-cascade", name: "Cascade Ridge", solution: "fund", parent: null },
  { id: "f-onboarding", name: "GP onboarding", solution: "fund", parent: null },
  { id: "f-form-2026", name: "Formations 2026", solution: "corporate", parent: null },
  { id: "f-offer-castle", name: "Castle Placement mandates", solution: "offering", parent: null },
];

export function blankPlan(solution: string, folder: string | null, name = "Untitled plan"): Plan {
  return {
    id: `pl-${Date.now().toString(36)}`,
    solution,
    folder,
    name,
    vehicle: "",
    owner: "Luca Ott (Aurum)",
    parties: [{ id: "aurum", name: "Aurum", contact: "Luca Ott", color: "#B8975A" }],
    rows: [T("1", "First topic", "aurum"), T("1.1", "First task", "aurum", { owner: "Luca Ott", priority: "Medium", status: "Not started", start: PLAN_TODAY, deadline: PLAN_TODAY })],
  };
}

/** Folder path from the top of the solution down to (and including) this folder. */
export function folderPath(folders: PlanFolder[], id: string | null): PlanFolder[] {
  const out: PlanFolder[] = [];
  let cur = folders.find((f) => f.id === id);
  while (cur) {
    out.unshift(cur);
    cur = folders.find((f) => f.id === cur!.parent);
  }
  return out;
}

/** Every folder id inside this one, at any depth. */
export function descendants(folders: PlanFolder[], id: string): string[] {
  const kids = folders.filter((f) => f.parent === id).map((f) => f.id);
  return kids.flatMap((k) => [k, ...descendants(folders, k)]);
}

const STORE = "aurum-pmo-plans";
export function loadPlans(): { plans: Plan[]; folders: PlanFolder[] } | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as { plans: Plan[]; folders: PlanFolder[] }) : null;
  } catch {
    return null;
  }
}
export function savePlans(v: { plans: Plan[]; folders: PlanFolder[] }) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(v));
  } catch {
    /* storage unavailable: changes last for this visit only */
  }
}

/* ───────────────────────── calculations ───────────────────────── */

export const isTopic = (r: PlanRow) => !r.id.includes(".");
export const topicOf = (id: string) => id.split(".")[0];
export const daysLeft = (r: PlanRow, today = PLAN_TODAY) =>
  r.status === "Completed" || !r.deadline ? null : Math.round((Date.parse(`${r.deadline}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
export const isOverdue = (r: PlanRow, today = PLAN_TODAY) => {
  const d = daysLeft(r, today);
  return d !== null && d < 0;
};
/** Rows that list this one in "depends on" — what this task holds up. */
export const holdsUp = (rows: PlanRow[], id: string) => rows.filter((r) => r.dependsOn.includes(id)).map((r) => r.id);
/** A task whose predecessors aren't complete is waiting, whatever its own status says. */
export const waitingOn = (rows: PlanRow[], r: PlanRow) => r.dependsOn.filter((d) => rows.find((x) => x.id === d)?.status !== "Completed");

export function summary(rows: PlanRow[]) {
  const tasks = rows.filter((r) => !isTopic(r));
  const count = (s: PlanStatus) => tasks.filter((t) => t.status === s).length;
  return {
    tasks: tasks.length,
    completed: count("Completed"),
    inProgress: count("In progress"),
    notStarted: count("Not started"),
    blocked: count("Blocked"),
    onHold: count("On hold"),
    overdue: tasks.filter((t) => isOverdue(t)).length,
    pct: tasks.length ? count("Completed") / tasks.length : 0,
  };
}
