"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, FileText, Hash, Paperclip, Search, SendHorizontal, Slash, X } from "lucide-react";
import { cx } from "@/components/ui";
import { Menu } from "@/components/shell/WorkstationTopBar";
import { attachables, chatPeople, isExternal, type ChatAttachment, type MatterStatus } from "@/lib/chat";
import { useChat } from "./context";
import { Avatar, ExternalTag, Kbd, StatusRing, fileSize } from "./ui";

const COMMANDS = [
  { cmd: "/status", hint: "Open · Awaiting client · Awaiting approval · Resolved" },
  { cmd: "/assign", hint: "@person — make them the owner" },
  { cmd: "/priority", hint: "Urgent · High · Normal · Low · None" },
  { cmd: "/approve", hint: "record an approval (not on your own request)" },
  { cmd: "/reject", hint: "record a rejection, with a reason" },
  { cmd: "/task", hint: "add a PMO task to the linked plan" },
  { cmd: "/request", hint: "ask the plan's client party for a deliverable" },
];

type Suggest = { kind: "@" | "#" | "/"; start: number; term: string };
type Opt = { key: string; insert: string; label: string; sub: string; person?: string; status?: MatterStatus };

function AttachPicker({ onPick, onClose }: { onPick: (a: ChatAttachment) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => attachables.filter((a) => (a.name + " " + a.source).toLowerCase().includes(q.toLowerCase())).slice(0, 40), [q]);
  return (
    <Menu className="bottom-12 left-2 w-[min(440px,calc(100vw-32px))]">
      <div className="flex items-center gap-2 border-b border-d-line-soft px-2 pb-2">
        <Search size={13} className="text-d-text-3" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a document in data rooms and the register" aria-label="Find a document" className="h-7 flex-1 bg-transparent text-[12.5px] focus:outline-none" />
        <button onClick={onClose} aria-label="Close">
          <X size={13} className="text-d-text-3" />
        </button>
      </div>
      <div className="max-h-[280px] overflow-y-auto pt-1">
        {list.length === 0 && <div className="px-3 py-6 text-center text-[12px] text-d-text-3">No documents match.</div>}
        {list.map((a) => (
          <button key={a.id} onClick={() => onPick(a)} className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left hover:bg-d-raise">
            <FileText size={14} className="shrink-0 text-d-text-3" />
            <span className="min-w-0 flex-1 truncate text-[12.5px]">{a.name}</span>
            <span className="shrink-0 text-[11px] text-d-text-3">{a.source}</span>
            <span className="tnum shrink-0 text-[11px] text-d-text-3">{fileSize(a.size)}</span>
          </button>
        ))}
      </div>
    </Menu>
  );
}

