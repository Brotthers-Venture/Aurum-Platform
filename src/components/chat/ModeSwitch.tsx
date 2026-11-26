"use client";

import { Columns3, LayoutList, Maximize2 } from "lucide-react";
import { cx } from "@/components/ui";
import { useChat, type ChatMode } from "./context";

const MODES: { id: ChatMode; label: string; key: string; Icon: typeof LayoutList }[] = [
  { id: "inbox", label: "Inbox mode", key: "1", Icon: LayoutList },
  { id: "conversation", label: "Conversation mode", key: "2", Icon: Columns3 },
  { id: "focus", label: "Focus mode", key: "3", Icon: Maximize2 },
];

/** Inbox, Conversation or Focus. The choice is remembered; keys 1, 2, 3 switch. */
export function ModeSwitch({ className }: { className?: string }) {
  const { mode, setMode } = useChat();
  return (
    <div role="radiogroup" aria-label="Workspace layout" className={cx("hidden items-center rounded-[5px] p-0.5 md:flex", className)}>
      {MODES.map(({ id, label, key, Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={mode === id}
          aria-label={`${label} (${key})`}
          title={`${label} · ${key}`}
          onClick={() => setMode(id)}
          className={cx("flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors", mode === id ? "bg-d-raise text-d-text" : "text-d-text-3 hover:text-d-text")}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}
