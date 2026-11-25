"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronDown, CornerDownRight, FileText, Hash, Menu as MenuIcon, MoreHorizontal, PanelRight, Pencil, Reply, ShieldAlert, X } from "lucide-react";
import { cx } from "@/components/ui";
import { Menu, menuHead, menuItem } from "@/components/shell/WorkstationTopBar";
import { useBrand } from "@/components/brand/BrandProvider";
import { withTenant } from "@/lib/brand";
import { MATTER_STATUSES, PRIORITIES, REACTIONS, VIEWER, chatPeople, isExternal, personName, type ChatMessage, type Matter } from "@/lib/chat";
import { useChat } from "./context";
import { Composer } from "./Composer";
import { ContextRail } from "./Rail";
import { Avatar, ExternalTag, PriorityMark, RichText, StatusRing, clock, dayLabel, fileSize, shortDay } from "./ui";

function Prop({ label, open, onToggle, children, value }: { label: string; open: boolean; onToggle: () => void; children: ReactNode; value: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onToggle();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onToggle]);
  return (
    <div ref={ref} className="relative">
      <button onClick={onToggle} aria-expanded={open} aria-haspopup="menu" className="flex h-7 items-center gap-1.5 rounded-[4px] border border-transparent px-1.5 text-[12.5px] text-d-text hover:border-d-line hover:bg-d-surface-2">
        <span className="text-d-text-3">{label}</span>
        {value}
      </button>
      {open && <Menu className="left-0 top-8 w-[230px]">{children}</Menu>}
    </div>
  );
}

