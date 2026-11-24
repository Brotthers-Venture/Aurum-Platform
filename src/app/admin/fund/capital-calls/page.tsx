import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button, PageHeader, Panel, Progress, Stat, StatRow, Status } from "@/components/ui";
import { capitalCalls, fundById, toUSD } from "@/lib/data";
import { date, money, moneyShort } from "@/lib/format";

export const metadata: Metadata = { title: "Capital calls" };

export default function CapitalCallsPage() {
  const open = capitalCalls.filter((c) => c.status !== "Funded");
  const outstanding = open.reduce((a, c) => a + toUSD(c.amount - c.received, fundById(c.fundId)!.currency), 0);
  const ytd = capitalCalls
    .filter((c) => c.noticeDate.startsWith("2026") && c.status !== "Draft")
    .reduce((a, c) => a + toUSD(c.amount, fundById(c.fundId)!.currency), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Capital activity"
        title="Capital calls"
        description="Draft, approve and issue capital calls. Allocations follow each partner’s pro-rata unfunded commitment; receipts are matched against the fund bank account."
        actions={
          <Button>
            <Plus size={14} strokeWidth={2} /> New capital call
          </Button>
        }
      />
      <StatRow cols={4}>
          <Stat label="Open calls" value={open.length} sub="Draft, issued or partially funded" />
          <Stat label="Outstanding" value={moneyShort(outstanding)} sub="USD equivalent" />
          <Stat label="Called 2026 YTD" value={moneyShort(ytd)} sub="USD equivalent" />
          <Stat label="Next due" value="Dec 1" sub="Infrastructure Partners I · No. 7" />
        </StatRow>
      <Panel flush>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Call</th>
                <th>Purpose</th>
                <th>Notice date</th>
                <th>Due date</th>
                <th className="r">Amount</th>
                <th className="w-[150px]">Funded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {capitalCalls.map((c) => {
                const f = fundById(c.fundId)!;
                return (
                  <tr key={c.id} className="row-link">
                    <td className="font-semibold">{f.shortName}</td>
                    <td className="num">No. {c.number}</td>
                    <td className="max-w-[300px] text-stone-600">{c.purpose}</td>
                    <td className="num text-stone-600">{date(c.noticeDate)}</td>
                    <td className="num text-stone-600">{date(c.dueDate)}</td>
                    <td className="num r">{money(c.amount, f.currency)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={c.received / c.amount} />
                        <span className="num w-9 text-right text-[12px] text-stone-500">{Math.round((c.received / c.amount) * 100)}%</span>
                      </div>
                    </td>
                    <td>
                      <Status value={c.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
