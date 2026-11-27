"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { POLICIES, PEOPLE, accountById, entityById, personById } from "@/lib/banking/data";
import { bank, useBanking } from "@/lib/banking/store";
import { money } from "@/lib/format";
import { Amt, BankBanner, Empty, Illus, btnPrimary, btnSecondary, card, day, field, td, th, tr, useFlash } from "./ui";

/** Receipts the platform could not match by itself, with its best suggestion and the reason. */
export function Reconciliation() {
  const d = useBanking();
  const { flash, node } = useFlash();
  const firm = PEOPLE.filter((p) => p.side === "Firm").map((p) => p.name);
  const [who, setWho] = useState(firm[0]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const perAccount = d.accounts
    .filter((a) => a.connection !== "Statements" || a.fromBooks)
    .map((a) => {
      const t = d.txns.filter((x) => x.accountId === a.id);
      const matched = t.filter((x) => x.match.state === "Matched").length;
      return { a, n: t.length, matched };
    })
    .filter((r) => r.n);
  return (
    <div>
      <PageHead
        eyebrow="Banking Solution"
        title="Reconciliation"
        meta="Bank transactions against the books. Investors pay to their own account numbers, so most receipts match themselves; the rest wait here with a suggestion."
        action={
          <label className="flex items-center gap-2 text-[12.5px] text-d-text-3">
            Working as
            <select className={cx(field, "mt-0 h-8 w-auto")} value={who} onChange={(e) => setWho(e.target.value)}>
              {firm.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        }
      />
      <BankBanner className="mb-4" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-3">
          {d.exceptions.length === 0 && <Empty>Every bank transaction is matched to the books.</Empty>}
          {d.exceptions.map((t) => {
            const a = accountById(t.accountId)!;
            return (
              <article key={t.id} className={cx(card, "px-4 py-4")}>
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-d-text-3">
                      {day(t.date)} · {entityById(a.entityId)!.short} · {a.name} ··{a.mask} {t.illustrative && <Illus short />}
                    </div>
                    <div className="mt-1 text-[15px] font-semibold text-d-text">{t.counterparty}</div>
                    <div className="mt-0.5 font-mono text-[11.5px] text-d-text-3">{t.description}</div>
                  </div>
                  <div className="fig text-[22px] text-d-text">
                    <Amt v={t.amount} ccy={a.currency} signed />
                  </div>
                </div>
                {t.match.state === "Suggested" ? (
                  <div className="mt-3 rounded-[10px] border border-d-line px-3.5 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                      <span className="text-d-text-3">Suggested match</span>
                      <span className="font-semibold text-d-text">{t.match.to}</span>
                      <span
                        className={cx("rounded-[5px] border px-1.5 text-[11px]", t.match.confidence === "High" ? "border-up-line text-up-ink" : "border-attn-line text-gold-700")}
                      >
                        {t.match.confidence} confidence
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-d-text-2">{t.match.why}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnPrimary}
                        onClick={() =>
                          flash(bank.confirmMatch(t.id, who, t.match.state === "Suggested" && t.match.confidence === "Medium" ? "Shortfall recorded as a bank fee" : undefined))
                        }
                      >
                        <Check size={14} /> {t.match.confidence === "Medium" ? "Match and record the shortfall" : "Confirm match"}
                      </button>
                      <Link href={`/admin/banking/accounts/${a.id}`} className={btnSecondary}>
                        Open the account
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-[10px] border border-d-line px-3.5 py-3">
                    <p className="text-[12.5px] text-d-text-2">No capital call, invoice or transfer explains this receipt. Say what it is, or ask the client.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        aria-label="What this receipt is"
                        className={cx(field, "mt-0 max-w-[360px]")}
                        placeholder="e.g. Invoice 2291, Harborview Logistics"
                        value={labels[t.id] ?? ""}
                        onChange={(e) => setLabels({ ...labels, [t.id]: e.target.value })}
                      />
                      <button type="button" className={btnPrimary} onClick={() => flash(bank.classify(t.id, who, labels[t.id] ?? ""))}>
                        Record
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
        <aside className={cx(card, "self-start")}>
          <header className="border-b border-d-line px-4 py-3 text-[13px] font-semibold text-d-text">Matched by account</header>
          <ul>
            {perAccount.map(({ a, n, matched }) => (
              <li key={a.id} className="border-b border-d-line-soft px-4 py-2.5 last:border-0">
                <div className="flex justify-between gap-3 text-[12.5px]">
                  <span className="truncate text-d-text">
                    {entityById(a.entityId)!.short} · {a.name}
                  </span>
                  <span className="tnum shrink-0 text-d-text-3">
                    {matched}/{n}
                  </span>
                </div>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-d-raise">
                  <span className="block h-full rounded-full" style={{ width: `${(matched / n) * 100}%`, background: matched === n ? "var(--color-up)" : "var(--d-accent)" }} />
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      {node}
    </div>
  );
}

/** The rules each entity has set for moving money. */
export function Policies() {
  return (
    <div>
      <PageHead
        eyebrow="Banking Solution"
        title="Approval policies"
        meta="Set with each client when its accounts are opened, signed by its authorized signatories, and enforced on every payment. Changes need the client’s signed instruction."
      />
      <BankBanner className="mb-4" />
      <div className="grid gap-3 lg:grid-cols-2">
        {POLICIES.map((p) => {
          const e = entityById(p.entityId)!;
          return (
            <section key={p.entityId} className={card}>
              <header className="border-b border-d-line px-4 py-3">
                <span className="block font-semibold text-d-text">{e.name}</span>
                <span className="block text-[12px] text-d-text-3">
                  {e.kind} · payments in {p.currency}
                </span>
              </header>
              <table className="w-full text-[13px]">
                <thead className="border-b border-d-line-soft">
                  <tr>
                    <th className={th}>Amount</th>
                    <th className={th}>Approvals</th>
                    <th className={th}>Client signatory</th>
                  </tr>
                </thead>
                <tbody>
                  {p.tiers.map((t, i) => (
                    <tr key={i} className={tr}>
                      <td className={cx(td, "tnum text-d-text")}>
                        {t.upTo === null ? (i ? `Over ${money(p.tiers[i - 1].upTo!, p.currency)}` : "Any amount") : `Up to ${money(t.upTo, p.currency)}`}
                      </td>
                      <td className={cx(td, "text-d-text-2")}>{t.approvals === 1 ? "One" : t.approvals === 2 ? "Two" : t.approvals}</td>
                      <td className={cx(td, "text-d-text-2")}>{t.clientRequired ? "Required" : "Not required"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="grid gap-x-6 gap-y-2 px-4 py-3 text-[12.5px] sm:grid-cols-2">
                {(
                  [
                    ["Client signatories", p.signatories.map((x) => personById(x)!.name).join(", ")],
                    ["Firm approvers", p.firmApprovers.map((x) => personById(x)!.name).join(", ") || "None"],
                    ["Release to the bank", p.releasers.map((x) => personById(x)!.name).join(", ")],
                    ["New or changed payees", "Confirmed by a callback to a number on record before any payment"],
                    ["Preparer", "Cannot approve or release the same payment"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-d-text-3">{k}</dt>
                    <dd className="text-d-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}
