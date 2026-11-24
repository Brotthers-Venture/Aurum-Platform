import type { Metadata } from "next";
import { ArrowRight, Check, Plus } from "lucide-react";
import { Button, PageHeader, Panel, Status } from "@/components/ui";
import { JournalTable } from "@/components/fund/JournalTable";
import { buildBooks } from "@/lib/accounting/engine";
import { funds, investorById } from "@/lib/data";
import { date, money, pct } from "@/lib/format";

export const metadata: Metadata = { title: "Transfers" };

const stages = ["Requested", "GP consent", "Documentation", "Completed"] as const;

export default function TransfersPage() {
  const transfers = funds.flatMap((f) => buildBooks(f.id).transfers.map((t) => ({ t, f, books: buildBooks(f.id) })));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounting"
        title="Transfers"
        description="Secondary transfers of partnership interests. On completion the transferor’s commitment, contributions, distributions and allocated income move to the transferee, and a reclassification entry posts to the ledger."
        actions={
          <Button>
            <Plus size={14} strokeWidth={2} /> New transfer
          </Button>
        }
      />
      {transfers.map(({ t, f, books }) => {
        const reached = stages.indexOf(t.status);
        const entry = books.journal.find((j) => j.ref === t.id);
        const m = (v: number) => money(v, f.currency);
        return (
          <Panel
            key={t.id}
            title={
              <span className="flex items-center gap-3">
                {f.name}
                <Status value={t.status} />
              </span>
            }
            actions={<span className="font-mono text-[11px] text-stone-400">{t.id.toUpperCase()}</span>}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 rounded-[3px] border border-stone-200 p-4">
                    <div className="eyebrow">Transferor</div>
                    <div className="mt-1 text-[15px] font-semibold">{investorById(t.from)?.name}</div>
                  </div>
                  <div className="text-center">
                    <div className="num text-[18px] font-medium">{pct(t.fraction, 0)}</div>
                    <ArrowRight size={18} className="mx-auto text-stone-400" />
                  </div>
                  <div className="flex-1 rounded-[3px] border border-stone-200 p-4">
                    <div className="eyebrow">Transferee</div>
                    <div className="mt-1 text-[15px] font-semibold">{investorById(t.to)?.name}</div>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-8 text-[13px] sm:grid-cols-4">
                  {[
                    ["Commitment moved", m(t.commitmentMoved)],
                    ["Capital moved", m(t.navMoved)],
                    ["Requested", date(t.requested)],
                    ["Effective", date(t.date)],
                  ].map(([k, v]) => (
                    <div key={k} className="border-b border-stone-100 py-2">
                      <dt className="text-[11px] uppercase tracking-[0.08em] text-stone-500">{k}</dt>
                      <dd className="num mt-0.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                {t.consideration && <p className="mt-3 text-[12px] text-stone-500">Consideration: {t.consideration} (settled between the parties).</p>}
                {entry && (
                  <div className="mt-5 overflow-hidden rounded-[3px] border border-stone-200">
                    <JournalTable entries={[entry]} currency={f.currency} compact />
                  </div>
                )}
              </div>
              <ol className="space-y-3">
                {[
                  ["Requested", "Transfer request and draft transfer agreement received"],
                  ["GP consent", "General partner consent; ROFR waived by existing partners"],
                  ["Documentation", "Transferee KYC/AML, tax form and admission documents"],
                  ["Completed", "Register updated and reclassification posted to ledger"],
                ].map(([s, d], i) => {
                  const done = i < reached || t.status === "Completed";
                  const current = i === reached && t.status !== "Completed";
                  return (
                    <li key={s} className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          done ? "bg-ink-900 text-white" : current ? "border-2 border-ink-900" : "border border-stone-300"
                        }`}
                      >
                        {done && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span>
                        <span className={`block text-[13px] ${current ? "font-semibold" : done ? "font-medium" : "text-stone-500"}`}>{s}</span>
                        <span className="block text-[12px] text-stone-500">{d}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
