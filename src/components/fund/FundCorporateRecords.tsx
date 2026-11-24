"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Panel } from "@/components/ui";
import { CorporateDocuments } from "@/components/fund/CorporateDocuments";
import type { CorporateFile } from "@/lib/corporateDocs";

export function FundCorporateRecords({
  fund,
  initial,
}: {
  fund: { name: string; legalForm: string; domicile: string; lei?: string; gp: string };
  initial: CorporateFile[];
}) {
  const [files, setFiles] = useState(initial);
  return (
    <div className="grid grid-cols-[1fr_300px] gap-6">
      <CorporateDocuments files={files} onChange={setFiles} gleif={fund.lei ? { lei: fund.lei, legalName: fund.name, capturedAt: "2026-11-24T12:00:00Z", status: "ISSUED" } : null} />
      <Panel title="Legal identity">
        <dl className="space-y-3 text-[13px]">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-stone-500">Legal name</dt>
            <dd className="mt-0.5 font-medium">{fund.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-stone-500">LEI</dt>
            <dd className="mt-0.5">
              {fund.lei ? (
                <a href={`https://search.gleif.org/#/record/${fund.lei}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[12.5px] hover:underline">
                  {fund.lei} <ExternalLink size={11} />
                </a>
              ) : (
                <span className="text-stone-500">None on file</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-stone-500">Legal form · domicile</dt>
            <dd className="mt-0.5">
              {fund.legalForm} · {fund.domicile}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-stone-500">General partner</dt>
            <dd className="mt-0.5">{fund.gp}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
