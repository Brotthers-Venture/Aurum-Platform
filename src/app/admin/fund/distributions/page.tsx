import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ButtonLink, PageHeader, Panel, Status } from "@/components/ui";
import { distributions, fundById } from "@/lib/data";
import { date, money } from "@/lib/format";
import { ByManager } from "@/components/fund/ByManager";
import { GpMark } from "@/components/brand/GpLogo";
import { gps } from "@/lib/gps";

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
      <ByManager
        noun={["distribution", "distributions"]}
        groups={[...gps]
          .sort((x, y) => x.shortName.localeCompare(y.shortName))
          .map((g) => {
            const list = distributions.filter((d) => fundById(d.fundId)!.gpId === g.id);
            return {
              id: g.id,
              name: g.shortName,
              mark: <GpMark gp={g} size={20} />,
              meta: `${list.length} ${list.length === 1 ? "distribution" : "distributions"}`,
              count: list.length,
              href: `/admin/fund/gps/${g.id}`,
              content: <DistTable list={list} />,
            };
          })}
      />
    </div>
  );
}

function DistTable({ list }: { list: typeof distributions }) {
  return (
    <Panel flush>
      <div className="overflow-x-auto">
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
            {list.map((d) => {
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
      </div>
    </Panel>
  );
}
