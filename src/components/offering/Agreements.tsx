"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, FileText, ShieldCheck } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { rooms } from "@/lib/dataroom";
import { AGREEMENTS, OFFERINGS, offeringById, partyById, type Agreement, type AgreementStatus } from "@/lib/offering/data";
import { Drawer, Illus, KV, Section, Seg, day, daysFrom } from "./ui";

const OUTSTANDING: AgreementStatus[] = ["Required", "Draft", "Sent", "Viewed", "Partially signed"];
/** what needs someone first */
const PRIORITY: AgreementStatus[] = ["Required", "Partially signed", "Viewed", "Sent", "Draft", "Fully executed", "Not required", "Declined", "Expired", "Superseded"];
const TONE: Partial<Record<AgreementStatus, string>> = {
  "Fully executed": "border-up-line text-up-ink",
  "Partially signed": "border-attn-line text-gold-700",
  Sent: "border-d-text-3 text-d-text",
  Viewed: "border-d-text-3 text-d-text",
  Required: "border-neg-line text-negative",
  Declined: "border-d-line text-d-text-3",
  Expired: "border-d-line text-d-text-3",
  Superseded: "border-d-line text-d-text-3",
};
export function AgreementPill({ s }: { s: AgreementStatus }) {
  return <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]", TONE[s] ?? "border-d-line text-d-text-2")}>{s}</span>;
}

