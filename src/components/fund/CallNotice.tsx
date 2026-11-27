"use client";

import type { ReactNode } from "react";
import { AurumLogo } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { SERIF } from "@/lib/brand";
import type { Notice } from "@/lib/capital-notice";

const amt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** A value the records do not hold yet. It prints as a marked gap, so an unfinished notice cannot pass for a final one. */
function Missing({ children }: { children: ReactNode }) {
  return <span className="rounded-[2px] border border-dashed border-[#b4232c] px-1 text-[#b4232c]">{children}</span>;
}

/**
 * One capital call notice on a US Letter sheet, issued by the firm as administrator. The firm's logo and name come
 * from the tenant brand, never the GP's.
 */
export function CallNotice({ n }: { n: Notice }) {
  const { brand } = useBrand();
  const w = n.bank?.wire;
  const rows: [string, ReactNode][] = [
    ["Bank", n.bank?.institution ?? <Missing>Bank not on file</Missing>],
    ...(w
      ? ([
          ...(w.aba ? [["ABA/Routing", w.aba]] : []),
          ...(w.abaWire ? [["ABA/Wire", w.abaWire]] : []),
          ...(w.swift ? [["SWIFT code", `${w.swift} (for international wires)`]] : []),
          ["Account #", w.accountNumber],
        ] as [string, ReactNode][])
      : ([["Account #", <Missing key="m">Full account number not on file (••{n.bank?.mask ?? "—"})</Missing>]] as [string, ReactNode][])),
    ["Acct. name", n.fundName],
    ["Address", w?.beneficiaryAddress ?? <Missing>Beneficiary address not on file</Missing>],
  ];

  return (
    <article
      className="report-sheet cc-sheet relative mx-auto flex h-[11in] w-[8.5in] shrink-0 flex-col px-[0.95in] pb-[0.55in] pt-[0.6in] text-[10.5pt] leading-[1.45] text-[#1b2230] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]"
      // Paper is always white, whatever the workstation theme does to white surfaces.
      style={{ fontFamily: SERIF[brand.fonts.serif].stack, background: "#fff", colorScheme: "light" }}
    >
      <div className="flex justify-end">
        <AurumLogo height={34} />
      </div>

      <div className="mt-6">{longDate(n.date)}</div>
      <div className="font-semibold">{n.investor.name}</div>
      <div className="mt-3 flex justify-between gap-8">
        <div>
          <div>Att: {n.investor.contact.toUpperCase()}</div>
          {n.investor.address?.length ? n.investor.address.map((l) => <div key={l}>{l}</div>) : <Missing>Mailing address not on file</Missing>}
        </div>
        <div className="whitespace-nowrap">Partner No.: {n.partnerNo}</div>
      </div>

      <div className="mt-9 text-center text-[13pt] font-semibold">{n.fundName}</div>
      <div className="mt-2 text-center">Notice {n.noticeNo}</div>
      <div className="mt-3 border-y border-[#1b2230] py-1 text-center font-semibold">NOTICE OF CAPITAL CALL</div>

      <p className="mt-6">
        Pursuant to the {n.interest.includes("Partnership") ? "Limited Partnership Agreement" : "governing documents"} of {n.fundName}, the Fund hereby calls the following capital
        contribution ({n.period}):
      </p>
      <div className="mt-2 grid grid-cols-[1.4in_1fr] tabular-nums">
        <span />
        <span>
          {amt(n.amount)}&nbsp;&nbsp; {n.interest}
        </span>
        <span className="mt-1">Total:</span>
        <span className="mt-1">
          {n.currency} <b>{amt(n.amount)}</b>
        </span>
      </div>

      <p className="mt-6">
        Please remit payment on or before <b>{longDate(n.due)}</b> to:
      </p>
      <dl className="mt-1 grid grid-cols-[1.2in_1fr] pl-[0.12in]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k}:</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
        <dt className="mt-4">Reference:</dt>
        <dd className="mt-4 font-semibold tabular-nums">{n.reference}</dd>
      </dl>
      <p className="mt-1 pl-[0.12in] text-[9pt] text-[#5a6473]">Quote the reference on the wire so the payment is matched to this notice.</p>

      <p className="mt-5 text-[9.5pt] italic">
        Please confirm these wire instructions by telephone before remitting funds; {n.admin.name} will never change wire instructions by email.
      </p>

      <div className="mt-8">
        <div>{n.admin.entity}</div>
        <div>Administrator, {n.fundName}</div>
      </div>

      <footer className="mt-auto border-t border-[#d9dde3] pt-3 text-center text-[8pt] leading-[1.5] text-[#5a6473]">
        <div>
          {n.admin.entity}, {n.admin.address}
        </div>
        <div>
          {n.admin.phone ? `Tel. ${n.admin.phone} · ` : ""}
          Email: {n.admin.email}
        </div>
        {n.lei && <div>Fund LEI {n.lei} · verify at gleif.org</div>}
        <div className="absolute bottom-[0.55in] right-[0.95in]">Page 1 of 1</div>
      </footer>
    </article>
  );
}
