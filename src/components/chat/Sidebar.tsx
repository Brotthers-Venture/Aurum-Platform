"use client";

import { AtSign, ChevronDown, FilePen, Hash, Inbox, Layers, PenSquare, UserRoundCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { moduleName } from "@/lib/brand";
import { VIEWER, matchesFilters, personName } from "@/lib/chat";
import { counts, unread } from "@/lib/chat-store";
import { useChat, type Nav } from "./context";
import { Avatar, Kbd } from "./ui";

function Row({
  active,
  onClick,
  icon,
  label,
  count,
  trailing,
  strong,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: ReactNode;
  count?: number;
  trailing?: ReactNode;
  strong?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cx(
        "relative flex h-[29px] w-full items-center gap-2.5 rounded-[4px] pl-2.5 pr-2 text-left text-[13px] text-d-text-2 hover:bg-d-raise hover:text-d-text",
        active && "bg-d-raise text-d-text",
        strong && "font-semibold text-d-text",
      )}
    >
      {active && <span aria-hidden className="absolute -left-2.5 top-1.5 bottom-1.5 w-0.5 rounded-full bg-d-accent-fill" />}
      <span className="flex w-4 shrink-0 justify-center text-d-text-3">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
      {!!count && <span className="tnum text-[11.5px] text-d-text-3">{count}</span>}
    </button>
  );
}

function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-4">
      <div className="flex items-center pr-1">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex h-6 flex-1 items-center gap-1 px-2.5 text-left text-[11.5px] font-medium text-d-text-3 hover:text-d-text-2"
        >
          {title}
          <ChevronDown size={12} className={cx("transition-transform", !open && "-rotate-90")} />
        </button>
        {action}
      </div>
      {open && <div className="mt-0.5 space-y-px">{children}</div>}
    </div>
  );
}

export function Sidebar({ brandName, onClose }: { brandName: string; onClose: () => void }) {
  const { s, nav, setNav, openNew, openCmd } = useChat();
  const { brand } = useBrand();
  const c = counts(s);
  const is = (n: Nav) => JSON.stringify(n) === JSON.stringify(nav);
  return (
    <aside aria-label={moduleName(brand, "communication")} className="chat-nav flex h-full flex-col border-r border-d-line bg-d-chrome">
      <div className="flex h-12 shrink-0 items-center gap-2 pl-4 pr-2">
        <h1 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{moduleName(brand, "communication")}</h1>
        <button
          onClick={() => openNew()}
          aria-label="New matter (C)"
          title="New matter · C"
          className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise hover:text-d-text"
        >
          <PenSquare size={15} />
        </button>
        <button onClick={onClose} aria-label="Close navigation" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise lg:hidden">
          <X size={15} />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        <div className="space-y-px">
          <Row
            active={is({ kind: "inbox" })}
            onClick={() => setNav({ kind: "inbox" })}
            icon={<Inbox size={15} />}
            label="Inbox"
            count={c.inbox}
            strong={c.inbox > 0 && !is({ kind: "inbox" })}
          />
          <Row active={is({ kind: "assigned" })} onClick={() => setNav({ kind: "assigned" })} icon={<UserRoundCheck size={15} />} label="Assigned to me" count={c.assigned} />
          <Row active={is({ kind: "mentions" })} onClick={() => setNav({ kind: "mentions" })} icon={<AtSign size={15} />} label="Mentions" count={c.mentions} />
          <Row active={is({ kind: "drafts" })} onClick={() => setNav({ kind: "drafts" })} icon={<FilePen size={15} />} label="Drafts" count={c.drafts} />
        </div>

        <Group title="Matters">
          {s.views.map((v) => (
            <Row
              key={v.id}
              active={is({ kind: "view", id: v.id })}
              onClick={() => setNav({ kind: "view", id: v.id })}
              icon={<Layers size={14} />}
              label={v.name}
              count={s.matters.filter((m) => matchesFilters(m, v.filters, s.messages)).length}
            />
          ))}
        </Group>

        <Group title="Internal channels">
          {s.channels
            .filter((ch) => !ch.external)
            .map((ch) => {
              const u = unread(s, ch.id);
              return (
                <Row
                  key={ch.id}
                  active={is({ kind: "conv", id: ch.id })}
                  onClick={() => setNav({ kind: "conv", id: ch.id })}
                  icon={<Hash size={14} />}
                  label={ch.name}
                  strong={u > 0}
                  count={u}
                />
              );
            })}
        </Group>

        <Group title="External channels">
          {s.channels
            .filter((ch) => ch.external)
            .map((ch) => {
              const u = unread(s, ch.id);
              return (
                <Row
                  key={ch.id}
                  active={is({ kind: "conv", id: ch.id })}
                  onClick={() => setNav({ kind: "conv", id: ch.id })}
                  icon={<Hash size={14} />}
                  label={ch.name}
                  strong={u > 0}
                  count={u}
                />
              );
            })}
        </Group>

        <Group title="Direct messages">
          {s.directs.map((d) => {
            const other = d.members.find((m) => m !== VIEWER) ?? VIEWER;
            const u = unread(s, d.id);
            return (
              <Row
                key={d.id}
                active={is({ kind: "conv", id: d.id })}
                onClick={() => setNav({ kind: "conv", id: d.id })}
                icon={<Avatar id={other} size={16} />}
                label={personName(other)}
                strong={u > 0}
                count={u}
              />
            );
          })}
        </Group>
      </nav>
      <div className="flex shrink-0 items-center justify-between border-t border-d-line-soft px-4 py-2.5 text-[11.5px] text-d-text-3">
        <span className="truncate">
          {personName(VIEWER)} · {brandName}
        </span>
        <button onClick={openCmd} className="flex items-center gap-1 hover:text-d-text-2" aria-label="Keyboard shortcuts and commands">
          <Kbd>?</Kbd>
        </button>
      </div>
    </aside>
  );
}
