import { accountByCode } from "@/lib/accounting/coa";
import type { JournalEntry } from "@/lib/accounting/engine";
import { investorById } from "@/lib/data";
import { date, money } from "@/lib/format";
import type { Currency } from "@/lib/data";

/** Journal entries with lines. Amounts arrive in cents from the engine. */
export function JournalTable({ entries, currency, compact }: { entries: JournalEntry[]; currency: Currency; compact?: boolean }) {
  const m = (v: number) => (v ? money(v / 100, currency, { decimals: 2 }) : "");
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th className="w-[110px]">Entry</th>
          {!compact && <th className="w-[110px]">Date</th>}
          <th>Account</th>
          <th>Partner</th>
          <th className="r">Debit</th>
          <th className="r">Credit</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((je) => {
          // collapse partner lines on large entries for readability
          const lines = je.lines;
          return [
            <tr key={je.id} className="bg-stone-25">
              <td className="font-mono text-[11px] text-stone-500">{je.id}</td>
              {!compact && <td className="num text-stone-600">{date(je.date)}</td>}
              <td colSpan={4} className="text-[12px] font-semibold text-ink-900">
                {je.memo}
                <span className="ml-2 font-normal text-stone-400">{je.source}</span>
              </td>
            </tr>,
            ...lines.map((l, i) => (
              <tr key={`${je.id}-${i}`}>
                <td />
                {!compact && <td />}
                <td className={l.credit ? "pl-8" : ""}>
                  <span className="font-mono text-[11px] text-stone-400">{l.account}</span>{" "}
                  <span className="text-ink-800">{accountByCode(l.account).name}</span>
                </td>
                <td className="text-[12px] text-stone-500">{l.partnerId ? investorById(l.partnerId)?.name : ""}</td>
                <td className="num r">{m(l.debit)}</td>
                <td className="num r">{m(l.credit)}</td>
              </tr>
            )),
          ];
        })}
      </tbody>
    </table>
  );
}
