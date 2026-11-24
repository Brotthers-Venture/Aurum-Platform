"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";

export function ApproveButton({ label = "Approve" }: { label?: string }) {
  const [done, setDone] = useState(false);
  if (done)
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-positive">
        <Check size={14} strokeWidth={2.4} /> Approved by you
      </span>
    );
  return (
    <Button size="sm" variant="brand" onClick={() => setDone(true)}>
      {label}
    </Button>
  );
}
