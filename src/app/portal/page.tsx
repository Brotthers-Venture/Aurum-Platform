import Link from "next/link";
import { reportingRate } from "@/lib/fx-server";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AurumLogo } from "@/components/brand/Logo";
import { GpLogo } from "@/components/brand/GpLogo";
import { PORTAL_INVESTOR_ID, capitalAccounts, fundById, investorById, toUSD } from "@/lib/data";
import { gpsForInvestor } from "@/lib/gpData";
import { moneyShort } from "@/lib/format";

export const metadata: Metadata = { title: "Your investment portals" };

/** Investors with several managers pick a portal; each opens in that manager’s brand. */
export default async function PortalChooser() {
  const fx = await reportingRate();
  const inv = investorById(PORTAL_INVESTOR_ID)!;
  const list = gpsForInvestor(inv.id, inv.name);
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[880px] items-center justify-between px-8">
          <AurumLogo variant="dark" height={34} priority />
          <Link href="/login" className="text-[12px] font-medium text-stone-500 hover:text-ink-900">
            Sign out
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[880px] px-8 py-14">
        <div className="eyebrow">{inv.name}</div>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em]">Your investment portals</h1>
        <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-stone-600">
          You invest with {list.length} managers administered by Aurum. Each manager has its own portal; choose one to continue.
        </p>
        <ul className="mt-10 space-y-3">
          {list.map((gp) => {
            const accts = capitalAccounts.filter((c) => c.investorId === inv.id && fundById(c.fundId)!.gpId === gp.id);
            const nav = accts.reduce((a, c) => a + toUSD(c.nav, fundById(c.fundId)!.currency, fx.rate), 0);
            const tall = gp.logo && gp.logo.width / gp.logo.height < 3;
            return (
              <li key={gp.id}>
                <Link
                  href={`/investor/${gp.id}`}
                  className="group flex items-center gap-8 rounded-[8px] border border-stone-200/70 bg-white shadow-card px-6 py-5 hover:border-ink-900"
                >
                  <span className="flex h-[52px] w-[200px] items-center">
                    <GpLogo gp={gp} height={tall ? 48 : 24} />
                  </span>
                  <span className="flex-1 text-[13px] text-stone-600">
                    {accts.length ? `${accts.length} fund${accts.length > 1 ? "s" : ""} · ${moneyShort(nav)} NAV` : "Subscription in progress"}
                  </span>
                  <ArrowRight size={16} className="text-stone-300 group-hover:text-ink-900" />
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
