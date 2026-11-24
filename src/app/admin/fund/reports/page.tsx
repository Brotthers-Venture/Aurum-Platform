import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
      <PageHeader eyebrow="Records" title="Reports" description="Standard report packages. Each runs for a selected vehicle and period." />
      {reports.map(([group, items]) => (
        <section key={group}>
          <h2 className="eyebrow mb-3">{group}</h2>
          <div className="grid gap-px overflow-hidden rounded-[4px] border border-stone-200 bg-stone-200 md:grid-cols-3">
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
