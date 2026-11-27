"use client";

import { useMemo, useState } from "react";
import { CircleCheck, Download, TriangleAlert } from "lucide-react";
import { Button, PageHeader, Panel, cx } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { JournalTable } from "./JournalTable";
import { accountByCode, chartOfAccounts, isDebitNormal } from "@/lib/accounting/coa";
import { buildBooks, netAlloc, partnerNav, trialBalance, TODAY } from "@/lib/accounting/engine";
import { fundById, funds, investorById } from "@/lib/data";
import { date, money, pct } from "@/lib/format";

const periods = [
  { v: TODAY, l: "Today · Nov 24, 2026" },
  { v: "2026-09-30", l: "Q3 2026 · Sep 30, 2026" },
  { v: "2026-06-30", l: "Q2 2026 · Jun 30, 2026" },
  { v: "2026-03-31", l: "Q1 2026 · Mar 31, 2026" },
  { v: "2025-12-31", l: "FY 2025 · Dec 31, 2025" },
];

function StatementRow({ label, v, strong, indent, fmt }: { label: string; v: number; strong?: boolean; indent?: boolean; fmt: (v: number) => string }) {
  return (
    <div className={cx("flex justify-between border-b border-stone-100 py-2 text-[13px]", strong && "font-semibold", indent && "pl-4")}>
      <span className={strong ? "text-ink-900" : "text-stone-600"}>{label}</span>
      <span className="num">{fmt(v)}</span>
    </div>
  );
}

