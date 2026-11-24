import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Panel, Progress, Status } from "@/components/ui";
import { fundById, onboarding } from "@/lib/data";
import { date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Subscriptions" };

export default function PortalSubscriptions() {
  const mine = onboarding.filter((o) => o.investorName === "Calloway Family Trust");
  const completed = [
    { fund: "Aurum Infrastructure Partners I, LP", amount: 15_000_000, date: "2023-09-29" },
    { fund: "Serra Real Estate Co-Invest SPV, Ltd.", amount: 8_000_000, date: "2024-06-01" },
    { fund: "Meridian Corporate Venture Fund, LP", amount: 5_000_000, date: "2024-11-30" },
  ];
  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">Calloway Family Trust</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">Subscriptions</h1>
      <p className="mt-1.5 text-[14px] text-stone-600">
        Your investor profile is saved once and reused across every subscription — you only confirm what has changed.
      </p>

      <h2 className="eyebrow mt-10 mb-3">In progress</h2>
      {mine.map((o) => (
        <Link
          key={o.id}
          href={`/subscribe/${o.fundId}`}
          className="group flex items-center gap-8 rounded-[4px] border border-stone-200 bg-white p-6 hover:border-ink-900"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold">{fundById(o.fundId)!.name}</span>
              <Status value={o.status} />
            </div>
            <div className="num mt-1 text-[13px] text-stone-500">
              {money(o.commitment)} commitment · invited {date(o.invitedOn)} · closes Dec 18, 2026
            </div>
          </div>
          <div className="w-[220px]">
            <Progress value={o.progress} />
            <div className="num mt-2 text-[12px] text-stone-500">{Math.round(o.progress * 100)}% complete</div>
          </div>
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            Continue <ArrowRight size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}

      <h2 className="eyebrow mt-10 mb-3">Completed</h2>
      <Panel flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th className="r">Commitment</th>
              <th>Accepted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {completed.map((c) => (
              <tr key={c.fund}>
                <td className="font-semibold">{c.fund}</td>
                <td className="num r">{money(c.amount)}</td>
                <td className="num text-stone-600">{date(c.date)}</td>
                <td>
                  <Status value="Countersigned" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </main>
  );
}
