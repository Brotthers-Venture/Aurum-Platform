"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Clock, ListFilter, Menu as MenuIcon, Paperclip, Search, X } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { withTenant } from "@/lib/brand";
import { Menu, menuHead, menuItem } from "@/components/shell/WorkstationTopBar";
import {
  MATTER_STATUSES,
  VIEWER,
  chatPeople,
  clientWaiting,
  directLabel,
  isExternal,
  matchesFilters,
  personName,
  priorityRank,
  waited,
  type Filters,
  type LinkKind,
  type Matter,
} from "@/lib/chat";
import { visibleInbox } from "@/lib/chat-store";
import { useChat } from "./context";
import { Highlight, Kbd, StatusRing, relTime, shortDay } from "./ui";
import { ModeSwitch } from "./ModeSwitch";

const LINK_LABEL: Record<LinkKind, string> = {
  call: "Capital calls",
  subscription: "Subscriptions",
  investor: "Investors",
  bank: "Bank details",
  room: "Data rooms",
  formation: "Formations",
  plan: "Project plans",
  vehicle: "Vehicles",
  access: "Access",
};

function Chip({ label, value, children, onClear, wide }: { label: string; value?: string; children: (close: () => void) => ReactNode; onClear?: () => void; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <span className={cx("flex h-6 items-center rounded-[4px] border text-[11.5px]", value ? "border-d-line-strong bg-d-raise text-d-text" : "border-d-line text-d-text-2")}>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-full items-center gap-1 pl-2 pr-1.5 hover:text-d-text">
          <span>
            {label}
            {value && <span className="font-medium">{": " + value}</span>}
          </span>
          {wide ? <ListFilter size={12} className="order-first" /> : !value && <ChevronDown size={11} />}
        </button>
        {value && onClear && (
          <button onClick={onClear} aria-label={`Clear ${label}`} className="flex h-full items-center pr-1.5 text-d-text-3 hover:text-d-text">
            <X size={11} />
          </button>
        )}
      </span>
      {open && <Menu className={cx("left-0 top-7 overflow-y-auto", wide ? "max-h-[min(460px,70vh)] w-[260px]" : "max-h-[320px] w-[220px]")}>{children(() => setOpen(false))}</Menu>}
    </div>
  );
}

function MatterRow({ m, active, onClick, now, q }: { m: Matter; active: boolean; onClick: () => void; now: number; q: string }) {
  const { s } = useChat();
  const last = s.messages.filter((x) => x.where === m.id).at(-1);
  const isUnread = !!last && last.author !== VIEWER && (s.read[m.id] ?? "") < last.at && last.at > "2026-11-24T00:00:00Z";
  const wait = m.status !== "Resolved" ? clientWaiting(m.id, s.messages) : null;
  return (
    <button
      onClick={onClick}
      data-matter={m.id}
      title={`${m.ref} · ${m.title} — ${m.linked.label}`}
      aria-current={active ? "true" : undefined}
      className={cx(
        "relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-x-3 px-4 py-2.5 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--d-raise)_55%,transparent)]",
        active && "bg-d-raise hover:bg-d-raise",
      )}
    >
      {active && <span aria-hidden className="absolute bottom-1.5 left-0 top-1.5 w-0.5 bg-d-accent-fill" />}
      <span className="pt-0.5">
        <StatusRing status={m.status} />
      </span>
      <span className="min-w-0">
        <span className={cx("line-clamp-2 text-[13.5px] leading-snug", isUnread ? "font-semibold text-d-text" : "text-d-text")}>
          {isUnread && <span className="mb-[2px] mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-d-text align-middle" aria-label="Unread" />}
          <Highlight text={m.title} q={q} />
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-d-text-3">
          <span className="truncate">{m.linked.label}</span>
          {m.dueDate && m.status !== "Resolved" && <span className="tnum shrink-0">· due {shortDay(m.dueDate)}</span>}
          {wait && now > 0 && <span className="shrink-0 font-medium text-d-warn">· client waiting {waited(wait, now)}</span>}
        </span>
      </span>
      <span className="tnum self-start pt-0.5 text-[11.5px] text-d-text-3">{relTime(m.updatedAt, now)}</span>
    </button>
  );
}

