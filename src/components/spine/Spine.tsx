"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { cx } from "@/components/ui";
import { discussHref, eventsFor, ledger, onLedger, type LedgerEvent, type Ref } from "@/lib/spine";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

/** Open (or start) the Corporate Chat conversation about this record. */
export function DiscussButton({ refTo, label, title, className }: { refTo: Ref; label: string; title?: string; className?: string }) {
  return (
    <Link
      href={discussHref(refTo, label, title)}
      className={cx("inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-stone-200 bg-white px-3 text-[12.5px] font-semibold text-ink-900 hover:border-stone-300", className)}
    >
      <MessagesSquare size={14} strokeWidth={1.8} style={{ color: "var(--module-communication, #1F8A84)" }} /> Discuss
    </Link>
  );
}

/** Everything that happened to a record, from the shared ledger — updates live as events arrive. */
export function ActivityFeed({ refTo, seed = [], limit = 12, empty = "Nothing has happened here yet." }: { refTo: Ref; seed?: LedgerEvent[]; limit?: number; empty?: string }) {
  const [all, setAll] = useState<LedgerEvent[]>(seed);
  const key = `${refTo.kind}:${refTo.id}`;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAll(ledger(seed));
    return onLedger(() => setAll(ledger(seed)));
    // the seed belongs to the record; re-read only when the record changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const list = eventsFor(all, refTo).slice(0, limit);
  if (!list.length) return <p className="text-[12.5px] text-stone-500">{empty}</p>;
  return (
    <ol className="relative space-y-3 border-l border-stone-200 pl-4">
      {list.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-stone-400" />
          <p className="text-[12.5px] leading-snug text-ink-900">
            {e.text.charAt(0).toUpperCase() + e.text.slice(1)}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {e.actor} · {when(e.at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
