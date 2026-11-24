"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderInput,
  FolderUp,
  Hash,
  Image as ImageIcon,
  Info,
  Lock,
  Megaphone,
  MessageSquareText,
  Paperclip,
  Pin,
  Plus,
  Search,
  SendHorizontal,
  ShieldCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { cx } from "@/components/ui";
import { AurumMark } from "@/components/brand/Logo";
import { gpById } from "@/lib/gps";
import {
  ME,
  canSeeChannel,
  channelById,
  channelMembers,
  channels as allChannels,
  clientById,
  clients,
  directThreads,
  fileSize,
  initials,
  lastRead as seedRead,
  messages as seedMessages,
  personById,
  requests as seedRequests,
  spaceById,
  spaceRole,
  spaces,
  typeOf,
  unreadCount,
  type AccessRequest,
  type Attachment,
  type Channel,
  type FileRef,
  type Message,
} from "@/lib/comms";

/** Communication accent — the deep turquoise already used for "cash returned" in charts. */
export const COMM = "#1F8A84";
const TZ = "America/New_York";

type Props = ({ mode: "aurum"; space?: string } | { mode: "client"; clientId: string; personId: string; accent: string; accentInk: string }) & { className?: string };

type View = { kind: "conv"; where: string } | { kind: "requests" };

/* ───────────────────────── formatting ───────────────────────── */

const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: TZ });
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const clock = (iso: string) => timeFmt.format(new Date(iso));

function clientColor(clientId: string) {
  const c = clientById(clientId);
  const gp = c?.gpId ? gpById(c.gpId) : undefined;
  return gp?.brand.primary ?? c?.color ?? "#6F6A61";
}

/* ───────────────────────── small pieces ───────────────────────── */

function PersonAvatar({ id, size = 32 }: { id: string; size?: number }) {
  const p = personById(id);
  const aurum = p?.org === "aurum";
  const bg = aurum ? "#EFE5CF" : clientColor(p?.org ?? "");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[9px] font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.34, background: bg, color: aurum ? "#7B6235" : "#FFFFFF" }}
      aria-hidden
    >
      {p ? initials(p.name) : "?"}
    </span>
  );
}

function FileGlyph({ type, size = 18 }: { type: FileRef["type"]; size?: number }) {
  const map = {
    pdf: { Icon: FileText, color: "#B5542A" },
    xlsx: { Icon: FileSpreadsheet, color: COMM },
    csv: { Icon: FileSpreadsheet, color: COMM },
    docx: { Icon: FileText, color: "#2B4366" },
    img: { Icon: ImageIcon, color: "#7B6235" },
    zip: { Icon: FileText, color: "#6F6A61" },
  } as const;
  const { Icon, color } = map[type];
  return <Icon size={size} strokeWidth={1.6} style={{ color }} />;
}

function HexTile({ label, active, unread, onClick, title, children }: { label: string; active: boolean; unread: number; onClick: () => void; title: string; children?: ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} aria-current={active} className="group relative flex h-[52px] w-[52px] items-center justify-center">
      <svg viewBox="-30 -34 60 68" className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          d="M0,-32L27.7,-16L27.7,16L0,32L-27.7,16L-27.7,-16Z"
          fill={active ? "#FFFFFF" : "transparent"}
          stroke={active ? COMM : "#D1C8B5"}
          strokeWidth={active ? 3.5 : 1.5}
          strokeLinejoin="miter"
          className="transition-all group-hover:stroke-[#1F8A84]"
        />
      </svg>
      <span className={cx("relative text-[11px] font-bold tracking-[0.06em]", active ? "text-ink-900" : "text-stone-500 group-hover:text-ink-900")}>{children ?? label}</span>
      {unread > 0 && (
        <span className="absolute -right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: COMM }}>
          {unread}
        </span>
      )}
    </button>
  );
}

/* ───────────────────────── attachments ───────────────────────── */

function FileRow({ f, filedTo, onFile, canFile }: { f: FileRef; filedTo?: string; onFile?: () => void; canFile?: boolean }) {
  return (
    <div className="group/file flex items-center gap-3 rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 shadow-card">
      <FileGlyph type={f.type} size={20} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-ink-900">{f.name}</div>
        <div className="text-[11px] text-stone-500">
          {fileSize(f.size)}
          {filedTo && <span className="ml-2 inline-flex items-center gap-1 text-[#1F6F6A]"><Check size={11} /> Filed to {filedTo}</span>}
        </div>
      </div>
      {canFile && !filedTo && (
        <button onClick={onFile} className="hidden h-7 items-center gap-1 rounded-[7px] px-2 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-ink-900 group-hover/file:flex">
          <FolderInput size={13} /> File to records
        </button>
      )}
      <button className="flex h-7 w-7 items-center justify-center rounded-[7px] text-stone-400 hover:bg-stone-100 hover:text-ink-900" aria-label={`Download ${f.name}`}>
        <Download size={14} />
      </button>
    </div>
  );
}