function sortMatters(ms: Matter[], sort: "updated" | "due" | "priority") {
  return [...ms].sort((a, b) =>
    sort === "due"
      ? (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
      : sort === "priority"
        ? priorityRank[a.priority] - priorityRank[b.priority] || b.updatedAt.localeCompare(a.updatedAt)
        : b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function ListPane({ onMenu, setList }: { onMenu: () => void; setList: (ids: string[]) => void }) {
  const api = useChat();
  const { brand } = useBrand();
  const t = (x: string) => withTenant(x, brand.name);
  const { s, nav, now, q, setQ, filters, setFilters, group, setGroup, sort, setSort, selected, select, setNav, inboxAct, saveView, mode, setMode } = api;
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [viewName, setViewName] = useState("");

  const title =
    nav.kind === "inbox"
      ? "Inbox"
      : nav.kind === "assigned"
        ? "Assigned to me"
        : nav.kind === "mentions"
          ? "Mentions"
          : nav.kind === "drafts"
            ? "Drafts"
            : nav.kind === "view"
              ? (s.views.find((v) => v.id === nav.id)?.name ?? "Matters")
              : "";

  const matters = useMemo(
    () =>
      sortMatters(
        s.matters.filter((m) => matchesFilters(m, filters, s.messages)),
        sort,
      ),
    [s.matters, s.messages, filters, sort],
  );
  const groups = useMemo(() => {
    const keyOf = (m: Matter) => (group === "status" ? m.status : LINK_LABEL[m.linked.kind]);
    const order = group === "status" ? ["Awaiting approval", "Awaiting client", "Open", "Resolved"] : Object.values(LINK_LABEL);
    const map = new Map<string, Matter[]>();
    for (const m of matters) map.set(keyOf(m), [...(map.get(keyOf(m)) ?? []), m]);
    return order.filter((k) => map.has(k)).map((k) => ({ key: k, items: map.get(k)! }));
  }, [matters, group]);

  const inbox = visibleInbox(s, new Date(now || Date.parse("2026-11-25")).toISOString());
  const mentions = s.messages.filter((m) => m.mentions?.includes(VIEWER) && !s.inbox[m.id]?.done).sort((a, b) => b.at.localeCompare(a.at));
  const drafts = Object.entries(s.drafts).filter(([, d]) => d.trim());

  // search across matters, messages and attachments
  const term = q.trim().toLowerCase();
  const results = term
    ? {
        matters: s.matters.filter((m) => (m.title + " " + m.ref + " " + m.linked.label).toLowerCase().includes(term)),
        messages: s.messages
          .filter((m) => m.kind === "message" && m.body.toLowerCase().includes(term))
          .slice(-30)
          .reverse(),
        files: s.messages.flatMap((m) => (m.attachments ?? []).filter((a) => a.name.toLowerCase().includes(term)).map((a) => ({ a, m }))).slice(0, 20),
      }
    : null;

  const ids = results ? results.matters.map((m) => m.id) : nav.kind === "view" || nav.kind === "assigned" ? groups.flatMap((g) => g.items.map((m) => m.id)) : [];
  useEffect(() => {
    setList(ids);
  }, [ids.join(","), setList]); // eslint-disable-line react-hooks/exhaustive-deps

  const openWhere = (where: string) => {
    if (s.matters.some((m) => m.id === where)) select(where);
    else setNav({ kind: "conv", id: where });
  };
  const nActive = (["status", "owner", "linked", "label", "external"] as const).filter((k) => filters[k]).length;
  const filtered = JSON.stringify(filters) !== JSON.stringify(s.views.find((v) => nav.kind === "view" && v.id === nav.id)?.filters ?? null);
  const where = (id: string) =>
    s.matters.find((m) => m.id === id)?.ref ??
    (s.channels.find((c) => c.id === id)
      ? "#" + s.channels.find((c) => c.id === id)!.name
      : (() => {
          const d = s.directs.find((x) => x.id === id);
          return d ? directLabel(d) : "";
        })());

  return (
    <section aria-label={title} className="chat-list flex h-full flex-col bg-d-bg">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-d-line px-3">
        <button onClick={onMenu} aria-label="Open navigation" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise lg:hidden">
          <MenuIcon size={16} />
        </button>
        <h2 className="shrink-0 text-[13.5px] font-semibold">{title}</h2>
        <ModeSwitch />
        <label className="ml-auto flex h-7 min-w-0 max-w-[200px] flex-1 items-center gap-1.5 rounded-[4px] border border-d-line bg-d-surface px-2 text-d-text-3 focus-within:border-d-line-strong">
          <Search size={13} className="shrink-0" />
          <input
            id="chat-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search matters, messages and files"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-d-text placeholder:text-d-text-3 focus:outline-none"
          />
          {q ? (
            <button onClick={() => setQ("")} aria-label="Clear search">
              <X size={12} />
            </button>
          ) : (
            <Kbd>/</Kbd>
          )}
        </label>
      </div>

      {(nav.kind === "view" || nav.kind === "assigned") && !results && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-d-line-soft px-3 py-2">
          <Chip label={`Filter${nActive ? ` · ${nActive}` : ""}`} wide>
            {(close) => (
              <>
                <div className={menuHead}>Status</div>
                {(["open", ...MATTER_STATUSES] as Filters["status"][]).map((st) => (
                  <button key={st} className={menuItem} onClick={() => (setFilters({ ...filters, status: filters.status === st ? undefined : st }), close())}>
                    {st === "open" ? "Not resolved" : st}
                    {filters.status === st && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
                <div className={menuHead}>Owner</div>
                {chatPeople
                  .filter((p) => !isExternal(p.id) && s.matters.some((m) => m.owner === p.id))
                  .map((p) => (
                    <button key={p.id} className={menuItem} onClick={() => (setFilters({ ...filters, owner: filters.owner === p.id ? undefined : p.id }), close())}>
                      {p.name}
                      {filters.owner === p.id && <Check size={13} className="ml-auto" />}
                    </button>
                  ))}
                <div className={menuHead}>Linked record</div>
                {[...new Set(s.matters.map((m) => m.linked.kind))].map((k) => (
                  <button key={k} className={menuItem} onClick={() => (setFilters({ ...filters, linked: filters.linked === k ? undefined : k }), close())}>
                    {LINK_LABEL[k]}
                    {filters.linked === k && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
                <div className={menuHead}>Label</div>
                {[...new Set(s.matters.flatMap((m) => m.labels))].sort().map((l) => (
                  <button key={l} className={menuItem} onClick={() => (setFilters({ ...filters, label: filters.label === l ? undefined : l }), close())}>
                    {l}
                    {filters.label === l && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
                <div className={menuHead}>Participants</div>
                <button className={menuItem} onClick={() => (setFilters({ ...filters, external: filters.external ? undefined : true }), close())}>
                  Includes external participants
                  {filters.external && <Check size={13} className="ml-auto" />}
                </button>
                <div className={menuHead}>Group by</div>
                {(["status", "linked"] as const).map((g) => (
                  <button key={g} className={menuItem} onClick={() => (setGroup(g), close())}>
                    {g === "status" ? "Status" : "Linked record"}
                    {group === g && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
                <div className={menuHead}>Sort by</div>
                {(["updated", "due", "priority"] as const).map((o) => (
                  <button key={o} className={menuItem} onClick={() => (setSort(o), close())}>
                    {o === "updated" ? "Last updated" : o === "due" ? "Due date" : "Priority"}
                    {sort === o && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
              </>
            )}
          </Chip>
          {(
            [
              ["status", filters.status ? (filters.status === "open" ? "Not resolved" : filters.status) : undefined],
              ["owner", filters.owner ? personName(filters.owner).split(" ")[0] : undefined],
              ["linked", filters.linked ? LINK_LABEL[filters.linked] : undefined],
              ["label", filters.label],
              ["external", filters.external ? "External" : undefined],
            ] as const
          )
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <span key={k} className="flex h-6 items-center gap-1 rounded-[4px] bg-d-raise pl-2 pr-1 text-[11.5px] text-d-text">
                {v}
                <button onClick={() => setFilters({ ...filters, [k]: undefined })} aria-label={`Clear ${v}`} className="text-d-text-3 hover:text-d-text">
                  <X size={11} />
                </button>
              </span>
            ))}
          {filtered && !naming && (
            <button onClick={() => setNaming(true)} className="ml-auto h-6 rounded-[4px] px-1.5 text-[11.5px] text-d-text-2 underline-offset-2 hover:text-d-text hover:underline">
              Save view
            </button>
          )}
          {naming && (
            <form
              className="ml-auto flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (viewName.trim()) saveView(viewName.trim());
                setNaming(false);
                setViewName("");
              }}
            >
              <input
                autoFocus
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="View name"
                aria-label="View name"
                className="h-6 w-28 rounded-[4px] border border-d-line-strong bg-d-surface px-1.5 text-[11.5px] focus:outline-none"
              />
              <button className="h-6 rounded-[4px] border border-d-line-strong px-2 text-[11.5px]">Save</button>
            </form>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto" role="list">
        {results ? (
          <SearchResults q={q} results={results} open={openWhere} where={where} tenant={brand.name} />
        ) : nav.kind === "inbox" ? (
          inbox.length === 0 ? (
            <Empty title="You're all caught up" body="Mentions, assignments, approvals and client replies land here." />
          ) : (
            inbox.map((i) => {
              const st = s.inbox[i.id];
              const active = activeItem === i.id;
              return (
                <div key={i.id} data-inbox-selected={active ? "" : undefined} className={cx("group relative border-b border-d-line-soft", active && "bg-d-raise")}>
                  {active && <span aria-hidden className="absolute bottom-1.5 left-0 top-1.5 w-0.5 bg-d-accent-fill" />}
                  <button
                    onClick={() => {
                      setActiveItem(i.id);
                      openWhere(i.where);
                      if (!st?.read) inboxAct(i.id, "read");
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-d-surface-2"
                  >
                    <span className="flex items-center gap-2 text-[11.5px] text-d-text-3">
                      {!st?.read && <span className="h-1.5 w-1.5 rounded-full bg-d-text" aria-label="Unread" />}
                      <span className={cx(!st?.read && "font-medium text-d-text-2")}>{i.reason}</span>
                      <span>· {where(i.where)}</span>
                      <span className="tnum ml-auto">{relTime(i.at, now)}</span>
                    </span>
                    <span className={cx("mt-1 line-clamp-2 block text-[13px]", !st?.read ? "font-medium text-d-text" : "text-d-text-2")}>
                      {t(i.reason === "Mention" || i.reason === "Client reply" ? `${personName(i.author)}: ${i.text}` : i.text)}
                    </span>
                  </button>
                  <div className="absolute right-2 top-1.5 hidden gap-0.5 rounded-[4px] bg-d-surface p-0.5 shadow-[var(--d-pop)] group-hover:flex group-has-[:focus-visible]:flex [@media(hover:none)]:flex">
                    <IconAct label={st?.read ? "Mark unread" : "Mark read"} onClick={() => inboxAct(i.id, st?.read ? "unread" : "read")}>
                      <span className="block h-2 w-2 rounded-full border border-current" />
                    </IconAct>
                    <SnoozeMenu onPick={(a) => inboxAct(i.id, a)} />
                    <IconAct label="Mark done (E)" onClick={() => inboxAct(i.id, "done")} act="done">
                      <Check size={13} />
                    </IconAct>
                  </div>
                </div>
              );
            })
          )
        ) : nav.kind === "mentions" ? (
          mentions.length === 0 ? (
            <Empty title="No mentions" body="When someone writes @ and your name, it appears here." />
          ) : (
            mentions.map((m) => (
              <button key={m.id} onClick={() => openWhere(m.where)} className="w-full border-b border-d-line-soft px-4 py-2.5 text-left hover:bg-d-surface-2">
                <span className="flex text-[11.5px] text-d-text-3">
                  {personName(m.author)} · {where(m.where)}
                  <span className="tnum ml-auto">{relTime(m.at, now)}</span>
                </span>
                <span className="mt-1 line-clamp-2 block text-[13px] text-d-text">{t(m.body)}</span>
              </button>
            ))
          )
        ) : nav.kind === "drafts" ? (
          drafts.length === 0 ? (
            <Empty title="No drafts" body="Unsent messages are kept here per matter, so you can come back to them." />
          ) : (
            drafts.map(([w, d]) => (
              <button key={w} onClick={() => openWhere(w)} className="w-full border-b border-d-line-soft px-4 py-2.5 text-left hover:bg-d-surface-2">
                <span className="text-[11.5px] text-d-text-3">{where(w)}</span>
                <span className="mt-1 line-clamp-2 block text-[13px] text-d-text-2">{t(d)}</span>
              </button>
            ))
          )
        ) : groups.length === 0 ? (
          <Empty title="No matters match these filters" body="Clear a filter or start a new matter with C." />
        ) : (
          groups.map((g) => (
            <div key={g.key} role="group" aria-label={g.key}>
              <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-d-line-soft chat-list-head bg-d-bg/95 px-4 py-1.5 text-[11.5px] font-medium text-d-text-3 backdrop-blur-[2px]">
                {group === "status" && <StatusRing status={g.items[0].status} size={12} />}
                {g.key}
                <span className="tnum">{g.items.length}</span>
              </div>
              {g.items.map((m) => (
                <MatterRow key={m.id} m={m} active={selected === m.id} onClick={() => (select(m.id), mode === "inbox" && setMode("conversation"))} now={now} q="" />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function IconAct({ label, onClick, children, act }: { label: string; onClick: () => void; children: ReactNode; act?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      data-act={act}
      className="flex h-6 w-6 items-center justify-center rounded-[3px] text-d-text-2 hover:bg-d-raise hover:text-d-text"
    >
      {children}
    </button>
  );
}

function SnoozeMenu({ onPick }: { onPick: (a: "snooze-1h" | "snooze-tomorrow" | "snooze-week") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <IconAct label="Snooze" onClick={() => setOpen((o) => !o)}>
        <Clock size={13} />
      </IconAct>
      {open && (
        <Menu className="right-0 top-7 w-[170px]">
          {(
            [
              ["snooze-1h", "For one hour"],
              ["snooze-tomorrow", "Until tomorrow, 08:00"],
              ["snooze-week", "For a week"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={menuItem} onClick={() => (onPick(k), setOpen(false))}>
              {l}
            </button>
          ))}
        </Menu>
      )}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="text-[13px] font-medium text-d-text">{title}</div>
      <p className="mx-auto mt-1 max-w-[260px] text-[12px] text-d-text-3">{body}</p>
    </div>
  );
}

function H({ children }: { children: ReactNode }) {
  return <div className="border-b border-d-line-soft px-4 pb-1.5 pt-3 text-[11.5px] font-medium text-d-text-3">{children}</div>;
}

function SearchResults({
  q,
  results,
  open,
  where,
  tenant,
}: {
  q: string;
  results: { matters: Matter[]; messages: { id: string; where: string; body: string; author: string }[]; files: { a: { name: string }; m: { id: string; where: string } }[] };
  open: (where: string) => void;
  where: (id: string) => string;
  tenant: string;
}) {
  const none = !results.matters.length && !results.messages.length && !results.files.length;
  if (none) return <Empty title={`Nothing found for “${q}”`} body="Search looks in matter titles and references, messages and attachment names." />;
  return (
    <>
      {results.matters.length > 0 && <H>Matters</H>}
      {results.matters.map((m) => (
        <button key={m.id} onClick={() => open(m.id)} className="flex w-full items-center gap-2.5 border-b border-d-line-soft px-4 py-2 text-left hover:bg-d-surface-2">
          <StatusRing status={m.status} />
          <span className="tnum text-[11px] text-d-text-3">{m.ref}</span>
          <span className="truncate text-[13px]">
            <Highlight text={m.title} q={q} />
          </span>
        </button>
      ))}
      {results.messages.length > 0 && <H>Messages</H>}
      {results.messages.map((m) => (
        <button key={m.id} onClick={() => open(m.where)} className="w-full border-b border-d-line-soft px-4 py-2 text-left hover:bg-d-surface-2">
          <span className="text-[11.5px] text-d-text-3">
            {personName(m.author)} · {where(m.where)}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[12.5px] text-d-text-2">
            <Highlight text={withTenant(m.body, tenant)} q={q} />
          </span>
        </button>
      ))}
      {results.files.length > 0 && <H>Files</H>}
      {results.files.map(({ a, m }, i) => (
        <button key={m.id + i} onClick={() => open(m.where)} className="flex w-full items-center gap-2 border-b border-d-line-soft px-4 py-2 text-left hover:bg-d-surface-2">
          <Paperclip size={13} className="text-d-text-3" />
          <span className="truncate text-[12.5px]">
            <Highlight text={a.name} q={q} />
          </span>
          <span className="ml-auto shrink-0 text-[11px] text-d-text-3">{where(m.where)}</span>
        </button>
      ))}
    </>
  );
}