export function AgreementTable({ list, showOffering = true }: { list: Agreement[]; showOffering?: boolean }) {
  const [open, setOpen] = useState<Agreement | null>(null);
  const td = "px-3 py-2.5 first:pl-4 last:pr-4 align-top";
  return (
    <>
      <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
        <table className="w-full min-w-[960px] text-[13px]">
          <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
            <tr>
              {["Investor", ...(showOffering ? ["Offering"] : []), "Agreement", "Status", "Signatures", "Sent", "Executed", "Evidence"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-medium first:pl-4 last:pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const p = partyById(a.partyId)!;
              const signed = a.signatories.filter((x) => x.signed).length;
              return (
                <tr key={a.id} onClick={() => setOpen(a)} className="cursor-pointer border-b border-d-line-soft last:border-0 hover:bg-d-raise">
                  <td className={td}>
                    <span className="flex items-center gap-2 font-medium text-d-text">
                      {p.name} {a.illustrative && <Illus short />}
                    </span>
                  </td>
                  {showOffering && <td className={cx(td, "text-d-text-2")}>{offeringById(a.offeringId)?.short}</td>}
                  <td className={cx(td, "whitespace-nowrap")}>
                    <div className="text-d-text">{a.kind}</div>
                    <div className="text-[11.5px] text-d-text-3">{a.version}</div>
                  </td>
                  <td className={td}>
                    <AgreementPill s={a.status} />
                  </td>
                  <td className={cx(td, "tnum text-d-text-2")}>
                    {signed} of {a.signatories.length}
                  </td>
                  <td className={cx(td, "tnum whitespace-nowrap text-d-text-3")}>{a.sent ? day(a.sent) : "—"}</td>
                  <td className={cx(td, "tnum whitespace-nowrap text-d-text-2")}>{a.executed ? day(a.executed) : "—"}</td>
                  <td className={cx(td, "max-w-[240px] text-[12px] text-d-text-3")}>{a.evidence ?? (a.status === "Fully executed" ? "Missing" : "—")}</td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-d-text-3">
                  No agreements match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open && <AgreementDrawer a={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function AgreementDrawer({ a, onClose }: { a: Agreement; onClose: () => void }) {
  const p = partyById(a.partyId)!;
  const o = offeringById(a.offeringId)!;
  const room = o.roomId ? rooms.find((r) => r.id === o.roomId) : undefined;
  const executed = a.status === "Fully executed" && !!a.evidence;
  return (
    <Drawer
      onClose={onClose}
      kicker={`${a.kind} · ${o.short}`}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {p.name} {a.illustrative && <Illus />}
        </span>
      }
    >
      <Section>
        <div className="flex items-center gap-2">
          <AgreementPill s={a.status} />
          <span className="text-[12px] text-d-text-3">
            {a.source === "Recorded by hand" ? "Recorded by hand" : `From ${a.source === "Data room" ? "the data room" : "the subscription in Fund Solution"}`}
          </span>
        </div>
      </Section>
      <Section title="Signatures">
        <ul className="divide-y divide-d-line-soft">
          {a.signatories.map((x, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className={cx("flex h-5 w-5 items-center justify-center rounded-full border", x.signed ? "border-up-line text-up-ink" : "border-d-line text-d-text-3")}>
                {x.signed ? <Check size={11} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-d-text">{x.name}</span>
                <span className="block text-[11.5px] text-d-text-3">{x.side}</span>
              </span>
              <span className="tnum text-[12px] text-d-text-3">{x.signed ? day(x.signed) : "Not signed"}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Evidence">
        <div className={cx("flex gap-2.5 rounded-[10px] border px-3 py-2.5", executed ? "border-up-line" : "border-d-line")}>
          <ShieldCheck size={15} className={cx("mt-0.5 shrink-0", executed ? "text-up-ink" : "text-d-text-3")} />
          <div className="text-[12.5px]">
            <div className="text-d-text">{a.evidence ?? "No executed document on file"}</div>
            <div className="mt-0.5 text-d-text-3">Signature certificate: {a.certificate ?? "not on file"}</div>
          </div>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
          An agreement shows as executed only with evidence: the signed document, a signature certificate or the data room’s acceptance record.
        </p>
      </Section>
      <Section title="Details">
        <KV
          rows={[
            ["Version", a.version],
            ["Sent", a.sent ? day(a.sent) : "—"],
            ["Executed", a.executed ? day(a.executed) : "—"],
            ["Expires", a.expires ? `${day(a.expires)}${daysFrom(a.expires) < 90 ? " · within 90 days" : ""}` : "—"],
            ["Responsible", a.owner],
          ]}
        />
      </Section>
      {room && a.kind === "NDA" && (
        <Section title="Data room access">
          <p className="text-[12.5px] leading-relaxed text-d-text-2">
            {room.nda
              ? `${room.name} requires this NDA before any document opens. ${executed ? "The investor has access." : "The investor can’t open documents until it is executed."}`
              : `${room.name} doesn’t require an NDA.`}
          </p>
          <p className="mt-1.5 text-[11.5px] text-d-text-3">Enforced by the data room in this prototype; server-side enforcement comes with the database.</p>
        </Section>
      )}
      <Section title="Electronic signature">
        <p className="text-[12.5px] leading-relaxed text-d-text-2">No signature provider is connected. Upload the executed document and its certificate as evidence.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            disabled
            title="Available once the document store is connected"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text opacity-50"
          >
            <FileText size={13} /> Upload executed document
          </button>
          <button
            disabled
            title="DocuSign or Adobe Acrobat Sign, once chosen and approved"
            className="inline-flex h-8 items-center rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text opacity-50"
          >
            Send for signature
          </button>
        </div>
        <p className="mt-1.5 text-[11.5px] text-d-text-3">Both are part of phase 2; shown here for review, not active.</p>
      </Section>
      <Link
        href={`/admin/offering/investors/${p.id}`}
        className="inline-flex h-8 items-center rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise"
      >
        Investor profile
      </Link>
    </Drawer>
  );
}

export function AgreementsPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"outstanding" | "executed" | "all">(params.get("status") === "outstanding" ? "outstanding" : "all");
  const [kind, setKind] = useState<"all" | Agreement["kind"]>("all");
  const [scope, setScope] = useState(params.get("offering") ?? "all");
  const list = AGREEMENTS.filter(
    (a) =>
      (status === "all" || (status === "outstanding" ? OUTSTANDING.includes(a.status) : a.status === "Fully executed")) &&
      (kind === "all" || a.kind === kind) &&
      (scope === "all" || a.offeringId === scope),
  ).sort((a, b) => PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status));
  const ndaOut = AGREEMENTS.filter((a) => a.kind === "NDA" && OUTSTANDING.includes(a.status)).length;
  const ndaDone = AGREEMENTS.filter((a) => a.kind === "NDA" && a.status === "Fully executed").length;
  const subsWaiting = AGREEMENTS.filter((a) => a.kind === "Subscription agreement" && a.status === "Partially signed").length;
  const expiring = AGREEMENTS.filter((a) => a.expires && daysFrom(a.expires) >= 0 && daysFrom(a.expires) < 90).length;
  return (
    <div>
      <PageHead
        eyebrow="Offering Solution"
        title="Agreements"
        meta="NDAs, subscription agreements and side letters for every offering. Data room NDAs and subscriptions are read from where they live, not re-entered."
      />
      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3 border-y border-d-line px-2 py-3">
        {[
          ["NDAs outstanding", ndaOut],
          ["NDAs executed", ndaDone],
          ["Subscriptions awaiting countersignature", subsWaiting],
          ["Expiring within 90 days", expiring],
        ].map(([k, v]) => (
          <div key={k as string}>
            <dt className="text-[12px] text-d-text-3">{k}</dt>
            <dd className="tnum mt-0.5 text-[20px] leading-none text-d-text">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            ["all", "All"],
            ["outstanding", "Outstanding"],
            ["executed", "Executed"],
          ]}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          aria-label="Agreement type"
          className="h-8 rounded-[8px] border border-d-line bg-transparent px-2 text-[12.5px] text-d-text focus:outline-none"
        >
          <option value="all">All agreement types</option>
          <option value="NDA">NDAs</option>
          <option value="Subscription agreement">Subscription agreements</option>
          <option value="Side letter">Side letters</option>
        </select>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Offering"
          className="h-8 rounded-[8px] border border-d-line bg-transparent px-2 text-[12.5px] text-d-text focus:outline-none"
        >
          <option value="all">All offerings</option>
          {OFFERINGS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.short}
            </option>
          ))}
        </select>
        <span className="tnum ml-auto text-[12.5px] text-d-text-3">{list.length} agreements</span>
      </div>
      <AgreementTable list={list} />
    </div>
  );
}
