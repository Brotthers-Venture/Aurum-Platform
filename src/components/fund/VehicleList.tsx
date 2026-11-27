import Link from "next/link";
import { FundCover } from "@/components/fund/FundCard";
import { StatusPill } from "@/components/gp/GpKit";
import { funds, fundTotals } from "@/lib/data";
import { moneyShort, multiple, pct } from "@/lib/format";
import { gpById } from "@/lib/gps";
import { offeringFor } from "@/lib/offerings";

/** A manager's vehicles as compact rows: cover, name, status and the figures an administrator watches. */
export function VehicleList({ gpId }: { gpId: string }) {
  const gp = gpById(gpId)!;
  return (
    <ul className="divide-y divide-d-line-soft">
      {funds
        .filter((f) => f.gpId === gpId)
        .map((f) => {
          const t = fundTotals(f.id);
          const o = offeringFor(f);
          return (
            <li key={f.id}>
              <Link href={`/admin/fund/funds/${f.id}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-d-raise">
                <span className="relative flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[7px]">
                  <FundCover id={f.id} primary={gp.brand.primary} secondary={gp.brand.secondary} className="absolute inset-0 h-full w-full" />
                  <span className="relative text-[11px] font-semibold tracking-[0.04em] text-white drop-shadow">{o.code}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-d-text group-hover:underline">{f.name}</span>
                  <span className="block truncate text-[12px] text-d-text-3">
                    {f.strategy.split(" — ")[0]} · {f.domicile} · {f.vintage}
                  </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <StatusPill value={f.status} />
                </span>
                <span className="w-[96px] shrink-0 text-right">
                  <span className="num block text-[13px] text-d-text">{t.commitment ? moneyShort(t.commitment, f.currency) : "—"}</span>
                  <span className="block text-[11px] text-d-text-3">{t.commitment ? `${pct(t.contributed / t.commitment, 0)} called` : "No closings yet"}</span>
                </span>
                <span className="hidden w-[96px] shrink-0 text-right md:block">
                  <span className="num block text-[13px] text-d-text">{t.commitment ? moneyShort(t.nav, f.currency) : "—"}</span>
                  <span className="block text-[11px] text-d-text-3">{t.commitment ? `NAV · ${multiple(t.tvpi)}` : `${t.investors} investors`}</span>
                </span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
