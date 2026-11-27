"use client";

/**
 * PMO report — a print-ready document built from the project plans. One plan, one party's
 * requests, or every plan consolidated for the board. The page lays itself out on US Letter
 * landscape; "Download PDF" opens the browser's print dialog, where "Save as PDF" writes the file.
 * No server or third-party service is involved.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { AurumLogo } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { gpById, inkFor } from "@/lib/gps";
import { solutionById } from "@/lib/solutions";
import {
  PLAN_TODAY,
  daysLeft,
  folderPath,
  holdsUp,
  isOverdue,
  isTopic,
  loadPlans,
  nextDeadline,
  planFolders,
  plans as seedPlans,
  summary,
  topicOf,
  type Plan,
  type PlanFolder,
  type PlanRow,
  type PlanStatus,
} from "@/lib/plans";

export type ReportScope = "all" | "open";
export type ReportParams = { plan: string; party: string; scope: ReportScope; head: "firm" | "sponsor" };

const STATUS_TEXT: Record<PlanStatus, string> = { Completed: "#1F7A45", "In progress": "#2A64A0", "Not started": "#5B7592", Blocked: "#B3261E", "On hold": "#A86A0B" };
const PRIORITY_TEXT = { High: "#B3261E", Medium: "#A86A0B", Low: "#1F7A45" } as const;

const us = (iso?: string) => (iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(2, 4)}` : "");
const usLong = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}`;

/** The sponsor whose letterhead a plan can carry: a party that is also one of the firm's GP clients. */
const sponsorOf = (p: Plan) => p.parties.map((x) => gpById(x.id)).find(Boolean);

