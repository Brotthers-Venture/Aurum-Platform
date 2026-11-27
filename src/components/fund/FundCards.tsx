import { FundCard } from "@/components/fund/FundCard";
import { funds, fundTotals } from "@/lib/data";
import { moneyShort, multiple, pct } from "@/lib/format";
import { gpById } from "@/lib/gps";
import { cardTerms, offeringFor } from "@/lib/offerings";

/**
 * Cards for all vehicles, or one GP's. `admin` shows what an administrator watches (status, commitments, called,
 * NAV, investors) on compact cards; otherwise the offering terms an investor would see.
 */
export function FundCards({ gpId, linkTo = "admin", admin }: { gpId?: string; linkTo?: "admin" | "report"; admin?: boolean }) {
  const list = funds.filter((f) => !gpId || f.gpId === gpId);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {list.map((f) => {
        const gp = gpById(f.gpId)!;
        const o = offeringFor(f);
        const t = fundTotals(f.id);
        const terms: [string, string][] = admin
          ? [
              ["Status", f.status],
              ["Commitments", t.commitment ? moneyShort(t.commitment, f.currency) : "—"],
              ["Called", t.commitment ? pct(t.contributed / t.commitment, 0) : "—"],
              ["NAV · TVPI", t.commitment ? `${moneyShort(t.nav, f.currency)} · ${multiple(t.tvpi)}` : "—"],
              ["Investors", String(t.investors)],
            ]
          : cardTerms(f, o, f.targetSize ? moneyShort(f.targetSize, f.currency) : "—");
        return <FundCard key={f.id} fund={f} gp={gp} offering={o} compact={admin} terms={terms} href={linkTo === "admin" ? `/admin/fund/funds/${f.id}` : `/report/${f.id}`} />;
      })}
    </div>
  );
}
