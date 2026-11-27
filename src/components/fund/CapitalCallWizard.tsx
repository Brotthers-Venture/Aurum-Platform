"use client";

import { useMemo, useState } from "react";
import { CircleCheck, Plus, Trash2 } from "lucide-react";
import { ButtonLink, Panel, cx } from "@/components/ui";
import { WField, WizardShell, parseAmount, wizInput } from "./WizardShell";
import { allocateCents, buildBooks, TODAY } from "@/lib/accounting/engine";
import { accountByCode } from "@/lib/accounting/coa";
import { bankAccounts, fundById, funds, investorById } from "@/lib/data";
import { date, money, pct } from "@/lib/format";

const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

export function CapitalCallWizard() {
  const [step, setStep] = useState(0);
  const [fundId, setFundId] = useState("meridian-cvc");
  const [notice, setNotice] = useState(TODAY);
  const [due, setDue] = useState(addDays(TODAY, 14));
  const [basis, setBasis] = useState<"commitment" | "unfunded">("commitment");
  const [lines, setLines] = useState([{ name: "Investment — Halcyon Sensors Series A", amount: "3,500,000" }]);
  const [fees, setFees] = useState("0");
  const [expenses, setExpenses] = useState("85,000");
  const [noticeFor, setNoticeFor] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const f = fundById(fundId)!;
  const books = buildBooks(fundId);
  const partners = books.partners.filter((p) => p.commitment > 0);
  const nextNumber = Math.max(0, ...books.calls.map((c) => c.number)) + 1;
  const total = lines.reduce((a, l) => a + parseAmount(l.amount), 0) + parseAmount(fees) + parseAmount(expenses);
  const m = (v: number, dec = 0) => money(v, f.currency, { decimals: dec });

  const alloc = useMemo(() => {
    const weights = partners.map((p) => Math.round((basis === "commitment" ? p.commitment : p.commitment - p.called) * 100));
    const cents = allocateCents(Math.round(total * 100), weights);
    return partners.map((p, i) => {
      const amount = cents[i] / 100;
      const unfunded = p.commitment - p.called;
      return { p, amount, unfunded, after: unfunded - amount, over: amount > unfunded + 0.005 };
    });
  }, [partners, basis, total]);

  const totalUnfunded = partners.reduce((a, p) => a + p.commitment - p.called, 0);
  const overCommitted = alloc.some((a) => a.over);
  const bank = bankAccounts.find((b) => b.fundId === fundId);
  const lp = alloc.find((a) => a.p.investorId === noticeFor) ?? alloc[0];

  if (done) {
    return (
      <div className="mx-auto max-w-[560px] py-20 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-gold-400">
          <CircleCheck size={22} strokeWidth={2} />
        </span>
        <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.015em]">Submitted for approval</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-stone-600">
          Capital Call No. {nextNumber} for {f.name} ({m(total)}) is with Fund Accounting for review, then {f.gp} for sign-off. On approval, {alloc.length} notices publish to
          investor portals and the entries post to the ledger.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <ButtonLink href="/admin/fund/capital-calls">Back to capital calls</ButtonLink>
        </div>
      </div>
    );
  }

  const content = [
    // 0 Setup
    <Panel key="0" title="Vehicle and dates">
      <div className="grid gap-5 sm:grid-cols-2">
        <WField label="Vehicle">
          <select className={wizInput} value={fundId} onChange={(e) => setFundId(e.target.value)}>
            {funds
              .filter((x) => buildBooks(x.id).partners.some((p) => p.commitment - p.called > 1))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
        </WField>
        <WField label="Call number">
          <input className={`${wizInput} num bg-stone-50`} readOnly value={`No. ${nextNumber}`} />
        </WField>
        <WField label="Notice date">
          <input type="date" className={wizInput} value={notice} onChange={(e) => setNotice(e.target.value)} />
        </WField>
        <WField label="Due date" hint="LPA requires at least 10 business days’ notice.">
          <input type="date" className={wizInput} value={due} onChange={(e) => setDue(e.target.value)} />
        </WField>
      </div>
      <div className="mt-6">
        <div className="text-[12px] font-semibold">Allocation basis</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["commitment", "Pro rata to commitments", "Standard under most LPAs once all closes are equalized."],
              ["unfunded", "Pro rata to unfunded commitments", "Use where partners are not at the same funded percentage."],
            ] as const
          ).map(([v, t, d]) => (
            <button
              key={v}
              type="button"
              onClick={() => setBasis(v)}
              className={cx("rounded-[3px] border p-4 text-left", basis === v ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-300 hover:border-stone-500")}
            >
              <div className="text-[13px] font-semibold">{t}</div>
              <div className="mt-1 text-[12px] text-stone-500">{d}</div>
            </button>
          ))}
        </div>
      </div>
    </Panel>,

    // 1 Use of proceeds
    <Panel key="1" title="Use of proceeds">
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_180px_36px] items-end gap-3">
            <WField label={i === 0 ? "Investment" : ""}>
              <input className={wizInput} value={l.name} onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
            </WField>
            <WField label={i === 0 ? `Amount (${f.currency})` : ""}>
              <input className={`${wizInput} num text-right`} value={l.amount} onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} />
            </WField>
            <button type="button" onClick={() => setLines(lines.filter((_, k) => k !== i))} className="mb-2.5 text-stone-400 hover:text-negative" aria-label="Remove">
              <Trash2 size={15} strokeWidth={1.6} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setLines([...lines, { name: "", amount: "0" }])} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-900">
          <Plus size={13} strokeWidth={2} /> Add investment
        </button>
      </div>
      <div className="mt-6 grid gap-5 border-t border-stone-100 pt-5 sm:grid-cols-2">
        <WField label="Management fee" hint={f.managementFee}>
          <input className={`${wizInput} num text-right`} value={fees} onChange={(e) => setFees(e.target.value)} />
        </WField>
        <WField label="Fund expenses" hint="Legal, audit, administration">
          <input className={`${wizInput} num text-right`} value={expenses} onChange={(e) => setExpenses(e.target.value)} />
        </WField>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4 text-[14px]">
        <span className="font-semibold">Total call</span>
        <span className="num text-[18px] font-medium">{m(total)}</span>
      </div>
      <div className="num mt-1 text-right text-[12px] text-stone-500">
        {pct(total / partners.reduce((a, p) => a + p.commitment, 0))} of commitments · {m(totalUnfunded)} unfunded before call
      </div>
    </Panel>,

    // 2 Allocation
    <Panel key="2" flush title={`Partner allocation — ${basis === "commitment" ? "pro rata to commitments" : "pro rata to unfunded"}`}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Limited partner</th>
            <th className="r">Commitment</th>
            <th className="r">Unfunded before</th>
            <th className="r">This call</th>
            <th className="r">Unfunded after</th>
            <th className="r">Funded after</th>
          </tr>
        </thead>
        <tbody>
          {alloc.map((a) => (
            <tr key={a.p.investorId}>
              <td className="font-semibold">{investorById(a.p.investorId)?.name}</td>
              <td className="num r">{m(a.p.commitment)}</td>
              <td className="num r">{m(a.unfunded)}</td>
              <td className="num r font-semibold">{m(a.amount, 2)}</td>
              <td className={cx("num r", a.over && "text-negative")}>{m(a.after)}</td>
              <td className="num r text-stone-600">{pct((a.p.called + a.amount) / a.p.commitment)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="num r">{m(partners.reduce((a, p) => a + p.commitment, 0))}</td>
            <td className="num r">{m(totalUnfunded)}</td>
            <td className="num r">{m(total, 2)}</td>
            <td className="num r">{m(totalUnfunded - total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      <p className="border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">
        Amounts rounded to the cent using largest-remainder allocation, so partner amounts always sum exactly to the call.
        {overCommitted && <span className="ml-1 font-semibold text-negative">One or more partners would exceed their unfunded commitment.</span>}
      </p>
    </Panel>,

    // 3 Notices
    <div key="3" className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Panel flush title="Recipients">
        <ul className="max-h-[520px] overflow-y-auto">
          {alloc.map((a) => (
            <li key={a.p.investorId}>
              <button
                type="button"
                onClick={() => setNoticeFor(a.p.investorId)}
                className={cx(
                  "w-full border-b border-stone-100 px-4 py-2.5 text-left text-[12px]",
                  lp.p.investorId === a.p.investorId ? "bg-stone-100 font-semibold" : "hover:bg-stone-50",
                )}
              >
                {investorById(a.p.investorId)?.name}
                <span className="num block text-stone-500">{m(a.amount, 2)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="rounded-[8px] border border-stone-200/70 bg-white shadow-card px-10 py-9 font-serif text-[13px] leading-relaxed text-ink-800">
        <div className="flex items-start justify-between font-sans">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-900">{f.name}</div>
          <div className="num text-[12px] text-stone-500">{date(notice)}</div>
        </div>
        <h2 className="mt-8 text-[20px] font-semibold text-ink-900">Capital Call Notice No. {nextNumber}</h2>
        <p className="mt-4">To: {investorById(lp.p.investorId)?.name}</p>
        <p className="mt-3">
          Pursuant to the Limited Partnership Agreement, {f.gp} hereby calls capital from the Limited Partners in the aggregate amount of {m(total)}. Your share, based on your
          commitment of {m(lp.p.commitment)}, is set out below and is due on <span className="font-semibold">{date(due)}</span>.
        </p>
        <table className="mt-5 w-full font-sans text-[12px]">
          <tbody>
            {[
              ["Amount due", m(lp.amount, 2)],
              ["Commitment", m(lp.p.commitment)],
              ["Contributed to date (including this call)", m(lp.p.called + lp.amount, 2)],
              ["Remaining unfunded commitment", m(lp.after, 2)],
            ].map(([k, v], i) => (
              <tr key={k} className="border-b border-stone-200">
                <td className="py-2 text-stone-600">{k}</td>
                <td className={cx("num py-2 text-right", i === 0 && "font-semibold text-ink-900")}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 rounded-[3px] bg-stone-50 p-4 font-sans text-[12px]">
          <div className="font-semibold text-ink-900">Wire instructions</div>
          <div className="mt-1 text-stone-600">
            {bank?.institution} · {bank?.accountName} · Account ••{bank?.mask}
            <br />
            Reference: {investorById(lp.p.investorId)?.name} — Call {nextNumber}
          </div>
          <div className="mt-2 text-negative">Aurum will never change wire instructions by email. Confirm by phone before sending.</div>
        </div>
      </div>
    </div>,

    // 4 Review
    <div key="4" className="space-y-4">
      <Panel title="Entries that will post on issue" flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Partner</th>
              <th className="r">Debit</th>
              <th className="r">Credit</th>
            </tr>
          </thead>
          <tbody>
            {alloc.flatMap((a) => [
              <tr key={a.p.investorId + "d"}>
                <td>
                  <span className="font-mono text-[11px] text-stone-400">1200</span> {accountByCode("1200").name}
                </td>
                <td className="text-[12px] text-stone-500">{investorById(a.p.investorId)?.name}</td>
                <td className="num r">{m(a.amount, 2)}</td>
                <td />
              </tr>,
              <tr key={a.p.investorId + "c"}>
                <td className="pl-8">
                  <span className="font-mono text-[11px] text-stone-400">3000</span> {accountByCode("3000").name}
                </td>
                <td className="text-[12px] text-stone-500">{investorById(a.p.investorId)?.name}</td>
                <td />
                <td className="num r">{m(a.amount, 2)}</td>
              </tr>,
            ])}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Balanced</td>
              <td className="num r">{m(total, 2)}</td>
              <td className="num r">{m(total, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </Panel>
      <Panel title="Approval chain">
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            ["Prepare", "You · Fund Services", true],
            ["Review", "Fund Accounting (four-eyes)", false],
            ["Approve", f.gp, false],
          ].map(([s, w, d], i) => (
            <li key={s as string} className={cx("rounded-[3px] border p-3", d ? "border-ink-900" : "border-stone-200")}>
              <div className="num text-[11px] text-stone-400">Step {i + 1}</div>
              <div className="text-[13px] font-semibold">{s}</div>
              <div className="text-[12px] text-stone-500">{w}</div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>,
  ];

  return (
    <WizardShell
      back="/admin/fund/capital-calls"
      backLabel="Capital calls"
      eyebrow={f.name}
      title={`New capital call — No. ${nextNumber}`}
      steps={["Setup", "Use of proceeds", "Allocation", "Notices", "Review & approve"]}
      step={step}
      setStep={setStep}
      canContinue={total > 0 && !overCommitted && due > notice}
      finalLabel="Submit for approval"
      onFinish={() => setDone(true)}
      aside={
        <Panel title="Summary">
          <dl className="space-y-2.5 text-[13px]">
            {[
              ["Call amount", m(total)],
              ["Partners", String(alloc.length)],
              ["Notice", date(notice)],
              ["Due", date(due)],
              ["Funded after call", pct((partners.reduce((a, p) => a + p.called, 0) + total) / partners.reduce((a, p) => a + p.commitment, 0))],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-stone-500">{k}</dt>
                <dd className="num font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      }
    >
      {content[step]}
    </WizardShell>
  );
}
