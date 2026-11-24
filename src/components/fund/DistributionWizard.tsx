"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { ButtonLink, KeyValue, Panel, cx } from "@/components/ui";
import { WField, WizardShell, parseAmount, wizInput } from "./WizardShell";
import { allocateCents, buildBooks, TODAY } from "@/lib/accounting/engine";
import { runWaterfall } from "@/lib/accounting/waterfall";
import { fundById, funds, investorById } from "@/lib/data";
import { date, money, pct } from "@/lib/format";

export function DistributionWizard() {
  const [step, setStep] = useState(0);
  const [fundId, setFundId] = useState("serra-re-spv");
  const [payDate, setPayDate] = useState("2026-12-18");
  const [source, setSource] = useState("Sale of Serra Office Tower, São Paulo");
  const [roc, setRoc] = useState("37,600,000");
  const [gain, setGain] = useState("14,400,000");
  const [income, setIncome] = useState("0");
  const [hurdle, setHurdle] = useState(String(+(fundById("serra-re-spv")!.hurdleRate * 100).toFixed(2)));
  const [carry, setCarry] = useState(String(+(fundById("serra-re-spv")!.carryRate * 100).toFixed(2)));
  const [catchUp, setCatchUp] = useState("100");
  const [done, setDone] = useState(false);

  const f = fundById(fundId)!;
  const books = buildBooks(fundId);
  const partners = books.partners.filter((p) => p.commitment > 0);
  const m = (v: number, dec = 0) => money(v, f.currency, { decimals: dec });
  const proceeds = parseAmount(roc) + parseAmount(gain) + parseAmount(income);

  const contributions = books.journal
    .filter((je) => je.source === "Receipt")
    .map((je) => ({ date: je.date, amount: je.lines.filter((l) => l.account === "1000").reduce((a, l) => a + l.debit, 0) / 100 }));
  const prior = partners.reduce((a, p) => a + p.distributed, 0);

  const wf = runWaterfall({
    contributions,
    priorDistributions: prior,
    proceeds,
    date: payDate,
    hurdle: parseAmount(hurdle) / 100,
    carry: parseAmount(carry) / 100,
    catchUp: parseAmount(catchUp) / 100,
  });

  const lpCents = allocateCents(Math.round(wf.lp * 100), partners.map((p) => Math.round(p.commitment * 100)));
  const incomeShare = proceeds ? parseAmount(income) / proceeds : 0;
  const rows = partners.map((p, i) => {
    const gross = lpCents[i] / 100;
    const inv = investorById(p.investorId)!;
    const foreign = inv.taxForm !== "W-9";
    const wht = foreign ? gross * incomeShare * 0.3 : 0;
    return { p, inv, gross, wht, net: gross - wht, foreign };
  });

  const selectFund = (id: string) => {
    setFundId(id);
    setHurdle(String(+(fundById(id)!.hurdleRate * 100).toFixed(2)));
    setCarry(String(+(fundById(id)!.carryRate * 100).toFixed(2)));
  };

  if (done) {
    return (
      <div className="mx-auto max-w-[560px] py-20 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-gold-400">
          <CircleCheck size={22} strokeWidth={2} />
        </span>
        <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.015em]">Distribution submitted for approval</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-stone-600">
          {m(proceeds)} from {source}: {m(wf.lp)} to limited partners and {m(wf.gp)} carried interest to {f.gp}. Payment
          instructions are generated on approval.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/admin/fund/distributions">Back to distributions</ButtonLink>
        </div>
      </div>
    );
  }

  const maxTier = Math.max(...wf.tiers.map((t) => t.lp + t.gp), 1);

  const content = [
    <Panel key="0" title="Proceeds">
      <div className="grid gap-5 sm:grid-cols-2">
        <WField label="Vehicle">
          <select className={wizInput} value={fundId} onChange={(e) => selectFund(e.target.value)}>
            {funds.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </WField>
        <WField label="Payment date">
          <input type="date" className={wizInput} value={payDate} min={TODAY} onChange={(e) => setPayDate(e.target.value)} />
        </WField>
        <div className="sm:col-span-2">
          <WField label="Source">
            <input className={wizInput} value={source} onChange={(e) => setSource(e.target.value)} />
          </WField>
        </div>
      </div>
      <div className="mt-6 text-[12px] font-semibold">Character of proceeds</div>
      <div className="mt-2 grid gap-4 sm:grid-cols-3">
        <WField label="Return of cost" hint="Reduces investments at cost">
          <input className={`${wizInput} num text-right`} value={roc} onChange={(e) => setRoc(e.target.value)} />
        </WField>
        <WField label="Realized gain">
          <input className={`${wizInput} num text-right`} value={gain} onChange={(e) => setGain(e.target.value)} />
        </WField>
        <WField label="Income" hint="Dividends, interest, yield">
          <input className={`${wizInput} num text-right`} value={income} onChange={(e) => setIncome(e.target.value)} />
        </WField>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="text-[14px] font-semibold">Distributable proceeds</span>
        <span className="num text-[18px] font-medium">{m(proceeds)}</span>
      </div>
    </Panel>,

    <div key="1" className="space-y-4">
      <Panel title="Waterfall terms">
        <div className="grid gap-4 sm:grid-cols-3">
          <WField label="Preferred return (%)" hint="Compounded annually">
            <input className={`${wizInput} num`} value={hurdle} onChange={(e) => setHurdle(e.target.value)} />
          </WField>
          <WField label="Carried interest (%)">
            <input className={`${wizInput} num`} value={carry} onChange={(e) => setCarry(e.target.value)} />
          </WField>
          <WField label="GP catch-up (%)" hint="100 = full catch-up">
            <input className={`${wizInput} num`} value={catchUp} onChange={(e) => setCatchUp(e.target.value)} />
          </WField>
        </div>
        <p className="mt-4 text-[12px] text-stone-500">
          European (whole-of-fund) waterfall. Contributed capital {m(wf.capital)} from {contributions.length} receipts; prior
          distributions {m(prior)}; preferred return accrued to {date(payDate)}: {m(wf.prefAccrued)}.
        </p>
      </Panel>
      <Panel title="Waterfall result" flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th className="w-[38%]" />
              <th className="r">Limited partners</th>
              <th className="r">General partner</th>
              <th className="r">Total</th>
            </tr>
          </thead>
          <tbody>
            {wf.tiers.map((t, i) => (
              <tr key={t.key}>
                <td>
                  <span className="num mr-2 text-stone-400">{i + 1}</span>
                  <span className="font-semibold">{t.name}</span>
                </td>
                <td>
                  <div className="flex h-2.5 w-full">
                    <div className="h-full bg-ink-900" style={{ width: `${(t.lp / maxTier) * 100}%` }} />
                    <div className="h-full bg-gold-400" style={{ width: `${(t.gp / maxTier) * 100}%` }} />
                  </div>
                </td>
                <td className="num r">{m(t.lp)}</td>
                <td className="num r">{m(t.gp)}</td>
                <td className="num r">{m(t.lp + t.gp)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Total</td>
              <td className="num r">{m(wf.lp)}</td>
              <td className="num r">{m(wf.gp)}</td>
              <td className="num r">{m(wf.lp + wf.gp)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="flex gap-5 border-t border-stone-100 px-5 py-3 text-[12px] text-stone-600">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-ink-900" /> Limited partners
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-gold-400" /> General partner (carried interest)
          </span>
        </div>
      </Panel>
    </div>,

    <Panel key="2" flush title="Partner allocation">
      <table className="data-table">
        <thead>
          <tr>
            <th>Limited partner</th>
            <th>Tax form</th>
            <th className="r">Share</th>
            <th className="r">Gross</th>
            <th className="r">Withholding (est.)</th>
            <th className="r">Net payable</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p.investorId}>
              <td className="font-semibold">{r.inv.name}</td>
              <td className="font-mono text-[12px] text-stone-600">{r.inv.taxForm}</td>
              <td className="num r text-stone-600">{pct(r.p.commitment / partners.reduce((a, p) => a + p.commitment, 0), 2)}</td>
              <td className="num r">{m(r.gross, 2)}</td>
              <td className={cx("num r", r.wht ? "text-caution" : "text-stone-400")}>{r.wht ? m(r.wht, 2) : "—"}</td>
              <td className="num r font-semibold">{m(r.net, 2)}</td>
            </tr>
          ))}
          <tr>
            <td className="font-semibold">{f.gp}</td>
            <td className="text-[12px] text-stone-500">Carried interest</td>
            <td />
            <td className="num r">{m(wf.gp, 2)}</td>
            <td className="num r text-stone-400">—</td>
            <td className="num r font-semibold">{m(wf.gp, 2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total</td>
            <td className="num r">{m(proceeds, 2)}</td>
            <td className="num r">{m(rows.reduce((a, r) => a + r.wht, 0), 2)}</td>
            <td className="num r">{m(proceeds - rows.reduce((a, r) => a + r.wht, 0), 2)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">
        Withholding estimated at 30% on the income portion for partners documented on W-8 forms; treaty rates are applied by tax
        review before payment.
      </p>
    </Panel>,

    <div key="3" className="space-y-4">
      <Panel title="Summary">
        <KeyValue
          items={[
            ["Vehicle", f.name],
            ["Payment date", date(payDate)],
            ["Source", source],
            ["Proceeds", m(proceeds)],
            ["To limited partners", m(wf.lp)],
            ["Carried interest", m(wf.gp)],
            ["Partners paid", String(rows.length)],
            ["Withholding (est.)", m(rows.reduce((a, r) => a + r.wht, 0))],
          ]}
        />
      </Panel>
      <Panel title="Entries that will post on payment">
        <ul className="space-y-1.5 font-mono text-[12px] text-ink-800">
          <li>Dr 1000 Cash {m(proceeds, 2)} / Cr 1100 Investments at cost {m(parseAmount(roc), 2)}</li>
          <li className="pl-[11.5ch]">Cr 4100 Realized gain {m(parseAmount(gain), 2)}{parseAmount(income) ? ` · Cr 4000 Investment income ${m(parseAmount(income), 2)}` : ""}</li>
          <li>Dr 3100 Partners&apos; distributions (per partner) {m(wf.lp, 2)} · Dr carried interest {m(wf.gp, 2)} / Cr 1000 Cash {m(proceeds, 2)}</li>
        </ul>
      </Panel>
    </div>,
  ];

  return (
    <WizardShell
      back="/admin/fund/distributions"
      backLabel="Distributions"
      eyebrow={f.name}
      title="New distribution"
      steps={["Proceeds", "Waterfall", "Allocation", "Review & approve"]}
      step={step}
      setStep={setStep}
      canContinue={proceeds > 0}
      finalLabel="Submit for approval"
      onFinish={() => setDone(true)}
      aside={
        <Panel title="Split">
          <div className="flex h-3 w-full overflow-hidden rounded-[2px]">
            <div className="bg-ink-900" style={{ width: `${(wf.lp / Math.max(proceeds, 1)) * 100}%` }} />
            <div className="bg-gold-400" style={{ width: `${(wf.gp / Math.max(proceeds, 1)) * 100}%` }} />
          </div>
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-stone-500">Limited partners</dt>
              <dd className="num font-medium">{m(wf.lp)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">General partner</dt>
              <dd className="num font-medium">{m(wf.gp)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2">
              <dt className="text-stone-500">Carry as % of proceeds</dt>
              <dd className="num font-medium">{pct(proceeds ? wf.gp / proceeds : 0)}</dd>
            </div>
          </dl>
        </Panel>
      }
    >
      {content[step]}
    </WizardShell>
  );
}