function MatterHeader({ m }: { m: Matter }) {
  const { propMenu, setPropMenu, setStatus, setOwner, setPriority, setDue, rail, setRail, canDecide, decide, setMobilePane } = useChat();
  const toggle = (k: "status" | "owner" | "priority" | "due") => () => setPropMenu(propMenu === k ? null : k);
  const d = canDecide(m);
  const [note, setNote] = useState("");
  const [more, setMore] = useState(false);
  const showProps = more || !!propMenu;
  return (
    <header className="shrink-0 border-b border-d-line bg-d-bg">
      <div className="flex h-12 items-center gap-2 px-4">
        <button onClick={() => setMobilePane("list")} aria-label="Back to list" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise md:hidden">
          <ArrowLeft size={16} />
        </button>
        <span className="tnum shrink-0 rounded-[3px] border border-d-line px-1.5 text-[11px] text-d-text-3">{m.ref}</span>
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold">{m.title}</h2>
        <button onClick={() => setRail(!rail)} aria-pressed={rail} aria-label={rail ? "Hide record details" : "Show record details"} title="Record details" className={cx("flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise hover:text-d-text", rail && "bg-d-raise text-d-text")}>
          <PanelRight size={15} />
        </button>
      </div>
      {/* Phones: one summary line that expands on tap */}
      <button
        onClick={() => setMore((x) => !x)}
        aria-expanded={showProps}
        className="flex w-full items-center gap-2 px-4 pb-2.5 text-left text-[12.5px] text-d-text-2 md:hidden"
      >
        <StatusRing status={m.status} size={12} />
        <span className="min-w-0 flex-1 truncate">
          {m.status} · {personName(m.owner)} · {m.priority}
          {m.dueDate ? ` · due ${shortDay(m.dueDate)}` : ""}
        </span>
        <ChevronDown size={14} className={cx("shrink-0 transition-transform", showProps && "rotate-180")} />
      </button>
      <div className={cx("flex-wrap items-center gap-x-1 gap-y-1 px-3 pb-2.5", showProps ? "flex" : "hidden md:flex")}>
        <Prop label="Status" open={propMenu === "status"} onToggle={toggle("status")} value={<span className="flex items-center gap-1.5"><StatusRing status={m.status} size={12} />{m.status}</span>}>
          <div className={menuHead}>Status · S</div>
          {MATTER_STATUSES.map((st) => (
            <button key={st} className={menuItem} onClick={() => (setStatus(m.id, st), setPropMenu(null))}>
              <StatusRing status={st} size={12} /> {st}
              {m.status === st && <Check size={13} className="ml-auto" />}
            </button>
          ))}
        </Prop>
        <Prop label="Owner" open={propMenu === "owner"} onToggle={toggle("owner")} value={<span className="flex items-center gap-1.5"><Avatar id={m.owner} size={16} />{personName(m.owner)}</span>}>
          <div className={menuHead}>Assign · A</div>
          <div className="max-h-[260px] overflow-y-auto">
            {chatPeople
              .filter((p) => !isExternal(p.id))
              .map((p) => (
                <button key={p.id} className={menuItem} onClick={() => (setOwner(m.id, p.id), setPropMenu(null))}>
                  <Avatar id={p.id} size={16} /> {p.name}
                  {m.owner === p.id && <Check size={13} className="ml-auto" />}
                </button>
              ))}
          </div>
        </Prop>
        <Prop label="Priority" open={propMenu === "priority"} onToggle={toggle("priority")} value={<span className="flex items-center gap-1.5"><PriorityMark p={m.priority} />{m.priority}</span>}>
          <div className={menuHead}>Priority · P</div>
          {PRIORITIES.map((p) => (
            <button key={p} className={menuItem} onClick={() => (setPriority(m.id, p), setPropMenu(null))}>
              <PriorityMark p={p} /> {p}
              {m.priority === p && <Check size={13} className="ml-auto" />}
            </button>
          ))}
        </Prop>
        <Prop label="Due" open={propMenu === "due"} onToggle={toggle("due")} value={<span className="tnum">{m.dueDate ? shortDay(m.dueDate) : "None"}</span>}>
          <div className={menuHead}>Due date</div>
          <div className="space-y-2 px-2 pb-2">
            <input type="date" defaultValue={m.dueDate} onChange={(e) => setDue(m.id, e.target.value)} aria-label="Due date" className="h-8 w-full rounded-[4px] border border-d-line bg-d-bg px-2 text-[12.5px] text-d-text [color-scheme:inherit]" />
            {m.dueDate && (
              <button className={menuItem} onClick={() => (setDue(m.id, ""), setPropMenu(null))}>
                Clear due date
              </button>
            )}
          </div>
        </Prop>
        <span className="flex h-7 items-center gap-1.5 px-1.5 text-[12.5px]">
          <span className="text-d-text-3">Linked</span>
          <span className="truncate">{m.linked.label}</span>
        </span>
      </div>
      {m.status === "Awaiting approval" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-d-line-soft bg-d-surface-2 px-4 py-2 text-[12.5px]">
          <ShieldAlert size={14} className="shrink-0 text-d-warn" aria-hidden />
          <span className="min-w-0 flex-1 text-d-text-2">
            Approval requested by <span className="text-d-text">{personName(m.requestedBy ?? m.owner)}</span>
            {!d.ok && <span> · {d.why}</span>}
          </span>
          {d.ok && (
            <span className="flex items-center gap-1.5">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Decision note" className="h-7 w-44 rounded-[4px] border border-d-line bg-d-bg px-2 text-[12px] placeholder:text-d-text-3 focus:border-d-line-strong focus:outline-none" />
              <button onClick={() => decide(m.id, "rejected", note || undefined)} className="h-7 rounded-[4px] border border-d-line-strong px-2.5 font-medium hover:bg-d-raise">
                Reject
              </button>
              <button onClick={() => decide(m.id, "approved", note || undefined)} className="h-7 rounded-[4px] border border-d-line-strong bg-d-raise px-2.5 font-medium hover:border-d-text-3">
                Approve
              </button>
            </span>
          )}
        </div>
      )}
    </header>
  );
}

function ExternalBanner({ names }: { names: string[] }) {
  const { brand } = useBrand();
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-d-line-soft bg-d-surface-2 px-4 py-1.5 text-[12px] text-d-text-2">
      <ExternalTag />
      <span className="truncate">
        Includes people outside {brand.name}: {names.join(", ")}. Everything posted here is visible to them.
      </span>
    </div>
  );
}

