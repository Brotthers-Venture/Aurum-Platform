"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Clock3, PhoneCall, Plus, ShieldAlert, Stamp, Send, Link2 } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { INDICATIVE_BRL_USD, TODAY, accountById, entityById } from "@/lib/banking/data";
import { entityRows, useBanking } from "@/lib/banking/store";
import { Amt, BankBanner, EntityMark, Illus, card, day, td, th, tr } from "./ui";
import { NewPayment } from "./Payments";

/** The firm's cash across every administered entity, and what needs a decision today. */
export function CashPosition() {
  const d = useBanking();
  const [creating, setCreating] = useState(false);
  const rows = entityRows(d);
  const change = d.totalUsd - d.priorUsd;
  const usdTotal = d.accounts.filter((a) => a.currency === "USD").reduce((a, x) => a + x.balance, 0);
  const brlTotal = d.accounts.filter((a) => a.currency === "BRL").reduce((a, x) => a + x.balance, 0);
  const recent = d.txns.slice(0, 9);

  const actions = [
    { key: "approve", Icon: Stamp, label: "To approve", items: d.toApprove, href: "/admin/banking/payments?view=approve" },
    { key: "release", Icon: Send, label: "To release", items: d.toRelease, href: "/admin/banking/payments?view=release" },
    { key: "hold", Icon: ShieldAlert, label: "On hold", items: d.onHold, href: "/admin/banking/payments?view=hold" },
  ] as const;

  return (
    <div>
      <PageHead
        eyebrow="Banking Solution"
        title="Cash position"
        meta={`${day(TODAY)}, 4:42 PM ET · prior business day for comparison · BRL shown in USD at the indicative ${INDICATIVE_BRL_USD.toFixed(2)}`}
        action={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-brand px-3.5 text-[13px] font-semibold text-brand-ink hover:opacity-90"
          >
            <Plus size={15} /> New payment
          </button>
        }
      />
      <BankBanner className="mb-4" />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className={card}>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-d-line px-5 py-4">
            <div>
              <div className="text-[12.5px] text-d-text-3">Total cash, all entities</div>
              <div className="fig mt-1 text-[34px] leading-none text-d-text">
                <Amt v={d.totalUsd} ccy="USD" decimals={0} />
              </div>
              <div className="mt-1.5 text-[12.5px] text-d-text-3">
                <Amt v={change} ccy="USD" decimals={0} signed className={change < 0 ? "text-negative" : ""} /> since the prior business day
              </div>
            </div>
            <dl className="flex gap-8 text-[12.5px]">
              <div>
                <dt className="text-d-text-3">In dollars</dt>
                <dd className="tnum mt-0.5 text-[16px] text-d-text">
                  <Amt v={usdTotal} ccy="USD" decimals={0} />
                </dd>
              </div>
              <div>
                <dt className="text-d-text-3">In reais</dt>
                <dd className="tnum mt-0.5 text-[16px] text-d-text">
                  <Amt v={brlTotal} ccy="BRL" decimals={0} />
                </dd>
              </div>
              <div>
                <dt className="text-d-text-3">Accounts</dt>
                <dd className="tnum mt-0.5 text-[16px] text-d-text">{d.accounts.length}</dd>
              </div>
            </dl>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead className="border-b border-d-line">
                <tr>
                  <th className={th}>Entity</th>
                  <th className={cx(th, "text-right")}>Today</th>
                  <th className={cx(th, "text-right")}>Committed out</th>
                  <th className={cx(th, "text-right")}>Expected in</th>
                  <th className={cx(th, "text-right")}>Projected</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const projected = r.balance - r.committed + r.expected;
                  const illustrative = r.accts.every((a) => a.illustrative);
                  return (
                    <tr key={r.e.id} className={tr}>
                      <td className={td}>
                        <Link href={`/admin/banking/accounts?entity=${r.e.id}`} className="flex items-center gap-3">
                          <EntityMark id={r.e.id} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium text-d-text hover:underline">{r.e.name}</span>
                              {illustrative && <Illus short />}
                            </span>
                            <span className="block text-[12px] text-d-text-3">
                              {r.e.kind} · {r.accts.length} {r.accts.length === 1 ? "account" : "accounts"}
                              {r.accts.some((a) => a.fromBooks) && " · from the fund’s books"}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className={cx(td, "text-right")}>
                        <span className="block font-medium text-d-text">
                          <Amt v={r.balance} ccy={r.ccy} decimals={0} />
                        </span>
                        <span className="block text-[11.5px] text-d-text-3">
                          {r.balance === r.prior ? "No change" : <Amt v={r.balance - r.prior} ccy={r.ccy} decimals={0} signed />}
                        </span>
                      </td>
                      <td className={cx(td, "text-right text-d-text-2")}>{r.committed ? <Amt v={-r.committed} ccy={r.ccy} decimals={0} /> : "—"}</td>
                      <td className={cx(td, "text-right text-d-text-2")}>
                        {r.expected ? (
                          <span title={`Capital still owed on issued calls${r.expectedBy ? `, due ${day(r.expectedBy)}` : ""}`}>
                            <Amt v={r.expected} ccy={r.ccy} decimals={0} signed />
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={cx(td, "text-right", projected < -0.5 ? "text-negative" : "text-d-text")}>
                        <Amt v={projected} ccy={r.ccy} decimals={0} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-d-line-soft px-4 py-2.5 text-[11.5px] leading-relaxed text-d-text-3">
            Committed out: payments waiting for approval, release or their value date. Expected in: capital owed on issued calls that has not reached the bank. Projected = today −
            committed + expected.
          </p>
        </section>

        <aside className="flex min-w-0 flex-col gap-3">
          <section className={card}>
            <header className="flex h-11 items-center border-b border-d-line px-4 text-[13px] font-semibold text-d-text">Pending actions</header>
            <ul>
              {actions.map(({ key, Icon, label, items, href }) => (
                <li key={key} className="border-b border-d-line-soft last:border-0">
                  <Link href={href} className="group flex items-start gap-3 px-4 py-3 hover:bg-d-raise">
                    <Icon size={16} className={cx("mt-0.5 shrink-0", items.length ? "text-d-text-2" : "text-d-text-3")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-d-text">{label}</span>
                        <span className={cx("tnum text-[13px]", items.length ? "font-semibold text-d-text" : "text-d-text-3")}>{items.length}</span>
                      </span>
                      {items.slice(0, 2).map((p) => (
                        <span key={p.id} className="mt-1 flex justify-between gap-3 text-[12px] text-d-text-3">
                          <span className="truncate">
                            {entityById(accountById(p.fromAccountId)!.entityId)!.short} → {d.payee(p.payeeId)?.name}
                          </span>
                          <Amt v={p.amount} ccy={p.currency} decimals={0} />
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-b border-d-line-soft">
                <Link href="/admin/banking/payees" className="flex items-center gap-3 px-4 py-3 hover:bg-d-raise">
                  <PhoneCall size={16} className={d.callbacks.length ? "text-d-text-2" : "text-d-text-3"} />
                  <span className="flex-1 text-[13px] font-medium text-d-text">Payees to call back</span>
                  <span className={cx("tnum text-[13px]", d.callbacks.length ? "font-semibold text-negative" : "text-d-text-3")}>{d.callbacks.length}</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/banking/reconciliation" className="flex items-center gap-3 px-4 py-3 hover:bg-d-raise">
                  <Link2 size={16} className={d.exceptions.length ? "text-d-text-2" : "text-d-text-3"} />
                  <span className="flex-1 text-[13px] font-medium text-d-text">Receipts to match</span>
                  <span className={cx("tnum text-[13px]", d.exceptions.length ? "font-semibold text-d-text" : "text-d-text-3")}>{d.exceptions.length}</span>
                </Link>
              </li>
            </ul>
          </section>
          <section className={card}>
            <header className="flex h-11 items-center gap-2 border-b border-d-line px-4 text-[13px] font-semibold text-d-text">
              <Clock3 size={14} className="text-d-text-3" /> Today’s cutoffs
              <span className="ml-auto">
                <Illus short title="Typical partner cutoffs; confirmed with the partner bank" />
              </span>
            </header>
            <dl className="divide-y divide-d-line-soft text-[12.5px]">
              {[
                ["Same-day ACH", "2:00 PM ET", true],
                ["International wire (SWIFT)", "2:00 PM ET", true],
                ["Domestic wire (Fedwire)", "5:00 PM ET", false],
                ["TED", "5:00 PM Brasília", false],
                ["Pix and book transfers", "Any time, any day", false],
              ].map(([k, v, passed]) => (
                <div key={k as string} className="flex justify-between gap-3 px-4 py-2">
                  <dt className="text-d-text-2">{k}</dt>
                  <dd className={cx("tnum", passed ? "text-d-text-3 line-through" : "text-d-text")}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>

      <section className={cx(card, "mt-3")}>
        <header className="flex h-11 items-center justify-between border-b border-d-line px-4">
          <span className="text-[13px] font-semibold text-d-text">Recent activity</span>
          <Link href="/admin/banking/accounts" className="inline-flex items-center gap-1 text-[12px] text-d-text-3 hover:text-d-text">
            All accounts <ArrowRight size={12} />
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead className="border-b border-d-line">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Account</th>
                <th className={th}>Counterparty</th>
                <th className={th}>Category</th>
                <th className={cx(th, "text-right")}>Amount</th>
                <th className={th}>Books</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => {
                const a = accountById(t.accountId)!;
                return (
                  <tr key={t.id} className={tr}>
                    <td className={cx(td, "tnum whitespace-nowrap text-d-text-2")}>{day(t.date)}</td>
                    <td className={td}>
                      <Link href={`/admin/banking/accounts/${a.id}`} className="text-d-text hover:underline">
                        {entityById(a.entityId)!.short} · {a.name}
                      </Link>
                    </td>
                    <td className={cx(td, "text-d-text")}>
                      <span className="flex items-center gap-2">
                        {t.counterparty}
                        {t.illustrative && <Illus short />}
                      </span>
                    </td>
                    <td className={cx(td, "text-d-text-2")}>{t.category}</td>
                    <td className={cx(td, "text-right")}>
                      <Amt v={t.amount} ccy={a.currency} signed />
                    </td>
                    <td className={td}>
                      {t.match.state === "Matched" ? (
                        <span className="text-[12px] text-d-text-3">Matched</span>
                      ) : (
                        <Link href="/admin/banking/reconciliation" className="text-[12px] font-medium text-gold-700 hover:underline">
                          {t.match.state === "Suggested" ? "Match suggested" : "To identify"}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {creating && <NewPayment onClose={() => setCreating(false)} />}
    </div>
  );
}
