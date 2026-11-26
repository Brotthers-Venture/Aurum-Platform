"use client";

import { Building2, Check, Landmark, Minus } from "lucide-react";
import { PageHead } from "@/components/gp/GpKit";

const ROWS: [string, string, string][] = [
  ["Verify the buyer’s identity", "Aurum (Compliance)", "Venue"],
  ["Apply the company’s transfer rules", "Aurum (token rules)", "—"],
  ["List the holding for buyers to see", "—", "Venue"],
  ["Match buyer and seller, agree the price", "—", "Venue"],
  ["Settle the payment", "—", "Venue or its escrow agent"],
  ["Move the tokens and update the register", "Aurum (register and token)", "—"],
];

/**
 * Selling to a buyer the owner hasn't found: only through a licensed venue. Aurum stays the register, the identity
 * checks and the token engine; the venue lists, matches and settles. No venue is connected yet.
 */
export function SecondarySales() {
  return (
    <div className="max-w-[980px]">
      <PageHead
        eyebrow="Blockchain Solution"
        title="Secondary sales"
        meta="How an owner sells to a buyer they haven’t found themselves. Aurum doesn’t run a marketplace: listing and matching buyers and sellers of securities is for licensed venues."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-d-text">
            <Check size={14} className="text-up-ink" /> Owner has a buyer
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-d-text-2">
            Available now, from the owner’s wallet: the buyer is verified, the company approves, the agreement is signed and the tokens move. The parties settle payment themselves
            or through an escrow agent.
          </p>
        </section>
        <section className="rounded-[12px] border border-dashed border-d-line px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-d-text-2">
            <Minus size={14} className="text-d-text-3" /> Owner wants a buyer found
            <span className="ml-auto rounded-[5px] border border-d-line px-1.5 text-[10.5px] font-normal text-d-text-3">Not connected</span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-d-text-3">
            Needs a licensed venue partner. The holding is listed there; our rules still decide who can buy and the token still moves only through our register.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
        <h2 className="text-[13px] font-semibold text-d-text">Who does what in a venue sale</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
              <tr>
                <th className="py-2 pr-3 text-left font-medium">Step</th>
                <th className="py-2 pr-3 text-left font-medium">Aurum</th>
                <th className="py-2 text-left font-medium">Licensed venue</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([s, a, v]) => (
                <tr key={s} className="border-b border-d-line-soft last:border-0">
                  <td className="py-2.5 pr-3 text-d-text">{s}</td>
                  <td className="py-2.5 pr-3 text-d-text-2">{a}</td>
                  <td className="py-2.5 text-d-text-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          {
            Icon: Landmark,
            where: "United States",
            what: "A registered broker-dealer operating an alternative trading system (Regulation ATS).",
          },
          {
            Icon: Building2,
            where: "Brazil",
            what: "A market authorized by the CVM; secondary trading of securities, tokenized or not, happens in authorized organized markets.",
          },
        ].map(({ Icon, where, what }) => (
          <div key={where} className="rounded-[12px] border border-d-line px-5 py-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-d-text">
              <Icon size={14} className="text-d-text-3" /> {where}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-d-text-2">{what}</p>
            <p className="mt-2 text-[12px] text-d-text-3">Partner: none connected.</p>
          </div>
        ))}
      </section>
      <p className="mt-4 px-1 text-[12px] leading-relaxed text-d-text-3">
        Raising new money from investors is an offering and goes through the Offering Solution. The SEC’s 2026 exemption for tokenized securities venues covers tokenized listed
        stocks, not private companies’ shares. Counsel confirms the structure before any venue is connected.
      </p>
    </div>
  );
}
