import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ButtonLink, PageHeader, Panel } from "@/components/ui";
import { FundsTable } from "@/components/fund/FundsTable";
import { FundCards } from "@/components/fund/FundCards";
import { ByManager } from "@/components/fund/ByManager";
import { VehicleList } from "@/components/fund/VehicleList";
import { GpMark } from "@/components/brand/GpLogo";
import { fundTotals, toUSD } from "@/lib/data";
import { reportingRate } from "@/lib/fx-server";
import { fundsForGp } from "@/lib/gpData";
import { gps } from "@/lib/gps";
import { moneyShort } from "@/lib/format";

export const metadata: Metadata = { title: "Funds" };

/** Every vehicle the firm administers, organised by manager. */
export default async function FundsPage() {
  const fx = await reportingRate();
  const groups = [...gps]
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
    .map((g) => {
      const fs = fundsForGp(g.id);
      const committed = fs.reduce((a, f) => a + toUSD(fundTotals(f.id).commitment, f.currency, fx.rate), 0);
      const nav = fs.reduce((a, f) => a + toUSD(fundTotals(f.id).nav, f.currency, fx.rate), 0);
      return {
        id: g.id,
        name: g.shortName,
        mark: <GpMark gp={g} size={20} />,
        meta: `${fs.length} ${fs.length === 1 ? "vehicle" : "vehicles"}${committed ? ` · ${moneyShort(committed)} committed · ${moneyShort(nav)} NAV` : ""}`,
        count: fs.length,
        href: `/admin/fund/gps/${g.id}`,
        content: <VehicleList gpId={g.id} />,
        focus: <FundCards gpId={g.id} admin />,
        table: (
          <Panel flush>
            <FundsTable gpId={g.id} />
          </Panel>
        ),
      };
    });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Funds"
        description="Private funds, offshore vehicles and SPVs under administration, by manager. Totals in USD; BRL vehicles at the reporting rate."
        actions={
          <ButtonLink href="/admin/fund/funds/new">
            <Plus size={14} strokeWidth={2} /> New vehicle
          </ButtonLink>
        }
      />
      <ByManager groups={groups} noun={["vehicle", "vehicles"]} panels />
    </div>
  );
}