export function PmoReport({ initial }: { initial: ReportParams }) {
  const [data, setData] = useState<{ plans: Plan[]; folders: PlanFolder[] }>({ plans: seedPlans, folders: planFolders });
  useEffect(() => {
    const saved = loadPlans();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser copy of the plans replaces the seed after hydration
    if (saved) setData(saved);
  }, []);
  const [p, setP] = useState<ReportParams>(initial);
  const set = (patch: Partial<ReportParams>) => {
    const next = { ...p, ...patch };
    if (patch.plan !== undefined) next.party = "all";
    setP(next);
    const q = new URLSearchParams({ plan: next.plan });
    if (next.party !== "all") q.set("party", next.party);
    if (next.scope !== "all") q.set("scope", next.scope);
    if (next.head !== "firm") q.set("head", next.head);
    window.history.replaceState(null, "", `?${q}`);
  };

  const { brand } = useBrand();
  const single = data.plans.find((x) => x.id === p.plan);
  const list = single ? [single] : data.plans;
  const sponsor = single ? sponsorOf(single) : undefined;
  const useSponsor = p.head === "sponsor" && !!sponsor;
  const party = single?.parties.find((x) => x.id === p.party);
  const footer = single
    ? `${useSponsor ? sponsor!.shortName : brand.legalName} — ${single.vehicle || single.name} | Confidential`
    : `${brand.legalName} — Project portfolio | Confidential`;

  return (
    <div className="print-root min-h-screen bg-[#E9E6E0] pb-16">
      {/* Footer and page numbers are drawn by the page box itself, so they repeat on every printed sheet. */}
      <style>{`@page pmo { @bottom-left { content: ${JSON.stringify(footer)}; } }`}</style>

      <div className="print-chrome sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-6 py-3 text-[13px]">
          <Link href="/admin/pmo?tab=reports" className="flex items-center gap-1.5 font-semibold text-[var(--tenant-ink)] hover:underline">
            <ArrowLeft size={14} /> PMO
          </Link>
          <span className="h-5 w-px bg-black/10" />
          <Pick
            label="Plan"
            value={p.plan}
            onChange={(v) => set({ plan: v })}
            options={[["all", "All plans, consolidated"], ...data.plans.map((x) => [x.id, x.name] as [string, string])]}
          />
          {single && (
            <Pick
              label="Requested from"
              value={p.party}
              onChange={(v) => set({ party: v })}
              options={[["all", "Every party"], ...single.parties.map((x) => [x.id, `${x.contact} (${x.name})`] as [string, string])]}
            />
          )}
          <Pick
            label="Items"
            value={p.scope}
            onChange={(v) => set({ scope: v as ReportScope })}
            options={[
              ["all", "Whole plan"],
              ["open", "Open items only"],
            ]}
          />
          {sponsor && (
            <Pick
              label="Letterhead"
              value={p.head}
              onChange={(v) => set({ head: v as "firm" | "sponsor" })}
              options={[
                ["firm", brand.name],
                ["sponsor", sponsor.shortName],
              ]}
            />
          )}
          <button
            onClick={() => window.print()}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-[8px] px-3.5 font-semibold"
            style={{ background: "var(--tenant-ink)", color: inkFor(brand.colors.ink) }}
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
        <p className="mx-auto max-w-[1180px] px-6 pb-2.5 text-[11.5px] text-[#6B6458]">
          In the print window, choose &ldquo;Save as PDF&rdquo; as the destination. Paper size and margins are already set: US Letter, landscape.
        </p>
      </div>

      <div
        className="pmo-report mx-auto mt-8 w-[11in] max-w-full space-y-8 print:mt-0 print:space-y-0"
        style={{ ["--rep-ink" as string]: "var(--tenant-ink)", ["--rep-band" as string]: "color-mix(in oklab, var(--rep-ink) 72%, white)" }}
      >
        {!single && <Cover plans={list} folders={data.folders} />}
        {list.map((plan) => (
          <PlanDoc key={plan.id} plan={plan} folders={data.folders} partyId={single ? p.party : "all"} scope={p.scope} sponsor={useSponsor ? sponsor : undefined} party={party} />
        ))}
      </div>
    </div>
  );
}

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11.5px] text-[#6B6458]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 max-w-[260px] rounded-[6px] border border-black/15 bg-white px-2 text-[12.5px] text-[var(--rep-ink)]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ───────────────────────── letterhead ───────────────────────── */

type Sponsor = NonNullable<ReturnType<typeof gpById>>;

function Band({ title, lines, sponsor }: { title: string; lines: { text: string; strong?: boolean }[]; sponsor?: Sponsor }) {
  const { brand } = useBrand();
  const bg = sponsor ? sponsor.brand.primary : brand.colors.ink;
  const ink = inkFor(bg);
  const logo = sponsor ? (ink === "#FFFFFF" ? (sponsor.logoDark ?? sponsor.logo) : sponsor.logo) : null;
  return (
    <div className="flex items-center justify-between gap-8 px-[0.45in] py-[0.22in]" style={{ background: bg, color: ink }}>
      <div className="shrink-0">
        {logo ? (
          <Image src={logo.src} alt={sponsor!.shortName} width={Math.round((44 * logo.width) / logo.height)} height={44} />
        ) : (
          <AurumLogo variant={ink === "#FFFFFF" ? "white" : "dark"} height={40} />
        )}
      </div>
      <div className="min-w-0 text-right">
        <div className="font-serif text-[27px] font-semibold uppercase leading-tight tracking-[0.01em]">{title}</div>
        {lines.map((l, i) => (
          <div key={i} className={l.strong ? "mt-1 text-[11px] font-bold uppercase tracking-[0.08em]" : "mt-0.5 font-serif text-[13.5px] opacity-80"}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-[0.9in] gap-y-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#5B7592]">{k}</div>
          <div className="font-serif text-[14px] text-[var(--rep-ink)]">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Strip({ rows }: { rows: PlanRow[] }) {
  const s = summary(rows);
  const cells: [string, string | number, string?][] = [
    ["Tasks", s.tasks],
    ["Completed", s.completed, STATUS_TEXT.Completed],
    ["In progress", s.inProgress, STATUS_TEXT["In progress"]],
    ["Not started", s.notStarted, STATUS_TEXT["Not started"]],
    ["Blocked", s.blocked, s.blocked ? STATUS_TEXT.Blocked : undefined],
    ["Overdue", s.overdue, s.overdue ? STATUS_TEXT.Blocked : undefined],
    ["Complete", `${Math.round(s.pct * 100)}%`],
  ];
  return (
    <div className="grid grid-cols-7 border-y border-[#C9D3E0]">
      {cells.map(([k, v, c]) => (
        <div key={k} className="border-r border-[#E1E6EE] px-3 py-1.5 last:border-0">
          <div className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#5B7592]">{k}</div>
          <div className="tnum text-[15px] font-semibold" style={{ color: c ?? "var(--rep-ink)" }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── one plan ───────────────────────── */

const HEAD = [
  "ID",
  "Level",
  "Task / Subtask",
  "Owner",
  "Entity",
  "Depends on",
  "Priority",
  "Status",
  "Start",
  "Deadline",
  "Days left",
  "Deliverable / Evidence",
  "Holds up",
  "Next step / Notes",
];
const WIDTHS = ["4.5%", "5%", "17%", "7.5%", "6.5%", "6%", "6%", "8%", "6%", "6.5%", "5%", "9.5%", "5%", "8.5%"];

function PlanDoc({
  plan,
  folders,
  partyId,
  scope,
  sponsor,
  party,
}: {
  plan: Plan;
  folders: PlanFolder[];
  partyId: string;
  scope: ReportScope;
  sponsor?: Sponsor;
  party?: Plan["parties"][number];
}) {
  const { brand } = useBrand();
  const nameOf = (id: string) => plan.parties.find((x) => x.id === id)?.name ?? "";
  const tasks = plan.rows.filter((r) => !isTopic(r) && (partyId === "all" || r.party === partyId) && (scope === "all" || r.status !== "Completed"));
  const topics = plan.rows.filter((r) => isTopic(r) && tasks.some((t) => topicOf(t.id) === r.id));
  const where = [solutionById(plan.solution)?.name, ...folderPath(folders, plan.folder).map((f) => f.name)].filter(Boolean).join(" / ");
  const title = party || scope === "open" ? "Outstanding deliverables" : "Project status report";
  const lines = [
    { text: [plan.vehicle, plan.name].filter(Boolean).join(" — ") },
    ...(party ? [{ text: `Requested from: ${party.contact}`, strong: true }] : where ? [{ text: where, strong: true }] : []),
  ];
  const intro = party
    ? `The items below are required from ${party.name} to move ${plan.name} forward. Please deliver by the deadlines shown.`
    : scope === "open"
      ? `The items below are open and required to move ${plan.name} forward. Deadlines and owners are shown for each.`
      : `Status of every topic and task in ${plan.name}, with owners, dependencies and deadlines.`;

  return (
    <section
      className="report-sheet bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] print:shadow-none"
      style={sponsor ? { ["--rep-ink" as string]: sponsor.brand.primary, ["--rep-band" as string]: `color-mix(in oklab, ${sponsor.brand.primary} 72%, white)` } : undefined}
    >
      <Band title={title} lines={lines} sponsor={sponsor} />
      <div className="px-[0.45in] pb-[0.4in] pt-[0.22in]">
        <Meta
          items={[
            ["Project owner", party ? `${party.contact} (${party.name})` : plan.owner],
            ["As of", usLong(PLAN_TODAY)],
            ["Prepared by", brand.legalName],
            ["Next deadline", us(nextDeadline(tasks)) || "None open"],
          ]}
        />
        <div className="mt-3 border-t border-[#C9D3E0] pt-2.5 font-serif text-[12.5px] italic text-[#5B7592]">{intro}</div>
        <div className="mt-3">
          <Strip rows={tasks} />
        </div>

        <table className="mt-4 w-full table-fixed border-collapse border border-[var(--rep-ink)] text-[9.5px] leading-snug">
          <colgroup>
            {WIDTHS.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {HEAD.map((h) => (
                <th key={h} className="border-r border-white/15 bg-[var(--rep-ink)] px-1.5 py-2 text-center font-semibold text-white last:border-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          {topics.map((t) => {
            const mine = tasks.filter((x) => topicOf(x.id) === t.id);
            const all = plan.rows.filter((x) => !isTopic(x) && topicOf(x.id) === t.id);
            const pct = all.length ? Math.round((all.filter((x) => x.status === "Completed").length / all.length) * 100) : 0;
            return (
              <tbody key={t.id} className="break-inside-auto">
                <tr className="break-after-avoid bg-[var(--rep-band)] text-white">
                  <td className="px-1.5 py-1.5 text-center font-bold">{t.id}</td>
                  <td className="px-1.5 text-[8px] font-bold uppercase tracking-[0.06em]">Topic</td>
                  <td colSpan={5} className="px-1.5 font-serif text-[11.5px] font-semibold uppercase tracking-[0.02em]">
                    {t.title}
                  </td>
                  <td colSpan={7} className="px-1.5 font-semibold">
                    {pct}% complete
                  </td>
                </tr>
                {mine.map((r, i) => (
                  <TaskRow key={r.id} r={r} plan={plan} party={nameOf(r.party)} shade={i % 2 === 1} />
                ))}
              </tbody>
            );
          })}
          {!topics.length && (
            <tbody>
              <tr>
                <td colSpan={14} className="px-3 py-6 text-center text-[11px] text-[#5B7592]">
                  Nothing outstanding{party ? ` from ${party.name}` : ""}.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </section>
  );
}

function TaskRow({ r, plan, party, shade }: { r: PlanRow; plan: Plan; party: string; shade: boolean }) {
  const dl = daysLeft(r);
  const late = isOverdue(r);
  const holds = holdsUp(plan.rows, r.id);
  const td = "border-b border-r border-[#D5DCE6] px-1.5 py-2 align-middle";
  return (
    <tr className="break-inside-avoid" style={{ background: shade ? "#F3F6FA" : "#FFFFFF" }}>
      <td className={`${td} text-center font-bold text-[var(--rep-ink)]`}>{r.id}</td>
      <td className={`${td} text-center font-serif italic text-[#5B7592]`}>{r.id.split(".").length > 2 ? "Subtask" : "Task"}</td>
      <td className={`${td} font-serif text-[10.5px] font-semibold text-[var(--rep-ink)]`}>{r.title}</td>
      <td className={`${td} text-center`}>{r.owner}</td>
      <td className={`${td} text-center`}>{party}</td>
      <td className={`${td} text-center`}>{r.dependsOn.length ? r.dependsOn.join(", ") : "—"}</td>
      <td className={`${td} text-center font-semibold`} style={{ color: r.priority ? PRIORITY_TEXT[r.priority] : undefined }}>
        {r.priority}
      </td>
      <td className={`${td} text-center font-semibold`} style={{ color: r.status ? STATUS_TEXT[r.status] : undefined }}>
        {r.status}
      </td>
      <td className={`${td} tnum text-center`}>{r.status === "Completed" ? "" : us(r.start)}</td>
      <td className={`${td} tnum text-center`}>{r.status === "Completed" ? "" : us(r.deadline)}</td>
      <td className={`${td} tnum text-center font-semibold`} style={{ color: late ? STATUS_TEXT.Blocked : undefined }}>
        {dl === null ? "" : late ? `${-dl} late` : dl}
      </td>
      <td className={td}>{r.deliverable}</td>
      <td className={`${td} text-center`}>{holds.length ? holds.join(", ") : ""}</td>
      <td className={`${td} border-r-0`}>{r.notes}</td>
    </tr>
  );
}

/* ───────────────────────── consolidated cover ───────────────────────── */

function Cover({ plans, folders }: { plans: Plan[]; folders: PlanFolder[] }) {
  const { brand } = useBrand();
  const all = plans.flatMap((p) => p.rows);
  const s = summary(all);
  return (
    <section className="report-sheet bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] print:shadow-none">
      <Band
        title="Project portfolio report"
        lines={[{ text: `${plans.length} ${plans.length === 1 ? "plan" : "plans"} across the firm` }, { text: "Prepared for the board", strong: true }]}
      />
      <div className="px-[0.45in] pb-[0.4in] pt-[0.22in]">
        <Meta
          items={[
            ["Prepared by", brand.legalName],
            ["As of", usLong(PLAN_TODAY)],
            ["Open tasks", String(s.tasks - s.completed)],
            ["Overdue", String(s.overdue)],
          ]}
        />
        <div className="mt-3 border-t border-[#C9D3E0] pt-2.5 font-serif text-[12.5px] italic text-[#5B7592]">
          One line per plan. Each plan follows on its own pages with every topic and task.
        </div>
        <table className="mt-4 w-full border-collapse border border-[var(--rep-ink)] text-[10.5px]">
          <thead>
            <tr>
              {["Plan", "Solution / folder", "Owner", "Tasks", "Completed", "Blocked", "Overdue", "Complete", "Next deadline"].map((h, i) => (
                <th key={h} className={`bg-[var(--rep-ink)] px-2 py-2 font-semibold text-white ${i > 2 ? "text-center" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p, i) => {
              const ps = summary(p.rows);
              const pct = Math.round(ps.pct * 100);
              const td = "border-b border-[#D5DCE6] px-2 py-2.5";
              return (
                <tr key={p.id} style={{ background: i % 2 ? "#F3F6FA" : "#FFFFFF" }}>
                  <td className={`${td} font-serif text-[12px] font-semibold text-[var(--rep-ink)]`}>
                    {p.name}
                    {p.vehicle && <div className="font-sans text-[9.5px] font-normal text-[#5B7592]">{p.vehicle}</div>}
                  </td>
                  <td className={td}>{[solutionById(p.solution)?.name, ...folderPath(folders, p.folder).map((f) => f.name)].filter(Boolean).join(" / ")}</td>
                  <td className={td}>{p.owner}</td>
                  <td className={`${td} tnum text-center`}>{ps.tasks}</td>
                  <td className={`${td} tnum text-center`}>{ps.completed}</td>
                  <td className={`${td} tnum text-center font-semibold`} style={{ color: ps.blocked ? STATUS_TEXT.Blocked : undefined }}>
                    {ps.blocked}
                  </td>
                  <td className={`${td} tnum text-center font-semibold`} style={{ color: ps.overdue ? STATUS_TEXT.Blocked : undefined }}>
                    {ps.overdue}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E1E6EE]">
                        <div className="h-1.5 rounded-full bg-[var(--rep-band)]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="tnum w-8 text-right font-semibold">{pct}%</span>
                    </div>
                  </td>
                  <td className={`${td} tnum text-center`}>{us(nextDeadline(p.rows)) || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
