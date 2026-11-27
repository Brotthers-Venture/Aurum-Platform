"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { Lines, MEANING } from "@/components/analytics/charts";
import { fmtShort } from "@/components/analytics/AnalyticsPanels";
import { CONNECTION, ENTITIES, TODAY, balanceOn, vaFor, entityById, personById, policyFor, priorDay, type Category } from "@/lib/banking/data";
import { useBanking } from "@/lib/banking/store";
import { buildBooks } from "@/lib/accounting/engine";
import { investorById } from "@/lib/data";
import { Amt, BankBanner, ConnPill, EntityMark, Illus, KV, RailTag, Section, Seg, btnPrimary, card, day, td, th, tr } from "./ui";
import { NewPayment } from "./Payments";

/** Every account of every administered entity: where it is held, how it is reached, what it holds. */
export function AccountsRegister() {
  const d = useBanking();
  const params = useSearchParams();
  const only = params.get("entity");
  const ents = ENTITIES.filter((e) => !only || e.id === only);
  return (
    <div>
      <PageHead
        eyebrow="Banking Solution"
        title="Accounts"
        meta="Platform accounts are opened in the entity’s own name at the partner bank. Accounts at other banks are connected read-only or kept from statements."
        action={
          only ? (
            <Link href="/admin/banking/accounts" className="text-[12.5px] font-medium text-d-text-3 hover:text-d-text">
              Show all entities
            </Link>
          ) : null
        }
      />
      <BankBanner className="mb-4" />
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {(Object.keys(CONNECTION) as (keyof typeof CONNECTION)[]).map((c) => (
          <div key={c} className="rounded-[10px] border border-d-line bg-d-surface px-3.5 py-3">
            <ConnPill c={c} />
            <p className="mt-1 text-[12px] leading-relaxed text-d-text-3">{CONNECTION[c].detail}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {ents.map((e) => {
          const accts = d.accounts.filter((a) => a.entityId === e.id);
          if (!accts.length) return null;
          return (
            <section key={e.id} className={card}>
              <header className="flex flex-wrap items-center gap-3 border-b border-d-line px-4 py-3">
                <EntityMark id={e.id} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-d-text">{e.name}</span>
                  <span className="block text-[12px] text-d-text-3">
                    {e.kind} · {e.client} · {e.country === "BR" ? "Brazil" : e.country === "KY" ? "Cayman Islands" : "United States"}
                  </span>
                </span>
                <span className="tnum text-[15px] text-d-text">
                  <Amt v={accts.reduce((a, x) => a + x.balance, 0)} ccy={accts[0].currency} decimals={0} />
                </span>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-[13px]">
                  <thead className="border-b border-d-line-soft">
                    <tr>
                      <th className={th}>Account</th>
                      <th className={th}>Held at</th>
                      <th className={th}>Access</th>
                      <th className={th}>Last update</th>
                      <th className={cx(th, "text-right")}>Prior day</th>
                      <th className={cx(th, "text-right")}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accts.map((a) => (
                      <tr key={a.id} className={tr}>
                        <td className={td}>
                          <Link href={`/admin/banking/accounts/${a.id}`} className="block">
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-d-text hover:underline">{a.name}</span>
                              <span className="tnum text-[12px] text-d-text-3">··{a.mask}</span>
                              {a.illustrative && <Illus short />}
                            </span>
                            <span className="block text-[12px] text-d-text-3">
                              {a.purpose} · {a.currency}
                              {a.virtual && " · investor account numbers"}
                              {a.fromBooks && " · mirrors the fund’s books"}
                            </span>
                          </Link>
                        </td>
                        <td className={cx(td, "text-d-text-2")}>{a.bank}</td>
                        <td className={td}>
                          <ConnPill c={a.connection} />
                        </td>
                        <td className={cx(td, "tnum whitespace-nowrap text-[12px] text-d-text-3")}>
                          {a.lastSync.slice(0, 10) === TODAY ? `Today ${a.lastSync.slice(11)}` : day(a.lastSync.slice(0, 10))}
                        </td>
                        <td className={cx(td, "text-right text-d-text-2")}>
                          <Amt v={a.prior} ccy={a.currency} />
                        </td>
                        <td className={cx(td, "text-right font-medium text-d-text")}>
                          <Amt v={a.balance} ccy={a.currency} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const CATS: ("All" | Category)[] = [
  "All",
  "Capital call",
  "Investment",
  "Fees and expenses",
  "Distribution",
  "Proceeds",
  "Operating",
  "Tax",
  "Transfer",
  "Dividend",
  "Unidentified",
];

/** One account: balance over time, every transaction and what it matches in the books, details and controls. */
export function AccountDetail({ id }: { id: string }) {
  const d = useBanking();
  const a = d.account(id);
  const [cat, setCat] = useState<"All" | Category>("All");
  const [range, setRange] = useState<"90" | "365">("90");
  const [paying, setPaying] = useState(false);
  const [limit, setLimit] = useState(25);
  if (!a)
    return (
      <p className="py-16 text-center text-[13px] text-d-text-3">
        This account doesn’t exist.{" "}
        <Link href="/admin/banking/accounts" className="underline">
          Back to accounts
        </Link>
      </p>
    );
  const e = entityById(a.entityId)!;
  const txns = d.txns.filter((t) => t.accountId === a.id);
  const shown = txns.filter((t) => cat === "All" || t.category === cat);
  const days = Number(range);
  const points = Array.from({ length: 13 }, (_, i) => {
    const dt = new Date(`${TODAY}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - Math.round(((12 - i) * days) / 12));
    return dt.toISOString().slice(0, 10);
  });
  const series = points.map((p) => balanceOn(a.id, p, d.txns));
  const policy = policyFor(a.entityId);
  const inflow = txns.filter((t) => t.date > points[0] && t.amount > 0).reduce((x, t) => x + t.amount, 0);
  const outflow = txns.filter((t) => t.date > points[0] && t.amount < 0).reduce((x, t) => x + t.amount, 0);
  const partners = a.virtual && e.fundId ? buildBooks(e.fundId).partners : [];
  const cats = CATS.filter((c) => c === "All" || txns.some((t) => t.category === c));

  return (
    <div>
      <Link href="/admin/banking/accounts" className="ml-2 inline-flex items-center gap-1.5 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> Accounts
      </Link>
      <PageHead
        eyebrow={e.name}
        title={`${a.name} ··${a.mask}`}
        meta={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ConnPill c={a.connection} /> <span>{a.bank}</span> <span>{a.currency}</span>
            {a.illustrative && <Illus />}
            {a.fromBooks && <span className="text-d-text-3">Transactions are the fund’s posted cash entries.</span>}
          </span>
        }
        action={
          a.connection === "Platform" ? (
            <button type="button" className={btnPrimary} onClick={() => setPaying(true)}>
              <Plus size={15} /> New payment
            </button>
          ) : null
        }
      />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className={card}>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-3 border-b border-d-line px-5 py-4">
            <div>
              <div className="text-[12.5px] text-d-text-3">Balance</div>
              <div className="fig mt-1 text-[32px] leading-none text-d-text">
                <Amt v={a.balance} ccy={a.currency} />
              </div>
              <div className="mt-1.5 text-[12.5px] text-d-text-3">
                <Amt v={a.balance - a.prior} ccy={a.currency} signed /> since {day(priorDay(TODAY))}
              </div>
            </div>
            <dl className="flex gap-8 text-[12.5px]">
              <div>
                <dt className="text-d-text-3">In, last {days} days</dt>
                <dd className="mt-0.5 text-[15px]">
                  <Amt v={inflow} ccy={a.currency} decimals={0} signed />
                </dd>
              </div>
              <div>
                <dt className="text-d-text-3">Out, last {days} days</dt>
                <dd className="mt-0.5 text-[15px] text-d-text">
                  <Amt v={outflow} ccy={a.currency} decimals={0} />
                </dd>
              </div>
              <div>
                <dt className="text-d-text-3">Committed out</dt>
                <dd className="mt-0.5 text-[15px] text-d-text">{a.committed ? <Amt v={-a.committed} ccy={a.currency} decimals={0} /> : "—"}</dd>
              </div>
            </dl>
            <span className="ml-auto">
              <Seg
                label="Period"
                value={range}
                onChange={setRange}
                options={[
                  ["90", "90 days"],
                  ["365", "1 year"],
                ]}
              />
            </span>
          </div>
          <div className="px-4 pb-3 pt-2">
            <Lines
              categories={points.map((p) => day(p).replace(/, \d{4}$/, ""))}
              series={[{ name: "Balance", color: MEANING.value, values: series }]}
              fmt={fmtShort(a.currency)}
              height={220}
            />
          </div>
        </section>
        <aside className="flex min-w-0 flex-col gap-3">
          <section className={cx(card, "px-4 py-3")}>
            <Section title="Account details" className="mb-0">
              <KV
                rows={[
                  ["Account holder", e.name],
                  ["Account number", `•••• ${a.mask}`],
                  ["Routing", a.routing],
                  ["Held at", a.bank],
                  ...(a.opened ? ([["Opened", day(a.opened)]] as [string, string][]) : []),
                  ["Access", CONNECTION[a.connection].label],
                ]}
              />
            </Section>
          </section>
          {policy && (
            <section className={cx(card, "px-4 py-3")}>
              <Section
                title="Who can move money"
                className="mb-0"
                aside={
                  <Link href="/admin/banking/policies" className="text-[12px] text-d-text-3 hover:text-d-text">
                    Policy
                  </Link>
                }
              >
                <KV
                  rows={[
                    ["Client signatories", policy.signatories.map((x) => personById(x)!.name).join(", ")],
                    ["Firm approvers", policy.firmApprovers.map((x) => personById(x)!.name).join(", ") || "None"],
                    ["Release", policy.releasers.map((x) => personById(x)!.name).join(", ")],
                  ]}
                />
              </Section>
            </section>
          )}
        </aside>
      </div>

      {partners.length > 0 && (
        <section className={cx(card, "mt-3")}>
          <header className="border-b border-d-line px-4 py-3">
            <span className="block text-[13px] font-semibold text-d-text">Investor account numbers</span>
            <span className="block text-[12px] text-d-text-3">
              Each investor wires to its own number that lands in this account, so a receipt identifies the investor without a reference.
            </span>
          </header>
          <div className="grid gap-px bg-d-line-soft sm:grid-cols-2 xl:grid-cols-3">
            {partners.map((p) => (
              <div key={p.investorId} className="flex items-center justify-between gap-3 bg-d-surface px-4 py-2.5 text-[12.5px]">
                <span className="truncate text-d-text">{investorById(p.investorId)?.name}</span>
                <span className="tnum shrink-0 text-d-text-3">{vaFor(e.fundId!, p.investorId)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={cx(card, "mt-3")}>
        <header className="flex flex-wrap items-center gap-2 border-b border-d-line px-4 py-2.5">
          <span className="mr-2 text-[13px] font-semibold text-d-text">Transactions</span>
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={cx(
                "h-7 rounded-full border px-3 text-[12px]",
                cat === c ? "border-d-text bg-d-text font-semibold text-d-bg" : "border-d-line text-d-text-2 hover:text-d-text",
              )}
            >
              {c}
            </button>
          ))}
        </header>
        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-d-text-3">No transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[13px]">
              <thead className="border-b border-d-line">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Description</th>
                  <th className={th}>Rail</th>
                  <th className={th}>Matched to</th>
                  <th className={cx(th, "text-right")}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, limit).map((t) => (
                  <tr key={t.id} className={tr}>
                    <td className={cx(td, "tnum whitespace-nowrap text-d-text-2")}>{day(t.date)}</td>
                    <td className={td}>
                      <span className="block text-d-text">{t.counterparty}</span>
                      <span className="block max-w-[420px] truncate font-mono text-[11px] text-d-text-3">{t.description}</span>
                    </td>
                    <td className={td}>
                      <RailTag r={t.rail} />
                    </td>
                    <td className={cx(td, "max-w-[280px] text-[12.5px]")}>
                      {t.match.state === "Matched" ? (
                        <span className="text-d-text-2">{t.match.to}</span>
                      ) : (
                        <Link href="/admin/banking/reconciliation" className="font-medium text-gold-700 hover:underline">
                          {t.match.state === "Suggested" ? `Suggested: ${t.match.to}` : "To identify"}
                        </Link>
                      )}
                    </td>
                    <td className={cx(td, "text-right")}>
                      <Amt v={t.amount} ccy={a.currency} signed />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + 50)}
                className="w-full border-t border-d-line-soft px-4 py-3 text-[12.5px] font-medium text-d-text-2 hover:bg-d-raise hover:text-d-text"
              >
                Show more · {shown.length - limit} older transactions
              </button>
            )}
          </div>
        )}
      </section>
      {paying && <NewPayment entityId={a.entityId} onClose={() => setPaying(false)} />}
    </div>
  );
}
