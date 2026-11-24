import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { Panel } from "@/components/ui";
import { PORTAL_INVESTOR_ID, capitalAccounts, documents, fundById } from "@/lib/data";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Documents" };

export default function PortalDocuments() {
  const fundIds = new Set(capitalAccounts.filter((c) => c.investorId === PORTAL_INVESTOR_ID).map((c) => c.fundId));
  fundIds.add("atlantico-vp-ii");
  const docs = documents.filter((d) => fundIds.has(d.fundId) && d.visibility !== "Internal");
  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">Calloway Family Trust</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">Documents</h1>
      <p className="mt-1.5 text-[14px] text-stone-600">Notices, statements, reports and tax documents for your investments.</p>
      <Panel className="mt-8" flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Vehicle</th>
              <th>Category</th>
              <th>Date</th>
              <th className="r">Size</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="row-link">
                <td>
                  <span className="flex items-center gap-2.5 font-semibold">
                    <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
                    {d.name}
                  </span>
                </td>
                <td className="text-stone-600">{fundById(d.fundId)!.shortName}</td>
                <td className="text-stone-600">{d.category}</td>
                <td className="num text-stone-600">{date(d.date)}</td>
                <td className="num r text-stone-500">{d.size}</td>
                <td className="r">
                  <Download size={15} strokeWidth={1.6} className="inline text-stone-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </main>
  );
}