function MessageItem({ m, replies, onThread }: { m: ChatMessage; replies: number; onThread?: () => void }) {
  const { react, editMessage, convert, select, s } = useChat();
  const { brand } = useBrand();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(m.body);
  const [menu, setMenu] = useState(false);
  const [history, setHistory] = useState(false);
  const openRef = (ref: string) => {
    const t = s.matters.find((x) => x.ref === ref);
    if (t) select(t.id);
  };
  if (m.kind === "event")
    return (
      <div className="relative flex flex-col gap-0.5 py-1.5 pl-[38px] text-[12.5px] text-d-text-3 sm:flex-row sm:items-start sm:gap-3">
        <span aria-hidden className="absolute left-[13px] top-[11px] h-[7px] w-[7px] rounded-full border border-d-line-strong bg-d-bg" />
        <span className="min-w-0 flex-1">
          <span className="text-d-text-2">{personName(m.author)}</span> {withTenant(m.body, brand.name)}
        </span>
        <span className="tnum shrink-0 whitespace-nowrap text-[11px]">{shortDay(m.at)} {clock(m.at)}</span>
      </div>
    );
  const ext = isExternal(m.author);
  return (
    <article className="group relative flex gap-3 rounded-[4px] py-2 pr-2 hover:bg-d-surface-2/60" aria-label={`${personName(m.author)} at ${clock(m.at)}`}>
      <span className="relative z-[1] pt-0.5">
        <Avatar id={m.author} size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13px] font-semibold">{personName(m.author)}</span>
          {ext && <ExternalTag />}
          <span className="tnum text-[11px] text-d-text-3">{shortDay(m.at)} {clock(m.at)}</span>
          {m.editedAt && (
            <button onClick={() => setHistory((h) => !h)} className="text-[11px] text-d-text-3 underline-offset-2 hover:underline">
              edited
            </button>
          )}
        </div>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim() && text !== m.body) editMessage(m.id, text.trim());
              setEditing(false);
            }}
            className="mt-1"
          >
            <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="Edit message" className="w-full resize-none rounded-[4px] border border-d-line-strong bg-d-bg p-2 text-[14px] leading-[1.55] focus:outline-none" />
            <div className="mt-1 flex gap-2 text-[12px]">
              <button className="rounded-[4px] border border-d-line-strong px-2 py-0.5">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="px-2 py-0.5 text-d-text-2">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-0.5 space-y-1 text-[14px] leading-[1.55] text-d-text">
            <RichText body={withTenant(m.body, brand.name)} onRef={openRef} />
          </div>
        )}
        {history && m.edits && (
          <div className="mt-1.5 space-y-1 rounded-[4px] border border-d-line-soft p-2 text-[12px] text-d-text-3">
            <div className="font-medium text-d-text-2">Edit history</div>
            {m.edits.map((e, i) => (
              <div key={i}>
                <span className="tnum">{shortDay(e.at)} {clock(e.at)}</span> — {e.body}
              </div>
            ))}
          </div>
        )}
        {m.attachments && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.attachments.map((a, i) => (
              <span key={i} className="flex max-w-[340px] items-center gap-2 rounded-[4px] border border-d-line bg-d-surface px-2.5 py-1.5 text-[12.5px]">
                <FileText size={14} className="shrink-0 text-d-text-3" />
                <span className="truncate">{a.name}</span>
                <span className="tnum shrink-0 text-[11px] text-d-text-3">{fileSize(a.size)}</span>
                {a.source && <span className="shrink-0 text-[11px] text-d-text-3">· {a.source}</span>}
              </span>
            ))}
          </div>
        )}
        {(!!m.reactions?.length || replies > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {m.reactions?.map((r) => (
              <button key={r.key} onClick={() => react(m.id, r.key)} aria-pressed={r.by.includes(VIEWER)} title={r.by.map(personName).join(", ")} className={cx("h-6 rounded-full border px-2 text-[11.5px]", r.by.includes(VIEWER) ? "border-d-line-strong bg-d-raise text-d-text" : "border-d-line text-d-text-2")}>
                {REACTIONS.find((x) => x.key === r.key)?.label} <span className="tnum">{r.by.length}</span>
              </button>
            ))}
            {replies > 0 && onThread && (
              <button onClick={onThread} className="flex h-6 items-center gap-1 text-[12px] font-medium text-d-text-2 hover:text-d-text">
                <CornerDownRight size={13} /> {replies} {replies === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        )}
      </div>
      {!editing && (
        <div className="absolute -top-3 right-2 hidden items-center gap-0.5 rounded-[4px] bg-d-surface p-0.5 shadow-[var(--d-pop)] group-hover:flex group-has-[:focus-visible]:flex [@media(hover:none)]:static [@media(hover:none)]:flex">
          {REACTIONS.map((r) => (
            <button key={r.key} onClick={() => react(m.id, r.key)} className="h-6 rounded-[3px] px-1.5 text-[11px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
              {r.label}
            </button>
          ))}
          {onThread && (
            <button onClick={onThread} aria-label="Reply in thread (R)" title="Reply in thread" className="flex h-6 w-6 items-center justify-center rounded-[3px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
              <Reply size={13} />
            </button>
          )}
          {m.author === VIEWER && (
            <button onClick={() => (setText(m.body), setEditing(true))} aria-label="Edit message" title="Edit" className="flex h-6 w-6 items-center justify-center rounded-[3px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
              <Pencil size={13} />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setMenu((x) => !x)} aria-label="More actions" aria-expanded={menu} className="flex h-6 w-6 items-center justify-center rounded-[3px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
              <MoreHorizontal size={14} />
            </button>
            {menu && (
              <Menu className="right-0 top-7 w-[220px]">
                <div className={menuHead}>Convert message</div>
                <button className={menuItem} onClick={() => (convert(m.id, "matter"), setMenu(false))}>
                  Into a new matter
                </button>
                <button className={menuItem} onClick={() => (convert(m.id, "task"), setMenu(false))}>
                  Into a PMO task
                </button>
                <button className={menuItem} onClick={() => (convert(m.id, "qa"), setMenu(false))}>
                  Into a Q&A answer (draft)
                </button>
                <button className={menuItem} onClick={() => (convert(m.id, "change"), setMenu(false))}>
                  Into a change request (bank details)
                </button>
              </Menu>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Timeline({ where }: { where: string }) {
  const { s, setThread } = useChat();
  const end = useRef<HTMLDivElement>(null);
  const items = useMemo(() => s.messages.filter((m) => m.where === where && !m.replyTo).sort((a, b) => a.at.localeCompare(b.at)), [s.messages, where]);
  const replies = useMemo(() => {
    const r: Record<string, number> = {};
    for (const m of s.messages) if (m.where === where && m.replyTo) r[m.replyTo] = (r[m.replyTo] ?? 0) + 1;
    return r;
  }, [s.messages, where]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [where, items.length]);
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-6 pt-4">
      {items.length === 0 && <div className="py-16 text-center text-[13px] text-d-text-3">No messages yet. Start with @ to bring someone in, or / for a command.</div>}
      <div className="relative">
        {items.length > 0 && <span aria-hidden className="absolute bottom-2 left-[16px] top-2 w-px bg-d-line" />}
        {items.map((m, i) => {
          const day = dayLabel(m.at);
          const sep = i === 0 || dayLabel(items[i - 1].at) !== day;
          return (
            <div key={m.id}>
              {sep && (
                <div className="relative my-3 flex items-center gap-3 pl-[38px]">
                  <span className="tnum text-[11.5px] font-medium text-d-text-3">{day}</span>
                  <span className="h-px flex-1 bg-d-line-soft" />
                </div>
              )}
              <MessageItem m={m} replies={replies[m.id] ?? 0} onThread={m.kind === "message" ? () => setThread(m.id) : undefined} />
            </div>
          );
        })}
      </div>
      <div ref={end} />
    </div>
  );
}

function ThreadPanel({ id }: { id: string }) {
  const { s, setThread } = useChat();
  const root = s.messages.find((m) => m.id === id);
  if (!root) return null;
  const replies = s.messages.filter((m) => m.replyTo === id).sort((a, b) => a.at.localeCompare(b.at));
  return (
    <aside aria-label="Thread" className="absolute inset-y-0 right-0 z-20 flex w-full max-w-[400px] flex-col border-l border-d-line bg-d-bg shadow-[var(--d-pop)] xl:static xl:shadow-none">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-d-line px-4">
        <span className="text-[13px] font-semibold">Thread</span>
        <button onClick={() => setThread(null)} aria-label="Close thread" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise">
          <X size={15} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <MessageItem m={root} replies={0} />
        <div className="my-2 flex items-center gap-2 pl-[38px] text-[11.5px] text-d-text-3">
          {replies.length} {replies.length === 1 ? "reply" : "replies"} <span className="h-px flex-1 bg-d-line-soft" />
        </div>
        {replies.map((r) => (
          <MessageItem key={r.id} m={r} replies={0} />
        ))}
      </div>
      <Composer key={root.id} where={root.where} replyTo={root.id} />
    </aside>
  );
}

export function Detail({ onMenu }: { onMenu: () => void }) {
  const { s, nav, selected, rail, setRail, thread, markConvRead, setNav } = useChat();
  const where = nav.kind === "conv" ? nav.id : selected;
  useEffect(() => {
    if (where) markConvRead(where);
  }, [where]); // eslint-disable-line react-hooks/exhaustive-deps

  if (nav.kind === "conv") {
    const ch = s.channels.find((c) => c.id === nav.id);
    const dm = s.directs.find((d) => d.id === nav.id);
    const members = ch?.members ?? dm?.members ?? [];
    const ext = members.filter(isExternal);
    const other = dm?.members.find((x) => x !== VIEWER);
    return (
      <section className="flex min-w-0 flex-1 flex-col" aria-label={ch ? `#${ch.name}` : personName(other ?? "")}>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-d-line px-4">
          <button onClick={onMenu} aria-label="Open navigation" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise lg:hidden">
            <MenuIcon size={16} />
          </button>
          {ch ? <Hash size={15} className="text-d-text-3" /> : <Avatar id={other ?? ""} size={20} />}
          <h2 className="text-[14px] font-semibold">{ch ? ch.name : personName(other ?? "")}</h2>
          {ch && <span className="hidden truncate text-[12px] text-d-text-3 sm:inline">· {ch.topic}</span>}
          <button onClick={() => setNav({ kind: "view", id: "v-open" })} className="ml-auto hidden text-[12px] text-d-text-2 hover:text-d-text md:block">
            Back to matters
          </button>
        </header>
        {ext.length > 0 && <ExternalBanner names={ext.map(personName)} />}
        <div className="relative flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Timeline where={nav.id} />
            </div>
            <Composer key={nav.id} where={nav.id} />
          </div>
          {thread && <ThreadPanel id={thread} />}
        </div>
      </section>
    );
  }

  const m = selected ? s.matters.find((x) => x.id === selected) : undefined;
  if (!selected)
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-center">
        <div>
          <div className="text-[13.5px] font-medium">Select a matter</div>
          <p className="mt-1 text-[12.5px] text-d-text-3">Use J and K to move through the list, or press C to open a new one.</p>
        </div>
      </div>
    );
  if (!m)
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-center" role="alert">
        <div>
          <div className="text-[13.5px] font-medium">This matter could not be found</div>
          <p className="mt-1 text-[12.5px] text-d-text-3">It may have been removed from this browser&rsquo;s preview data.</p>
        </div>
      </div>
    );
  const ext = m.participants.filter(isExternal);
  return (
    <section className="flex min-w-0 flex-1" aria-label={`${m.ref} ${m.title}`}>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <MatterHeader m={m} />
        {ext.length > 0 && <ExternalBanner names={ext.map(personName)} />}
        <div className="relative flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Timeline where={m.id} />
            </div>
            <Composer key={m.id} where={m.id} />
          </div>
          {thread && <ThreadPanel id={thread} />}
        </div>
      </div>
      {rail && !thread && (
        <>
          <button aria-label="Close record details" onClick={() => setRail(false)} className="fixed inset-0 z-30 bg-black/40 min-[1280px]:hidden" />
          <div className="fixed inset-y-0 right-0 z-40 w-[320px] max-w-[90vw] min-[1280px]:static min-[1280px]:z-auto min-[1280px]:w-[300px]">
            <ContextRail m={m} onClose={() => setRail(false)} />
          </div>
        </>
      )}
    </section>
  );
}
