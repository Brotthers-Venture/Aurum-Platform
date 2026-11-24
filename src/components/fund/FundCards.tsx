import { FundCard } from "@/components/fund/FundCard";
import { funds } from "@/lib/data";
import { moneyShort } from "@/lib/format";
import { gpById } from "@/lib/gps";
import { cardTerms, offeringFor } from "@/lib/offerings";

/** Offering cards for all vehicles, or one GP's. */
export function FundCards({ gpId, linkTo = "admin" }: { gpId?: string; linkTo?: "admin" | "report" }) {
  const list = funds.filter((f) => !gpId || f.gpId === gpId);
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {list.map((f) => {
        const gp = gpById(f.gpId)!;
        const o = offeringFor(f);
        return (
          <FundCard
            key={f.id}
            fund={f}
            gp={gp}
            offering={o}
            terms={cardTerms(f, o, f.targetSize ? moneyShort(f.targetSize, f.currency) : "—")}
            href={linkTo === "admin" ? `/admin/fund/funds/${f.id}` : `/report/${f.id}`}
          />
        );
      })}
    </div>
  );
}
