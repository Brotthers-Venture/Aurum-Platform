import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, LineChart } from "lucide-react";
import { funds } from "@/lib/data";
import { gpById } from "@/lib/gps";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Reports" };

const reports = [
  ["Investor reporting", [
    ["Capital account statements", "Quarterly partner statements with contributions, distributions, fees and allocated P&L."],
    ["Quarterly investor report", "Fund-level narrative, portfolio summary and performance metrics."],
    ["ILPA reporting template", "Fees, expenses and carried interest in the ILPA standard format."],
  ]],
  ["Fund accounting", [
    ["Trial balance", "General ledger balances by vehicle and period."],
    ["Schedule of investments", "Cost, fair value and unrealized gain by holding."],
    ["Management fee calculation", "Fee basis, offsets and partner-level allocation."],
  ]],
  ["Regulatory & tax", [
    ["Schedule K-1 package", "Partner-level tax reporting for US vehicles."],
    ["FATCA / CRS report", "Reportable account holders by jurisdiction."],
    ["Informe CVM", "Periodic reporting for Brazilian FIPs, with MF Pepper."],
  ]],
] as const;

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Records"
        title="Reports"
        actions={
          <Link href="/admin/fund/analytics" className="inline-flex h-9 items-center gap-2 rounded-[3px] border border-stone-300 bg-white px-4 text-[13px] font-semibold hover:border-ink-900">
            <LineChart size={14} /> Analytics
          </Link>
        }
      />
      <section>
        <h2 className="eyebrow mb-3">Quarterly investor reports</h2>
        <div className="grid gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card md:grid-cols-3">
          {funds.map((f) => (
            <Link key={f.id} href={`/report/${f.id}`} className="group flex items-center gap-3 bg-white px-5 py-4 hover:bg-stone-50">
              <FileText size={16} className="shrink-0 text-stone-400 group-hover:text-ink-900" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink-900">{f.name}</span>
                <span className="block text-[12px] text-stone-500">{gpById(f.gpId)?.shortName}</span>
              </span>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-ink-900" />
            </Link>
          ))}
        </div>
      </section>
      {reports.map(([group, items]) => (
        <section key={group}>
          <h2 className="eyebrow mb-3">{group}</h2>
          <div className="grid gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card md:grid-cols-3">
            {items.map(([t, d]) => (
              <button key={t} className="group bg-white p-5 text-left hover:bg-stone-50">
                <div className="flex items-center justify-between text-[14px] font-semibold text-ink-900">
                  {t}
                  <ArrowRight size={14} strokeWidth={1.8} className="text-stone-300 group-hover:text-ink-900" />
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500">{d}</p>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
