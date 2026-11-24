import type { Metadata } from "next";
import { fxLabel, reportingRate } from "@/lib/fx-server";
import { InvestorsView, type MasterRow, type Vehicle } from "@/components/fund/InvestorsView";
import { gpById } from "@/lib/gps";
import { Download, UserPlus } from "lucide-react";
import { Button, ButtonLink, PageHeader, Panel, Status } from "@/components/ui";
import { capitalAccounts, fundById, funds, investorById, investors, profileChangeRequests, toUSD } from "@/lib/data";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Investors" };

export default async function InvestorsPage() {
  const fx = await reportingRate();
  const vehicles: Vehicle[] = funds.map((f) => ({
    id: f.id,
    name: f.name,
    shortName: f.shortName,
    currency: f.currency,
    gp: gpById(f.gpId)?.shortName ?? f.gp,
    status: f.status,
    rows: capitalAccounts
      .filter((c) => c.fundId === f.id)
      .map((c) => {
        const inv = investorById(c.investorId)!;
        return { investorId: inv.id, name: inv.name, contact: inv.contact, type: inv.type, kyc: inv.kyc, closeDate: c.closeDate, commitment: c.commitment, called: c.called, unfunded: c.unfunded, distributed: c.distributed, nav: c.nav };
      }),
  }));
  const master: MasterRow[] = investors
    .map((inv) => {
      const accts = capitalAccounts.filter((c) => c.investorId === inv.id);
      return {
        id: inv.id,
        name: inv.name,
        contact: inv.contact,
        type: inv.type,
        jurisdiction: inv.jurisdiction,
        taxForm: inv.taxForm,
        kyc: inv.kyc,
        rm: inv.relationshipManager,
        vehicles: accts.map((a) => fundById(a.fundId)!.shortName),
        commitmentUsd: accts.reduce((a, c) => a + toUSD(c.commitment, fundById(c.fundId)!.currency, fx.rate), 0),
        navUsd: accts.reduce((a, c) => a + toUSD(c.nav, fundById(c.fundId)!.currency, fx.rate), 0),
      };
    })
    .sort((a, b) => b.commitmentUsd - a.commitmentUsd);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Investors"
        description="Investor master records shared across every vehicle. One profile, many commitments."
        actions={
          <>
            <Button variant="secondary">
              <Download size={14} strokeWidth={1.8} /> Export
            </Button>
            <ButtonLink href="/admin/fund/onboarding">
              <UserPlus size={14} strokeWidth={1.8} /> Invite investor
            </ButtonLink>
          </>
        }
      />
      <InvestorsView vehicles={vehicles} master={master} fxNote={`Vehicle registers in fund currency · totals by investor in USD, ${fxLabel(fx)}`} />
      <Panel
        title="Profile change requests"
        actions={<span className="text-stone-500">Submitted by investors from the portal</span>}
        flush
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Investor</th>
              <th>Change</th>
              <th>From</th>
              <th>To</th>
              <th>Control</th>
              <th>Submitted</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {profileChangeRequests.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{investorById(r.investorId)?.name}</td>
                <td>{r.field}</td>
                <td className="text-[12px] text-stone-500">{r.from}</td>
                <td className="text-[12px] text-ink-900">{r.to}</td>
                <td className="text-[12px] text-stone-600">{r.control}</td>
                <td className="num text-stone-600">
                  {date(r.submitted)}
                  <div className="text-[11px] text-stone-400">{r.submittedBy}</div>
                </td>
                <td>
                  <Status value={r.status} />
                </td>
                <td className="r">
                  {r.status === "Pending review" && (
                    <Button size="sm" variant="secondary">
                      Review
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
