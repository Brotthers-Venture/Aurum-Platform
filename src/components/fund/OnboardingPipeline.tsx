"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, Plus, Settings2, X } from "lucide-react";
import { Button, PageHeader, Panel, Progress, Status, cx } from "@/components/ui";
import { fundById, onboarding, type OnboardingStatus } from "@/lib/data";
import { date, money, moneyShort } from "@/lib/format";

const stages: (OnboardingStatus | "All")[] = ["All", "Invited", "In progress", "Submitted", "Changes requested", "Approved", "Countersigned"];

export function OnboardingPipeline() {
  const router = useRouter();
  const [fundId, setFundId] = useState("atlantico-vp-ii");
  const [stage, setStage] = useState<(typeof stages)[number]>("All");
  const [inviting, setInviting] = useState(false);

  const fundRows = useMemo(() => onboarding.filter((o) => o.fundId === fundId), [fundId]);
  const rows = stage === "All" ? fundRows : fundRows.filter((r) => r.status === stage);
  const fund = fundById(fundId)!;
  const fundsWithOnboarding = Array.from(new Set(onboarding.map((o) => o.fundId)));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investor onboarding"
        title="Subscriptions"
        description="Invite investors, collect subscription documents, tax forms and KYC/AML in one guided flow, then review and countersign."
        actions={
          <>
            <Button variant="secondary">
              <Settings2 size={14} strokeWidth={1.8} /> Configure questionnaire
            </Button>
            <Button onClick={() => setInviting(true)}>
              <Plus size={14} strokeWidth={2} /> Invite investors
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={fundId}
          onChange={(e) => {
            setFundId(e.target.value);
            setStage("All");
          }}
          className="h-9 rounded-[3px] border border-stone-300 bg-white px-3 pr-8 text-[13px] font-semibold"
        >
          {fundsWithOnboarding.map((id) => (
            <option key={id} value={id}>
              {fundById(id)!.name}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-stone-500">
          {fundId === "atlantico-vp-ii" ? "Second close · target Dec 18, 2026" : "Final close · open"}
        </span>
        <div className="ml-auto flex items-center gap-2 rounded-[3px] border border-stone-200 bg-white px-3 py-1.5 text-[12px] text-stone-600">
          <Link2 size={13} strokeWidth={1.8} />
          <span className="font-mono text-[11px]">portal.aurumasset.us/subscribe/{fund.id}</span>
          <button className="text-stone-400 hover:text-ink-900" aria-label="Copy link">
            <Copy size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* stage summary — click to filter */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-stone-200/70 bg-stone-200 shadow-card md:grid-cols-3 xl:grid-cols-6">
        {stages.slice(1).map((s) => {
          const r = fundRows.filter((o) => o.status === s);
          const on = stage === s;
          return (
            <button
              key={s}
              onClick={() => setStage(on ? "All" : s)}
              className={cx("px-4 py-3.5 text-left transition-colors", on ? "bg-champagne text-ink-900" : "bg-white hover:bg-stone-50")}
            >
              <div className={cx("text-[11px] font-semibold uppercase tracking-[0.1em]", on ? "text-gold-400" : "text-stone-500")}>{s}</div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="num text-[20px] font-medium">{r.length}</span>
                <span className={cx("num text-[12px]", on ? "text-white/70" : "text-stone-500")}>
                  {moneyShort(r.reduce((a, x) => a + x.commitment, 0))}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Panel flush>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Type</th>
                <th className="r">Commitment</th>
                <th>Status</th>
                <th className="w-[140px]">Progress</th>
                <th>KYC / AML</th>
                <th>Eligibility</th>
                <th>Last activity</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="row-link" onClick={() => router.push(`/admin/fund/onboarding/${o.id}`)}>
                  <td className="min-w-[240px]">
                    <div className="font-semibold text-ink-900">{o.investorName}</div>
                    <div className="text-[12px] text-stone-500">{o.contactName}</div>
                  </td>
                  <td className="text-stone-600">{o.investorType}</td>
                  <td className="num r">{money(o.commitment)}</td>
                  <td>
                    <Status value={o.status} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={o.progress} />
                      <span className="num w-9 text-right text-[12px] text-stone-500">{Math.round(o.progress * 100)}%</span>
                    </div>
                  </td>
                  <td>
                    <Status value={o.kyc} />
                  </td>
                  <td className="text-[12px] text-stone-600">{o.accreditation}</td>
                  <td className="num text-stone-600">{date(o.lastActivity)}</td>
                  <td className="whitespace-nowrap text-stone-600">{o.relationshipManager}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-500">
                    No investors in this stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {inviting && <InviteDrawer fundName={fund.name} onClose={() => setInviting(false)} />}
    </div>
  );
}

function InviteDrawer({ fundName, onClose }: { fundName: string; onClose: () => void }) {
  const input =
    "h-10 w-full rounded-[3px] border border-stone-300 px-3 text-[13px] focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/30" onClick={onClose}>
      <aside className="flex h-full w-full max-w-[460px] flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 px-6 py-5">
          <div>
            <div className="eyebrow">Invite investors</div>
            <h2 className="mt-1 text-[17px] font-semibold">{fundName}</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-ink-900" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 text-[13px]">
          <label className="block">
            <span className="font-semibold">Investor legal name</span>
            <input className={`${input} mt-1.5`} placeholder="e.g. Bayview Partners Holdings LLC" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-semibold">Primary contact</span>
              <input className={`${input} mt-1.5`} placeholder="Full name" />
            </label>
            <label className="block">
              <span className="font-semibold">Email</span>
              <input className={`${input} mt-1.5`} placeholder="name@company.com" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-semibold">Expected commitment</span>
              <input className={`${input} num mt-1.5`} placeholder="$0" />
            </label>
            <label className="block">
              <span className="font-semibold">Relationship owner</span>
              <select className={`${input} mt-1.5 bg-white`}>
                <option>L. Andrade</option>
                <option>R. Mendes</option>
                <option>J. Teixeira</option>
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="font-semibold">Subscription package</legend>
            <div className="mt-2 space-y-2">
              {[
                ["Subscription agreement — Second close", true],
                ["Investor questionnaire (US / Non-US)", true],
                ["Tax forms (W-9 / W-8 series)", true],
                ["KYC / AML — identity and beneficial owners", true],
                ["Side letter request", false],
              ].map(([l, c]) => (
                <label key={l as string} className="flex items-center gap-2.5 rounded-[3px] border border-stone-200 px-3 py-2.5">
                  <input type="checkbox" defaultChecked={c as boolean} className="h-4 w-4 accent-ink-900" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="font-semibold">Message to investor</span>
            <textarea
              rows={4}
              className="mt-1.5 w-full rounded-[3px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none"
              defaultValue={`You have been invited to subscribe to ${fundName}. Please complete your subscription through the secure Aurum portal.`}
            />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-stone-200 px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Send invitation</Button>
        </footer>
      </aside>
    </div>
  );
}
