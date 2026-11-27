"use client";

import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { cx } from "@/components/ui";
import { ENTITIES, TODAY, accountById, entityById } from "@/lib/banking/data";
import { approvalStatus, bank, useBanking } from "@/lib/banking/store";
import { Amt, Illus, PayPill, RailTag, day, field, useFlash } from "./ui";

/** A client's own view: its accounts, payments waiting for its signature, and recent activity. */
export function ClientBanking({ org, person }: { org: string; person: string }) {
  const d = useBanking();
  const { flash, node } = useFlash();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const ents = ENTITIES.filter((e) => e.clientOrg === org).map((e) => e.id);
  const accts = d.accounts.filter((a) => ents.includes(a.entityId));
  const payments = d.payments.filter((p) => ents.includes(accountById(p.fromAccountId)!.entityId));
  const mine = payments.filter((p) => p.state === "Pending approval" && approvalStatus(p).eligible.includes(person));
  const others = payments.filter((p) => !mine.includes(p) && !["Cancelled"].includes(p.state)).slice(0, 8);
  const txns = d.txns.filter((t) => accts.some((a) => a.id === t.accountId)).slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2.5 rounded-[10px] border border-dashed border-stone-300 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-stone-600">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-stone-400" />
        <span>
          Your accounts are in your entity’s own name at our partner bank. Your administrator prepares payments; nothing leaves without the approvals you set, and new bank details
          are always confirmed by phone. <b className="font-semibold text-ink-900">Prototype: no money moves.</b>
        </span>
      </div>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Waiting for your approval</h2>
        {mine.length === 0 ? (
          <p className="rounded-[10px] border border-stone-200 bg-white px-4 py-6 text-center text-[13px] text-stone-500">Nothing needs your approval.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {mine.map((p) => {
              const a = accountById(p.fromAccountId)!;
              const st = approvalStatus(p);
              const payee = d.payee(p.payeeId)!;
              return (
                <article key={p.id} className="rounded-[12px] border border-stone-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3 text-[12px] text-stone-500">
                    <span>
                      {p.ref} · prepared by {st.maker}
                    </span>
                    {p.illustrative && <Illus short />}
                  </div>
                  <div className="mt-2 text-[17px] font-semibold text-ink-900">{payee.name}</div>
                  <div className="text-[12.5px] text-stone-500">{p.memo}</div>
                  <div className="fig mt-3 text-[28px] leading-none text-ink-900">
                    <Amt v={p.amount} ccy={p.currency} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                    <dt className="text-stone-500">From</dt>
                    <dd className="text-ink-900">
                      {entityById(a.entityId)!.short} ··{a.mask}
                    </dd>
                    <dt className="text-stone-500">To</dt>
                    <dd className="text-ink-900">
                      {payee.bank} ··{payee.mask}
                    </dd>
                    <dt className="text-stone-500">How</dt>
                    <dd>
                      <RailTag r={p.rail} />
                    </dd>
                    <dt className="text-stone-500">On</dt>
                    <dd className="text-ink-900">{p.date === TODAY ? "Today" : day(p.date)}</dd>
                    <dt className="text-stone-500">Approved so far</dt>
                    <dd className="text-ink-900">{st.approvedBy.join(", ") || "No one yet"}</dd>
                  </dl>
                  {rejecting === p.id ? (
                    <div className="mt-4">
                      <textarea
                        aria-label="Reason"
                        className={cx(field, "h-16 py-2")}
                        placeholder="Why you are rejecting it"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="h-9 rounded-[8px] border border-stone-300 px-3.5 text-[13px] font-semibold text-ink-900 hover:bg-stone-100"
                          onClick={() => {
                            const r = bank.reject(p.id, person, note);
                            flash(r);
                            if (r.ok) setRejecting(null);
                          }}
                        >
                          Reject payment
                        </button>
                        <button type="button" className="text-[12.5px] text-stone-500" onClick={() => setRejecting(null)}>
                          Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-brand px-4 text-[13px] font-semibold text-brand-ink hover:opacity-90"
                        onClick={() => flash(bank.approve(p.id, person))}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button type="button" className="h-9 rounded-[8px] px-3 text-[13px] font-medium text-stone-500 hover:text-ink-900" onClick={() => setRejecting(p.id)}>
                        Reject…
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Accounts</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accts.map((a) => (
            <div key={a.id} className="rounded-[12px] border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2 text-[12.5px] text-stone-500">
                <span>
                  {entityById(a.entityId)!.short} · {a.name}
                </span>
                <span className="tnum">··{a.mask}</span>
              </div>
              <div className="fig mt-2 text-[26px] leading-none text-ink-900">
                <Amt v={a.balance} ccy={a.currency} />
              </div>
              <div className="mt-1.5 text-[12px] text-stone-500">
                {a.balance === a.prior ? "No change since yesterday" : <Amt v={a.balance - a.prior} ccy={a.currency} signed />} · {a.bank}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Payments</h2>
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-[12px] border border-stone-200 bg-white">
            {others.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-stone-500">No payments yet.</li>}
            {others.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-900">{d.payee(p.payeeId)?.name}</span>
                  <span className="block text-[12px] text-stone-500">
                    {p.date === TODAY ? "Today" : day(p.date)} · {p.rail}
                  </span>
                </span>
                <Amt v={p.amount} ccy={p.currency} className="text-ink-900" />
                <PayPill s={p.state} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Recent activity</h2>
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-[12px] border border-stone-200 bg-white">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink-900">{t.counterparty}</span>
                  <span className="block text-[12px] text-stone-500">
                    {day(t.date)} · {t.category}
                  </span>
                </span>
                <Amt v={t.amount} ccy={accountById(t.accountId)!.currency} signed />
              </li>
            ))}
          </ul>
        </section>
      </div>
      {node}
    </div>
  );
}
