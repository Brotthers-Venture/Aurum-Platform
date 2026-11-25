"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useChat } from "./context";
import { Kbd } from "./ui";

function Modal({ label, onClose, children, width = 480 }: { label: string; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[14vh]" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} onMouseDown={(e) => e.stopPropagation()} className="w-full overflow-hidden rounded-[8px] bg-d-surface shadow-[var(--d-pop)]" style={{ maxWidth: width }}>
        <div className="flex h-12 items-center justify-between border-b border-d-line px-4">
          <h2 className="text-[13.5px] font-semibold">{label}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise">
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NewMatterDialog({ prefill, onClose, onCreate }: { prefill: { title?: string; from?: string }; onClose: () => void; onCreate: (title: string, from?: string) => void }) {
  const { s } = useChat();
  const [title, setTitle] = useState(prefill.title ?? "");
  const [from, setFrom] = useState(prefill.from ?? "");
  return (
    <Modal label="New matter" onClose={onClose}>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onCreate(title.trim(), from || undefined);
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-d-text-2">Title</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this about?" className="h-9 w-full rounded-[4px] border border-d-line bg-d-bg px-2.5 text-[13px] focus:border-d-line-strong focus:outline-none" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-d-text-2">Link to the same record as</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-full rounded-[4px] border border-d-line bg-d-bg px-2 text-[13px] focus:border-d-line-strong focus:outline-none">
            <option value="">Not linked</option>
            {s.matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.ref} — {m.linked.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11.5px] text-d-text-3">The reference prefix comes from the record type (CC for a capital call, KYC for an investor check…).</span>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-8 rounded-[4px] px-3 text-[12.5px] text-d-text-2 hover:text-d-text">
            Cancel
          </button>
          <button disabled={!title.trim()} className="h-8 rounded-[4px] border border-d-line-strong bg-d-raise px-3 text-[12.5px] font-semibold disabled:opacity-40">
            Open matter
          </button>
        </div>
      </form>
    </Modal>
  );
}

const SHORTCUTS: [string, string[]][] = [
  ["Command menu", ["Ctrl", "K"]],
  ["New matter", ["C"]],
  ["Next / previous", ["J", "K"]],
  ["Open selected", ["Enter"]],
  ["Mark done (inbox) or resolve", ["E"]],
  ["Change status", ["S"]],
  ["Assign", ["A"]],
  ["Priority", ["P"]],
  ["Reply", ["R"]],
  ["Search", ["/"]],
  ["Go to inbox", ["G", "I"]],
  ["Go to matters", ["G", "M"]],
  ["Back / close", ["Esc"]],
  ["This sheet", ["?"]],
];

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="Keyboard shortcuts" onClose={onClose} width={440}>
      <dl className="grid grid-cols-[1fr_auto] gap-y-2 p-4 text-[12.5px]">
        {SHORTCUTS.map(([label, keys]) => (
          <div key={label} className="contents">
            <dt className="text-d-text-2">{label}</dt>
            <dd className="flex justify-end gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-d-line-soft px-4 py-2.5 text-[11.5px] text-d-text-3">Every shortcut has a mouse and touch equivalent in the menus.</p>
    </Modal>
  );
}