export function AccountingWorkspace() {
  const [fundId, setFundId] = useState("cordillera-infra-i");
  const [asOf, setAsOf] = useState(TODAY);
  const [source, setSource] = useState("All");
  const f = fundById(fundId)!;
  const books = buildBooks(fundId, asOf);
  const m = (v: number) => money(v, f.currency, { decimals: 2 });
  const tb = useMemo(() => trialBalance(books.journal), [books]);
  const yearStart = `${asOf.slice(0, 4)}-01-01`;
  const tbYtd = useMemo(() => trialBalance(books.journal, yearStart), [books, yearStart]);
  const bal = (rows: typeof tb, code: string) => rows.find((r) => r.account === code)?.balance ?? 0;

  const totalDr = tb.reduce((a, r) => a + Math.max(r.balance, 0), 0);
  const totalCr = tb.reduce((a, r) => a + Math.max(-r.balance, 0), 0);
  const inBalance = Math.abs(totalDr - totalCr) < 0.005;

  // Statements
  const assets = ["1000", "1100", "1150", "1200"].map((c) => [c, bal(tb, c)] as const);
  const totalAssets = assets.reduce((a, [, v]) => a + v, 0);
  const liabilities = -bal(tb, "2300");
  const pnl = (rows: typeof tb) => {
    const income = -bal(rows, "4000");
    const expenses = bal(rows, "5000") + bal(rows, "5100") + bal(rows, "5200");
    const realized = -bal(rows, "4100");
    const unrealized = -bal(rows, "4200");
    return { income, expenses, nii: income - expenses, realized, unrealized, net: income - expenses + realized + unrealized };
  };
  const itd = pnl(tb);
  const ytd = pnl(tbYtd);
  const contributions = -bal(tb, "3000");
  const distributionsTotal = bal(tb, "3100");
  const capital = contributions - distributionsTotal + itd.net;

  const partners = books.partners.filter((p) => p.commitment > 0 || p.called > 0);
  const partnerTotal = partners.reduce((a, p) => a + partnerNav(p), 0);
  const ties = Math.abs(partnerTotal - capital) < 0.05 && Math.abs(totalAssets - liabilities - capital) < 0.05;

  const sources = ["All", ...Array.from(new Set(books.journal.map((j) => j.source)))];
  const journal = books.journal
    .filter((j) => source === "All" || j.source === source)
    .slice()
    .reverse();

  const tbTab = (
    <Panel flush>
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-[80px]">Account</th>
            <th>Name</th>
            <th>Type</th>
            <th className="r">Debit</th>
            <th className="r">Credit</th>
          </tr>
        </thead>
        <tbody>
          {tb.map((r) => {
            const a = accountByCode(r.account);
            return (
              <tr key={r.account}>
                <td className="font-mono text-[12px]">{r.account}</td>
                <td className="font-medium">{a.name}</td>
                <td className="capitalize text-stone-500">{a.type}</td>
                <td className="num r">{r.balance > 0 ? m(r.balance) : ""}</td>
                <td className="num r">{r.balance < 0 ? m(-r.balance) : ""}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              <span className={cx("inline-flex items-center gap-1.5", inBalance ? "text-positive" : "text-negative")}>
                {inBalance ? <CircleCheck size={14} strokeWidth={2} /> : <TriangleAlert size={14} />} {inBalance ? "In balance" : "Out of balance"}
              </span>
            </td>
            <td className="num r">{m(totalDr)}</td>
            <td className="num r">{m(totalCr)}</td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  );

  const statements = (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title={`Statement of assets, liabilities and partners’ capital — ${date(asOf)}`}>
        <div className="eyebrow mb-1">Assets</div>
        {assets.map(([c, v]) => (
          <StatementRow fmt={m} key={c} label={accountByCode(c).name} v={v} indent />
        ))}
        <StatementRow fmt={m} label="Total assets" v={totalAssets} strong />
        <div className="eyebrow mb-1 mt-5">Liabilities</div>
        <StatementRow fmt={m} label="Equalization interest payable" v={liabilities} indent />
        <StatementRow fmt={m} label="Total liabilities" v={liabilities} strong />
        <div className="eyebrow mb-1 mt-5">Partners’ capital</div>
        <StatementRow fmt={m} label="Total partners’ capital" v={capital} strong />
        <StatementRow fmt={m} label="Total liabilities and partners’ capital" v={liabilities + capital} strong />
      </Panel>
      <div className="space-y-6">
        <Panel title="Statement of operations">
          <div className="grid grid-cols-[minmax(0,1fr)_130px_130px] border-b border-stone-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            <span />
            <span className="text-right">YTD {asOf.slice(0, 4)}</span>
            <span className="text-right">Inception to date</span>
          </div>
          {(
            [
              ["Investment income", ytd.income, itd.income, false],
              ["Management fees, fund and organizational expenses", -ytd.expenses, -itd.expenses, false],
              ["Net investment income (loss)", ytd.nii, itd.nii, true],
              ["Net realized gain on investments", ytd.realized, itd.realized, false],
              ["Net change in unrealized appreciation", ytd.unrealized, itd.unrealized, false],
              ["Net increase in partners’ capital from operations", ytd.net, itd.net, true],
            ] as const
          ).map(([l, y, i, s]) => (
            <div key={l} className={cx("grid grid-cols-[minmax(0,1fr)_130px_130px] border-b border-stone-100 py-2 text-[13px]", s && "font-semibold")}>
              <span className={s ? "" : "text-stone-600"}>{l}</span>
              <span className="num text-right">{m(y)}</span>
              <span className="num text-right">{m(i)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Statement of changes in partners’ capital (inception to date)">
          <StatementRow fmt={m} label="Capital contributions" v={contributions} />
          <StatementRow fmt={m} label="Distributions" v={-distributionsTotal} />
          <StatementRow fmt={m} label="Net increase from operations" v={itd.net} />
          <StatementRow fmt={m} label="Partners’ capital, end of period" v={capital} strong />
        </Panel>
      </div>
    </div>
  );

  const partnersTab = (
    <Panel flush>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th className="r">Commitment</th>
              <th className="r">Contributions</th>
              <th className="r">Distributions</th>
              <th className="r">Income</th>
              <th className="r">Realized</th>
              <th className="r">Unrealized</th>
              <th className="r">Fees & exp.</th>
              <th className="r">Ending capital</th>
              <th className="r">Ownership</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.investorId}>
                <td className="font-semibold">{investorById(p.investorId)?.name}</td>
                <td className="num r">{m(p.commitment)}</td>
                <td className="num r">{m(p.called)}</td>
                <td className="num r">{m(-p.distributed)}</td>
                <td className="num r">{m(p.alloc.income)}</td>
                <td className="num r">{m(p.alloc.realized)}</td>
                <td className="num r">{m(p.alloc.unrealized)}</td>
                <td className="num r">{m(p.alloc.fees + p.alloc.expenses + p.alloc.organizational)}</td>
                <td className="num r font-semibold">{m(partnerNav(p))}</td>
                <td className="num r text-stone-600">{pct(partnerTotal ? partnerNav(p) / partnerTotal : 0, 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="num r">{m(partners.reduce((a, p) => a + p.commitment, 0))}</td>
              <td className="num r">{m(partners.reduce((a, p) => a + p.called, 0))}</td>
              <td className="num r">{m(-partners.reduce((a, p) => a + p.distributed, 0))}</td>
              <td className="num r">{m(partners.reduce((a, p) => a + p.alloc.income, 0))}</td>
              <td className="num r">{m(partners.reduce((a, p) => a + p.alloc.realized, 0))}</td>
              <td className="num r">{m(partners.reduce((a, p) => a + p.alloc.unrealized, 0))}</td>
              <td className="num r">{m(partners.reduce((a, p) => a + p.alloc.fees + p.alloc.expenses + p.alloc.organizational, 0))}</td>
              <td className="num r">{m(partnerTotal)}</td>
              <td className="num r">100.00%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={cx("flex items-center gap-2 border-t border-stone-100 px-5 py-3 text-[12px]", ties ? "text-positive" : "text-negative")}>
        {ties ? <CircleCheck size={14} strokeWidth={2} /> : <TriangleAlert size={14} />}
        Partner subledger {ties ? "ties" : "does not tie"} to the general ledger: {m(partnerTotal)} vs {m(capital)}. Allocated net income{" "}
        {m(partners.reduce((a, p) => a + netAlloc(p.alloc), 0))}.
      </div>
    </Panel>
  );

  const journalTab = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={cx(
              "h-7 rounded-[3px] border px-2.5 text-[12px] font-medium",
              source === s ? "border-gold-500 bg-champagne text-ink-900" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400",
            )}
          >
            {s}
          </button>
        ))}
        <span className="num ml-auto self-center text-[12px] text-stone-500">{journal.length} entries</span>
      </div>
      <Panel flush>
        <JournalTable entries={journal.slice(0, 40)} currency={f.currency} />
        {journal.length > 40 && <p className="border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">Showing the 40 most recent entries.</p>}
      </Panel>
    </div>
  );

  const coaTab = (
    <Panel flush>
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-[80px]">Code</th>
            <th>Account</th>
            <th>Type</th>
            <th>Normal balance</th>
            <th>Partner-level</th>
          </tr>
        </thead>
        <tbody>
          {chartOfAccounts.map((a) => (
            <tr key={a.code}>
              <td className="font-mono text-[12px]">{a.code}</td>
              <td className="font-medium">{a.name}</td>
              <td className="capitalize text-stone-600">{a.type}</td>
              <td className="text-stone-600">{isDebitNormal(a.code) ? "Debit" : "Credit"}</td>
              <td className="text-stone-600">{a.partner ? "Yes — tagged by partner" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounting"
        title="General ledger"
        description="Double-entry books for each vehicle. Every figure on the platform — capital accounts, NAV, calls and distributions — is derived from these entries."
        actions={
          <Button variant="secondary">
            <Download size={14} strokeWidth={1.8} /> Export to Excel
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <select value={fundId} onChange={(e) => setFundId(e.target.value)} className="h-9 rounded-[3px] border border-stone-300 bg-white px-3 text-[13px] font-semibold">
          {funds.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <select value={asOf} onChange={(e) => setAsOf(e.target.value)} className="h-9 rounded-[3px] border border-stone-300 bg-white px-3 text-[13px]">
          {periods.map((p) => (
            <option key={p.v} value={p.v}>
              As of {p.l}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-stone-500">Base currency {f.currency}</span>
        <span className={cx("ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold", inBalance && ties ? "text-positive" : "text-negative")}>
          {inBalance && ties ? <CircleCheck size={14} strokeWidth={2} /> : <TriangleAlert size={14} />}
          {inBalance && ties ? "Books in balance · subledger ties" : "Review required"}
        </span>
      </div>
      <Tabs
        tabs={[
          { id: "tb", label: "Trial balance", content: tbTab },
          { id: "fs", label: "Financial statements", content: statements },
          { id: "pc", label: "Partners’ capital", count: partners.length, content: partnersTab },
          { id: "je", label: "Journal", count: books.journal.length, content: journalTab },
          { id: "coa", label: "Chart of accounts", content: coaTab },
        ]}
      />
    </div>
  );
}
