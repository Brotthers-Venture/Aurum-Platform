import type { Metadata } from "next";
import { Download, UserPlus } from "lucide-react";
import { Avatar, Button, ButtonLink, PageHeader, Panel, Status } from "@/components/ui";
import { capitalAccounts, fundById, investorById, investors, profileChangeRequests, toUSD } from "@/lib/data";
import { date, initials, moneyShort } from "@/lib/format";

export const metadata: Metadata = { title: "Investors" };

export default function InvestorsPage() {
  const rows = investors
    .map((inv) => {
      const accts = capitalAccounts.filter((c) => c.investorId === inv.id);
      const commitment = accts.reduce((a, c) => a + toUSD(c.commitment, fundById(c.fundId)!.currency), 0);
      const nav = accts.reduce((a, c) => a + toUSD(c.nav, fundById(c.fundId)!.currency), 0);
      return { inv, accts, commitment, nav };
    })
    .sort((a, b) => b.commitment - a.commitment);

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
      <div className="flex flex-wrap items-center gap-2">
        {["All types", "Institutional", "Individuals & trusts", "Non-US"].map((f, i) => (
          <button
            key={f}
            className={`h-8 rounded-[3px] border px-3 text-[12px] font-medium ${
              i === 0 ? "border-ink-900 bg-ink-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="num ml-auto text-[12px] text-stone-500">{investors.length} investors</span>
      </div>
      <Panel flush>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Type</th>
                <th>Jurisdiction</th>
                <th>Tax form</th>
                <th>KYC / AML</th>
                <th>Vehicles</th>
                <th className="r">Commitments (USD)</th>
                <th className="r">NAV (USD)</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ inv, accts, commitment, nav }) => (
                <tr key={inv.id} className="row-link">
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar label={initials(inv.name)} />
                      <div>
                        <div className="font-semibold text-ink-900">{inv.name}</div>
                        <div className="text-[12px] text-stone-500">{inv.contact}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-stone-600">{inv.type}</td>
                  <td className="text-stone-600">{inv.jurisdiction}</td>
                  <td className="font-mono text-[12px] text-stone-600">{inv.taxForm}</td>
                  <td>
                    <Status value={inv.kyc} />
                  </td>
                  <td className="text-stone-600">
                    <span className="num">{accts.length}</span>
                    <span className="ml-1 text-[12px] text-stone-400">
                      {accts.map((a) => fundById(a.fundId)!.shortName.split(" ")[0]).join(", ")}
                    </span>
                  </td>
                  <td className="num r">{moneyShort(commitment)}</td>
                  <td className="num r">{moneyShort(nav)}</td>
                  <td className="text-stone-600">{inv.relationshipManager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
