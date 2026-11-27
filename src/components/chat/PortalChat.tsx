"use client";

/**
 * Corporate Chat as the firm's clients see it — sponsors, investors and company clients, inside their portal.
 * It reads and writes the same conversations the firm works in (lib/chat-store), filtered to what this person
 * may see: their organisation's matters and channels and their own direct conversations. Internal notes and
 * the firm's system events never appear here.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileText, Hash, SendHorizontal, ShieldAlert } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { withTenant } from "@/lib/brand";
import { CHAT_KEY, clientVisible, conversationsFor, loadChat, markPortalRead, portalReadKey, postFromPortal, type ChatState } from "@/lib/chat-store";
import { detectBankDetails, isExternal, personName, type ChatMessage, type MatterStatus } from "@/lib/chat";
import { Avatar, clock, dayLabel, fileSize, shortDay } from "./ui";

const SINCE = "2026-11-24T00:00:00Z";
const STATE_WORD: Record<MatterStatus, string> = { Open: "With the team", "Awaiting client": "Waiting for you", "Awaiting approval": "In review", Resolved: "Closed" };

type Conv = { id: string; kind: "matter" | "channel" | "direct"; title: string; sub: string; state?: MatterStatus; at: string; who?: string };

export function PortalChat({ personId, className }: { personId: string; className?: string }) {
  const { brand } = useBrand();
  const [s, setS] = useState<ChatState | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pane, setPane] = useState<"list" | "conv">("list");

  // One store for the firm and its clients: follow changes made here, in another tab, or by the firm.
  useEffect(() => {
    const load = () => setS(loadChat());
    load();
    const onStorage = (e: StorageEvent) => e.key === CHAT_KEY && load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("aurum-chat", load);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aurum-chat", load);
    };
  }, []);

  const convs = useMemo<Conv[]>(() => {
    if (!s) return [];
    const v = conversationsFor(s, personId);
    const last = (where: string) =>
      s.messages
        .filter((m) => m.where === where && clientVisible(m))
        .map((m) => m.at)
        .sort()
        .at(-1) ?? "";
    return [
      ...v.matters.map((m) => ({ id: m.id, kind: "matter" as const, title: m.title, sub: `${m.ref} · ${m.linked.label}`, state: m.status, at: last(m.id) || m.updatedAt })),
      ...v.channels.map((c) => ({ id: c.id, kind: "channel" as const, title: c.name, sub: withTenant(c.topic, brand.name), at: last(c.id) })),
      ...v.directs.map((d) => {
        const other = d.members.find((x) => x !== personId) ?? "";
        return { id: d.id, kind: "direct" as const, title: personName(other), sub: "Direct conversation", at: last(d.id), who: other };
      }),
    ].sort((a, b) => b.at.localeCompare(a.at));
  }, [s, personId, brand.name]);

  const current = convs.find((c) => c.id === open) ?? null;
  const unread = (where: string) => {
    if (!s) return 0;
    const since = s.read[portalReadKey(personId, where)] ?? SINCE;
    return s.messages.filter((m) => m.where === where && clientVisible(m) && m.author !== personId && m.at > since).length;
  };
  const choose = (id: string) => {
    setOpen(id);
    setPane("conv");
    markPortalRead(personId, id);
  };

  if (!s) return <div className={cx("ws animate-pulse rounded-[10px] bg-d-surface", className)} aria-busy="true" />;

  return (
    <div className={cx("ws flex overflow-hidden rounded-[10px] border border-d-line bg-d-bg text-d-text", className)}>
      {/* conversations */}
      <aside className={cx("w-full shrink-0 flex-col border-r border-d-line md:flex md:w-[300px]", pane === "list" ? "flex" : "hidden")}>
        <div className="border-b border-d-line px-4 py-3">
          <div className="text-[14px] font-semibold">Conversations</div>
          <div className="text-[12px] text-d-text-3">With {brand.name}, kept as a record of your correspondence.</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {convs.length === 0 && (
            <p className="px-4 py-10 text-center text-[12.5px] text-d-text-3">No conversations yet. {brand.name} will open one when there is something to discuss.</p>
          )}
          {convs.map((c) => {
            const n = unread(c.id);
            return (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                aria-current={c.id === open ? "true" : undefined}
                className={cx("flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-d-raise", c.id === open && "bg-d-raise")}
              >
                <span className="mt-0.5 shrink-0 text-d-text-3">
                  {c.kind === "channel" ? <Hash size={14} /> : c.kind === "direct" ? <Avatar id={c.who ?? ""} size={16} /> : <FileText size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block truncate text-[13px]", n ? "font-semibold" : "font-medium")}>{c.title}</span>
                  <span className="block truncate text-[11.5px] text-d-text-3">{c.sub}</span>
                  {c.state && (
                    <span className={cx("mt-0.5 block text-[11.5px] font-medium", c.state === "Awaiting client" ? "text-d-warn" : "text-d-text-2")}>{STATE_WORD[c.state]}</span>
                  )}
                </span>
                {n > 0 && <span className="tnum mt-0.5 rounded-full bg-d-text px-1.5 text-[10.5px] font-semibold text-d-bg">{n}</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* the conversation */}
      <section className={cx("min-w-0 flex-1 flex-col md:flex", pane === "conv" ? "flex" : "hidden")}>
        {current ? (
          <Conversation key={current.id} conv={current} personId={personId} s={s} onBack={() => setPane("list")} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-10 text-center text-[13px] text-d-text-3">Choose a conversation.</div>
        )}
      </section>
    </div>
  );
}

function Conversation({ conv, personId, s, onBack }: { conv: Conv; personId: string; s: ChatState; onBack: () => void }) {
  const { brand } = useBrand();
  const end = useRef<HTMLDivElement>(null);
  const all = s.messages.filter((m) => m.where === conv.id && clientVisible(m)).sort((a, b) => a.at.localeCompare(b.at));
  const top = all.filter((m) => !m.replyTo || !all.some((x) => x.id === m.replyTo));
  const repliesTo = (id: string) => all.filter((m) => m.replyTo === id);
  const [text, setText] = useState("");
  const [held, setHeld] = useState<string | null>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [all.length]);

  const send = () => {
    if (!text.trim()) return;
    const bank = detectBankDetails(text);
    if (bank?.hard) return setHeld(bank.what);
    postFromPortal(personId, conv.id, text);
    setText("");
  };

  return (
    <>
      <header className="flex items-start gap-2 border-b border-d-line px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="-ml-1 flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise md:hidden"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">{conv.kind === "channel" ? `#${conv.title}` : conv.title}</h2>
          <div className="truncate text-[12px] text-d-text-3">
            {conv.sub}
            {conv.state && ` · ${STATE_WORD[conv.state]}`}
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {top.length === 0 && <p className="py-12 text-center text-[12.5px] text-d-text-3">No messages yet.</p>}
        {top.map((m, i) => (
          <div key={m.id}>
            {(i === 0 || dayLabel(top[i - 1].at) !== dayLabel(m.at)) && (
              <div className="my-3 flex items-center gap-3">
                <span className="tnum text-[11.5px] font-medium text-d-text-3">{dayLabel(m.at)}</span>
                <span className="h-px flex-1 bg-d-line" />
              </div>
            )}
            <Bubble m={m} />
            {repliesTo(m.id).map((r) => (
              <div key={r.id} className="ml-9 border-l border-d-line pl-3">
                <Bubble m={r} />
              </div>
            ))}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="border-t border-d-line p-3">
        {held && (
          <div role="alert" className="mb-2 flex items-start gap-2 rounded-[6px] border border-d-line-strong bg-d-surface p-2.5 text-[12.5px]">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-d-warn" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Not sent: this looks like {held}.</div>
              <p className="mt-0.5 text-d-text-2">
                For your security, bank details are only changed from your profile, and {brand.name} confirms every change with you by phone before it applies.
              </p>
            </div>
            <button onClick={() => setHeld(null)} className="shrink-0 font-semibold underline-offset-2 hover:underline">
              Edit
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-[6px] bg-d-surface p-1.5 ring-1 ring-d-line focus-within:ring-d-line-strong">
          <textarea
            value={text}
            rows={1}
            onChange={(e) => {
              setText(e.target.value);
              setHeld(null);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Write to ${brand.name}`}
            aria-label={`Write to ${brand.name}`}
            className="block max-h-[160px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-[1.5] placeholder:text-d-text-3 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="flex h-8 items-center gap-1.5 rounded-[5px] bg-d-text px-3 text-[12.5px] font-semibold text-d-bg disabled:opacity-40"
          >
            Send <SendHorizontal size={13} />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-d-text-3">Never send bank details by message. Change them in your profile.</p>
      </div>
    </>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const { brand } = useBrand();
  const firm = !isExternal(m.author);
  return (
    <article className="flex gap-2.5 py-1.5" aria-label={`${personName(m.author)} at ${clock(m.at)}`}>
      <Avatar id={m.author} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[13px] font-semibold">{personName(m.author)}</span>
          {firm && <span className="text-[11px] text-d-text-3">{brand.name}</span>}
          <span className="tnum text-[11px] text-d-text-3">
            {shortDay(m.at)} {clock(m.at)}
          </span>
          {m.editedAt && <span className="text-[11px] text-d-text-3">edited</span>}
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-[1.55]">{withTenant(m.body, brand.name)}</p>
        {m.attachments && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.attachments.map((a, i) => (
              <span key={i} className="flex max-w-[300px] items-center gap-1.5 rounded-[4px] border border-d-line bg-d-surface px-2 py-1 text-[12px]">
                <FileText size={13} className="shrink-0 text-d-text-3" />
                <span className="truncate">{a.name}</span>
                <span className="tnum shrink-0 text-[11px] text-d-text-3">{fileSize(a.size)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
