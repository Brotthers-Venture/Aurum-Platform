"use client";

/**
 * A matter as a record: every message, internal note, system event, decision and earlier version of an
 * edited message, in order, on US Letter. "Download PDF" opens the print window; "Save as PDF" writes the file.
 * Untick internal notes to make a copy that can go to the client.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { AurumLogo } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { withTenant } from "@/lib/brand";
import { inkFor } from "@/lib/gps";
import { loadChat, type ChatState } from "@/lib/chat-store";
import { VIEWER, isExternal, orgName, orgOf, person, personName, type ChatMessage } from "@/lib/chat";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) + " UTC";

export function MatterExport({ id }: { id: string }) {
  const { brand } = useBrand();
  const [s, setS] = useState<ChatState | null>(null);
  const [notes, setNotes] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the conversation lives in this browser
    setS(loadChat());
  }, []);
  const [exportedAt] = useState(() => new Date().toISOString());
  if (!s) return <div className="min-h-screen bg-[#E9E6E0]" />;
  const m = s.matters.find((x) => x.id === id);
  if (!m) return <div className="p-10 text-center text-[14px]">This matter is not in this browser&rsquo;s records.</div>;

  const msgs = s.messages.filter((x) => x.where === m.id && (notes || !x.internal)).sort((a, b) => a.at.localeCompare(b.at));
  const people = [...new Set([...m.participants, ...msgs.map((x) => x.author).filter((a) => a !== "system")])];
  const orgOfLine = (pid: string) => (isExternal(pid) ? orgName(orgOf(pid)) : brand.name);
  const footer = `${brand.legalName} — ${m.ref} correspondence record | Confidential${notes ? " | Internal: includes staff notes" : ""}`;

  return (
    <div className="print-root min-h-screen bg-[#E9E6E0] pb-16">
      <style>{`@page chat { @bottom-left { content: ${JSON.stringify(footer)}; } }`}</style>
      <div className="print-chrome sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-4 px-6 py-3 text-[13px] text-[#0F2340]">
          <Link href={`/admin/communication?m=${m.id}`} className="flex items-center gap-1.5 font-semibold hover:underline">
            <ArrowLeft size={14} /> Corporate Chat
          </Link>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
            Include internal notes
          </label>
          <span className="text-[12px] text-[#6B6458]">{notes ? "For the firm's records." : "Safe to share with the client."}</span>
          <button
            onClick={() => window.print()}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-[8px] px-3.5 font-semibold"
            style={{ background: "var(--tenant-ink)", color: inkFor(brand.colors.ink) }}
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="chat-record mx-auto mt-8 w-[8.5in] max-w-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] print:mt-0 print:shadow-none">
        <div className="flex items-center justify-between gap-6 px-[0.6in] py-[0.25in]" style={{ background: "var(--tenant-ink)", color: inkFor(brand.colors.ink) }}>
          <AurumLogo variant={inkFor(brand.colors.ink) === "#FFFFFF" ? "white" : "dark"} height={34} />
          <div className="text-right">
            <div className="font-serif text-[22px] font-semibold uppercase">Correspondence record</div>
            <div className="font-serif text-[13px] opacity-80">
              {m.ref} — {m.title}
            </div>
          </div>
        </div>
        <div className="px-[0.6in] pb-[0.5in] pt-[0.25in] text-[10.5px] leading-snug text-[#1B2A3D]">
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            {(
              [
                ["Record", m.linked.label],
                ["Status", m.status],
                ["Owner", personName(m.owner)],
                ["Opened", when(m.createdAt)],
                ["Last activity", when(m.updatedAt)],
                ["Exported", `${when(exportedAt)} by ${personName(VIEWER)}`],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <div className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#5B7592]">{k}</div>
                <div className="font-serif text-[12px]">{v}</div>
              </div>
            ))}
          </div>

          <h2 className="mt-5 border-b border-[#C9D3E0] pb-1 font-serif text-[13px] font-semibold">Participants</h2>
          <table className="mt-1.5 w-full">
            <tbody>
              {people.map((p) => (
                <tr key={p} className="border-b border-[#EEF1F5]">
                  <td className="py-1 font-semibold">{personName(p)}</td>
                  <td className="py-1">{person(p)?.title}</td>
                  <td className="py-1">
                    {orgOfLine(p)}
                    {person(p)?.clientRole === "guest" ? " (guest)" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!!m.approvals?.length && (
            <>
              <h2 className="mt-5 border-b border-[#C9D3E0] pb-1 font-serif text-[13px] font-semibold">Decisions</h2>
              {m.approvals.map((a, i) => (
                <p key={i} className="mt-1.5">
                  <span className="font-semibold">{a.decision === "approved" ? "Approved" : "Rejected"}</span> by {personName(a.by)}, {when(a.at)}
                  {a.note ? ` — ${a.note}` : ""}. Requested by {personName(m.requestedBy ?? m.owner)}.
                </p>
              ))}
            </>
          )}

          <h2 className="mt-5 border-b border-[#C9D3E0] pb-1 font-serif text-[13px] font-semibold">Correspondence</h2>
          {msgs.map((x) => (
            <Entry
              key={x.id}
              x={x}
              org={x.author === "system" ? "" : orgOfLine(x.author)}
              tenant={brand.name}
              parent={x.replyTo ? s.messages.find((y) => y.id === x.replyTo) : undefined}
            />
          ))}
          {!msgs.length && <p className="mt-2 text-[#5B7592]">No messages.</p>}
        </div>
      </div>
    </div>
  );
}

function Entry({ x, org, tenant, parent }: { x: ChatMessage; org: string; tenant: string; parent?: ChatMessage }) {
  if (x.kind === "event")
    return (
      <p className="mt-1.5 break-inside-avoid text-[#5B7592]">
        <span className="tnum">{when(x.at)}</span> · {personName(x.author)} {withTenant(x.body, tenant)}
      </p>
    );
  return (
    <div className="mt-2.5 break-inside-avoid border-l-2 pl-2.5" style={{ borderColor: x.internal ? "#C9820F" : "#C9D3E0" }}>
      <div className="flex flex-wrap gap-x-2">
        <span className="font-semibold">{personName(x.author)}</span>
        <span className="text-[#5B7592]">{org}</span>
        <span className="tnum text-[#5B7592]">{when(x.at)}</span>
        {x.internal && <span className="font-bold uppercase tracking-[0.06em] text-[#9A6208]">Internal note</span>}
        {parent && <span className="text-[#5B7592]">in reply to {personName(parent.author)}</span>}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap font-serif text-[11.5px]">{withTenant(x.body, tenant)}</p>
      {x.attachments?.map((a, i) => (
        <p key={i} className="text-[#5B7592]">
          Attachment: {a.name}
        </p>
      ))}
      {x.edits?.map((e, i) => (
        <p key={i} className="text-[#5B7592]">
          Earlier version, {when(e.at)}: &ldquo;{e.body}&rdquo;
        </p>
      ))}
    </div>
  );
}
