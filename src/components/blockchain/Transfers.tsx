"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Circle, Minus, X } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { treatmentFor, type Transfer } from "@/lib/blockchain/data";
import { chain, useChain } from "@/lib/blockchain/store";
import { field, lbl } from "@/components/offering/Forms";
import { Drawer, Illus, KV, Section, Seg, SimBanner, day, n } from "./ui";

export function TransfersDesk() {
  const d = useChain();
  const [show, setShow] = useState<"open" | "all">("open");
  const [open, setOpen] = useState<string | null>(null);
  const list = d.transfers.filter((t) => show === "all" || t.status === "In progress").sort((a, b) => b.requested.localeCompare(a.requested));
  const current = open ? d.transfers.find((t) => t.id === open) : undefined;
  return (
    <div>
      <PageHead
        eyebrow="Blockchain Solution"
        title="Transfers"
        meta="Transfers between owners and the people they choose: gifts, estate planning and private sales the owner arranges. Aurum checks and records them; it doesn’t find buyers, set prices or hold money."
        action={
          <Seg
            label="Show"
            value={show}
            onChange={setShow}
            options={[
              ["open", "In progress"],
              ["all", "All"],
            ]}
          />
        }
      />
      <SimBanner className="mb-5" />
      <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
        {list.map((tr) => {
          const t = d.token(tr.tokenId)!;
          const from = t.holders.find((h) => h.id === tr.fromId);
          const done = tr.steps.filter((s) => s.state === "done" || s.state === "skipped").length;
          const next = tr.steps.find((s) => s.state !== "done" && s.state !== "skipped");
          return (
            <li key={tr.id}>
              <button
                onClick={() => setOpen(tr.id)}
                className="grid w-full grid-cols-1 gap-3 px-4 py-3 text-left hover:bg-d-raise md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px] md:items-center"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-d-text">
                    {n(tr.units)} {t.unitWord} · {from?.name ?? "—"} → {tr.to.name}
                    {tr.illustrative && <Illus short />}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-d-text-3">
                    {t.company} · {tr.kind} · requested {day(tr.requested)} by {tr.requestedBy}
                  </span>
                </span>
                <span className="text-[12.5px] text-d-text-2">
                  {tr.status === "In progress" ? (
                    <>
                      Next: <span className="text-d-text">{next?.label}</span>
                      {next?.state === "blocked" && <span className="text-gold-700"> · waiting</span>}
                    </>
                  ) : (
                    <span className={tr.status === "Completed" ? "text-up-ink" : "text-d-text-3"}>{tr.status}</span>
                  )}
                </span>
                <span className="flex items-center gap-1" aria-label={`${done} of ${tr.steps.length} steps done`}>
                  {tr.steps.map((s) => (
                    <span
                      key={s.id}
                      className={cx(
                        "h-1.5 flex-1 rounded-full",
                        s.state === "done" ? "" : s.state === "skipped" ? "bg-d-line" : s.state === "blocked" ? "bg-[var(--color-gold-500)]" : "bg-d-line-soft",
                      )}
                      style={s.state === "done" ? { background: "var(--color-up)" } : undefined}
                    />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
        {!list.length && <li className="px-4 py-8 text-center text-[12.5px] text-d-text-3">No transfers in progress.</li>}
      </ul>
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-d-text-3">
        A sale to someone the owner hasn’t found himself goes through a licensed venue.{" "}
        <Link href="/admin/blockchain/secondary" className="underline underline-offset-2">
          How secondary sales work
        </Link>
      </p>
      {current && <TransferDrawer tr={current} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function TransferDrawer({ tr, onClose }: { tr: Transfer; onClose: () => void }) {
  const d = useChain();
  const who = usePreviewRole().member.name;
  const [msg, setMsg] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const t = d.token(tr.tokenId)!;
  const from = t.holders.find((h) => h.id === tr.fromId);
  const kind = treatmentFor(t.jurisdiction, t.form);
  const firstOpen = tr.steps.findIndex((s) => s.state !== "done" && s.state !== "skipped");
  return (
    <Drawer onClose={onClose} kicker={`${t.company} · ${tr.kind}`} title={`${n(tr.units)} ${t.unitWord} to ${tr.to.name}`} width={480}>
      <Section>
        <KV
          rows={[
            ["From", from ? `${from.name}` : "—"],
            ["To", `${tr.to.name} · ${tr.to.kind} · ${tr.to.country}`],
            ["Recipient’s identity", tr.to.kyc === "Clear" ? "Verified by Compliance" : `KYC ${tr.to.kyc.toLowerCase()}`],
            ["Requested", `${day(tr.requested)} by ${tr.requestedBy}`],
            ["Status", tr.status],
          ]}
        />
        {tr.note && <p className="mt-2 text-[12px] text-d-text-3">{tr.note}</p>}
      </Section>
      <Section title="Steps">
        <ol className="space-y-1">
          {tr.steps.map((s, i) => {
            const canDo = tr.status === "In progress" && i === firstOpen && s.state !== "blocked";
            return (
              <li key={s.id} className="flex items-start gap-3 rounded-[9px] px-1 py-2">
                <span
                  className={cx(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    s.state === "done" ? "border-up-line text-up-ink" : s.state === "blocked" ? "border-attn-line text-gold-700" : "border-d-line text-d-text-3",
                  )}
                >
                  {s.state === "done" ? <Check size={11} /> : s.state === "skipped" ? <Minus size={11} /> : <Circle size={6} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-[13px]", s.state === "skipped" ? "text-d-text-3" : "text-d-text")}>{s.label}</span>
                  <span className="block text-[11.5px] text-d-text-3">
                    {s.state === "done" ? `Done${s.by ? ` by ${s.by}` : ""}${s.at ? ` · ${day(s.at)}` : ""}` : (s.note ?? (s.state === "skipped" ? "Not needed" : "Waiting"))}
                  </span>
                  {canDo && (
                    <button
                      onClick={() => setMsg(chain.completeStep(tr, s.id, who))}
                      className="mt-1.5 inline-flex h-7 items-center rounded-[7px] bg-brand px-2.5 text-[12px] font-semibold text-brand-ink"
                    >
                      {s.id === "chain"
                        ? "Move the tokens (simulated)"
                        : s.id === "identity"
                          ? "Confirm verification"
                          : s.id === "approval"
                            ? "Record the approval"
                            : s.id === "agreement"
                              ? "Record the signed agreement"
                              : "Record the registration"}
                    </button>
                  )}
                  {tr.status === "In progress" && s.state === "blocked" && s.id === "chain" && (
                    <button
                      onClick={() => chain.connectRecipient(tr, who)}
                      className="mt-1.5 inline-flex h-7 items-center rounded-[7px] border border-d-line px-2.5 text-[12px] font-semibold text-d-text hover:bg-d-raise"
                    >
                      Recipient connects a wallet (simulated)
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        {msg && <p className="mt-2 text-[12.5px] text-gold-700">{msg}</p>}
        <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
          {kind.t === "mirror"
            ? "The official register changes first; the token follows. Until then the transferred units stay frozen on the seller’s wallet."
            : "The token ledger is the record: the transfer is complete when the tokens move."}{" "}
          Payment, if any, is settled between the parties or through an escrow agent, never by Aurum.
        </p>
      </Section>
      {tr.status === "In progress" &&
        (rejecting ? (
          <Section title="Reject the request">
            <label className={lbl}>
              Reason
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={field} placeholder="Kept in the audit log and shown to the owner" />
            </label>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setRejecting(false)} className="h-8 rounded-[8px] px-3 text-[12.5px] text-d-text-3 hover:text-d-text">
                Cancel
              </button>
              <button
                disabled={!reason.trim()}
                onClick={() => {
                  chain.reject(tr, reason.trim(), who);
                  setRejecting(false);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-neg-line px-3 text-[12.5px] font-semibold text-negative disabled:opacity-40"
              >
                <X size={13} /> Reject and release the units
              </button>
            </div>
          </Section>
        ) : (
          <button onClick={() => setRejecting(true)} className="text-[12.5px] font-semibold text-d-text-3 hover:text-negative">
            Reject this request
          </button>
        ))}
    </Drawer>
  );
}
