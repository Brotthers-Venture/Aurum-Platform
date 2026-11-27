"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, PhoneCall } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { PEOPLE, entityById, type Payee } from "@/lib/banking/data";
import { bank, useBanking } from "@/lib/banking/store";
import { BankBanner, Dialog, Drawer, Illus, KV, Section, btnPrimary, btnSecondary, card, day, field, lbl, td, th, tr, useFlash } from "./ui";

const STATE_CLS: Record<Payee["state"], string> = {
  Verified: "border-up-line text-up-ink",
  "Callback required": "border-neg-line text-negative",
  "Cooling off": "border-attn-line text-gold-700",
};

/** Who the entities pay, and proof that each set of bank details was confirmed by phone. */
export function PayeesList() {
  const d = useBanking();
  const params = useSearchParams();
  const router = useRouter();
  const open = params.get("id");
  const setOpen = (id: string | null) => router.replace(id ? `/admin/banking/payees?id=${id}` : "/admin/banking/payees", { scroll: false });
  const list = [...d.payees].sort((a, b) => (a.state === "Verified" ? 1 : 0) - (b.state === "Verified" ? 1 : 0) || a.name.localeCompare(b.name));
  return (
    <div>
      <PageHead
        eyebrow="Banking Solution"
        title="Payees"
        meta="Bank details are confirmed by calling the payee on a number already on record: never one given in the email or letter that asked for the change."
      />
      <BankBanner className="mb-4" />
      <section className={card}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-[13px]">
            <thead className="border-b border-d-line">
              <tr>
                <th className={th}>Payee</th>
                <th className={th}>Paid by</th>
                <th className={th}>Bank</th>
                <th className={th}>Details</th>
                <th className={th}>Last confirmed</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={cx(tr, "cursor-pointer")} onClick={() => setOpen(p.id)}>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-d-text">{p.name}</span>
                      {p.illustrative && <Illus short />}
                    </span>
                    <span className="block text-[12px] text-d-text-3">
                      {p.kind} · {p.country}
                    </span>
                  </td>
                  <td className={cx(td, "text-d-text-2")}>{p.entityIds.map((id) => entityById(id)!.short).join(", ")}</td>
                  <td className={cx(td, "text-d-text-2")}>
                    {p.bank} ··{p.mask}
                    {p.change && (
                      <span className="block text-[12px] text-negative">
                        Change asked: {p.change.bank} ··{p.change.mask}
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11.5px]", STATE_CLS[p.state])}>
                      {p.state === "Verified" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {p.state}
                    </span>
                  </td>
                  <td className={cx(td, "text-[12px] text-d-text-3")}>
                    {p.verified ? `${day(p.verified.at.slice(0, 10))} · ${p.verified.by}` : p.onPlatform ? "Same partner bank" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {open && d.payee(open) && <PayeeDrawer p={d.payee(open)!} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PayeeDrawer({ p, onClose }: { p: Payee; onClose: () => void }) {
  const d = useBanking();
  const [calling, setCalling] = useState(false);
  const held = d.payments.filter((x) => x.payeeId === p.id && x.state === "On hold");
  return (
    <Drawer title={p.name} kicker={`${p.kind} · ${p.country}`} onClose={onClose} width={480}>
      {p.change && (
        <div className="mb-5 rounded-[10px] border border-neg-line px-3.5 py-3 text-[12.5px] leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-negative">
            <AlertTriangle size={14} /> Change of bank details waiting for a callback
          </div>
          <p className="mt-1 text-d-text-2">
            Asked on {p.change.requestedAt.replace("T", " at ")} by: {p.change.via}. From {p.bank} ··{p.mask} to {p.change.bank} ··{p.change.mask}.
          </p>
          {held.length > 0 && (
            <p className="mt-1 text-d-text-2">
              {held.length} payment{held.length === 1 ? " is" : "s are"} on hold until then.
            </p>
          )}
          <button type="button" className={cx(btnPrimary, "mt-3")} onClick={() => setCalling(true)}>
            <PhoneCall size={14} /> Record the callback
          </button>
        </div>
      )}
      <Section title="Bank details">
        <KV
          rows={[
            ["Bank", p.bank],
            ["Account", `•••• ${p.mask}`],
            ["Currency", p.currency],
            ["Paid by", p.entityIds.map((id) => entityById(id)!.name).join(", ")],
            ...(p.onPlatform ? ([["Transfers", "Same partner bank: instant book transfer"]] as [string, string][]) : []),
          ]}
        />
      </Section>
      <Section title="Number on record for callbacks">
        <KV
          rows={[
            ["Phone", p.trustedPhone],
            ["Taken from", p.phoneSource],
          ]}
        />
      </Section>
      {p.verified && (
        <Section title="Last confirmation">
          <KV
            rows={[
              ["Confirmed by", p.verified.by],
              ["When", p.verified.at.replace("T", " ")],
              ["Called", p.verified.number],
              ["Spoke with", p.verified.spokeWith],
            ]}
          />
        </Section>
      )}
      {calling && <CallbackDialog p={p} onClose={() => setCalling(false)} />}
    </Drawer>
  );
}

function CallbackDialog({ p, onClose }: { p: Payee; onClose: () => void }) {
  const firm = PEOPLE.filter((x) => x.side === "Firm").map((x) => x.name);
  const [who, setWho] = useState(firm[0]);
  const [spoke, setSpoke] = useState("");
  const [checks, setChecks] = useState({ number: false, outbound: false, details: false });
  const { flash, node } = useFlash();
  const ready = checks.number && checks.outbound && spoke.trim();
  const done = (confirmed: boolean) => {
    const r = bank.callback(p.id, who, { confirmed, spokeWith: spoke });
    flash(r);
    if (r.ok) setTimeout(onClose, 900);
  };
  return (
    <Dialog
      title={`Callback to ${p.name}`}
      sub="Call out, on the number on record, and read the new details back to the person you reach. Don’t use contact details from the request."
      onClose={onClose}
    >
      <div className="mb-4 rounded-[10px] border border-d-line px-3.5 py-3 text-[13px]">
        <div className="text-[12px] text-d-text-3">Call</div>
        <div className="tnum mt-0.5 text-[18px] text-d-text">{p.trustedPhone}</div>
        <div className="text-[12px] text-d-text-3">From: {p.phoneSource}</div>
        {p.change && (
          <div className="mt-3 text-[12.5px] text-d-text-2">
            Confirm: {p.change.bank}, account ending {p.change.mask}
          </div>
        )}
      </div>
      <fieldset className="space-y-2 text-[13px] text-d-text">
        {(
          [
            ["number", `I called ${p.trustedPhone}, the number on record, not one from the request`],
            ["outbound", "I placed the call myself; I did not take an incoming call as the confirmation"],
            ["details", "The person read back or confirmed the new bank and account number"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex items-start gap-2.5">
            <input type="checkbox" className="mt-0.5" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl} htmlFor="cb-spoke">
            Spoke with
          </label>
          <input id="cb-spoke" className={field} value={spoke} onChange={(e) => setSpoke(e.target.value)} placeholder="Name and role" />
        </div>
        <div>
          <label className={lbl} htmlFor="cb-who">
            Called by <span className="font-normal text-d-text-3">(simulated sign-in)</span>
          </label>
          <select id="cb-who" className={field} value={who} onChange={(e) => setWho(e.target.value)}>
            {firm.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className={btnSecondary} disabled={!ready} onClick={() => done(false)}>
          They did not ask for this change
        </button>
        <button type="button" className={btnPrimary} disabled={!ready || !checks.details} onClick={() => done(true)}>
          Confirmed: use the new details
        </button>
      </div>
      {node}
    </Dialog>
  );
}
