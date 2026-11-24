"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Honeycomb } from "./Honeycomb";
import type { Solution } from "@/lib/solutions";
import { capitalCalls, fundById, funds, fundTotals, onboarding, toUSD } from "@/lib/data";
import { moneyShort } from "@/lib/format";

function platformFigures() {
  let aua = 0;
  let commitments = 0;
  const lps = new Set<string>();
  funds.forEach((f) => {
    const t = fundTotals(f.id);
    aua += toUSD(t.nav, f.currency);
    commitments += toUSD(t.commitment, f.currency);
  });
  const openOnboarding = onboarding.filter((o) => !["Countersigned"].includes(o.status)).length;
  const outstanding = capitalCalls
    .filter((c) => c.status === "Partially funded" || c.status === "Issued")
    .reduce((a, c) => a + toUSD(c.amount - c.received, fundById(c.fundId)!.currency), 0);
  return { aua, commitments, funds: funds.length, openOnboarding, outstanding, lps: lps.size };
}

export function AdminHub() {
  const [active, setActive] = useState<Solution | null>(null);
  const [open, setOpen] = useState(false);
  const fig = platformFigures();

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 gap-10 px-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col">
          <div>
            <div className="eyebrow">Tuesday, November 24, 2026</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-ink-900">Aurum Platform</h1>
            <p className="mt-1 text-[14px] text-stone-600">
              Hover over the Client Portal to open the solutions. Select a solution to enter it.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center py-6">
            <Honeycomb
              onActiveChange={(s, o) => {
                setActive(s);
                setOpen(o);
              }}
            />
          </div>
        </section>

        <aside className="lg:pt-[92px]">
          <div className="rounded-[4px] border border-stone-200 bg-white">
            {active ? (
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Solution</span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      active.live ? "text-gold-700" : "text-stone-400"
                    }`}
                  >
                    {active.live ? "Live" : "Coming soon"}
                  </span>
                </div>
                <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.015em] text-ink-900">{active.name}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{active.summary}</p>
                <div className="eyebrow mt-6">Modules</div>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 text-[13px] text-ink-800">
                  {active.modules.map((m) => (
                    <li key={m} className="border-b border-stone-100 py-2">
                      {m}
                    </li>
                  ))}
                </ul>
                <Link
                  href={active.href}
                  className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-ink-900 underline-offset-4 hover:underline"
                >
                  {active.live ? "Open solution" : "View roadmap"} <ArrowRight size={14} strokeWidth={1.8} />
                </Link>
              </div>
            ) : (
              <div className="p-6">
                <span className="eyebrow">Client Portal</span>
                <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.015em] text-ink-900">
                  {open ? "Select a solution" : "Six solutions, one client record"}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
                  Every solution shares the same clients, entities, documents and permissions. Fund Solution is live;
                  the remaining solutions are in build.
                </p>
              </div>
            )}
          </div>

          <dl className="mt-4 divide-y divide-stone-200 rounded-[4px] border border-stone-200 bg-white">
            {[
              ["Net asset value under administration", moneyShort(fig.aua), "USD, BRL at reporting rate"],
              ["Total commitments", moneyShort(fig.commitments), `${fig.funds} active vehicles`],
              ["Open onboarding files", String(fig.openOnboarding), "Atlântico VP II second close"],
              ["Capital calls outstanding", moneyShort(fig.outstanding), "Due Dec 1, 2026"],
            ].map(([k, v, s]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <dt>
                  <div className="text-[13px] text-ink-800">{k}</div>
                  <div className="text-[11px] text-stone-500">{s}</div>
                </dt>
                <dd className="num text-[17px] font-medium tracking-[-0.01em] text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </main>
  );
}
