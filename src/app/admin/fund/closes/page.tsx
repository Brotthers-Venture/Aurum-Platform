import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader, Panel, Status } from "@/components/ui";
import { buildBooks } from "@/lib/accounting/engine";
import { EQUALIZATION_RATE } from "@/lib/accounting/schedules";
import { fundById, funds, investorById, onboarding } from "@/lib/data";
import { date, money, pct } from "@/lib/format";

export const metadata: Metadata = { title: "Closes & equalization" };

/** Preview of the Atlântico second close using subscriptions approved or countersigned in onboarding. */
function upcomingClose() {
  const fundId = "atlantico-vp-ii";
  const closeDate = "2026-12-18";
  const books = buildBooks(fundId);
  const existing = books.partners;
  const incoming = onboarding.filter((o) => o.fundId === fundId && (o.status === "Approved" || o.status === "Countersigned"));
  const totalCommit = existing.reduce((a, p) => a + p.commitment, 0) + incoming.reduce((a, o) => a + o.commitment, 0);
  const priorCalled = existing.reduce((a, p) => a + p.called, 0);
  const funded = books.calls.filter((c) => c.status === "Funded");
  const rows = incoming.map((o) => {
    const share = o.commitment / totalCommit;
    const principal = priorCalled * share;
    const interest = funded.reduce((a, c) => a + c.amount * share * EQUALIZATION_RATE * ((Date.parse(closeDate) - Date.parse(c.dueDate)) / 86_400_000 / 365), 0);
    return { o, principal, interest };
  });
  const refunds = existing.map((p) => ({ p, refund: p.called - (priorCalled * p.commitment) / totalCommit }));
  return { fund: fundById(fundId)!, closeDate, rows, refunds, totalCommit, priorCalled };
}

export default function ClosesPage() {
  const history = funds.flatMap((f) => buildBooks(f.id).equalizations.map((e) => ({ e, f })));
  const up = upcomingClose();
  const mu = (v: number) => money(v, "USD", { decimals: 2 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounting"
        title="Closes & equalization"
        description={`Investors admitted at a later close contribute their share of capital already called, plus interest at ${pct(
          EQUALIZATION_RATE,
          0,
        )} per year from each call’s due date. Existing partners are refunded the excess, so every partner ends the close at the same funded percentage.`}
      />

      <Panel
        title={
          <span className="flex items-center gap-3">
            Upcoming — {up.fund.name}, second close · {date(up.closeDate)}
            <Status value="Scheduled" />
          </span>
        }
        flush
      >
        <div className="flex gap-3 border-b border-stone-100 bg-stone-25 px-5 py-3 text-[12px] text-stone-600">
          <Info size={14} strokeWidth={1.8} className="mt-px shrink-0" />
          Preview using subscriptions currently Approved or Countersigned in onboarding. Updates automatically as investors are accepted.
        </div>
        <div className="grid gap-px bg-stone-100 lg:grid-cols-2">
          <div className="bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Incoming partner</th>
                  <th className="r">Commitment</th>
                  <th className="r">Equalization</th>
                  <th className="r">Interest</th>
                </tr>
              </thead>
              <tbody>
                {up.rows.map((r) => (
                  <tr key={r.o.id}>
                    <td className="font-semibold">{r.o.investorName}</td>
                    <td className="num r">{mu(r.o.commitment)}</td>
                    <td className="num r">{mu(r.principal)}</td>
                    <td className="num r">{mu(r.interest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Existing partner</th>
                  <th className="r">Refund of excess</th>
                </tr>
              </thead>
              <tbody>
                {up.refunds.map((r) => (
                  <tr key={r.p.investorId}>
                    <td className="font-semibold">{investorById(r.p.investorId)?.name}</td>
                    <td className="num r">{mu(r.refund)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="num border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">
          Capital called before close {mu(up.priorCalled)} · commitments after close {mu(up.totalCommit)} · funded after close{" "}
          {pct(up.priorCalled / up.totalCommit)}
        </div>
      </Panel>

      <h2 className="eyebrow pt-2">Completed closes</h2>
      {history.map(({ e, f }) => {
        const m = (v: number) => money(v, f.currency, { decimals: 2 });
        return (
          <Panel
            key={f.id + e.closeDate}
            title={
              <span className="flex items-center gap-3">
                {f.name} · {date(e.closeDate)}
                <Status value="Posted" />
              </span>
            }
            flush
          >
            <div className="grid gap-px bg-stone-100 lg:grid-cols-2">
              <div className="bg-white">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Incoming partner</th>
                      <th className="r">Commitment</th>
                      <th className="r">Equalization</th>
                      <th className="r">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.incoming.map((r) => (
                      <tr key={r.investorId}>
                        <td className="font-semibold">{investorById(r.investorId)?.name}</td>
                        <td className="num r">{m(r.commitment)}</td>
                        <td className="num r">{m(r.principal)}</td>
                        <td className="num r">{m(r.interest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Existing partner</th>
                      <th className="r">Refund of excess</th>
                      <th className="r">Interest received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.refunds.map((r) => (
                      <tr key={r.investorId}>
                        <td className="font-semibold">{investorById(r.investorId)?.name}</td>
                        <td className="num r">{m(r.amount)}</td>
                        <td className="num r">{m(r.interestShare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="num border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">
              Capital called before close {m(e.priorCalled)} · rate {pct(e.rate, 0)} simple · posted to the general ledger as equalization entries
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
