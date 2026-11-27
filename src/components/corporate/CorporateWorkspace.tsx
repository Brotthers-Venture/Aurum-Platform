"use client";

import { usePreviewRole } from "@/components/admin/PreviewRole";
import { MEMBERS } from "@/lib/parties";

import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert, Copy, ExternalLink, X } from "lucide-react";
import { cx } from "@/components/ui";
import { ActionButton, GhostButton, Kpi, ModuleHeader, Pill, Toast, fmtShort, useToast } from "@/components/firm/kit";
import { STAGES, formations as seed, jurisdictions, localFormations, services, usd, type Formation, type Stage } from "@/lib/formation";

/* Aurum's side of company formation: every application from the client form, moved stage by stage. */

const C = "var(--tenant-metal)";
const jName = (id: string) => jurisdictions.find((j) => j.id === id)?.name ?? id;
const tName = (j: string, t: string) => jurisdictions.find((x) => x.id === j)?.types.find((y) => y.id === t)?.short ?? t;

export function CorporateWorkspace() {
  const [allRows, setRows] = useState<Formation[]>(seed);
  // A tenant sees only the formations of its own clients.
  const { member } = usePreviewRole();
  const mine = member.party === "tenant" ? MEMBERS.filter((m) => m.party === "client" && m.tenantId === member.org).map((m) => m.orgName.toLowerCase()) : null;
  const rows = mine ? allRows.filter((r) => mine.some((n) => n.startsWith(r.client.toLowerCase()) || r.client.toLowerCase().startsWith(n.split(" ")[0]))) : allRows;
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [toast, flash] = useToast();
  useEffect(() => {
    const local = localFormations();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (local.length) setRows((r) => [...local.filter((l) => !r.some((x) => x.ref === l.ref)), ...r]);
  }, []);
  const upd = (ref: string, p: Partial<Formation>) => setRows((all) => all.map((r) => (r.ref === ref ? { ...r, ...p } : r)));
  const f = rows.find((r) => r.ref === open);
  const active = rows.filter((r) => r.stage !== "Post-formation");

  return (
    <div>
      <ModuleHeader
        color={C}
        title="Corporate Solution"
        action={
          <div className="flex gap-2">
            <GhostButton
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/incorporate`).catch(() => {});
                flash("Client form link copied");
              }}
            >
              <Copy size={13} /> Copy client link
            </GhostButton>
            <a
              href="/incorporate"
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-[10px] bg-brand px-3.5 text-[12.5px] font-semibold text-brand-ink hover:opacity-90"
            >
              <ExternalLink size={13} /> Open client form
            </a>
          </div>
        }
      />
      <div className="mt-6 grid grid-cols-4 gap-3">
        <Kpi label="In progress" value={String(active.length)} />
        <Kpi label="Identity checks open" value={String(rows.filter((r) => r.kyc !== "Clear").length)} />
        <Kpi label="Incorporated this month" value={String(rows.filter((r) => r.stage === "Incorporated" || r.stage === "Post-formation").length)} />
        <Kpi label="Fees booked" value={usd(rows.reduce((a, r) => a + r.total, 0))} />
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-stone-200">
        <div className="flex gap-6">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cx("-mb-px border-b-2 pb-2.5 text-[13px] font-semibold", view === v ? "text-ink-900" : "border-transparent text-stone-500")}
              style={view === v ? { borderColor: C } : undefined}
            >
              {v === "board" ? "Pipeline" : "All formations"}
            </button>
          ))}
        </div>
      </div>

      {view === "board" ? (
        <div className="mt-4 grid grid-cols-6 gap-3">
          {STAGES.map((s) => {
            const list = rows.filter((r) => r.stage === s);
            return (
              <div key={s} className="min-w-0">
                <div className="mb-2 flex items-center justify-between px-1 text-[11.5px] font-semibold text-stone-600">
                  {s} <span className="num text-stone-400">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.map((r) => (
                    <button
                      key={r.ref}
                      onClick={() => setOpen(r.ref)}
                      className="block w-full rounded-[10px] border border-stone-200 bg-white p-3 text-left shadow-card hover:border-stone-400"
                    >
                      <div className="num text-[10.5px] text-stone-400">
                        {r.ref}
                        {r.local && (
                          <span className="ml-1 font-semibold" style={{ color: C }}>
                            · new
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[12.5px] font-semibold leading-snug text-ink-900">{r.company}</div>
                      <div className="mt-1 text-[11px] text-stone-500">
                        {tName(r.jurisdiction, r.type)} · {jName(r.jurisdiction)}
                      </div>
                      {r.kyc !== "Clear" && (
                        <div className={cx("mt-2 flex items-center gap-1 text-[11px] font-semibold", r.kyc === "Needs info" ? "text-[#9A4422]" : "text-[#8C6D3F]")}>
                          <CircleAlert size={11} /> Identity: {r.kyc.toLowerCase()}
                        </div>
                      )}
                    </button>
                  ))}
                  {!list.length && <div className="rounded-[10px] border border-dashed border-stone-200 py-6 text-center text-[11px] text-stone-400">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[12px] border border-stone-200 bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">
                <th className="px-4 py-2">Ref</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Where</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">Identity</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-4 py-2 text-right">Fees</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ref} onClick={() => setOpen(r.ref)} className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="num px-4 py-2.5 text-stone-500">{r.ref}</td>
                  <td className="px-3 py-2.5 font-medium text-ink-900">{r.company}</td>
                  <td className="px-3 py-2.5 text-stone-600">
                    {tName(r.jurisdiction, r.type)} · {jName(r.jurisdiction)}
                  </td>
                  <td className="px-3 py-2.5 text-stone-600">{r.client}</td>
                  <td className="px-3 py-2.5 text-stone-600">{fmtShort(r.submitted)}</td>
                  <td className="px-3 py-2.5">
                    <Pill tone={r.kyc === "Clear" ? "good" : r.kyc === "Pending" ? "gold" : "warn"}>{r.kyc}</Pill>
                  </td>
                  <td className="px-3 py-2.5 text-ink-900">{r.stage}</td>
                  <td className="num px-4 py-2.5 text-right text-ink-900">{usd(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {f && <FormationDrawer f={f} onClose={() => setOpen(null)} onUpdate={(p) => upd(f.ref, p)} flash={flash} />}
      <Toast text={toast} />
    </div>
  );
}

function FormationDrawer({ f, onClose, onUpdate, flash }: { f: Formation; onClose: () => void; onUpdate: (p: Partial<Formation>) => void; flash: (t: string) => void }) {
  const i = STAGES.indexOf(f.stage);
  const next = STAGES[i + 1] as Stage | undefined;
  const blocked = next && i >= 1 && f.kyc !== "Clear";
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/20" onClick={onClose}>
      <aside className="flex h-full w-[520px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label={f.company}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
          <div>
            <div className="num text-[12px] font-semibold" style={{ color: C }}>
              {f.ref}
            </div>
            <h2 className="mt-0.5 text-[18px] font-semibold text-ink-900">{f.company}</h2>
            <div className="text-[12.5px] text-stone-500">
              {tName(f.jurisdiction, f.type)} · {jName(f.jurisdiction)} · submitted {fmtShort(f.submitted)}
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <ol className="flex gap-1">
            {STAGES.map((s, k) => (
              <li key={s} className="flex-1" title={s}>
                <div className="h-1.5 rounded-full" style={{ background: k <= i ? C : "#E7E5E0" }} />
                <div className={cx("mt-1.5 text-[10px] leading-tight", k === i ? "font-semibold text-ink-900" : "text-stone-400")}>{s}</div>
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12.5px]">
            {[
              ["Client", f.client],
              ["Contact", `${f.contact} · ${f.email}`],
              ["Beneficial owners", String(f.owners)],
              ["Fees", usd(f.total)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-stone-500">{k}</dt>
                <dd className="font-medium text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Identity checks</div>
            <div className="flex gap-1.5">
              {(["Pending", "Needs info", "Clear"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => onUpdate({ kyc: k })}
                  className={cx(
                    "h-8 rounded-[8px] border px-3 text-[12px] font-semibold",
                    f.kyc === k ? "border-ink-900 bg-ink-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            {f.note && <p className="mt-2 rounded-[8px] bg-[#FBF1E4] px-3 py-2 text-[12px] text-[#8A5A1E]">{f.note}</p>}
          </div>
          <div>
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Services ordered</div>
            <ul className="space-y-1 text-[12.5px]">
              {f.services.map((s) => (
                <li key={s} className="text-ink-900">
                  {services.find((x) => x.id === s)?.name ?? s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-stone-200 px-6 py-3">
          {blocked && <span className="text-[12px] text-[#9A4422]">Clear identity checks before moving on.</span>}
          <div className="ml-auto">
            {next ? (
              <ActionButton
                color="var(--tenant-ink)"
                disabled={!!blocked}
                onClick={() => {
                  onUpdate({ stage: next });
                  flash(`${f.company} moved to ${next}`);
                }}
              >
                Move to {next} <ArrowRight size={13} />
              </ActionButton>
            ) : (
              <span className="text-[12.5px] font-semibold text-[#1F6F44]">Formation complete</span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
