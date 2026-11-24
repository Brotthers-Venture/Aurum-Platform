import type { Metadata } from "next";
import { Landmark, Link2 } from "lucide-react";
import { Button, PageHeader, Panel, Status } from "@/components/ui";
import { bankAccounts, fundById } from "@/lib/data";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Banking" };

export default function BankingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Banking"
        description="Fund bank accounts used for subscriptions, capital calls and distributions."
        actions={
          <Button>
            <Link2 size={14} strokeWidth={1.8} /> Connect account
          </Button>
        }
      />

      <div className="flex gap-4 rounded-[8px] border border-stone-200/70 bg-white shadow-card p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-stone-100">
          <Landmark size={18} strokeWidth={1.6} />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-semibold">Plaid connectivity</h2>
            <span className="rounded-[2px] border border-stone-300 px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
              Integration pending
            </span>
          </div>
          <p className="mt-1 max-w-[720px] text-[13px] leading-relaxed text-stone-600">
            Once connected, balances and transactions sync daily, incoming wires are matched to capital calls automatically,
            and investors can verify their distribution accounts through Plaid during onboarding. Until then, statements are
            uploaded manually.
          </p>
        </div>
        <Button variant="secondary" disabled className="self-center">
          Configure Plaid
        </Button>
      </div>

      <Panel flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Vehicle</th>
              <th>Institution</th>
              <th>Purpose</th>
              <th>Currency</th>
              <th>Connection</th>
              <th>Last statement</th>
            </tr>
          </thead>
          <tbody>
            {bankAccounts.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="font-semibold">{b.accountName}</div>
                  <div className="font-mono text-[11px] text-stone-500">•••• {b.mask}</div>
                </td>
                <td className="text-stone-600">{fundById(b.fundId)!.shortName}</td>
                <td className="text-stone-600">{b.institution}</td>
                <td className="text-stone-600">{b.type}</td>
                <td className="font-mono text-[12px]">{b.currency}</td>
                <td>
                  <Status value={b.connection} />
                </td>
                <td className="num text-stone-600">{date(b.lastStatement)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
