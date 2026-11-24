import type { Metadata } from "next";
import { Download, FileText, Upload } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { documents, fundById } from "@/lib/data";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  const categories = Array.from(new Set(documents.map((d) => d.category)));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Documents"
        description="Fund formation, investor notices, reports and tax documents. Investor-specific files are published only to the entitled partner."
        actions={
          <Button>
            <Upload size={14} strokeWidth={1.8} /> Publish documents
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="space-y-px text-[13px]">
          <div className="rounded-[3px] bg-stone-100 px-3 py-2 font-semibold">
            All documents <span className="num float-right text-stone-500">{documents.length}</span>
          </div>
          {categories.map((c) => (
            <div key={c} className="cursor-pointer rounded-[3px] px-3 py-2 text-stone-600 hover:bg-stone-50 hover:text-ink-900">
              {c}
              <span className="num float-right text-stone-400">{documents.filter((d) => d.category === c).length}</span>
            </div>
          ))}
        </nav>
        <Panel flush>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Date</th>
                <th className="r">Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="row-link">
                  <td>
                    <span className="flex items-center gap-2.5 font-semibold">
                      <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
                      {d.name}
                    </span>
                  </td>
                  <td className="text-stone-600">{fundById(d.fundId)!.shortName}</td>
                  <td className="text-stone-600">{d.category}</td>
                  <td className="text-stone-600">{d.visibility}</td>
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
      </div>
    </div>
  );
}
