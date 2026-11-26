"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, X } from "lucide-react";
import { cx } from "@/components/ui";
import { isExternal, personName, recordSummary, type ChatAttachment, type Matter } from "@/lib/chat";
import { useChat } from "./context";
import { Avatar, ExternalTag, StatusRing, fileSize } from "./ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-d-line-soft px-4 py-3.5">
      <h3 className="mb-2 text-[11.5px] font-medium text-d-text-3">{title}</h3>
      {children}
    </section>
  );
}

/** The record behind a matter: amounts and progress from the ledger, people, files and related matters. */
export function ContextRail({ m, onClose }: { m: Matter; onClose: () => void }) {
  const { s, select, setPropMenu } = useChat();
  const r = recordSummary(m.linked);
  const files: ChatAttachment[] = [...s.messages.filter((x) => x.where === m.id).flatMap((x) => x.attachments ?? []), ...(r?.files ?? [])].filter(
    (f, i, all) => all.findIndex((y) => y.name === f.name) === i,
  );
  const related = s.matters.filter((x) => x.id !== m.id && (x.linked.label === m.linked.label || (x.linked.kind === m.linked.kind && x.linked.id === m.linked.id))).slice(0, 4);
  return (
    <aside aria-label="Record details" className="drawer-in flex h-full flex-col border-l border-d-line bg-d-chrome">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-d-line px-4">
        <span className="text-[12.5px] font-semibold">{r?.kind ?? "Record"}</span>
        <button onClick={onClose} aria-label="Close record details" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise">
          <X size={15} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Matter">
          <dl className="space-y-1 text-[12.5px]">
            {(
              [
                ["Status", m.status, "status"],
                ["Owner", personName(m.owner), "owner"],
                ["Priority", m.priority, "priority"],
                [
                  "Due",
                  m.dueDate ? new Date(`${m.dueDate}T12:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "None",
                  "due",
                ],
                ["Reference", m.ref, null],
                ["Labels", m.labels.join(", ") || "None", null],
              ] as const
            ).map(([k, v, menu]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <dt className="text-d-text-3">{k}</dt>
                {menu ? (
                  <button onClick={() => setPropMenu(menu)} className="rounded-[4px] px-1.5 py-0.5 text-right text-d-text hover:bg-d-raise">
                    {v}
                  </button>
                ) : (
                  <dd className="px-1.5 text-right text-d-text">{v}</dd>
                )}
              </div>
            ))}
          </dl>
        </Section>
        {r ? (
          <Section title="Linked record">
            <div className="text-[14px] font-semibold leading-snug">{r.title}</div>
            <div className="mt-0.5 text-[12px] text-d-text-3">{r.sub}</div>
            {r.progress && (
              <div className="mt-3">
                <div className="h-1 overflow-hidden rounded-full bg-d-line">
                  <div className="h-full rounded-full bg-d-accent-fill" style={{ width: `${Math.min(100, r.progress.pct * 100)}%` }} />
                </div>
                <div className="tnum mt-1 text-[11.5px] text-d-text-3">{r.progress.label}</div>
              </div>
            )}
            <dl className="mt-3 space-y-0">
              {r.facts.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-3 border-t border-d-line-soft py-1.5 text-[12.5px] first:border-t-0">
                  <dt className="shrink-0 text-d-text-2">{f.label}</dt>
                  <dd className={cx("tnum text-right font-medium", f.tone === "warn" && "text-d-warn", f.tone === "pos" && "text-d-pos")}>{f.value}</dd>
                </div>
              ))}
            </dl>
            <Link
              data-open-record
              href={r.href}
              className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-[4px] border border-d-line-strong text-[12.5px] font-medium hover:bg-d-raise"
            >
              Open record <ArrowUpRight size={13} />
            </Link>
          </Section>
        ) : (
          <Section title="Linked record">
            <p className="text-[12.5px] text-d-text-3">This matter isn&rsquo;t linked to a record.</p>
          </Section>
        )}
        <Section title={`People · ${m.participants.length}`}>
          <ul className="space-y-1.5">
            {m.participants.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[12.5px]">
                <Avatar id={p} size={20} />
                <span className="min-w-0 flex-1 truncate">{personName(p)}</span>
                {p === m.owner && <span className="text-[11px] text-d-text-3">Owner</span>}
                {isExternal(p) && <ExternalTag />}
              </li>
            ))}
          </ul>
        </Section>
        <Section title={`Files · ${files.length}`}>
          {files.length === 0 ? (
            <p className="text-[12.5px] text-d-text-3">No files yet. Attach from a data room with the paperclip.</p>
          ) : (
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-2 text-[12.5px]">
                  <FileText size={14} className="shrink-0 text-d-text-3" />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="tnum shrink-0 text-[11px] text-d-text-3">{fileSize(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        {related.length > 0 && (
          <Section title="Related matters">
            <ul className="space-y-1">
              {related.map((x) => (
                <li key={x.id}>
                  <button onClick={() => select(x.id)} className="flex w-full items-center gap-2 rounded-[4px] px-1 py-1 text-left text-[12.5px] hover:bg-d-raise">
                    <StatusRing status={x.status} size={12} />
                    <span className="tnum text-[11px] text-d-text-3">{x.ref}</span>
                    <span className="truncate">{x.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </aside>
  );
}
