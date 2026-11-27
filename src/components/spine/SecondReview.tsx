"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { eventsFor, ledger, onLedger, type LedgerEvent, type Ref } from "@/lib/spine";

/**
 * The latest second-review decision on a record, wherever it was made (Corporate Chat today). The decision
 * lives on the record, so the record shows it; nobody has to look it up in a conversation.
 */
export function SecondReview({ refTo }: { refTo: Ref }) {
  const [ev, setEv] = useState<LedgerEvent | null>(null);
  useEffect(() => {
    const pick = () => setEv(eventsFor(ledger(), refTo).find((e) => e.type.startsWith(`${refTo.kind}.second_review.`)) ?? null);
    pick();
    return onLedger(pick);
  }, [refTo]);
  if (!ev) return null;
  const ok = ev.type.endsWith(".approved");
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="mt-3 flex items-start gap-2 border-t border-stone-200 pt-3 text-[12.5px]">
      <Icon size={15} className="mt-0.5 shrink-0" style={{ color: ok ? "#1F7A45" : "#B3261E" }} aria-hidden />
      <div>
        <div className="font-semibold text-ink-900">Second review {ok ? "approved" : "rejected"}</div>
        <div className="text-stone-500">
          {ev.text} {new Date(ev.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
