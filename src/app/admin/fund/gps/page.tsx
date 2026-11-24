import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ButtonLink, PageHeader, Status } from "@/components/ui";
import { GpLogo } from "@/components/brand/GpLogo";
import { gps } from "@/lib/gps";
import { gpTotals } from "@/lib/gpData";
import { date, moneyShort } from "@/lib/format";

export const metadata: Metadata = { title: "GPs" };

export default function GpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="GPs"
        description="Fund managers Aurum administers for. Each GP has its own white-labeled portal, and its investors see the GP’s brand on every screen, notice and report."
        actions={
          <ButtonLink href="/admin/fund/gps/new">
            <Plus size={14} strokeWidth={2} /> New GP client
          </ButtonLink>
        }
      />
      <div className="grid gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card md:grid-cols-2 xl:grid-cols-3">
        {gps.map((g) => {
          const t = gpTotals(g.id);
          return (
            <Link key={g.id} href={`/admin/fund/gps/${g.id}`} className="group flex flex-col bg-white p-6 hover:bg-stone-25">
              <div className="flex h-[60px] items-center justify-between gap-4">
                <GpLogo gp={g} height={g.logo && g.logo.width / g.logo.height < 3 ? 52 : 28} />
                <Status value={g.status === "Live" ? "Clear" : "In progress"} />
              </div>
              <div className="mt-5 text-[14px] font-semibold">{g.name}</div>
              <div className="font-mono text-[11px] text-stone-500">{g.customDomain ?? g.portalDomain}</div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-stone-100 pt-4">
                {[
                  ["Funds", String(t.funds)],
                  ["Investors", String(t.investors)],
                  ["NAV", t.funds ? moneyShort(t.nav) : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">{k}</dt>
                    <dd className="num mt-0.5 text-[16px] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.brand.primary }} />
                Client since {date(g.clientSince)}
                {g.sample && <span className="ml-auto text-stone-400">Sample client</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
