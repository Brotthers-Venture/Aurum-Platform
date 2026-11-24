import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ButtonLink, PageHeader, Panel, Status } from "@/components/ui";
import { distributions, fundById } from "@/lib/data";
import { date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Distributions" };

export default function DistributionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Capital activity"
        title="Distributions"
        description="Waterfall-based distributions with partner-level allocation, withholding and payment instructions. Paid distributions are posted from the ledger."
        actions={
          <ButtonLink href="/admin/fund/distributions/new">
            <Plus size={14} strokeWidth={2} /> New distribution
          </ButtonLink>
        }
      />
      <Panel flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Payment date</th>
              <th>Vehicle</th>
              <th>Source</th>
              <th>Character</th>
              <th className="r">Gross amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {distributions.map((d) => {
              const f = fundById(d.fundId)!;
              return (
                <tr key={d.id} className="row-link">
                  <td className="num">{date(d.date)}</td>
                  <td className="font-semibold">{f.shortName}</td>
                  <td className="text-stone-600">{d.source}</td>
                  <td className="text-stone-600">{d.type}</td>
                  <td className="num r">{money(d.amount, f.currency)}</td>
                  <td>
                    <Status value={d.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
