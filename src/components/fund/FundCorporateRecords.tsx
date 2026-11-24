"use client";

import { useState } from "react";
import { DataRoom } from "@/components/fund/DataRoom";
import type { RoomFile } from "@/lib/corporateDocs";

export function FundCorporateRecords({ lei, initial }: { lei?: string; initial: RoomFile[] }) {
  const [files, setFiles] = useState(initial);
  return <DataRoom files={files} onChange={setFiles} gleif={lei ? { lei, capturedAt: "2026-11-24T12:00:00Z" } : null} />;
}