function FolderCard({ a, canFile, onFile }: { a: Extract<Attachment, { kind: "folder" }>; canFile: boolean; onFile: () => void }) {
  const [open, setOpen] = useState(false);
  const total = a.files.reduce((s, f) => s + f.size, 0);
  return (
    <div className="rounded-[10px] border border-stone-200 bg-white shadow-card">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
          <Folder size={20} strokeWidth={1.6} className="text-gold-700" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-ink-900">{a.name}</div>
            <div className="text-[11px] text-stone-500">
              Folder · {a.files.length} files · {fileSize(total)}
              {a.filedTo && <span className="ml-2 inline-flex items-center gap-1 text-[#1F6F6A]"><Check size={11} /> Filed to {a.filedTo}</span>}
            </div>
          </div>
          {open ? <ChevronDown size={15} className="text-stone-400" /> : <ChevronRight size={15} className="text-stone-400" />}
        </button>
        {canFile && !a.filedTo && (
          <button onClick={onFile} className="flex h-7 items-center gap-1 rounded-[7px] px-2 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-ink-900">
            <FolderInput size={13} /> File to records
          </button>
        )}
      </div>
      {open && (
        <ul className="border-t border-stone-100 px-3 py-1.5">
          {a.files.map((f) => (
            <li key={f.path} className="flex items-center gap-2.5 py-1.5 text-[12px]">
              <FileGlyph type={f.type} size={15} />
              <span className="min-w-0 flex-1 truncate text-stone-700">{f.path.split("/").slice(1).join(" / ")}</span>
              <span className="text-stone-400">{fileSize(f.size)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MeetCard({ meet }: { meet: NonNullable<Message["meet"]> }) {
  const when = meet.when ? `${dayFmt.format(new Date(meet.when))} · ${clock(meet.when)} ET` : "Happening now";
  return (
    <div className="flex max-w-[460px] items-center gap-3 rounded-[12px] border border-stone-200 bg-white px-4 py-3 shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ background: "#E3F1EF" }}>
        <Video size={18} style={{ color: COMM }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-ink-900">{meet.title}</div>
        <div className="text-[11px] text-stone-500">
          Google Meet · {when}
        </div>
        <div className="font-mono text-[11px] text-stone-400">meet.google.com/{meet.code}</div>
      </div>
      <a
        href={`https://meet.google.com/${meet.code}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold text-white"
        style={{ background: COMM }}
      >
        Join
      </a>
    </div>
  );
}

/* ───────────────────────── message ───────────────────────── */

function MessageItem({
  m,
  compact,
  replies,
  viewerId,
  canFile,
  onReply,
  onPin,
  onReact,
  onFile,
}: {
  m: Message;
  compact: boolean;
  replies: Message[];
  viewerId: string;
  canFile: boolean;
  onReply?: () => void;
  onPin?: () => void;
  onReact: (emoji: string) => void;
  onFile: (attId: string) => void;
}) {
  const p = personById(m.authorId);
  const client = p && p.org !== "aurum" ? clientById(p.org) : undefined;
  const name = m.authorId === viewerId ? "You" : p?.name;
  return (
    <div className={cx("group relative flex gap-3 rounded-[10px] px-3 hover:bg-stone-50/70", compact ? "py-0.5" : "mt-3 py-1.5")}>
      <div className="w-9 shrink-0">{!compact ? <PersonAvatar id={m.authorId} size={36} /> : <span className="hidden pt-1 text-[10px] text-stone-400 group-hover:block">{clock(m.at)}</span>}</div>
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[14px] font-semibold text-ink-900">{name}</span>
            <span className="text-[11px] text-stone-500">
              {p?.id === ME ? "Aurum" : p?.org === "aurum" ? `Aurum · ${p.title}` : p?.clientRole === "guest" ? `Guest · ${p.title}` : `${client?.short} · ${p?.title}`}
            </span>
            <span className="text-[11px] text-stone-400">{clock(m.at)}</span>
            {m.pinned && <Pin size={11} className="text-gold-700" aria-label="Pinned" />}
          </div>
        )}
        {m.body && <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-stone-700">{m.body}</p>}
        {m.meet && (
          <div className="mt-1.5">
            <MeetCard meet={m.meet} />
          </div>
        )}
        {!!m.attachments?.length && (
          <div className="mt-2 grid max-w-[560px] gap-2">
            {m.attachments.map((a) =>
              a.kind === "folder" ? (
                <FolderCard key={a.id} a={a} canFile={canFile} onFile={() => onFile(a.id)} />
              ) : (
                <FileRow key={a.id} f={a} filedTo={a.filedTo} canFile={canFile} onFile={() => onFile(a.id)} />
              ),
            )}
          </div>
        )}
        {!!m.reactions?.length && (
          <div className="mt-1.5 flex gap-1">
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                className={cx(
                  "flex h-6 items-center gap-1 rounded-full border px-2 text-[12px]",
                  r.by.includes(viewerId) ? "border-[#1F8A84]/40 bg-[#E3F1EF] text-ink-900" : "border-stone-200 bg-white text-stone-600",
                )}
                title={r.by.map((b) => (b === viewerId ? "You" : personById(b)?.name)).join(", ")}
              >
                {r.emoji} <span className="font-semibold">{r.by.length}</span>
              </button>
            ))}
          </div>
        )}
        {replies.length > 0 && onReply && (
          <button onClick={onReply} className="mt-1.5 flex items-center gap-2 rounded-[8px] py-1 pr-2 text-[12px] font-semibold hover:bg-white" style={{ color: COMM }}>
            <span className="flex -space-x-1.5">
              {[...new Set(replies.map((r) => r.authorId))].slice(0, 3).map((a) => (
                <span key={a} className="rounded-[9px] ring-2 ring-white">
                  <PersonAvatar id={a} size={20} />
                </span>
              ))}
            </span>
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
            <span className="font-normal text-stone-400">Last reply {clock(replies[replies.length - 1].at)}</span>
          </button>
        )}
      </div>
      <div className="absolute -top-3 right-3 hidden items-center rounded-[9px] border border-stone-200 bg-white p-0.5 shadow-card group-hover:flex">
        {["👍", "✅"].map((e) => (
          <button key={e} onClick={() => onReact(e)} className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[13px] hover:bg-stone-100" aria-label={`React ${e}`}>
            {e}
          </button>
        ))}
        {onReply && (
          <button onClick={onReply} className="flex h-7 w-7 items-center justify-center rounded-[7px] text-stone-500 hover:bg-stone-100 hover:text-ink-900" aria-label="Reply in thread">
            <MessageSquareText size={14} />
          </button>
        )}
        {onPin && (
          <button onClick={onPin} className="flex h-7 w-7 items-center justify-center rounded-[7px] text-stone-500 hover:bg-stone-100 hover:text-ink-900" aria-label={m.pinned ? "Unpin" : "Pin"}>
            <Pin size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function MessageList({
  list,
  all,
  dates = true,
  viewerId,
  canFile,
  onThread,
  onPin,
  onReact,
  onFile,
}: {
  list: Message[];
  all: Message[];
  dates?: boolean;
  viewerId: string;
  canFile: boolean;
  onThread?: (id: string) => void;
  onPin?: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onFile: (id: string, attId: string) => void;
}) {
  const out: ReactNode[] = [];
  let prev: Message | undefined;
  for (const m of list) {
    if (dates && (!prev || dayKey(prev.at) !== dayKey(m.at))) {
      out.push(
        <div key={`d-${m.id}`} className="relative my-4 flex items-center justify-center">
          <span className="absolute inset-x-0 top-1/2 h-px bg-stone-200" />
          <span className="relative rounded-full border border-stone-200 bg-white px-3 py-0.5 text-[11px] font-semibold text-stone-600">{dayFmt.format(new Date(m.at))}</span>
        </div>,
      );
      prev = undefined;
    }
    const compact = !!prev && prev.authorId === m.authorId && new Date(m.at).getTime() - new Date(prev.at).getTime() < 5 * 60_000;
    out.push(
      <MessageItem
        key={m.id}
        m={m}
        compact={compact}
        replies={all.filter((r) => r.parentId === m.id)}
        viewerId={viewerId}
        canFile={canFile}
        onReply={onThread ? () => onThread(m.id) : undefined}
        onPin={onPin ? () => onPin(m.id) : undefined}
        onReact={(e) => onReact(m.id, e)}
        onFile={(a) => onFile(m.id, a)}
      />,
    );
    prev = m;
  }
  return <>{out}</>;
}

/* ───────────────────────── composer ───────────────────────── */

type Draft = { files: Attachment[] };

async function readEntry(entry: FileSystemEntry, base: string): Promise<(FileRef & { path: string })[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
    return [{ name: file.name, size: file.size, type: typeOf(file.name), path: `${base}${file.name}` }];
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const kids: FileSystemEntry[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
    if (!batch.length) break;
    kids.push(...batch);
  }
  const nested = await Promise.all(kids.map((k) => readEntry(k, `${base}${entry.name}/`)));
  return nested.flat();
}

let uid = 0;
const nextId = (p: string) => `${p}${Date.now().toString(36)}${++uid}`;

function Composer({
  placeholder,
  disabled,
  accent,
  accentInk,
  onSend,
}: {
  placeholder: string;
  disabled?: string;
  accent: string;
  accentInk: string;
  onSend: (body: string, files: Attachment[]) => void;
}) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft>({ files: [] });
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    const inFolder = files.filter((f) => f.webkitRelativePath);
    const loose = files.filter((f) => !f.webkitRelativePath);
    const add: Attachment[] = loose.map((f) => ({ id: nextId("a"), kind: "file", name: f.name, size: f.size, type: typeOf(f.name) }));
    if (inFolder.length) {
      const root = inFolder[0].webkitRelativePath.split("/")[0];
      add.push({
        id: nextId("a"),
        kind: "folder",
        name: root,
        files: inFolder.map((f) => ({ name: f.name, size: f.size, type: typeOf(f.name), path: f.webkitRelativePath })),
      });
    }
    setDraft((d) => ({ files: [...d.files, ...add] }));
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const items = Array.from(e.dataTransfer.items ?? []);
    const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
    if (!entries.length) return addFiles(e.dataTransfer.files);
    const add: Attachment[] = [];
    for (const en of entries) {
      if (en.isDirectory) {
        const files = await readEntry(en, "");
        add.push({ id: nextId("a"), kind: "folder", name: en.name, files });
      } else {
        const [f] = await readEntry(en, "");
        add.push({ id: nextId("a"), kind: "file", name: f.name, size: f.size, type: f.type });
      }
    }
    setDraft((d) => ({ files: [...d.files, ...add] }));
  };

  const send = () => {
    if (!text.trim() && !draft.files.length) return;
    onSend(text.trim(), draft.files);
    setText("");
    setDraft({ files: [] });
  };

  if (disabled)
    return (
      <div className="m-4 flex items-center gap-2 rounded-[12px] border border-stone-200 bg-stone-50 px-4 py-3 text-[13px] text-stone-500">
        <Megaphone size={15} /> {disabled}
      </div>
    );

  return (
    <div className="px-4 pb-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cx("rounded-[14px] border bg-white shadow-card transition-colors", over ? "border-[#1F8A84] bg-[#F3FAF9]" : "border-stone-300 focus-within:border-ink-700")}
      >
        {draft.files.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-stone-100 p-3">
            {draft.files.map((a) => (
              <span key={a.id} className="flex items-center gap-2 rounded-[9px] border border-stone-200 bg-stone-50 py-1.5 pl-2.5 pr-1.5 text-[12px]">
                {a.kind === "folder" ? <Folder size={14} className="text-gold-700" /> : <FileGlyph type={a.type} size={14} />}
                <span className="max-w-[220px] truncate font-medium text-ink-900">{a.name}</span>
                <span className="text-stone-400">{a.kind === "folder" ? `${a.files.length} files` : fileSize(a.size)}</span>
                <button onClick={() => setDraft((d) => ({ files: d.files.filter((x) => x.id !== a.id) }))} className="rounded p-0.5 text-stone-400 hover:text-ink-900" aria-label={`Remove ${a.name}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder={over ? "Drop files or folders to attach" : placeholder}
          className="block w-full resize-none bg-transparent px-4 pt-3 text-[14px] text-ink-900 placeholder:text-stone-400 focus:outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
            <input
              ref={folderInput}
              type="file"
              multiple
              hidden
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
              onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))}
            />
            <button onClick={() => fileInput.current?.click()} className="flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] font-medium text-stone-500 hover:bg-stone-100 hover:text-ink-900">
              <Paperclip size={15} /> Files
            </button>
            <button onClick={() => folderInput.current?.click()} className="flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] font-medium text-stone-500 hover:bg-stone-100 hover:text-ink-900">
              <FolderUp size={15} /> Folder
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 text-[11px] text-stone-400 sm:flex">
              <Lock size={11} /> Encrypted
            </span>
            <button
              onClick={send}
              disabled={!text.trim() && !draft.files.length}
              className="flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold disabled:opacity-40"
              style={{ background: accent, color: accentInk }}
            >
              Send <SendHorizontal size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Google Meet menu ───────────────────────── */

function MeetMenu({ onPost }: { onPost: (meet: NonNullable<Message["meet"]>) => void }) {
  const [open, setOpen] = useState<null | "menu" | "schedule">(null);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const code = () => {
    const a = "abcdefghijkmnopqrstuvwxyz";
    const pick = (k: number) => Array.from({ length: k }, () => a[Math.floor(Math.random() * a.length)]).join("");
    return `${pick(3)}-${pick(4)}-${pick(3)}`;
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => (o ? null : "menu"))}
        className="flex h-8 items-center gap-1.5 rounded-[9px] border border-stone-200 bg-white px-2.5 text-[12px] font-semibold text-ink-900 shadow-card hover:border-stone-300"
        aria-expanded={!!open}
      >
        <Video size={14} style={{ color: COMM }} /> Meet <ChevronDown size={12} className="text-stone-400" />
      </button>
      {open === "menu" && (
        <div className="absolute right-0 top-10 z-30 w-[240px] rounded-[12px] border border-stone-200 bg-white p-1.5 shadow-lift">
          <button
            onClick={() => {
              onPost({ code: code(), title: "Call started" });
              window.open("https://meet.google.com/new", "_blank", "noopener");
              setOpen(null);
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] hover:bg-stone-50"
          >
            <Video size={15} style={{ color: COMM }} />
            <span>
              <span className="block font-semibold text-ink-900">Start a call now</span>
              <span className="block text-[11px] text-stone-500">Posts the link to this channel</span>
            </span>
          </button>
          <button onClick={() => setOpen("schedule")} className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] hover:bg-stone-50">
            <CalendarClock size={15} className="text-stone-500" />
            <span>
              <span className="block font-semibold text-ink-900">Schedule a call</span>
              <span className="block text-[11px] text-stone-500">Calendar invite to everyone here</span>
            </span>
          </button>
        </div>
      )}
      {open === "schedule" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!when) return;
            onPost({ code: code(), title: title || "Scheduled call", when: new Date(when).toISOString() });
            setTitle("");
            setWhen("");
            setOpen(null);
          }}
          className="absolute right-0 top-10 z-30 w-[300px] space-y-3 rounded-[12px] border border-stone-200 bg-white p-4 shadow-lift"
        >
          <div className="text-[13px] font-semibold text-ink-900">Schedule a Google Meet</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-9 w-full rounded-[8px] border border-stone-300 px-3 text-[13px] focus:border-ink-900 focus:outline-none" />
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            required
            className="h-9 w-full rounded-[8px] border border-stone-300 px-3 text-[13px] focus:border-ink-900 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(null)} className="h-8 rounded-[8px] px-3 text-[12px] font-semibold text-stone-600 hover:bg-stone-100">
              Cancel
            </button>
            <button className="h-8 rounded-[8px] px-3 text-[12px] font-semibold text-white" style={{ background: COMM }}>
              Schedule
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ───────────────────────── main ───────────────────────── */

export function CommsWorkspace(props: Props) {
  const viewerId = props.mode === "aurum" ? ME : props.personId;
  const viewer = personById(viewerId)!;
  const accent = props.mode === "client" ? props.accent : "#0F2340";
  const accentInk = props.mode === "client" ? props.accentInk : "#FFFFFF";
  const isAurum = props.mode === "aurum";
  const isClientAdmin = viewer.clientRole === "admin";

  const [msgs, setMsgs] = useState<Message[]>(seedMessages);
  const [reqs, setReqs] = useState<AccessRequest[]>(seedRequests);
  const [chans, setChans] = useState<Channel[]>(allChannels);
  const [read, setRead] = useState<Record<string, string>>(isAurum ? seedRead : {});
  const startSpace = props.mode === "aurum" && props.space && spaceById(props.space) ? props.space : "fund";
  const [spaceId, setSpaceId] = useState<string>(isAurum ? startSpace : "");
  const visible = useMemo(() => chans.filter((c) => canSeeChannel(c, viewerId)), [chans, viewerId]);
  /** Where to land in a space: the conversation with unread messages, else the most recent one. */
  const firstIn = (sid: string) => {
    const last = (id: string) => seedMessages.filter((m) => m.where === id).reduce((t, m) => (m.at > t ? m.at : t), "");
    const unreadIn = (id: string) => (isAurum ? unreadCount(id, seedMessages, viewerId, seedRead) : 0);
    return [...visible.filter((c) => c.spaceId === sid)].sort((a, b) => unreadIn(b.id) - unreadIn(a.id) || last(b.id).localeCompare(last(a.id)))[0];
  };
  const [view, setView] = useState<View>(() => ({ kind: "conv", where: isAurum ? (startSpace === "fund" ? "f-strlex-stx" : firstIn(startSpace)?.id ?? "") : (visible.find((c) => c.name !== "general") ?? visible[0])?.id ?? "" }));
  const [tab, setTab] = useState<"messages" | "files" | "pinned">("messages");
  const [side, setSide] = useState<null | { kind: "thread"; id: string } | { kind: "details" }>(null);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [ask, setAsk] = useState<null | AccessRequest["kind"]>(null);

  const dms = directThreads.filter((d) => d.memberIds.includes(viewerId));
  const where = view.kind === "conv" ? view.where : "";
  const channel = channelById(where) ?? chans.find((c) => c.id === where);
  const dm = dms.find((d) => d.id === where);
  const space = channel ? spaceById(channel.spaceId) : undefined;
  const role = space ? spaceRole(space.id, viewerId) : null;
  const canApprove = (r: AccessRequest) => viewerId === ME || spaceById(r.spaceId)?.ownerId === viewerId;
  const pendingFor = reqs.filter((r) => r.status === "pending" && canApprove(r));

  const open = (id: string) => {
    setView({ kind: "conv", where: id });
    setTab("messages");
    setSide(null);
    setQuery("");
    setRead((r) => ({ ...r, [id]: new Date().toISOString() }));
  };

  const post = (body: string, attachments: Attachment[], extra?: Partial<Message>) =>
    setMsgs((m) => [...m, { id: nextId("m"), where, authorId: viewerId, at: new Date().toISOString(), body, attachments: attachments.length ? attachments : undefined, ...extra }]);

  const react = (id: string, emoji: string) =>
    setMsgs((all) =>
      all.map((m) => {
        if (m.id !== id) return m;
        const rs = [...(m.reactions ?? [])];
        const i = rs.findIndex((r) => r.emoji === emoji);
        if (i < 0) rs.push({ emoji, by: [viewerId] });
        else {
          const by = rs[i].by.includes(viewerId) ? rs[i].by.filter((b) => b !== viewerId) : [...rs[i].by, viewerId];
          if (by.length) rs[i] = { ...rs[i], by };
          else rs.splice(i, 1);
        }
        return { ...m, reactions: rs };
      }),
    );
  const pin = (id: string) => setMsgs((all) => all.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)));
  const fileTo = (id: string, attId: string) =>
    setMsgs((all) => all.map((m) => (m.id === id ? { ...m, attachments: m.attachments?.map((a) => (a.id === attId ? { ...a, filedTo: "Corporate documents" } : a)) } : m)));

  const decide = (r: AccessRequest, ok: boolean) => {
    setReqs((all) => all.map((x) => (x.id === r.id ? { ...x, status: ok ? "approved" : "declined", decidedBy: viewerId } : x)));
    if (ok && r.kind === "channel")
      setChans((c) => [...c, { id: nextId("ch"), spaceId: r.spaceId, clientId: r.clientId, name: r.subject, topic: r.detail }]);
  };

  const scroller = useRef<HTMLDivElement>(null);
  const count = msgs.filter((m) => m.where === where).length;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [where, count, tab]);

  const top = msgs.filter((m) => m.where === where && !m.parentId);
  const shown = query ? top.filter((m) => `${m.body} ${m.attachments?.map((a) => a.name).join(" ")}`.toLowerCase().includes(query.toLowerCase())) : top;
  const pinned = top.filter((m) => m.pinned);
  const files = msgs
    .filter((m) => m.where === where)
    .flatMap((m) => (m.attachments ?? []).map((a) => ({ a, m })));

  const unread = (id: string) => (isAurum && id !== where ? unreadCount(id, msgs, viewerId, read) : 0);
  const spaceUnread = (sid: string) => visible.filter((c) => c.spaceId === sid).reduce((s, c) => s + unread(c.id), 0);

  /* ── channel column content ── */
  const channelLink = (c: Channel) => {
    const on = view.kind === "conv" && where === c.id;
    const u = unread(c.id);
    const Icon = c.announce ? Megaphone : c.private ? Lock : Hash;
    return (
      <button
        key={c.id}
        onClick={() => open(c.id)}
        className={cx(
          "flex h-8 w-full items-center gap-2 rounded-[9px] px-2.5 text-left text-[13px]",
          on ? "bg-champagne font-semibold text-ink-900" : u ? "font-semibold text-ink-900 hover:bg-white/70" : "text-stone-600 hover:bg-white/70 hover:text-ink-900",
        )}
        aria-current={on}
      >
        <Icon size={13} strokeWidth={2} className={on ? "text-ink-900" : "text-stone-400"} />
        <span className="min-w-0 flex-1 truncate">{c.name}</span>
        {!!c.guestIds?.length && <span className="rounded-[5px] bg-white px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-stone-500">Guest</span>}
        {u > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: COMM }}>
            {u}
          </span>
        )}
      </button>
    );
  };

  const section = (key: string, title: ReactNode, list: Channel[], color?: string) => {
    if (!list.length) return null;
    const c = collapsed[key];
    return (
      <div key={key} className="mt-4">
        <button onClick={() => setCollapsed((s) => ({ ...s, [key]: !c }))} className="mb-1 flex w-full items-center gap-1.5 px-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500 hover:text-ink-900">
          {c ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          {color && <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />}
          <span className="truncate">{title}</span>
        </button>
        {!c && <div className="space-y-0.5">{list.map(channelLink)}</div>}
      </div>
    );
  };

  const dmLink = (d: (typeof dms)[number]) => {
    const others = d.memberIds.filter((x) => x !== viewerId);
    const on = view.kind === "conv" && where === d.id;
    const u = unread(d.id);
    return (
      <button
        key={d.id}
        onClick={() => open(d.id)}
        className={cx("flex h-9 w-full items-center gap-2 rounded-[9px] px-2 text-left text-[13px]", on ? "bg-champagne font-semibold text-ink-900" : u ? "font-semibold text-ink-900 hover:bg-white/70" : "text-stone-600 hover:bg-white/70")}
      >
        <PersonAvatar id={others[0]} size={22} />
        <span className="min-w-0 flex-1 truncate">{others.length === 1 ? personById(others[0])?.name : others.map((o) => personById(o)?.name.split(" ")[0]).join(", ")}</span>
        {u > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: COMM }}>
            {u}
          </span>
        )}
      </button>
    );
  };

  /* ── conversation header ── */
  const convTitle = channel ? (
    <span className="flex items-center gap-1.5">
      {channel.announce ? <Megaphone size={17} className="text-stone-400" /> : channel.private ? <Lock size={16} className="text-stone-400" /> : <Hash size={17} className="text-stone-400" />}
      {channel.name}
    </span>
  ) : dm ? (
    dm.memberIds
      .filter((x) => x !== viewerId)
      .map((x) => personById(x)?.name)
      .join(", ")
  ) : (
    ""
  );
  const convSub = channel
    ? [isAurum ? (channel.clientId ? clientById(channel.clientId)?.short : "Aurum internal") : null, space?.firmWide ? null : space?.name, channel.topic].filter(Boolean).join(" · ")
    : "Direct message";
  const members = channel ? channelMembers(channel) : dm ? dm.memberIds.map((x) => personById(x)!) : [];
  const announceOnly = channel?.announce && !(viewerId === ME || role === "owner");

  const filedLabel = isAurum;

  return (
    <div className={cx("flex gap-3 overflow-hidden", props.className ?? "h-screen p-3")} style={{ "--comm": COMM } as CSSProperties}>
      {/* rail — Aurum staff only */}
      {isAurum && (
        <nav className="flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-[18px] bg-cream py-4 shadow-card" aria-label="Spaces">
          <Link href="/admin" className="mb-2 flex flex-col items-center gap-1 text-stone-400 hover:text-ink-900" aria-label="Back to Aurum">
            <AurumMark size={26} color={COMM} />
          </Link>
          <span className="mb-1 h-px w-8 bg-stone-200" />
          {spaces.map((s) => (
            <HexTile
              key={s.id}
              label={s.short}
              title={s.name}
              active={spaceId === s.id && view.kind === "conv" && !dm}
              unread={spaceUnread(s.id)}
              onClick={() => {
                setSpaceId(s.id);
                const f = firstIn(s.id);
                if (f) open(f.id);
              }}
            >
              {s.firmWide ? <AurumMark size={16} color={spaceId === s.id ? "#F8C618" : "#A39B8A"} /> : undefined}
            </HexTile>
          ))}
          <div className="mt-auto flex flex-col items-center gap-2">
            <Link href="/admin" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-stone-400 hover:bg-white hover:text-ink-900" aria-label="Back to hub" title="Back to hub">
              <ArrowLeft size={16} />
            </Link>
            <PersonAvatar id={ME} size={34} />
          </div>
        </nav>
      )}

      {/* channel column */}
      <aside className="flex w-[268px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-cream shadow-card">
        <div className="border-b border-stone-200/70 px-4 pb-3 pt-4">
          {isAurum ? (
            <>
              <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: COMM }}>
                <AurumMark size={11} color={COMM} /> Communication
              </div>
              <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.01em] text-ink-900">{spaceById(spaceId)?.name}</div>
              <div className="mt-0.5 text-[11px] text-stone-500">
                Owner · {spaceById(spaceId)?.ownerId === ME ? "You" : personById(spaceById(spaceId)?.ownerId ?? "")?.name}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-500">
                <Lock size={10} /> Secure messages
              </div>
              <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.01em] text-ink-900">Aurum</div>
              <div className="mt-0.5 text-[11px] text-stone-500">Your administration team</div>
            </>
          )}
        </div>
        <div className="scroll-quiet flex-1 overflow-y-auto px-2 pb-4">
          {isAurum ? (
            <>
              {section(`${spaceId}-int`, spaceById(spaceId)?.firmWide ? "Firm-wide" : "Aurum internal", visible.filter((c) => c.spaceId === spaceId && c.clientId === null))}
              {clients
                .filter((cl) => cl.spaceIds.includes(spaceId))
                .map((cl) => section(`${spaceId}-${cl.id}`, cl.short, visible.filter((c) => c.spaceId === spaceId && c.clientId === cl.id), clientColor(cl.id)))}
            </>
          ) : (
            spaces
              .filter((s) => visible.some((c) => c.spaceId === s.id))
              .map((s) => section(s.id, s.name.replace(" Solution", "").replace("Fund", "Fund administration"), visible.filter((c) => c.spaceId === s.id)))
          )}
          {dms.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 px-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Direct messages</div>
              <div className="space-y-0.5">{dms.map(dmLink)}</div>
            </div>
          )}
        </div>
        <div className="space-y-1 border-t border-stone-200/70 p-2">
          {isAurum ? (
            <button
              onClick={() => {
                setView({ kind: "requests" });
                setSide(null);
              }}
              className={cx("flex h-9 w-full items-center gap-2 rounded-[9px] px-2.5 text-[13px]", view.kind === "requests" ? "bg-champagne font-semibold text-ink-900" : "text-stone-600 hover:bg-white/70")}
            >
              <ShieldCheck size={15} className="text-stone-500" />
              <span className="flex-1 text-left">Access requests</span>
              {pendingFor.length > 0 && <span className="rounded-full bg-gold-100 px-1.5 text-[11px] font-bold text-gold-700">{pendingFor.length}</span>}
            </button>
          ) : isClientAdmin ? (
            <>
              <button onClick={() => setAsk("channel")} className="flex h-8 w-full items-center gap-2 rounded-[9px] px-2.5 text-[12px] font-medium text-stone-600 hover:bg-white/70 hover:text-ink-900">
                <Plus size={14} /> Request a channel
              </button>
              <button onClick={() => setAsk("colleague")} className="flex h-8 w-full items-center gap-2 rounded-[9px] px-2.5 text-[12px] font-medium text-stone-600 hover:bg-white/70 hover:text-ink-900">
                <Users size={14} /> Add a colleague
              </button>
              <button onClick={() => setAsk("guest")} className="flex h-8 w-full items-center gap-2 rounded-[9px] px-2.5 text-[12px] font-medium text-stone-600 hover:bg-white/70 hover:text-ink-900">
                <UserPlus size={14} /> Invite a guest
              </button>
              {reqs.some((r) => r.requestedBy === viewerId) && (
                <div className="mt-1 rounded-[10px] bg-white px-3 py-2">
                  {reqs
                    .filter((r) => r.requestedBy === viewerId)
                    .map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 py-0.5 text-[11px]">
                        <span className="truncate text-stone-600">{r.subject}</span>
                        <span className={cx("shrink-0 font-semibold", r.status === "approved" ? "text-[#1F6F6A]" : r.status === "declined" ? "text-[#B5542A]" : "text-gold-700")}>
                          {r.status === "pending" ? "With Aurum" : r.status === "approved" ? "Approved" : "Declined"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </aside>

      {/* main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] bg-white shadow-card">
        {view.kind === "requests" ? (
          <RequestsView reqs={reqs} canApprove={canApprove} onDecide={decide} />
        ) : (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 pb-0 pt-4">
              <div className="min-w-0">
                <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink-900">{convTitle}</h1>
                <p className="mt-0.5 truncate text-[12px] text-stone-500">{convSub}</p>
                <div className="mt-3 flex gap-5">
                  {(["messages", "files", "pinned"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cx("-mb-px border-b-2 pb-2.5 text-[13px] font-semibold capitalize", tab === t ? "border-ink-900 text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900")}
                    >
                      {t}
                      {t === "files" && files.length > 0 && <span className="ml-1 text-stone-400">{files.length}</span>}
                      {t === "pinned" && pinned.length > 0 && <span className="ml-1 text-stone-400">{pinned.length}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="relative hidden xl:block">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setTab("messages");
                    }}
                    placeholder="Search in conversation"
                    className="h-8 w-[200px] rounded-[9px] border border-stone-200 bg-stone-50 pl-7 pr-2 text-[12px] focus:border-ink-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setSide((s) => (s?.kind === "details" ? null : { kind: "details" }))}
                  className="flex h-8 items-center gap-1.5 rounded-[9px] border border-stone-200 bg-white px-2 text-[12px] font-semibold text-ink-900 shadow-card hover:border-stone-300"
                  aria-label="Members and details"
                >
                  <span className="flex -space-x-1.5">
                    {members.slice(0, 3).map((p) => (
                      <span key={p.id} className="rounded-[9px] ring-2 ring-white">
                        <PersonAvatar id={p.id} size={20} />
                      </span>
                    ))}
                  </span>
                  {members.length}
                </button>
                <MeetMenu onPost={(meet) => post("", [], { meet })} />
                <button
                  onClick={() => setSide((s) => (s?.kind === "details" ? null : { kind: "details" }))}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] text-stone-500 hover:bg-stone-100 hover:text-ink-900"
                  aria-label="Details"
                >
                  <Info size={16} />
                </button>
              </div>
            </header>

            {tab === "messages" && (
              <>
                <div ref={scroller} className="flex-1 overflow-y-auto px-3 pb-2 pt-1">
                  {shown.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[13px] text-stone-400">{query ? "No messages match." : "No messages yet. Say hello."}</div>
                  ) : (
                    <MessageList
                      list={shown}
                      all={msgs}
                      viewerId={viewerId}
                      canFile={filedLabel}
                      onThread={(id) => setSide({ kind: "thread", id })}
                      onPin={pin}
                      onReact={react}
                      onFile={fileTo}
                    />
                  )}
                </div>
                <Composer
                  key={where}
                  placeholder={channel ? `Message #${channel.name}` : "Message"}
                  disabled={announceOnly ? "Only the partners post in announcements." : undefined}
                  accent={accent}
                  accentInk={accentInk}
                  onSend={(b, f) => post(b, f)}
                />
              </>
            )}

            {tab === "files" && <FilesTab files={files} canFile={filedLabel} onFile={fileTo} />}

            {tab === "pinned" && (
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {pinned.length ? (
                  <MessageList list={pinned} all={msgs} viewerId={viewerId} canFile={filedLabel} onPin={pin} onReact={react} onFile={fileTo} />
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-stone-400">Nothing pinned. Hover a message and use the pin to keep it here.</div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* right panel */}
      {side && view.kind === "conv" && (
        <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-card">
          {side.kind === "thread" ? (
            <ThreadPanel
              root={msgs.find((m) => m.id === side.id)!}
              replies={msgs.filter((m) => m.parentId === side.id)}
              all={msgs}
              viewerId={viewerId}
              canFile={filedLabel}
              accent={accent}
              accentInk={accentInk}
              onClose={() => setSide(null)}
              onReact={react}
              onFile={fileTo}
              onSend={(b, f) => post(b, f, { parentId: side.id })}
            />
          ) : (
            <DetailsPanel ch={channel} members={members} viewerId={viewerId} files={files.length} onClose={() => setSide(null)} />
          )}
        </aside>
      )}

      {ask && props.mode === "client" && (
        <RequestDialog
          kind={ask}
          clientId={props.clientId}
          channels={visible}
          accent={accent}
          accentInk={accentInk}
          onClose={() => setAsk(null)}
          onSubmit={(subject, detail, sid) => {
            setReqs((r) => [{ id: nextId("r"), kind: ask, spaceId: sid, clientId: props.clientId, requestedBy: viewerId, at: new Date().toISOString(), subject, detail, status: "pending" }, ...r]);
            setAsk(null);
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── panels ───────────────────────── */

function FilesTab({ files, canFile, onFile }: { files: { a: Attachment; m: Message }[]; canFile: boolean; onFile: (id: string, attId: string) => void }) {
  if (!files.length) return <div className="flex flex-1 items-center justify-center text-[13px] text-stone-400">Files and folders shared here will be listed in this tab.</div>;
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-stone-200 text-left text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-500">
            <th className="py-2 font-bold">Name</th>
            <th className="py-2 font-bold">Shared by</th>
            <th className="py-2 font-bold">Date</th>
            <th className="py-2 text-right font-bold">Size</th>
            <th className="py-2 pl-4 font-bold">Records</th>
          </tr>
        </thead>
        <tbody>
          {[...files].reverse().map(({ a, m }) => (
            <tr key={a.id} className="border-b border-stone-100">
              <td className="py-2.5">
                <span className="flex items-center gap-2.5">
                  {a.kind === "folder" ? <Folder size={16} className="text-gold-700" /> : <FileGlyph type={a.type} size={16} />}
                  <span className="font-medium text-ink-900">{a.name}</span>
                  {a.kind === "folder" && <span className="text-[11px] text-stone-400">{a.files.length} files</span>}
                </span>
              </td>
              <td className="py-2.5 text-stone-600">{personById(m.authorId)?.name}</td>
              <td className="py-2.5 text-stone-600">{shortFmt.format(new Date(m.at))}</td>
              <td className="py-2.5 text-right tabular-nums text-stone-600">{fileSize(a.kind === "folder" ? a.files.reduce((s, f) => s + f.size, 0) : a.size)}</td>
              <td className="py-2.5 pl-4">
                {a.filedTo ? (
                  <span className="inline-flex items-center gap-1 text-[12px] text-[#1F6F6A]">
                    <Check size={12} /> Filed
                  </span>
                ) : canFile ? (
                  <button onClick={() => onFile(m.id, a.id)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-stone-600 hover:text-ink-900">
                    <FolderInput size={13} /> File
                  </button>
                ) : (
                  <span className="text-stone-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThreadPanel({
  root,
  replies,
  all,
  viewerId,
  canFile,
  accent,
  accentInk,
  onClose,
  onReact,
  onFile,
  onSend,
}: {
  root: Message;
  replies: Message[];
  all: Message[];
  viewerId: string;
  canFile: boolean;
  accent: string;
  accentInk: string;
  onClose: () => void;
  onReact: (id: string, e: string) => void;
  onFile: (id: string, a: string) => void;
  onSend: (b: string, f: Attachment[]) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div className="text-[15px] font-semibold text-ink-900">Thread</div>
        <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink-900" aria-label="Close thread">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        <MessageList list={[root]} all={[]} dates={false} viewerId={viewerId} canFile={canFile} onReact={onReact} onFile={onFile} />
        <div className="mx-4 my-2 flex items-center gap-2 text-[11px] font-semibold text-stone-500">
          {replies.length} {replies.length === 1 ? "reply" : "replies"} <span className="h-px flex-1 bg-stone-200" />
        </div>
        <MessageList list={replies} all={all} dates={false} viewerId={viewerId} canFile={canFile} onReact={onReact} onFile={onFile} />
      </div>
      <Composer key={root.id} placeholder="Reply…" accent={accent} accentInk={accentInk} onSend={onSend} />
    </>
  );
}

function DetailsPanel({ ch, members, viewerId, files, onClose }: { ch?: Channel; members: ReturnType<typeof channelMembers>; viewerId: string; files: number; onClose: () => void }) {
  const sp = ch ? spaceById(ch.spaceId) : undefined;
  const groups: [string, typeof members][] = [
    ["Aurum", members.filter((p) => p.org === "aurum")],
    [ch?.clientId ? clientById(ch.clientId)?.short ?? "Client" : "Client", members.filter((p) => p.org !== "aurum" && p.clientRole !== "guest")],
    ["Guests", members.filter((p) => p.clientRole === "guest")],
  ];
  const ownerName = sp ? (sp.ownerId === viewerId ? "You" : personById(sp.ownerId)?.name) : undefined;
  return (
    <>
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div className="text-[15px] font-semibold text-ink-900">Details</div>
        <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink-900" aria-label="Close details">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {ch && (
          <dl className="space-y-2.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Space</dt>
              <dd className="text-right font-medium text-ink-900">{sp?.name}</dd>
            </div>
            {ownerName && (
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Owner</dt>
                <dd className="text-right font-medium text-ink-900">{ownerName}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Visibility</dt>
              <dd className="text-right font-medium text-ink-900">{ch.private ? "Private — named members" : ch.clientId ? "Everyone in this client" : "Aurum staff in this space"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Files</dt>
              <dd className="text-right font-medium text-ink-900">{files}</dd>
            </div>
          </dl>
        )}
        {groups
          .filter(([, list]) => list.length)
          .map(([label, list]) => (
            <div key={label}>
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">
                {label} · {list.length}
              </div>
              <ul className="space-y-2.5">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <PersonAvatar id={p.id} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink-900">
                        {p.id === viewerId ? "You" : p.name}
                        {sp?.ownerId === p.id && <span className="ml-1.5 rounded-[5px] bg-gold-50 px-1.5 py-px text-[10px] font-semibold text-gold-700">Owner</span>}
                        {p.clientRole === "admin" && <span className="ml-1.5 rounded-[5px] bg-stone-100 px-1.5 py-px text-[10px] font-semibold text-stone-600">Client admin</span>}
                      </div>
                      <div className="truncate text-[11px] text-stone-500">{p.expires ? `${p.title} · access until ${shortFmt.format(new Date(p.expires))}` : p.title}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-4 text-[12px] leading-relaxed text-stone-600">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-ink-900">
            <ShieldCheck size={14} style={{ color: COMM }} /> Encrypted and retained
          </div>
          Encrypted in transit and at rest with a key unique to this workspace. Messages and files can’t be deleted; every view, download and change is recorded in the audit log.
        </div>
      </div>
    </>
  );
}

function RequestsView({ reqs, canApprove, onDecide }: { reqs: AccessRequest[]; canApprove: (r: AccessRequest) => boolean; onDecide: (r: AccessRequest, ok: boolean) => void }) {
  const label = { channel: "New channel", guest: "Guest access", colleague: "New colleague" } as const;
  const pending = reqs.filter((r) => r.status === "pending");
  const done = reqs.filter((r) => r.status !== "pending");
  const row = (r: AccessRequest) => (
    <li key={r.id} className="flex items-center gap-4 rounded-[14px] border border-stone-200 bg-white px-5 py-4 shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-stone-100 text-stone-600">
        {r.kind === "channel" ? <Hash size={17} /> : r.kind === "guest" ? <UserPlus size={17} /> : <Users size={17} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[14px] font-semibold text-ink-900">{r.kind === "channel" ? `#${r.subject}` : r.subject}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">{label[r.kind]}</span>
        </div>
        <div className="mt-0.5 text-[12px] text-stone-600">{r.detail}</div>
        <div className="mt-1 text-[11px] text-stone-400">
          {clientById(r.clientId)?.short} · requested by {personById(r.requestedBy)?.name} · {shortFmt.format(new Date(r.at))} · {spaceById(r.spaceId)?.name}
        </div>
      </div>
      {r.status === "pending" ? (
        canApprove(r) ? (
          <div className="flex shrink-0 gap-2">
            <button onClick={() => onDecide(r, false)} className="h-8 rounded-[9px] border border-stone-200 px-3 text-[12px] font-semibold text-stone-600 hover:border-stone-400 hover:text-ink-900">
              Decline
            </button>
            <button onClick={() => onDecide(r, true)} className="h-8 rounded-[9px] px-3 text-[12px] font-semibold text-white" style={{ background: COMM }}>
              Approve
            </button>
          </div>
        ) : (
          <span className="text-[12px] text-stone-400">Space owner decides</span>
        )
      ) : (
        <span className={cx("text-[12px] font-semibold", r.status === "approved" ? "text-[#1F6F6A]" : "text-[#B5542A]")}>
          {r.status === "approved" ? "Approved" : "Declined"} by {r.decidedBy === ME ? "you" : personById(r.decidedBy ?? "")?.name}
        </span>
      )}
    </li>
  );
  return (
    <div className="flex-1 overflow-y-auto px-8 py-7">
      <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink-900">Access requests</h1>
      <p className="mt-1 text-[12px] text-stone-500">Clients request; the space owner approves. Nothing grants access without Aurum.</p>
      <ul className="mt-6 space-y-3">{pending.length ? pending.map(row) : <li className="text-[13px] text-stone-400">Nothing waiting.</li>}</ul>
      {done.length > 0 && (
        <>
          <div className="mb-3 mt-8 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Decided</div>
          <ul className="space-y-3">{done.map(row)}</ul>
        </>
      )}
    </div>
  );
}

function RequestDialog({
  kind,
  clientId,
  channels,
  accent,
  accentInk,
  onClose,
  onSubmit,
}: {
  kind: AccessRequest["kind"];
  clientId: string;
  channels: Channel[];
  accent: string;
  accentInk: string;
  onClose: () => void;
  onSubmit: (subject: string, detail: string, spaceId: string) => void;
}) {
  const client = clientById(clientId)!;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [why, setWhy] = useState("");
  const [sid, setSid] = useState(client.spaceIds[0]);
  const [chan, setChan] = useState(channels[0]?.id ?? "");
  const [until, setUntil] = useState("");
  const title = { channel: "Request a channel", colleague: "Add a colleague", guest: "Invite a guest" }[kind];
  const field = "h-9 w-full rounded-[9px] border border-stone-300 px-3 text-[13px] focus:border-ink-900 focus:outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6 backdrop-blur-[2px]" role="dialog" aria-modal aria-label={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (kind === "channel") onSubmit(name.toLowerCase().trim().replace(/\s+/g, "-"), why, sid);
          else if (kind === "colleague") onSubmit(`${name} — ${email}`, why || `All ${client.short} channels`, sid);
          else onSubmit(`${name} — ${email}`, `${why} · #${channels.find((c) => c.id === chan)?.name}${until ? ` · until ${shortFmt.format(new Date(until))}` : ""}`, channels.find((c) => c.id === chan)?.spaceId ?? sid);
        }}
        className="w-full max-w-[440px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-ink-900">{title}</h2>
            <p className="mt-0.5 text-[12px] text-stone-500">Aurum reviews and approves every access change.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {kind === "channel" ? (
          <>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel name, e.g. investor-relations" className={field} />
            {client.spaceIds.length > 1 && (
              <select value={sid} onChange={(e) => setSid(e.target.value)} className={field}>
                {client.spaceIds.map((s) => (
                  <option key={s} value={s}>
                    {spaceById(s)?.name}
                  </option>
                ))}
              </select>
            )}
          </>
        ) : (
          <>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "guest" ? "Name and firm" : "Full name"} className={field} />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
            {kind === "guest" && (
              <div className="grid grid-cols-2 gap-3">
                <select value={chan} onChange={(e) => setChan(e.target.value)} className={field} aria-label="Channel">
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
                <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} required className={field} aria-label="Access until" />
              </div>
            )}
          </>
        )}
        <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} placeholder={kind === "guest" ? "Role, e.g. tax adviser" : "Reason (optional)"} className="w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-[9px] px-4 text-[13px] font-semibold text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button className="h-9 rounded-[9px] px-4 text-[13px] font-semibold" style={{ background: accent, color: accentInk }}>
            Send request
          </button>
        </div>
      </form>
    </div>
  );
}
