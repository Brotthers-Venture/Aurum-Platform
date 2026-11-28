"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useChat } from "./context";
import { Avatar, Kbd } from "./ui";
import { useHomes } from "./homes";
import { cx } from "@/components/ui";
import { VIEWER, channelSlug, chatPeople, isExternal, personName } from "@/lib/chat";

function Modal({ label, onClose, children, width = 480 }: { label: string; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[14vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-[8px] bg-d-surface shadow-[var(--d-pop)]"
        style={{ maxWidth: width }}
      >
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

export function NewMatterDialog({
  prefill,
  onClose,
  onCreate,
}: {
  prefill: { title?: string; from?: string };
  onClose: () => void;
  onCreate: (title: string, from?: string) => void;
}) {
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
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is this about?"
            className="h-9 w-full rounded-[4px] border border-d-line bg-d-bg px-2.5 text-[13px] focus:border-d-line-strong focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-d-text-2">Link to the same record as</span>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-full rounded-[4px] border border-d-line bg-d-bg px-2 text-[13px] focus:border-d-line-strong focus:outline-none"
          >
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
  ["Show or hide details", ["D"]],
  ["Open the linked record", ["O"]],
  ["Inbox · Conversation · Focus", ["1", "2", "3"]],
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

/* ───────────────────────── channels and groups ───────────────────────── */

const fieldCls = "h-9 w-full rounded-[4px] border border-d-line bg-d-bg px-2.5 text-[13px] focus:border-d-line-strong focus:outline-none";
const staff = chatPeople.filter((p) => !isExternal(p.id) && p.id !== VIEWER);

function PeoplePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const list = staff.filter((p) => `${p.name} ${p.title}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find people at the firm" className={fieldCls} />
      <div className="mt-1.5 max-h-[188px] overflow-y-auto rounded-[4px] border border-d-line">
        {list.map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-[12.5px] hover:bg-d-raise">
            <input
              type="checkbox"
              checked={value.includes(p.id)}
              onChange={(e) => onChange(e.target.checked ? [...value, p.id] : value.filter((x) => x !== p.id))}
              className="accent-[var(--tenant-accent)]"
            />
            <Avatar id={p.id} size={20} />
            <span className="text-d-text">{p.name}</span>
            <span className="truncate text-d-text-3">{p.title}</span>
          </label>
        ))}
        {!list.length && <p className="px-2.5 py-3 text-[12px] text-d-text-3">No one matches.</p>}
      </div>
      <p className="mt-1 text-[11.5px] text-d-text-3">
        {value.length ? `${value.length} selected, plus you` : "Only you so far"}. Clients join through a channel request, which the firm approves.
      </p>
    </div>
  );
}

export function NewConversationDialog({ initial, onClose }: { initial: { kind: "channel" | "group"; home?: string }; onClose: () => void }) {
  const { createChannel, startGroup } = useChat();
  const homes = useHomes();
  const [kind, setKind] = useState(initial.kind);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [home, setHome] = useState(initial.home ?? "");
  const [people, setPeople] = useState<string[]>([]);
  const slug = channelSlug(name);
  const problem = kind === "channel" ? (!slug ? "Name the channel." : null) : !people.length ? "Choose at least one person." : null;

  return (
    <Modal label={kind === "channel" ? "New channel" : "New group message"} onClose={onClose} width={520}>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (problem) return;
          if (kind === "channel") createChannel({ name: slug, topic: topic.trim(), home: home || undefined, members: people });
          else startGroup(people, name);
          onClose();
        }}
      >
        <div role="tablist" aria-label="Kind" className="flex gap-1 rounded-[6px] bg-d-bg p-0.5">
          {(
            [
              ["channel", "Channel", "A standing place for a team or a topic, filed under its room"],
              ["group", "Group message", "A private conversation with a few people"],
            ] as const
          ).map(([k, label, hint]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              title={hint}
              onClick={() => setKind(k)}
              className={cx("h-8 flex-1 rounded-[4px] text-[12.5px]", kind === k ? "bg-d-raise font-semibold text-d-text" : "text-d-text-2 hover:text-d-text")}
            >
              {label}
            </button>
          ))}
        </div>

        {kind === "channel" ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-d-text-2">Name</span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-d-text-3">#</span>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. pmo-closings" className={fieldCls} />
              </div>
              {name && slug !== name && <span className="mt-1 block text-[11.5px] text-d-text-3">Will be #{slug || "…"}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-d-text-2">Room</span>
              <select value={home} onChange={(e) => setHome(e.target.value)} className={fieldCls}>
                <option value="">No room — firm-wide</option>
                {homes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11.5px] text-d-text-3">The channel is filed under its room here and opens from that room as its team channel.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-d-text-2">Topic (optional)</span>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What the channel is for" className={fieldCls} />
            </label>
          </>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-d-text-2">Name (optional)</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown instead of the people's names" className={fieldCls} />
          </label>
        )}

        <div>
          <span className="mb-1.5 block text-[12px] text-d-text-2">People</span>
          <PeoplePicker value={people} onChange={setPeople} />
        </div>

        <div className="flex items-center justify-end gap-2">
          {problem && <span className="mr-auto text-[11.5px] text-d-text-3">{problem}</span>}
          <button type="button" onClick={onClose} className="h-8 rounded-[4px] px-3 text-[12.5px] text-d-text-2 hover:text-d-text">
            Cancel
          </button>
          <button disabled={!!problem} className="h-8 rounded-[4px] bg-d-text px-3 text-[12.5px] font-semibold text-d-bg disabled:opacity-40">
            {kind === "channel" ? "Create channel" : "Start conversation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ManageChannelDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, updateChannel } = useChat();
  const ch = s.channels.find((c) => c.id === id);
  const [topic, setTopic] = useState(ch?.topic ?? "");
  const [people, setPeople] = useState<string[]>(ch?.members.filter((m) => m !== VIEWER && !isExternal(m)) ?? []);
  if (!ch) return null;
  const outside = ch.members.filter(isExternal);
  return (
    <Modal label={`#${ch.name}`} onClose={onClose} width={520}>
      <div className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-d-text-2">Topic</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className={fieldCls} />
        </label>
        {ch.external ? (
          <p className="text-[12px] text-d-text-3">
            This channel is shared with {outside.map(personName).join(", ")}. People outside the firm are added through a channel request.
          </p>
        ) : (
          <div>
            <span className="mb-1.5 block text-[12px] text-d-text-2">People</span>
            <PeoplePicker value={people} onChange={setPeople} />
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-d-line pt-3">
          <button
            onClick={() => {
              updateChannel(id, { archived: !ch.archived });
              onClose();
            }}
            className="h-8 rounded-[4px] px-3 text-[12.5px] text-d-text-2 hover:bg-d-raise hover:text-d-text"
          >
            {ch.archived ? "Restore channel" : "Archive channel"}
          </button>
          <span className="ml-auto" />
          <button onClick={onClose} className="h-8 rounded-[4px] px-3 text-[12.5px] text-d-text-2 hover:text-d-text">
            Cancel
          </button>
          <button
            onClick={() => {
              updateChannel(id, { topic: topic.trim(), members: ch.external ? ch.members : [...new Set([VIEWER, ...people])] });
              onClose();
            }}
            className="h-8 rounded-[4px] bg-d-text px-3 text-[12.5px] font-semibold text-d-bg"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
