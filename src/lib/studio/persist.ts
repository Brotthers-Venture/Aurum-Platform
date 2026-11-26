/**
 * Where Report Studio keeps its reports.
 *
 * Today: this browser (localStorage), handled by store.ts.
 * When NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set and a signed-in user's access token has
 * been provided (setAccessToken), every change is also written to the tables in
 * supabase/migrations/20261126000000_reporting_studio.sql through Supabase's REST API, and reports are read back from
 * there on load. Row-level security decides what each user may read and change; a refused change is reported, never
 * retried silently.
 *
 * Not yet exercised against a live database: there is no Supabase project or sign-in in this environment.
 */
import type { ReportData } from "./data";
import type { Report } from "./model";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let token: string | null = null;
/** Called by the sign-in flow once Supabase Auth is in place. */
export function setAccessToken(t: string | null) {
  token = t;
}

export type SyncState = { mode: "browser" | "database"; error?: string };
export const syncMode = (): SyncState["mode"] => (URL_ && KEY && token ? "database" : "browser");

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

type Row = Record<string, unknown>;

const toRow = (r: Report, snapshotId: string | null): Row => ({
  id: r.id,
  template: r.template,
  subject: r.subject ?? "fund",
  fund_id: r.subject === "family" ? null : r.fundId,
  family_id: r.subject === "family" ? r.fundId : null,
  investor_id: r.investorId ?? null,
  locale: r.locale ?? "en",
  period: r.period,
  name: r.name,
  status: r.status,
  archived_from: r.archivedFrom ?? null,
  design: r.design,
  pages: r.pages,
  review: r.review ?? {},
  snapshot_id: snapshotId,
});

/** Snapshot ids already written for a report, so a frozen snapshot is stored once. */
const written = new Map<string, string>();

/** Write one change. `prev` is the report before the change (undefined when it is new). */
export async function push(r: Report, prev?: Report): Promise<void> {
  if (syncMode() !== "database") return;
  let snapshotId: string | null = null;
  if (r.snapshot) {
    const key = `${r.id}@${r.snapshot.at}`;
    snapshotId = written.get(key) ?? null;
    if (!snapshotId) {
      // the report row must exist before its snapshot (foreign key)
      if (!prev) await rest("reports", { method: "POST", body: JSON.stringify(toRow({ ...r, status: "draft" }, null)) });
      const [snap] = (await rest("report_snapshots", { method: "POST", body: JSON.stringify({ report_id: r.id, data: r.snapshot.data }) })) as { id: string }[];
      snapshotId = snap.id;
      written.set(key, snapshotId);
    }
  }
  if (!prev && !r.snapshot) await rest("reports", { method: "POST", body: JSON.stringify(toRow(r, null)) });
  else await rest(`reports?id=eq.${encodeURIComponent(r.id)}`, { method: "PATCH", body: JSON.stringify(toRow(r, snapshotId)) });

  const newVersions = r.versions.slice(prev?.versions.length ?? 0);
  if (newVersions.length)
    await rest("report_versions", {
      method: "POST",
      body: JSON.stringify(
        newVersions.map((v) => ({ report_id: r.id, n: v.n, status: v.status, note: v.note, snapshot_id: snapshotId, pages: v.status === "draft" ? null : r.pages })),
      ),
    });

  const before = new Set((prev?.comments ?? []).map((c) => c.id));
  const added = (r.comments ?? []).filter((c) => !before.has(c.id));
  if (added.length)
    await rest("report_comments", { method: "POST", body: JSON.stringify(added.map((c) => ({ report_id: r.id, page_id: c.pageId, block_id: c.blockId, body: c.text }))) });
}

/** Reports this user may read, mapped back to the app's model. Comments and versions load with the report. */
export async function pull(): Promise<Report[]> {
  if (syncMode() !== "database") return [];
  const rows = (await rest("reports?select=*,report_snapshots!reports_snapshot_fk(data,taken_at),report_versions(n,status,note,at)&order=modified_at.desc")) as Row[];
  return rows.map((x) => {
    const snap = x.report_snapshots as { data: ReportData; taken_at: string } | null;
    const versions = ((x.report_versions as { n: number; status: Report["status"]; note: string; at: string }[]) ?? [])
      .sort((a, b) => a.n - b.n)
      .map((v) => ({ n: v.n, status: v.status, note: v.note, at: v.at.slice(0, 19), by: "" }));
    return {
      id: x.id as string,
      template: x.template as Report["template"],
      subject: x.subject as Report["subject"],
      fundId: (x.fund_id ?? x.family_id) as string,
      investorId: (x.investor_id as string) ?? undefined,
      locale: x.locale as Report["locale"],
      period: x.period as Report["period"],
      name: x.name as string,
      status: x.status as Report["status"],
      archivedFrom: (x.archived_from as Report["status"]) ?? undefined,
      design: x.design as Report["design"],
      pages: x.pages as Report["pages"],
      review: x.review as Report["review"],
      snapshot: snap ? { at: snap.taken_at.slice(0, 19), by: "", data: snap.data } : undefined,
      versions,
      created: String(x.created_at).slice(0, 19),
      modified: String(x.modified_at).slice(0, 19),
      modifiedBy: "",
    };
  });
}