export function Composer({ where, replyTo }: { where: string; replyTo?: string }) {
  const { s, send, setDraft } = useChat();
  const [text, setText] = useState(() => (replyTo ? "" : (s.drafts[where] ?? "")));
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [picker, setPicker] = useState(false);
  const [sug, setSug] = useState<Suggest | null>(null);
  const [idx, setIdx] = useState(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const matter = s.matters.find((m) => m.id === where);

  // Autosave the draft for this matter or conversation (not for thread replies).
  useEffect(() => {
    if (replyTo) return;
    const t = window.setTimeout(() => {
      if ((s.drafts[where] ?? "") !== text) setDraft(where, text);
    }, 500);
    return () => window.clearTimeout(t);
  }, [text, where, replyTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo<Opt[]>(() => {
    if (!sug) return [];
    const t = sug.term.toLowerCase();
    if (sug.kind === "@")
      return chatPeople
        .filter((p) => p.name.toLowerCase().includes(t) || p.id.startsWith(t))
        .slice(0, 7)
        .map((p) => ({ key: p.id, insert: "@" + p.name.split(" ")[0] + " ", label: p.name, sub: p.title, person: p.id }));
    if (sug.kind === "#")
      return s.matters
        .filter((m) => (m.ref + " " + m.title).toLowerCase().includes(t))
        .slice(0, 7)
        .map((m) => ({ key: m.id, insert: "#" + m.ref + " ", label: m.title, sub: m.ref, status: m.status }));
    return COMMANDS.filter((c) => c.cmd.startsWith("/" + t)).map((c) => ({ key: c.cmd, insert: c.cmd + " ", label: c.cmd, sub: c.hint }));
  }, [sug, s.matters]);

  const detect = (value: string, caret: number) => {
    const before = value.slice(0, caret);
    const m = before.match(/(^|\s)([@#])([\wÀ-ÿ-]*)$/) ?? (replyTo ? null : before.match(/^(\s*)(\/)(\w*)$/));
    if (m) {
      setSug({ kind: m[2] as Suggest["kind"], start: caret - m[3].length - 1, term: m[3] });
      setIdx(0);
    } else setSug(null);
  };
  const apply = (insert: string) => {
    if (!sug || !ta.current) return;
    const caret = ta.current.selectionStart;
    const next = text.slice(0, sug.start) + insert + text.slice(caret);
    setText(next);
    setSug(null);
    requestAnimationFrame(() => {
      const pos = sug.start + insert.length;
      ta.current?.setSelectionRange(pos, pos);
      ta.current?.focus();
    });
  };
  const submit = () => {
    if (!text.trim() && !files.length) return;
    send(where, text, files, replyTo);
    setText("");
    setFiles([]);
    setSug(null);
  };

  const placeholder = replyTo ? "Reply in thread" : matter ? "Write a message — @ to mention, # to reference, / for commands" : "Write a message — @ to mention, # to reference";
  const ext = (matter?.participants ?? s.channels.find((c) => c.id === where)?.members ?? s.directs.find((d) => d.id === where)?.members ?? []).some(isExternal);

  return (
    <div className={cx("relative shrink-0 bg-d-bg px-4 pb-3 pt-2", replyTo ? "border-t border-d-line" : "mx-auto w-full max-w-[792px]")}>
      {sug && options.length > 0 && (
        <Menu className="bottom-full left-4 mb-1 w-[min(420px,calc(100%-32px))]">
          <div role="listbox" aria-label={sug.kind === "@" ? "People" : sug.kind === "#" ? "Matters" : "Commands"}>
            {options.map((o, i) => (
              <button
                key={o.key}
                role="option"
                aria-selected={i === idx}
                onMouseDown={(e) => (e.preventDefault(), apply(o.insert))}
                className={cx("flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-1.5 text-left", i === idx && "bg-d-raise")}
              >
                {o.person && <Avatar id={o.person} size={18} />}
                {o.status && <StatusRing status={o.status} size={12} />}
                <span className="min-w-0 flex-1 truncate text-[12.5px]">{o.label}</span>
                {o.person && isExternal(o.person) && <ExternalTag />}
                <span className="max-w-[55%] shrink-0 truncate text-[11px] text-d-text-3">{o.sub}</span>
              </button>
            ))}
          </div>
        </Menu>
      )}
      {picker && (
        <AttachPicker
          onClose={() => setPicker(false)}
          onPick={(a) => {
            setFiles((f) => [...f.filter((x) => x.name !== a.name), { name: a.name, size: a.size, type: a.type, source: a.source }]);
            setPicker(false);
            ta.current?.focus();
          }}
        />
      )}
      <div className="rounded-[6px] border border-d-line bg-d-surface focus-within:border-d-line-strong">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
            {files.map((f) => (
              <span key={f.name} className="flex items-center gap-1.5 rounded-[4px] border border-d-line bg-d-bg px-2 py-1 text-[12px]">
                <FileText size={13} className="text-d-text-3" />
                <span className="max-w-[220px] truncate">{f.name}</span>
                <button onClick={() => setFiles((x) => x.filter((y) => y.name !== f.name))} aria-label={`Remove ${f.name}`}>
                  <X size={12} className="text-d-text-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          id={replyTo ? undefined : "chat-composer"}
          ref={ta}
          value={text}
          rows={replyTo ? 2 : 3}
          onChange={(e) => {
            setText(e.target.value);
            detect(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={(e) => {
            if (sug && options.length) {
              if (e.key === "ArrowDown") return e.preventDefault(), setIdx((i) => (i + 1) % options.length);
              if (e.key === "ArrowUp") return e.preventDefault(), setIdx((i) => (i - 1 + options.length) % options.length);
              if (e.key === "Enter" || e.key === "Tab") return e.preventDefault(), apply(options[idx].insert);
              if (e.key === "Escape") return e.stopPropagation(), setSug(null);
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-[14px] leading-[1.55] text-d-text placeholder:text-d-text-3 focus:outline-none focus-visible:outline-none"
        />
        <div className="flex items-center gap-0.5 px-1.5 pb-1.5">
          <button onClick={() => setPicker((p) => !p)} aria-label="Attach from a data room" title="Attach from a data room" className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
            <Paperclip size={15} />
          </button>
          {[
            { ch: "@", Icon: AtSign, label: "Mention" },
            { ch: "#", Icon: Hash, label: "Reference a matter" },
            ...(replyTo || !matter ? [] : [{ ch: "/", Icon: Slash, label: "Command" }]),
          ].map(({ ch, Icon, label }) => (
            <button
              key={ch}
              onClick={() => {
                const v = (text && !text.endsWith(" ") && ch !== "/" ? text + " " : ch === "/" ? "" : text) + ch;
                setText(v);
                requestAnimationFrame(() => {
                  ta.current?.focus();
                  ta.current?.setSelectionRange(v.length, v.length);
                  detect(v, v.length);
                });
              }}
              aria-label={label}
              title={label}
              className="flex h-7 w-7 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise hover:text-d-text"
            >
              <Icon size={15} />
            </button>
          ))}
          <span className="ml-2 hidden items-center gap-1 whitespace-nowrap text-[11px] text-d-text-3 min-[1600px]:flex">
            <Kbd>Enter</Kbd> send · <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> new line{ext && " · visible to external participants"}
          </span>
          <button
            onClick={submit}
            disabled={!text.trim() && !files.length}
            className={cx(
              "ml-auto flex h-7 items-center gap-1.5 rounded-[4px] px-3 text-[12.5px] font-semibold disabled:opacity-40",
              replyTo ? "border border-d-line-strong text-d-text hover:bg-d-raise" : "bg-d-accent-fill text-d-on-accent",
            )}
          >
            Send <SendHorizontal size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
