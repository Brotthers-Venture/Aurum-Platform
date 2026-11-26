"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import { initials, isExternal, personName, SYSTEM, type MatterStatus, type Priority } from "@/lib/chat";

/** Our own status mark: an outlined ring — empty when open, half when waiting on someone, filled when resolved. */
export function StatusRing({ status, size = 14 }: { status: MatterStatus; size?: number }) {
  const r = 5.25;
  const tone = status === "Resolved" ? "var(--d-pos)" : status === "Open" ? "var(--d-text-2)" : "var(--d-warn)";
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <circle cx="7" cy="7" r={r} fill="none" stroke={tone} strokeWidth="1.5" />
      {status === "Resolved" && <circle cx="7" cy="7" r="3" fill={tone} />}
      {(status === "Awaiting client" || status === "Awaiting approval") && <path d={`M7 ${7 - 3} A3 3 0 0 1 7 ${7 + 3} Z`} fill={tone} />}
      {status === "Awaiting approval" && <circle cx="7" cy="7" r="0.9" fill={tone} />}
    </svg>
  );
}

/** Priority as bars (Urgent gets a filled square), always paired with a text label where space allows. */
export function PriorityMark({ p }: { p: Priority }) {
  if (p === "Urgent")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
        <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" fill="var(--d-neg)" />
        <rect x="6.3" y="3.6" width="1.4" height="4.6" rx=".7" fill="var(--d-bg)" />
        <circle cx="7" cy="10.2" r=".85" fill="var(--d-bg)" />
      </svg>
    );
  const lit = p === "High" ? 3 : p === "Normal" ? 2 : p === "Low" ? 1 : 0;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 3.6} y={9 - i * 3} width="2.4" height={3 + i * 3} rx=".6" fill={i < lit ? "var(--d-text-2)" : "var(--d-line-strong)"} />
      ))}
    </svg>
  );
}

export function Avatar({ id, size = 22 }: { id: string; size?: number }) {
  const ext = isExternal(id);
  return (
    <span
      title={personName(id) + (ext ? " · External" : "")}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-semibold",
        ext ? "border-dashed border-d-text-3 bg-d-bg text-d-text-2" : "border-d-line-strong bg-d-raise text-d-text",
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {id === SYSTEM ? "·" : initials(id)}
    </span>
  );
}

export function AvatarStack({ ids, max = 3 }: { ids: string[]; max?: number }) {
  return (
    <span className="flex items-center -space-x-1">
      {ids.slice(0, max).map((id) => (
        <span key={id} className="rounded-full ring-2 ring-d-bg">
          <Avatar id={id} size={20} />
        </span>
      ))}
      {ids.length > max && <span className="tnum pl-2.5 text-[11px] text-d-text-3">+{ids.length - max}</span>}
    </span>
  );
}

export function ExternalTag({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex h-[17px] items-center rounded-[3px] border border-d-line-strong px-1 text-[10.5px] font-medium text-d-text-2", className)}>External</span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[3px] border border-d-line px-1 font-sans text-[10.5px] text-d-text-3">{children}</kbd>
  );
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const shortDay = (iso: string) => {
  const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
};
export const clock = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
export function relTime(iso: string, now: number) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return shortDay(iso);
}

/** Mark a search term inside text. */
export function Highlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[2px] bg-d-accent-soft px-0.5 text-d-text">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Markdown-lite: **bold**, *italic*, `code`, "- " lists, links, @mentions and #REF references.
 * Rendered as React nodes — never as HTML.
 */
export function RichText({ body, onRef }: { body: string; onRef?: (ref: string) => void }) {
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => {
    if (list.length)
      blocks.push(
        <ul key={"l" + k} className="my-1 list-disc space-y-0.5 pl-5">
          {list.map((l, i) => (
            <li key={i}>{inline(l, onRef)}</li>
          ))}
        </ul>,
      );
    list = [];
  };
  lines.forEach((l, i) => {
    if (/^\s*[-•]\s+/.test(l)) list.push(l.replace(/^\s*[-•]\s+/, ""));
    else {
      flush(i);
      blocks.push(<p key={i}>{l ? inline(l, onRef) : " "}</p>);
    }
  });
  flush(lines.length);
  return <>{blocks}</>;
}

function inline(text: string, onRef?: (ref: string) => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/\S+|@[A-Za-zÀ-ÿ]+|#[A-Z]{2,4}-\d+)/g;
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(re)) {
    const t = m[0];
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (t.startsWith("**"))
      out.push(
        <strong key={k++} className="font-semibold">
          {t.slice(2, -2)}
        </strong>,
      );
    else if (t.startsWith("`"))
      out.push(
        <code key={k++} className="rounded-[3px] bg-d-raise px-1 py-px text-[0.92em]">
          {t.slice(1, -1)}
        </code>,
      );
    else if (t.startsWith("*")) out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    else if (t.startsWith("http"))
      out.push(
        <a key={k++} href={t} target="_blank" rel="noreferrer" className="underline decoration-d-line-strong underline-offset-2 hover:decoration-d-text">
          {t}
        </a>,
      );
    else if (t.startsWith("@"))
      out.push(
        <span key={k++} className="rounded-[3px] bg-d-raise px-1 font-medium text-d-text">
          {t}
        </span>,
      );
    else
      out.push(
        <button key={k++} onClick={() => onRef?.(t.slice(1))} className="rounded-[3px] border border-d-line px-1 text-[0.92em] font-medium text-d-text hover:border-d-line-strong">
          {t.slice(1)}
        </button>,
      );
    last = m.index! + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function fileSize(b: number) {
  return b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`;
}
