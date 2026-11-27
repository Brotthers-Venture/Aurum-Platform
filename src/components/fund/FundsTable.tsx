import Link from "next/link";
import { Status } from "@/components/ui";
import { funds, fundTotals } from "@/lib/data";
import { moneyShort, multiple, pct } from "@/lib/format";

export function FundsTable({ gpId }: { gpId?: string } = {}) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Domicile</th>
            <th>Vintage</th>
            <th>Status</th>
            <th className="r">Commitments</th>
            <th className="r">Called</th>
            <th className="r">NAV</th>
            <th className="r">DPI</th>
            <th className="r">TVPI</th>
            <th className="r">LPs</th>
          </tr>
        </thead>
        <tbody>
          {funds
            .filter((f) => !gpId || f.gpId === gpId)
            .map((f) => {
              const t = fundTotals(f.id);
              return (
                <tr key={f.id} className="row-link">
                  <td>
                    <Link href={`/admin/fund/funds/${f.id}`} className="block">
                      <span className="block font-semibold text-ink-900">{f.name}</span>
                      <span className="block text-[12px] text-stone-500">
                        {f.strategy} · {f.currency}
                        {f.coAdministrator ? " · with MF Pepper" : ""}
                        {f.economicsPending ? " · economics pending LPA review" : ""}
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-stone-600">{f.domicile}</td>
                  <td className="num text-stone-600">{f.vintage}</td>
                  <td>
                    <Status value={f.status} />
                  </td>
                  <td className="num r">{moneyShort(t.commitment, f.currency)}</td>
                  <td className="num r">{pct(t.contributed / t.commitment, 0)}</td>
                  <td className="num r">{moneyShort(t.nav, f.currency)}</td>
                  <td className="num r">{multiple(t.dpi)}</td>
                  <td className="num r">{multiple(t.tvpi)}</td>
                  <td className="num r text-stone-600">{t.investors}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
