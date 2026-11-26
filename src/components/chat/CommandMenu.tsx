"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Hash, Inbox, Keyboard, Layers, Moon, PenSquare, Search, Sun, UserRound } from "lucide-react";
import { cx } from "@/components/ui";
import { useTheme } from "@/components/shell/ThemeProvider";
import { MATTER_STATUSES, VIEWER, chatPeople, isExternal, personName } from "@/lib/chat";
import { capitalCalls, fundById, funds, investors } from "@/lib/data";
import { useChat } from "./context";
import { Avatar, Kbd, StatusRing } from "./ui";

type Item = { id: string; group: string; label: string; sub?: string; icon: ReactNode; run: () => void; keys?: string };

/** Ctrl/⌘ K — jump to any matter, channel, person or record, and run actions. Combobox + listbox semantics. */
export function CommandMenu({ onClose, onHelp }: { onClose: () => void; onHelp: () => void }) {
  const api = useChat();
  const { s, selected, setNav, select, openNew, setStatus, setPropMenu, flash } = api;
  const { theme, setPref } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sel = s.matters.find((m) => m.id === selected);

  const items = useMemo<Item[]>(() => {
    const go = (fn: () => void) => () => {
      fn();
      onClose();
    };
    const actions: Item[] = [
      { id: "a-new", group: "Actions", label: "New matter", icon: <PenSquare size={15} />, run: go(() => openNew()), keys: "C" },
      ...(sel
        ? [
            ...MATTER_STATUSES.filter((x) => x !== sel.status).map((st) => ({
              id: "a-st-" + st,
              group: "Actions",
              label: `Change status to ${st}`,
              sub: sel.ref,
              icon: <StatusRing status={st} />,
              run: go(() => setStatus(sel.id, st)),
            })),
            { id: "a-assign", group: "Actions", label: "Assign…", sub: sel.ref, icon: <UserRound size={15} />, run: go(() => setPropMenu("owner")), keys: "A" },
          ]
        : []),
      { id: "a-inbox", group: "Actions", label: "Go to inbox", icon: <Inbox size={15} />, run: go(() => setNav({ kind: "inbox" })), keys: "G I" },
      {
        id: "a-theme",
        group: "Actions",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: theme === "dark" ? <Sun size={15} /> : <Moon size={15} />,
        run: go(() => setPref(theme === "dark" ? "light" : "dark")),
      },
      { id: "a-keys", group: "Actions", label: "Keyboard shortcuts", icon: <Keyboard size={15} />, run: go(onHelp), keys: "?" },
    ];
    const matters: Item[] = s.matters.map((m) => ({
      id: m.id,
      group: "Matters",
      label: m.title,
      sub: `${m.ref} · ${m.linked.label}`,
      icon: <StatusRing status={m.status} />,
      run: go(() => (setNav({ kind: "view", id: "v-open" }), select(m.id))),
    }));
    const channels: Item[] = s.channels.map((c) => ({
      id: c.id,
      group: "Channels",
      label: c.name,
      sub: c.topic,
      icon: <Hash size={15} />,
      run: go(() => setNav({ kind: "conv", id: c.id })),
    }));
    const views: Item[] = s.views.map((v) => ({ id: v.id, group: "Views", label: v.name, icon: <Layers size={15} />, run: go(() => setNav({ kind: "view", id: v.id })) }));
    const people: Item[] = chatPeople
      .filter((p) => p.id !== VIEWER)
      .map((p) => {
        const dm = s.directs.find((d) => d.members.includes(p.id) && d.members.length === 2);
        return {
          id: "p-" + p.id,
          group: "People",
          label: p.name,
          sub: p.title + (isExternal(p.id) ? " · External" : ""),
          icon: <Avatar id={p.id} size={18} />,
          run: go(() => (dm ? setNav({ kind: "conv", id: dm.id }) : flash(`No direct conversation with ${personName(p.id)} yet — mention them in a matter with @.`))),
        };
      });
    const records: Item[] = [
      ...capitalCalls.map((c) => ({
        id: "r-" + c.id,
        group: "Records",
        label: `Capital Call No. ${c.number}`,
        sub: `${fundById(c.fundId)?.shortName} · ${c.status}`,
        icon: <ArrowRight size={15} />,
        run: go(() => router.push("/admin/fund/capital-calls")),
      })),
      ...funds.map((f) => ({
        id: "r-" + f.id,
        group: "Records",
        label: f.name,
        sub: f.status,
        icon: <ArrowRight size={15} />,
        run: go(() => router.push(`/admin/fund/funds/${f.id}`)),
      })),
      ...investors.map((i) => ({
        id: "r-" + i.id,
        group: "Records",
        label: i.name,
        sub: i.type,
        icon: <ArrowRight size={15} />,
        run: go(() => router.push("/admin/fund/investors")),
      })),
    ];
    return [...actions, ...matters, ...views, ...channels, ...people, ...records];
  }, [s, sel, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const term = q.trim().toLowerCase();
  const shown = term
    ? items.filter((i) => (i.label + " " + (i.sub ?? "") + " " + i.group).toLowerCase().includes(term)).slice(0, 40)
    : items.filter((i) => i.group !== "Records" && i.group !== "People").slice(0, 24);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[620px] overflow-hidden rounded-[8px] bg-d-surface shadow-[var(--d-pop)]"
      >
        <div className="flex items-center gap-2.5 border-b border-d-line px-4">
          <Search size={16} className="text-d-text-3" />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={shown[idx] ? "cmd-" + shown[idx].id : undefined}
            value={q}
            onChange={(e) => (setQ(e.target.value), setIdx(0))}
            onKeyDown={(e) => {
              const keys: Record<string, () => void> = {
                ArrowDown: () => setIdx((i) => Math.min(shown.length - 1, i + 1)),
                ArrowUp: () => setIdx((i) => Math.max(0, i - 1)),
                Home: () => setIdx(0),
                End: () => setIdx(shown.length - 1),
                Enter: () => shown[idx]?.run(),
                Escape: onClose,
              };
              if (keys[e.key]) {
                e.preventDefault();
                keys[e.key]();
              }
            }}
            placeholder="Search matters, channels, people and records, or run an action"
            className="h-12 flex-1 bg-transparent text-[14px] text-d-text placeholder:text-d-text-3 focus:outline-none focus-visible:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div id="cmd-list" role="listbox" ref={listRef} className="max-h-[56vh] overflow-y-auto p-1.5">
          {shown.length === 0 && <div className="px-3 py-10 text-center text-[12.5px] text-d-text-3">No results for “{q}”.</div>}
          {shown.map((it, i) => {
            const head = i === 0 || shown[i - 1].group !== it.group;
            return (
              <div key={it.id}>
                {head && <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold text-d-text-3">{it.group}</div>}
                <button
                  id={"cmd-" + it.id}
                  data-i={i}
                  role="option"
                  aria-selected={i === idx}
                  onMouseMove={() => setIdx(i)}
                  onClick={it.run}
                  className={cx("flex h-9 w-full items-center gap-3 rounded-[4px] px-2.5 text-left text-[13px]", i === idx && "bg-d-raise")}
                >
                  <span className="flex w-5 shrink-0 justify-center text-d-text-2">{it.icon}</span>
                  <span className="min-w-0 truncate">{it.label}</span>
                  {it.sub && <span className="min-w-0 truncate text-[12px] text-d-text-3">{it.sub}</span>}
                  {it.keys && (
                    <span className="ml-auto flex shrink-0 gap-1">
                      {it.keys.split(" ").map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-d-line-soft px-4 py-2 text-[11px] text-d-text-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> open
          </span>
          <span className="ml-auto">
            {api.s.matters.length} matters · {api.s.channels.length} channels
          </span>
        </div>
      </div>
    </div>
  );
}
