"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { treatmentFor } from "@/lib/blockchain/data";
import { reconcile, useChain } from "@/lib/blockchain/store";
import { CompanyMark, SimBanner, StatusPill, TreatmentPill, n } from "./ui";

/** Every company whose shares, units or quotas are tokenized, and whether its token agrees with its register. */
export function ChainCompanies() {
  const d = useChain();
  const live = d.tokens.filter((t) => t.status === "Live");
  const holders = live.reduce((a, t) => a + t.holders.length, 0);
  const open = d.transfers.filter((t) => t.status === "In progress").length;
  const breaks = live.filter((t) => reconcile(t).some((r) => r.diff !== 0)).length;
  const th = "px-3 py-2.5 text-left text-[11.5px] font-medium text-d-text-3 first:pl-4 last:pr-4 whitespace-nowrap";
  const td = "px-3 py-3 first:pl-4 last:pr-4 align-middle";
  return (
    <div>
      <PageHead
        eyebrow="Blockchain Solution"
        title="Tokenized companies"
        meta="Share registers held as tokens in their owners’ own wallets. A register service for companies we form and administer; nothing here is offered or sold."
        action={
          <Link
            href="/admin/blockchain/tokenize"
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-brand px-3.5 text-[13px] font-semibold text-brand-ink hover:opacity-90"
          >
            <Plus size={15} /> Tokenize a company
          </Link>
        }
      />
      <SimBanner className="mb-5" />
      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3 border-y border-d-line px-2 py-3">
        {[
          ["Companies live", live.length],
          ["Being prepared", d.tokens.length - live.length],
          ["Holders", holders],
          ["Transfers in progress", open],
          ["Register differences", breaks],
        ].map(([k, v]) => (
          <div key={k as string}>
            <dt className="text-[12px] text-d-text-3">{k}</dt>
            <dd className={cx("tnum mt-0.5 text-[20px] leading-none", k === "Register differences" && Number(v) > 0 ? "text-gold-700" : "text-d-text")}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
        <table className="w-full min-w-[980px] text-[13px]">
          <thead className="border-b border-d-line">
            <tr>
              <th className={th}>Company</th>
              <th className={th}>Jurisdiction</th>
              <th className={th}>The token is</th>
              <th className={th}>Status</th>
              <th className={cx(th, "text-right")}>Supply</th>
              <th className={cx(th, "text-right")}>Holders</th>
              <th className={th}>Register</th>
              <th className={th}>Agent</th>
            </tr>
          </thead>
          <tbody>
            {d.tokens.map((t) => {
              const tr = treatmentFor(t.jurisdiction, t.form);
              const diffs = reconcile(t).filter((r) => r.diff !== 0).length;
              return (
                <tr key={t.id} className="border-b border-d-line-soft last:border-0 hover:bg-d-raise">
                  <td className={td}>
                    <Link href={`/admin/blockchain/${t.id}`} className="flex items-center gap-3">
                      <CompanyMark t={t} size={32} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-d-text hover:underline">{t.company}</span>
                        <span className="block text-[12px] text-d-text-3">
                          {t.symbol} · {t.unitWord}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={cx(td, "text-d-text-2")}>{t.jurisdictionName}</td>
                  <td className={td}>
                    <TreatmentPill t={tr.t} />
                  </td>
                  <td className={td}>
                    <StatusPill s={t.status} />
                  </td>
                  <td className={cx(td, "tnum text-right text-d-text")}>{n(t.supply)}</td>
                  <td className={cx(td, "tnum text-right text-d-text-2")}>{t.holders.length}</td>
                  <td className={cx(td, "text-[12.5px]")}>
                    {t.status !== "Live" ? (
                      <span className="text-d-text-3">Not issued</span>
                    ) : diffs ? (
                      <span className="text-gold-700">
                        {diffs} difference{diffs > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-up-ink">Agrees</span>
                    )}
                  </td>
                  <td className={cx(td, "max-w-[220px] truncate text-[12.5px] text-d-text-2")}>{t.agent.split(",")[0]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-d-text-3">
        “Legal record”: the token ledger is the company’s register (Delaware and Wyoming corporations). “Record by agreement”: an LLC whose operating agreement adopts it. “Register
        mirror”: the official register stays the record and the token follows it (Brazil, Cayman, BVI and others). Counsel confirms each case.
      </p>
    </div>
  );
}
