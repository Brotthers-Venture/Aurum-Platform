"use client";

import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FolderClosed,
  FolderOpen,
  Link2,
  Pencil,
  Plus,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import {
  pageCount,
  pageViews,
  views as seedViews,
  type FolderAccess,
  type Question,
  type Room,
  type RoomDoc,
  type RoomSettings,
  type RoomUser,
  type ShareLink,
} from "@/lib/dataroom";
import { localPageViews } from "@/lib/dataroom-local";
import { ActionButton, GhostButton, Pill, field, fmtDate, fmtShort } from "@/components/firm/kit";
import { DocAnalytics, LinksPanel, RoomBranding } from "./RoomExtras";
import { loadRoomBrands } from "@/lib/dataroom-extras";
import { coverPosition, roomCover } from "@/lib/covers";

/* The room console: a numbered index with a details rail, a party-by-party engagement read-out,
   a reference-numbered Q&A queue, one permissions grid for every audience, and an exportable audit trail. */

const C = FIRM.dataroom;
type Section = "index" | "links" | "engagement" | "qa" | "permissions" | "branding" | "audit" | "setup";
const size = (b: number) => (b === 0 ? "Awaiting file" : b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
const dur = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${Math.round(s / 60)} min` : s ? `${Math.round(s)} s` : "—");
const NOW = Date.parse("2026-11-24T22:00:00Z");
const ago = (iso: string) => {
  const d = Math.round((NOW - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
};
const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
const ext = (n: string) => (n.split(".").pop() ?? "").toUpperCase();
const bare = (f: string) => f.replace(/^\d+ /, "");
const num = (f: string) => f.split(" ")[0];
const Glyph = ({ name, s = 15 }: { name: string; s?: number }) =>
  /\.(xlsx|csv)$/i.test(name) ? <FileSpreadsheet size={s} className="shrink-0 text-[#1F6F6A]" /> : <FileText size={s} className="shrink-0 text-[#B5542A]" />;

export function previewUrl(l: ShareLink, settings: RoomSettings) {
  const json = JSON.stringify({ link: l, settings });
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `/room/${l.id}?preview=1&cfg=${b64}`;
}
const linkUrl = (id: string) => (typeof window === "undefined" ? `/room/${id}` : `${window.location.origin}/room/${id}`);

export function RoomConsole({
  room,
  docs,
  questions,
  links,
  settings,
  onBack,
  onUpload,
  onRename,
  onSaveLink,
  onSettings,
  onDraft,
  onRelease,
  flash,
}: {
  room: Room;
  docs: RoomDoc[];
  users: RoomUser[];
  questions: Question[];
  links: ShareLink[];
  settings: RoomSettings;
  onBack: () => void;
  onUpload: (folder: string, files: File[]) => void;
  onRename: (name: string) => void;
  onSaveLink: (l: ShareLink) => void;
  onSettings: (s: RoomSettings) => void;
  onDraft: (id: string, text: string) => void;
  onRelease: (id: string) => void;
  flash: (t: string) => void;
}) {
  const [section, setSection] = useState<Section>("index");
  const [editing, setEditing] = useState(false);
  const [analytics, setAnalytics] = useState<RoomDoc | null>(null);
  const [banner, setBanner] = useState(() => (typeof window === "undefined" ? roomCover(room) : (loadRoomBrands()[room.id]?.banner ?? roomCover(room))));
  const act = useActivity(room, docs);
  const go = (x: Section) => {
    setAnalytics(null);
    setSection(x);
  };
  const openQs = questions.filter((q) => q.status !== "Answered").length;
  const tabs: [Section, string, number?][] = [
    ["index", "Documents"],
    ["links", "Links"],
    ["engagement", "Analytics"],
    ["qa", "Q&A", openQs],
    ["permissions", "Permissions"],
    ["branding", "Branding"],
    ["audit", "Audit trail"],
    ["setup", "Settings"],
  ];
  return (
    <div className="-mx-8 -mt-4 min-h-[calc(100vh-64px)] border-t border-stone-200">
      {/* room header: the room's banner, then title, figures and tabs */}
      <div className="relative h-[148px] overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner} alt="" style={{ objectPosition: coverPosition(banner) }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/5" />
        <div className="relative flex h-full flex-col justify-between px-8 py-4 text-[#fff] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 text-[12px]">
            <button onClick={onBack} className="flex items-center gap-1 font-medium text-[rgba(255,255,255,0.85)] hover:text-[#fff]">
              <ArrowLeft size={13} /> All rooms
            </button>
            <span className="text-[rgba(255,255,255,0.40)]">/</span>
            <span className="text-[rgba(255,255,255,0.80)]">
              {room.purpose} · {room.client}
            </span>
          </div>
          <div className="text-[12px] text-[rgba(255,255,255,0.80)]">Updated {fmtShort(room.created)} · owner {room.owner}</div>
        </div>
      </div>
      <div className="border-b border-stone-200 bg-white px-8 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          {editing ? (
            <input
              autoFocus
              defaultValue={room.name}
              onBlur={(e) => {
                if (e.target.value.trim()) onRename(e.target.value.trim());
                setEditing(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="h-9 w-[440px] border-b-2 bg-transparent text-[22px] font-semibold text-ink-900 focus:outline-none"
              style={{ borderColor: C }}
            />
          ) : (
            <h1 className="group flex items-center gap-2 text-[22px] font-semibold tracking-[-0.01em] text-ink-900">
              {room.name}
              <button onClick={() => setEditing(true)} className="text-stone-300 opacity-0 hover:text-ink-900 group-hover:opacity-100" aria-label="Rename room">
                <Pencil size={14} />
              </button>
            </h1>
          )}
          <Pill tone={room.status === "Open" ? "good" : room.status === "Preparing" ? "gold" : "neutral"}>{room.status}</Pill>
          <div className="ml-auto flex items-center gap-5 text-[12px] text-stone-500">
            <span>
              <b className="num font-semibold text-ink-900">{docs.length}</b> documents
            </span>
            <span>
              <b className="num font-semibold text-ink-900">{act.parties.length}</b> parties active
            </span>
            <span>
              <b className="num font-semibold text-ink-900">{links.filter((l) => !l.revoked).length}</b> audiences
            </span>
            <ActionButton color={C} onClick={() => go("links")}>
              <Link2 size={14} /> Share
            </ActionButton>
          </div>
        </div>
        <div className="mt-3 flex gap-6">
          {tabs.map(([id, label, n]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={cx(
                "-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-semibold",
                section === id && !analytics ? "text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900",
              )}
              style={section === id && !analytics ? { borderColor: C } : undefined}
            >
              {label}
              {n ? (
                <span className="num rounded-[5px] px-1.5 text-[10.5px] font-bold text-white" style={{ background: C }}>
                  {n}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-stone-50">
        {analytics ? (
          <DocAnalytics room={room} doc={analytics} pv={act.pv} onBack={() => setAnalytics(null)} flash={flash} />
        ) : (
          <>
        {section === "index" && (
          <Index room={room} docs={docs} links={links} settings={settings} questions={questions} act={act} onUpload={onUpload} flash={flash} go={go} onAnalytics={setAnalytics} />
        )}
        {section === "links" && <LinksPanel links={links} settings={settings} preview={previewUrl} onSave={onSaveLink} onEdit={() => go("permissions")} flash={flash} />}
        {section === "branding" && <RoomBranding room={room} docs={docs} onSaved={(b) => setBanner(b ?? roomCover(room))} previewHref={links.find((l) => !l.revoked) ? previewUrl(links.find((l) => !l.revoked)!, settings) : undefined} flash={flash} />}
        {section === "engagement" && <Engagement docs={docs} questions={questions} act={act} />}
        {section === "qa" && <QaQueue settings={settings} onSettings={onSettings} questions={questions} onDraft={onDraft} onRelease={onRelease} flash={flash} />}
        {section === "permissions" && <PermissionGrid room={room} docs={docs} links={links} settings={settings} onSave={onSaveLink} flash={flash} />}
        {section === "audit" && <AuditTrail room={room} docs={docs} act={act} />}
        {section === "setup" && <Setup settings={settings} onChange={onSettings} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── activity model ───────────────────────── */

type Act = ReturnType<typeof useActivity>;
function useActivity(room: Room, docs: RoomDoc[]) {
  const [local] = useState(localPageViews);
  return useMemo(() => {
    const ids = new Set(docs.map((d) => d.id));
    const pv = [...pageViews, ...local].filter((v) => ids.has(v.docId));
    const ev = seedViews.filter((v) => v.roomId === room.id);
    const byName = new Map(docs.map((d) => [d.name, d]));
    type P = { firm: string; people: Set<string>; seconds: number; docs: Set<string>; downloads: number; last: string; folders: Record<string, number> };
    const parties = new Map<string, P>();
    const get = (firm: string, at: string) => {
      const p = parties.get(firm) ?? { firm, people: new Set<string>(), seconds: 0, docs: new Set<string>(), downloads: 0, last: at, folders: {} };
      if (at > p.last) p.last = at;
      parties.set(firm, p);
      return p;
    };
    for (const v of pv) {
      const p = get(v.firm, v.at);
      const d = docs.find((x) => x.id === v.docId)!;
      p.people.add(v.viewer);
      p.seconds += v.seconds;
      p.docs.add(v.docId);
      p.folders[d.folder] = (p.folders[d.folder] ?? 0) + v.seconds;
    }
    for (const e of ev) {
      const p = get(e.firm, e.at);
      p.people.add(e.who);
      const d = byName.get(e.doc);
      if (d) p.docs.add(d.id);
      if (e.action === "Downloaded") p.downloads += 1;
      if (e.action === "Viewed" && d && !pv.some((v) => v.docId === d.id && v.firm === e.firm)) {
        p.seconds += e.seconds;
        p.folders[d.folder] = (p.folders[d.folder] ?? 0) + e.seconds;
      }
    }
    return { pv, ev, parties: [...parties.values()] };
  }, [docs, local, room.id]);
}

/** Interest score 0–100: reading time (40), share of the index opened (30), recency (15), downloads and questions (15). */
function score(p: Act["parties"][number], maxSec: number, nDocs: number, qs: number) {
  const t = maxSec ? p.seconds / maxSec : 0;
  const cov = nDocs ? Math.min(1, p.docs.size / Math.max(3, nDocs * 0.4)) : 0;
  const days = (NOW - Date.parse(p.last)) / 86_400_000;
  const rec = Math.max(0, 1 - days / 14);
  const sig = Math.min(1, (p.downloads + qs) / 3);
  return Math.round(40 * t + 30 * cov + 15 * rec + 15 * sig);
}
const band = (s: number) => (s >= 60 ? { label: "High", color: "#1F8A4C" } : s >= 30 ? { label: "Moderate", color: "#C9820F" } : { label: "Low", color: "#7A8699" });

/* ───────────────────────── index ───────────────────────── */

function Index({
  room,
  docs,
  links,
  settings,
  questions,
  act,
  onUpload,
  flash,
  go,
  onAnalytics,
}: {
  room: Room;
  docs: RoomDoc[];
  links: ShareLink[];
  settings: RoomSettings;
  questions: Question[];
  act: Act;
  onUpload: (folder: string, files: File[]) => void;
  flash: (t: string) => void;
  go: (s: Section) => void;
  onAnalytics: (d: RoomDoc) => void;
}) {
  const folders = [...new Set(docs.map((d) => d.folder))];
  const [folder, setFolder] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [docId, setDocId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const shown = docs.filter((d) => (!folder || d.folder === folder) && (!q || `${d.index} ${d.name}`.toLowerCase().includes(q.toLowerCase())));
  const doc = docs.find((d) => d.id === docId);
  const timeOn = (id: string) => act.pv.filter((v) => v.docId === id).reduce((s, v) => s + v.seconds, 0);
  const exportIndex = () => {
    const rows = [
      ["Ref", "Folder", "Document", "Type", "Pages", "Size"],
      ...docs.map((d) => [d.index, bare(d.folder), d.name, ext(d.name), String(pageCount(d.name)), size(d.size)]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.name.replace(/[^\w]+/g, "_")}_index.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Index exported");
  };

  return (
    <div className="grid min-h-[calc(100vh-200px)] grid-cols-[260px_minmax(0,1fr)_320px]">
      {/* tree */}
      <aside className="border-r border-stone-200 bg-white py-4">
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Index</span>
          <button onClick={exportIndex} className="flex items-center gap-1 text-[11.5px] font-semibold text-stone-500 hover:text-ink-900">
            <Download size={12} /> CSV
          </button>
        </div>
        <button
          onClick={() => setFolder(null)}
          className={cx("flex w-full items-center gap-2 px-4 py-1.5 text-left text-[12.5px]", !folder ? "font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50")}
          style={!folder ? { boxShadow: `inset 3px 0 0 ${C}` } : undefined}
        >
          All documents <span className="num ml-auto text-[11px] text-stone-400">{docs.length}</span>
        </button>
        {folders.map((f) => {
          const isOpen = open[f];
          const kids = docs.filter((d) => d.folder === f);
          return (
            <div key={f}>
              <div
                className={cx("flex items-center gap-1 pl-2 pr-4", folder === f ? "bg-stone-50" : "hover:bg-stone-50")}
                style={folder === f ? { boxShadow: `inset 3px 0 0 ${C}` } : undefined}
              >
                <button
                  onClick={() => setOpen((o) => ({ ...o, [f]: !o[f] }))}
                  className="rounded p-0.5 text-stone-400 hover:text-ink-900"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <button
                  onClick={() => setFolder(f)}
                  className={cx("flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-[12.5px]", folder === f ? "font-semibold text-ink-900" : "text-stone-700")}
                >
                  {isOpen ? <FolderOpen size={14} style={{ color: C }} /> : <FolderClosed size={14} style={{ color: C }} />}
                  {settings.indexNumbers && <span className="num text-stone-400">{num(f)}</span>}
                  <span className="truncate">{bare(f)}</span>
                  <span className="num ml-auto text-[11px] text-stone-400">{kids.length}</span>
                </button>
              </div>
              {isOpen &&
                kids.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => (setFolder(f), setDocId(d.id))}
                    className={cx(
                      "flex w-full items-center gap-2 py-1 pl-10 pr-4 text-left text-[12px]",
                      docId === d.id ? "font-semibold text-ink-900" : "text-stone-500 hover:text-ink-900",
                    )}
                  >
                    {settings.indexNumbers && <span className="num w-7 shrink-0 text-stone-400">{d.index}</span>}
                    <span className="truncate">{d.name.replace(/\.[a-z]+$/i, "")}</span>
                  </button>
                ))}
            </div>
          );
        })}
      </aside>

      {/* list */}
      <div className="min-w-0 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="text-[14px] font-semibold text-ink-900">
            {folder ? (
              <>
                {settings.indexNumbers && <span className="num mr-1.5 text-stone-400">{num(folder)}</span>}
                {bare(folder)}
              </>
            ) : (
              "All documents"
            )}
          </div>
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find by name or reference"
              className="h-8 w-[240px] rounded-[8px] border border-stone-200 bg-white pl-8 pr-3 text-[12.5px] focus:border-ink-900 focus:outline-none"
            />
          </div>
          <input
            ref={input}
            type="file"
            multiple
            hidden
            onChange={(e) => (e.target.files?.length && onUpload(folder ?? folders[0], Array.from(e.target.files)), (e.target.value = ""))}
          />
          <GhostButton onClick={() => input.current?.click()}>
            <Upload size={13} /> Add files{folder ? ` to ${num(folder)}` : ""}
          </GhostButton>
        </div>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-stone-200 bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">
                {settings.indexNumbers && <th className="w-14 px-4 py-2">Ref</th>}
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Pages</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Reading time</th>
                <th className="px-4 py-2">Last opened</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d, i) => {
                const newFolder = !folder && (i === 0 || shown[i - 1].folder !== d.folder);
                return (
                  <Fragment key={d.id}>
                    {newFolder && (
                      <tr className="border-b border-stone-100 bg-stone-25">
                        <td colSpan={settings.indexNumbers ? 6 : 5} className="px-4 py-1.5 text-[11.5px] font-semibold text-stone-600">
                          {settings.indexNumbers && <span className="num mr-2 text-stone-400">{num(d.folder)}</span>}
                          {bare(d.folder)}
                        </td>
                      </tr>
                    )}
                    <tr
                      onClick={() => setDocId(d.id)}
                      className={cx("cursor-pointer border-b border-stone-100 last:border-0", docId === d.id ? "bg-stone-100" : "hover:bg-stone-50")}
                    >
                      {settings.indexNumbers && <td className="num px-4 py-2 text-stone-500">{d.index}</td>}
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2 text-ink-900">
                          <Glyph name={d.name} /> {d.name}
                        </span>
                      </td>
                      <td className="num px-3 py-2 text-stone-600">{pageCount(d.name)}</td>
                      <td className="num px-3 py-2 text-stone-600">{size(d.size)}</td>
                      <td className="num px-3 py-2 text-stone-600">{dur(timeOn(d.id))}</td>
                      <td className="px-4 py-2 text-stone-500">{d.lastViewer ? `${d.lastViewer.split(" ")[0]} · ${d.lastViewed ? fmtShort(d.lastViewed) : ""}` : "—"}</td>
                    </tr>
                  </Fragment>
                );
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400">
                    No documents match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* rail */}
      <aside className="border-l border-stone-200 bg-white">
        {doc ? (
          <DocDetails doc={doc} links={links} act={act} onClose={() => setDocId(null)} onAnalytics={() => onAnalytics(doc)} />
        ) : (
          <Checklist docs={docs} links={links} settings={settings} questions={questions} go={go} />
        )}
      </aside>
    </div>
  );
}

function DocDetails({ doc, links, act, onClose, onAnalytics }: { doc: RoomDoc; links: ShareLink[]; act: Act; onClose: () => void; onAnalytics: () => void }) {
  const pages = pageCount(doc.name);
  const pv = act.pv.filter((v) => v.docId === doc.id);
  const per = Array.from({ length: pages }, (_, i) => pv.filter((v) => v.page === i + 1).reduce((s, v) => s + v.seconds, 0));
  const max = Math.max(1, ...per);
  const readers = Object.values(
    pv.reduce<Record<string, { who: string; firm: string; s: number; pages: number }>>(
      (m, v) => ((m[v.viewer] ??= { who: v.viewer, firm: v.firm, s: 0, pages: 0 }), (m[v.viewer].s += v.seconds), (m[v.viewer].pages += 1), m),
      {},
    ),
  ).sort((a, b) => b.s - a.s);
  const LVL: Record<FolderAccess, string> = { none: "Hidden", view: "View only", download: "Can download", upload: "Can add files" };
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="num text-[11.5px] font-semibold" style={{ color: C }}>
            {doc.index} · {ext(doc.name)}
          </div>
          <div className="mt-0.5 text-[14px] font-semibold leading-snug text-ink-900">{doc.name}</div>
          <div className="mt-0.5 text-[11.5px] text-stone-500">
            {pages} pages · {size(doc.size)} · {bare(doc.folder)}
          </div>
        </div>
        <button onClick={onClose} className="rounded p-1 text-stone-400 hover:bg-stone-100" aria-label="Close details">
          <X size={14} />
        </button>
      </div>

      <div className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Attention by page</div>
      <div className="mt-2 flex h-14 items-end gap-[3px]">
        {per.map((s, i) => (
          <div
            key={i}
            title={`Page ${i + 1}: ${dur(s)}`}
            className="flex-1 rounded-t-[2px]"
            style={{ height: `${Math.max(6, (s / max) * 100)}%`, background: s ? C : "var(--color-stone-100)", opacity: s ? 0.35 + 0.65 * (s / max) : 1 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-stone-400">
        <span>p.1</span>
        <span>p.{pages}</span>
      </div>
      <button onClick={onAnalytics} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-stone-200 bg-white py-1.5 text-[12px] font-semibold text-ink-900 hover:border-stone-300">
        Full analytics and versions <ChevronRight size={13} />
      </button>

      <div className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Readers</div>
      <ul className="mt-2 space-y-2">
        {readers.map((r) => (
          <li key={r.who} className="flex items-center justify-between text-[12px]">
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink-900">{r.who}</span>
              <span className="block truncate text-[11px] text-stone-500">{r.firm}</span>
            </span>
            <span className="num shrink-0 text-stone-600">
              {dur(r.s)} · {r.pages}/{pages} pp
            </span>
          </li>
        ))}
        {!readers.length && <li className="text-[12px] text-stone-400">Not opened yet.</li>}
      </ul>

      <div className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Who can see it</div>
      <ul className="mt-2 space-y-1.5 text-[12px]">
        {links.map((l) => {
          const lv = l.folders[doc.folder] ?? "view";
          return (
            <li key={l.id} className="flex items-center justify-between">
              <span className={cx("truncate", l.revoked ? "text-stone-400 line-through" : "text-ink-900")}>{l.name}</span>
              <span className={cx("shrink-0 font-semibold", lv === "none" ? "text-stone-400" : "")} style={lv !== "none" ? { color: C } : undefined}>
                {LVL[lv]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Checklist({ docs, links, settings, questions, go }: { docs: RoomDoc[]; links: ShareLink[]; settings: RoomSettings; questions: Question[]; go: (s: Section) => void }) {
  const live = links.filter((l) => !l.revoked);
  const items: [boolean, string, Section][] = [
    [docs.length > 0, "Every folder has at least one document", "index"],
    [settings.indexNumbers, "Documents carry reference numbers", "setup"],
    [live.length > 0, "At least one audience can enter", "permissions"],
    [live.every((l) => l.nda !== "off"), "Every audience accepts an NDA first", "permissions"],
    [live.every((l) => l.watermark), "Pages are watermarked for every audience", "permissions"],
    [live.every((l) => l.verifyEmail || l.mode === "invite"), "Visitors prove their email", "permissions"],
    [!settings.visitorQa || settings.qaApprover, "Answers are approved before release", "qa"],
    [questions.every((q) => q.status === "Answered" || (NOW - Date.parse(q.at)) / 86_400_000 < 3), "No question older than 3 days", "qa"],
  ];
  const done = items.filter(([ok]) => ok).length;
  return (
    <div className="p-5">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Readiness</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="num text-[28px] font-semibold text-ink-900">
          {done}/{items.length}
        </span>
        <span className="text-[12px] text-stone-500">checks passed</span>
      </div>
      <div className="mt-2 flex gap-1">
        {items.map(([ok], i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: ok ? C : "var(--color-stone-100)" }} />
        ))}
      </div>
      <ul className="mt-4 space-y-1">
        {items.map(([ok, label, to]) => (
          <li key={label}>
            <button onClick={() => go(to)} className="flex w-full items-start gap-2 rounded-[6px] px-1.5 py-1.5 text-left text-[12.5px] hover:bg-stone-50">
              {ok ? <CircleCheck size={15} className="mt-px shrink-0" style={{ color: C }} /> : <CircleDashed size={15} className="mt-px shrink-0 text-[#C9820F]" />}
              <span className={ok ? "text-stone-600" : "font-medium text-ink-900"}>{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11.5px] text-stone-500">Select a document to see its readers, attention by page and which audiences can open it.</p>
    </div>
  );
}

/* ───────────────────────── engagement ───────────────────────── */

function Engagement({ docs, questions, act }: { docs: RoomDoc[]; questions: Question[]; act: Act }) {
  const [open, setOpen] = useState<string | null>(null);
  const folders = [...new Set(docs.map((d) => d.folder))];
  const maxSec = Math.max(0, ...act.parties.map((p) => p.seconds));
  const qBy = (firm: string) => questions.filter((q) => firm.startsWith(q.firm) || q.firm.startsWith(firm)).length;
  const rows = act.parties.map((p) => ({ p, s: score(p, maxSec, docs.length, qBy(p.firm)) })).sort((a, b) => b.s - a.s);
  const cellMax = Math.max(1, ...act.parties.flatMap((p) => Object.values(p.folders)));
  return (
    <div className="space-y-6 px-8 py-6">
      <div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[15px] font-semibold text-ink-900">Interest by party</div>
            <div className="text-[12px] text-stone-500">Score out of 100: reading time 40, share of the index opened 30, recency 15, downloads and questions 15.</div>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-stone-200 bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">
                <th className="px-4 py-2">Party</th>
                <th className="w-[220px] px-3 py-2">Interest</th>
                <th className="px-3 py-2">People</th>
                <th className="px-3 py-2">Reading time</th>
                <th className="px-3 py-2">Index opened</th>
                <th className="px-3 py-2">Downloads</th>
                <th className="px-3 py-2">Questions</th>
                <th className="px-4 py-2">Last active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, s }) => {
                const b = band(s);
                return (
                  <Fragment key={p.firm}>
                    <tr onClick={() => setOpen((o) => (o === p.firm ? null : p.firm))} className="cursor-pointer border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-medium text-ink-900">
                        <span className="flex items-center gap-1.5">
                          {open === p.firm ? <ChevronDown size={13} className="text-stone-400" /> : <ChevronRight size={13} className="text-stone-400" />}
                          {p.firm}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="num w-7 font-semibold text-ink-900">{s}</span>
                          <span className="h-1.5 flex-1 rounded-full bg-stone-100">
                            <span className="block h-1.5 rounded-full" style={{ width: `${s}%`, background: b.color }} />
                          </span>
                          <span className="w-[64px] text-[11px] font-semibold" style={{ color: b.color }}>
                            {b.label}
                          </span>
                        </span>
                      </td>
                      <td className="num px-3 py-2.5 text-stone-600">{p.people.size}</td>
                      <td className="num px-3 py-2.5 text-stone-600">{dur(p.seconds)}</td>
                      <td className="num px-3 py-2.5 text-stone-600">
                        {p.docs.size} of {docs.length}
                      </td>
                      <td className="num px-3 py-2.5 text-stone-600">{p.downloads || "—"}</td>
                      <td className="num px-3 py-2.5 text-stone-600">{qBy(p.firm) || "—"}</td>
                      <td className="px-4 py-2.5 text-stone-500">{ago(p.last)}</td>
                    </tr>
                    {open === p.firm && (
                      <tr className="border-b border-stone-100 bg-stone-25">
                        <td colSpan={8} className="px-10 py-3">
                          <div className="grid grid-cols-2 gap-6 text-[12px]">
                            <div>
                              <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-500">People</div>
                              {[...p.people].map((who) => (
                                <div key={who} className="flex justify-between py-0.5">
                                  <span className="text-ink-900">{who}</span>
                                  <span className="num text-stone-500">
                                    {dur(
                                      act.pv.filter((v) => v.viewer === who).reduce((x, v) => x + v.seconds, 0) ||
                                        act.ev.filter((e) => e.who === who).reduce((x, e) => x + e.seconds, 0),
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-500">Documents opened</div>
                              {[...p.docs].map((id) => {
                                const d = docs.find((x) => x.id === id);
                                return d ? (
                                  <div key={id} className="flex gap-2 py-0.5">
                                    <span className="num w-8 text-stone-400">{d.index}</span>
                                    <span className="truncate text-ink-900">{d.name}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400">
                    Nobody has entered this room yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length > 0 && (
        <div>
          <div className="text-[15px] font-semibold text-ink-900">Where each party spends time</div>
          <div className="text-[12px] text-stone-500">Darker cells mean more reading time in that section of the index.</div>
          <div className="mt-3 overflow-x-auto rounded-[10px] border border-stone-200 bg-white p-4">
            <div className="grid gap-1 text-[11.5px]" style={{ gridTemplateColumns: `200px repeat(${folders.length}, minmax(90px,1fr))` }}>
              <div />
              {folders.map((f) => (
                <div key={f} className="truncate px-1 pb-1 font-semibold text-stone-600" title={bare(f)}>
                  <span className="num mr-1 text-stone-400">{num(f)}</span>
                  {bare(f)}
                </div>
              ))}
              {rows.map(({ p }) => (
                <Fragment key={p.firm}>
                  <div className="flex items-center truncate pr-2 text-ink-900">{p.firm}</div>
                  {folders.map((f) => {
                    const s = p.folders[f] ?? 0;
                    const t = s / cellMax;
                    return (
                      <div
                        key={f}
                        title={`${p.firm} · ${bare(f)}: ${dur(s)}`}
                        className="num flex h-9 items-center justify-center rounded-[4px] text-[11px] font-semibold"
                        style={{ background: s ? `rgba(53,88,192,${0.1 + 0.85 * t})` : "var(--color-stone-100)", color: t > 0.45 ? "#fff" : "var(--color-stone-600)" }}
                      >
                        {s ? dur(s) : ""}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Q&A queue ───────────────────────── */

const STAGE: Record<Question["status"], { label: string; tone: "warn" | "gold" | "good" }> = {
  Open: { label: "New", tone: "warn" },
  Draft: { label: "Awaiting approval", tone: "gold" },
  Answered: { label: "Released", tone: "good" },
};

function QaQueue({
  settings,
  onSettings,
  questions,
  onDraft,
  onRelease,
  flash,
}: {
  settings: RoomSettings;
  onSettings: (s: RoomSettings) => void;
  questions: Question[];
  onDraft: (id: string, t: string) => void;
  onRelease: (id: string) => void;
  flash: (t: string) => void;
}) {
  const set = (p: Partial<RoomSettings>) => onSettings({ ...settings, ...p });
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [sel, setSel] = useState<string | null>(null);
  const approval = settings.qaFlow === "advanced" && settings.qaApprover;
  const ref = (q: Question) => `Q-${String(questions.indexOf(q) + 1).padStart(3, "0")}`;
  const list = [...questions].filter((q) => filter === "all" || q.status !== "Answered").sort((a, b) => a.at.localeCompare(b.at));
  return (
    <div className="space-y-4 px-8 py-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] border border-stone-200 bg-white px-4 py-3 text-[12.5px]">
        <span className="font-semibold text-ink-900">Rules</span>
        <Check2 on={settings.visitorQa} onClick={() => set({ visitorQa: !settings.visitorQa })} label="Visitors can submit questions" />
        <Check2 on={approval} onClick={() => set(approval ? { qaApprover: false } : { qaFlow: "advanced", qaApprover: true })} label="A partner approves every answer" />
        <Check2
          on={settings.qaFlow === "advanced" && settings.qaExpert}
          onClick={() => set({ qaFlow: "advanced", qaExpert: !settings.qaExpert })}
          label="A specialist drafts first"
        />
        <div className="ml-auto flex rounded-[8px] border border-stone-200 p-0.5">
          {(["open", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx("h-7 rounded-[6px] px-3 text-[12px] font-semibold", filter === f ? "bg-ink-900 text-white" : "text-stone-500")}
            >
              {f === "open" ? "Outstanding" : "All"}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-white">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">
              <th className="w-20 px-4 py-2">Ref</th>
              <th className="px-3 py-2">Question</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">Document</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-4 py-2 text-right">Waiting</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => {
              const days = Math.floor((NOW - Date.parse(q.at)) / 86_400_000);
              return (
                <Fragment key={q.id}>
                  <tr
                    onClick={() => setSel((s) => (s === q.id ? null : q.id))}
                    className={cx("cursor-pointer border-b border-stone-100", sel === q.id ? "bg-stone-100" : "hover:bg-stone-50")}
                  >
                    <td className="num px-4 py-2.5 font-semibold text-stone-600">{ref(q)}</td>
                    <td className="max-w-[520px] px-3 py-2.5 text-ink-900">{q.text}</td>
                    <td className="px-3 py-2.5 text-stone-600">
                      {q.from}
                      <span className="block text-[11px] text-stone-400">{q.firm}</span>
                    </td>
                    <td className="num px-3 py-2.5 text-stone-600">{q.docIndex ? `${q.docIndex}${q.page ? ` p.${q.page}` : ""}` : "General"}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={STAGE[q.status].tone}>{STAGE[q.status].label}</Pill>
                    </td>
                    <td className={cx("num px-4 py-2.5 text-right", q.status !== "Answered" && days >= 3 ? "font-semibold text-[#C0392B]" : "text-stone-500")}>
                      {q.status === "Answered" ? "—" : days ? `${days}d` : "<1d"}
                    </td>
                  </tr>
                  {sel === q.id && (
                    <tr className="border-b border-stone-100 bg-stone-25">
                      <td />
                      <td colSpan={5} className="py-3 pr-4">
                        <QuestionCard
                          q={q}
                          needsApproval={approval}
                          onDraft={(t) => (onDraft(q.id, t), flash(approval ? "Draft saved — approve it to release" : "Draft saved"))}
                          onRelease={() => (onRelease(q.id), flash(`Answer released to ${q.from}`))}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-400">
                  Nothing outstanding.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Check2({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-stone-700 hover:text-ink-900">
      <span
        className={cx("flex h-4 w-4 items-center justify-center rounded-[4px] border", on ? "border-transparent text-white" : "border-stone-300 bg-white")}
        style={on ? { background: C } : undefined}
      >
        {on && <Check size={11} strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

export function QuestionCard({
  q,
  room,
  needsApproval = true,
  onDraft,
  onRelease,
}: {
  q: Question;
  room?: string;
  needsApproval?: boolean;
  onDraft: (t: string) => void;
  onRelease: () => void;
}) {
  const [text, setText] = useState(q.draft ?? "");
  return (
    <div className="rounded-[10px] border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[12px] text-stone-500">
          <span className="font-semibold text-ink-900">{q.from}</span> · {q.firm}
          {room ? ` · ${room}` : ""}
          {q.docIndex ? ` · re ${q.docIndex}${q.page ? `, page ${q.page}` : ""}` : ""} · {stamp(q.at)}
        </div>
        <Pill tone={STAGE[q.status].tone}>{STAGE[q.status].label}</Pill>
      </div>
      <p className="mt-2 text-[13.5px] text-ink-900">{q.text}</p>
      {q.status === "Answered" ? (
        <div className="mt-3 border-l-2 pl-3 text-[13px] text-stone-700" style={{ borderColor: C }}>
          <span className="font-semibold text-ink-900">{q.answeredBy}:</span> {q.answer}
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={needsApproval ? "Draft the answer — it goes out once approved" : "Write the answer"}
            className={field}
          />
          {q.status === "Draft" && text === q.draft ? (
            <ActionButton color={C} onClick={onRelease}>
              Approve & release
            </ActionButton>
          ) : needsApproval ? (
            <GhostButton onClick={() => text.trim() && onDraft(text.trim())}>Save draft</GhostButton>
          ) : (
            <ActionButton
              color={C}
              onClick={() => {
                if (!text.trim()) return;
                onDraft(text.trim());
                onRelease();
              }}
            >
              Send answer
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── permissions grid ───────────────────────── */

const LEVELS: FolderAccess[] = ["none", "view", "download", "upload"];
const LEVEL: Record<FolderAccess, { label: string; bg: string; fg: string }> = {
  none: { label: "No access", bg: "var(--color-stone-100)", fg: "var(--color-stone-400)" },
  view: { label: "View", bg: `color-mix(in srgb, ${C} 16%, transparent)`, fg: C },
  download: { label: "Download", bg: `color-mix(in srgb, ${C} 34%, transparent)`, fg: "var(--color-ink-900)" },
  upload: { label: "Contribute", bg: C, fg: "#FFFFFF" },
};

function PermissionGrid({
  room,
  docs,
  links,
  settings,
  onSave,
  flash,
}: {
  room: Room;
  docs: RoomDoc[];
  links: ShareLink[];
  settings: RoomSettings;
  onSave: (l: ShareLink) => void;
  flash: (t: string) => void;
}) {
  const folders = [...new Set(docs.map((d) => d.folder))];
  const [cols, setCols] = useState<ShareLink[]>(links);
  const [edit, setEdit] = useState<string | null>(null);
  const saved = useMemo(() => new Map(links.map((l) => [l.id, JSON.stringify(l)])), [links]);
  const dirty = cols.filter((c) => saved.get(c.id) !== JSON.stringify(c));
  const patch = (id: string, p: Partial<ShareLink>) => setCols((all) => all.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const add = () => {
    const n: ShareLink = {
      id: `${room.id.replace("rm-", "")}-${Date.now().toString(36)}`,
      roomId: room.id,
      name: "New audience",
      mode: "invite",
      invited: [],
      verifyEmail: true,
      nda: "acknowledge",
      questions: [],
      watermark: true,
      screenshot: false,
      download: false,
      print: false,
      allowDomains: [],
      blockDomains: [],
      folders: Object.fromEntries(folders.map((f) => [f, "view" as FolderAccess])),
      welcome: `Welcome to ${room.name}.`,
      created: "2026-11-24",
    };
    setCols((c) => [...c, n]);
    setEdit(n.id);
  };
  const cycle = (c: ShareLink, f: string) => patch(c.id, { folders: { ...c.folders, [f]: LEVELS[(LEVELS.indexOf(c.folders[f] ?? "view") + 1) % LEVELS.length] } });
  const controls: { label: string; value: (c: ShareLink) => string | boolean; toggle?: (c: ShareLink) => Partial<ShareLink> }[] = [
    { label: "Email code at entry", value: (c) => c.verifyEmail, toggle: (c) => ({ verifyEmail: !c.verifyEmail }) },
    { label: "Password", value: (c) => (c.password !== undefined ? "Set" : false) },
    {
      label: "NDA",
      value: (c) => (c.nda === "off" ? false : c.nda === "esign" ? "Signature" : "Click to accept"),
      toggle: (c) => ({ nda: c.nda === "off" ? "acknowledge" : c.nda === "acknowledge" ? "esign" : "off" }),
    },
    { label: "Entry questions", value: (c) => (c.questions.length ? `${c.questions.length}` : false) },
    { label: "Watermark", value: (c) => c.watermark, toggle: (c) => ({ watermark: !c.watermark }) },
    { label: "Capture shield", value: (c) => c.screenshot, toggle: (c) => ({ screenshot: !c.screenshot }) },
    { label: "Printing allowed", value: (c) => c.print, toggle: (c) => ({ print: !c.print }) },
    { label: "Downloads allowed", value: (c) => c.download, toggle: (c) => ({ download: !c.download }) },
    { label: "Email domains", value: (c) => (c.allowDomains.length ? `${c.allowDomains.length} allowed` : c.blockDomains.length ? `${c.blockDomains.length} blocked` : false) },
    { label: "Access ends", value: (c) => (c.expires ? fmtShort(c.expires) : false) },
  ];
  const editing = cols.find((c) => c.id === edit);
  const W = `minmax(240px,1.2fr) repeat(${cols.length}, minmax(150px,1fr)) 56px`;

  return (
    <div className="px-8 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-semibold text-ink-900">Who can do what</div>
          <div className="text-[12px] text-stone-500">
            Each column is an audience. Click a folder cell to step through No access → View → Download → Contribute; click a control to switch it.
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[11px] text-stone-500">
          {LEVELS.map((l) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px]" style={{ background: LEVEL[l].bg, outline: l === "none" ? "1px solid var(--color-stone-300)" : undefined }} />
              {LEVEL[l].label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[10px] border border-stone-200 bg-white">
        <div className="min-w-max text-[12.5px]">
          {/* audience headers */}
          <div className="grid border-b border-stone-200 bg-stone-50" style={{ gridTemplateColumns: W }}>
            <div className="px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">Audience</div>
            {cols.map((c) => (
              <button key={c.id} onClick={() => setEdit(c.id)} className="border-l border-stone-200 px-3 py-2.5 text-left hover:bg-white">
                <span className={cx("flex items-center gap-1.5 font-semibold", c.revoked ? "text-stone-400" : "text-ink-900")}>
                  <span className="truncate">{c.name}</span>
                  {saved.get(c.id) !== JSON.stringify(c) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9820F]" title="Unsaved" />}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500">
                  {c.mode === "invite" ? <Users size={11} /> : <Link2 size={11} />}
                  {c.revoked ? "Paused" : c.mode === "invite" ? `${c.invited.length} named` : "Shared link"}
                </span>
              </button>
            ))}
            <button
              onClick={add}
              className="flex items-center justify-center border-l border-stone-200 text-stone-400 hover:bg-white hover:text-ink-900"
              aria-label="Add audience"
              title="Add audience"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="bg-stone-25 px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">Folders</div>
          {folders.map((f) => (
            <div key={f} className="grid border-t border-stone-100" style={{ gridTemplateColumns: W }}>
              <div className="flex items-center gap-2 px-4 py-1.5 text-ink-900">
                {settings.indexNumbers && <span className="num w-5 text-stone-400">{num(f)}</span>}
                {bare(f)}
              </div>
              {cols.map((c) => {
                const lv = c.folders[f] ?? "view";
                return (
                  <div key={c.id} className="border-l border-stone-100 p-1">
                    <button
                      onClick={() => cycle(c, f)}
                      className="flex h-7 w-full items-center justify-center gap-1 rounded-[5px] text-[11.5px] font-semibold"
                      style={{ background: LEVEL[lv].bg, color: LEVEL[lv].fg }}
                    >
                      {lv === "none" && <EyeOff size={11} />}
                      {LEVEL[lv].label}
                    </button>
                  </div>
                );
              })}
              <div className="border-l border-stone-100" />
            </div>
          ))}

          <div className="border-t border-stone-200 bg-stone-25 px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">Controls</div>
          {controls.map((k) => (
            <div key={k.label} className="grid border-t border-stone-100" style={{ gridTemplateColumns: W }}>
              <div className="px-4 py-2 text-ink-900">{k.label}</div>
              {cols.map((c) => {
                const v = k.value(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => (k.toggle ? patch(c.id, k.toggle(c)) : setEdit(c.id))}
                    className="flex items-center justify-center border-l border-stone-100 py-2 text-[12px] hover:bg-stone-50"
                  >
                    {v === true ? (
                      <Check size={15} strokeWidth={2.6} style={{ color: C }} />
                    ) : v === false ? (
                      <span className="text-stone-300">—</span>
                    ) : (
                      <span className="font-semibold" style={{ color: C }}>
                        {v}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="border-l border-stone-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] text-stone-500">{dirty.length ? `${dirty.length} audience${dirty.length === 1 ? "" : "s"} changed` : "All changes saved"}</span>
        <div className="flex gap-2">
          <GhostButton onClick={() => setCols(links)}>
            Discard
          </GhostButton>
          <ActionButton color={C} disabled={!dirty.length} onClick={() => dirty.forEach(onSave)}>
            Save changes
          </ActionButton>
        </div>
      </div>

      {editing && <AudienceDrawer c={editing} settings={settings} onPatch={(p) => patch(editing.id, p)} onClose={() => setEdit(null)} flash={flash} />}
    </div>
  );
}

function AudienceDrawer({
  c,
  settings,
  onPatch,
  onClose,
  flash,
}: {
  c: ShareLink;
  settings: RoomSettings;
  onPatch: (p: Partial<ShareLink>) => void;
  onClose: () => void;
  flash: (t: string) => void;
}) {
  const csv = (s: string) =>
    s
      .split(/[\s,;]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  const row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="grid grid-cols-[130px_1fr] items-start gap-3 border-b border-stone-100 py-3 last:border-0">
      <span className="pt-2 text-[12px] text-stone-500">{label}</span>
      <div>{children}</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/20" onClick={onClose}>
      <aside className="flex h-full w-[500px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label="Audience">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <input
            value={c.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-[17px] font-semibold text-ink-900 focus:outline-none"
            aria-label="Audience name"
          />
          <button onClick={onClose} className="rounded p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          {row({
            label: "Entry",
            children: (
              <div className="flex rounded-[8px] border border-stone-200 p-0.5">
                {(
                  [
                    ["invite", "Named people"],
                    ["link", "One shared link"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => onPatch({ mode: v })}
                    className={cx("h-8 flex-1 rounded-[6px] text-[12.5px] font-semibold", c.mode === v ? "bg-ink-900 text-white" : "text-stone-500")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            ),
          })}
          {c.mode === "invite" &&
            row({
              label: "People",
              children: (
                <textarea
                  value={c.invited.join(", ")}
                  onChange={(e) => onPatch({ invited: csv(e.target.value) })}
                  rows={3}
                  placeholder="name@firm.com, other@firm.com"
                  className="w-full resize-none rounded-[8px] border border-stone-300 px-3 py-2 text-[12.5px] focus:border-ink-900 focus:outline-none"
                />
              ),
            })}
          {row({
            label: "Password",
            children: <input value={c.password ?? ""} onChange={(e) => onPatch({ password: e.target.value || undefined })} placeholder="Leave empty for none" className={field} />,
          })}
          {row({
            label: "Access ends",
            children: <input type="date" value={c.expires ?? ""} onChange={(e) => onPatch({ expires: e.target.value || undefined })} className={cx(field, "max-w-[200px]")} />,
          })}
          {row({
            label: "Domains",
            children: (
              <div className="space-y-2">
                <input
                  value={c.allowDomains.join(", ")}
                  onChange={(e) => onPatch({ allowDomains: csv(e.target.value) })}
                  placeholder="Only allow, e.g. firm.com"
                  className={field}
                />
                <input value={c.blockDomains.join(", ")} onChange={(e) => onPatch({ blockDomains: csv(e.target.value) })} placeholder="Block, e.g. gmail.com" className={field} />
              </div>
            ),
          })}
          {row({
            label: "Entry questions",
            children: (
              <textarea
                value={c.questions.join("\n")}
                onChange={(e) => onPatch({ questions: e.target.value.split("\n").filter((x) => x.trim()) })}
                rows={3}
                placeholder={"One per line, e.g.\nAre you an accredited investor?"}
                className="w-full resize-none rounded-[8px] border border-stone-300 px-3 py-2 text-[12.5px] focus:border-ink-900 focus:outline-none"
              />
            ),
          })}
          {row({
            label: "Welcome note",
            children: (
              <textarea
                value={c.welcome}
                onChange={(e) => onPatch({ welcome: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-[8px] border border-stone-300 px-3 py-2 text-[12.5px] focus:border-ink-900 focus:outline-none"
              />
            ),
          })}
          {c.expires && <p className="pb-3 text-[11.5px] text-stone-500">Entry closes {fmtDate(c.expires)}.</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-stone-200 px-6 py-3">
          <button onClick={() => onPatch({ revoked: !c.revoked })} className={cx("text-[12.5px] font-semibold", c.revoked ? "text-ink-900" : "text-[#9A4422]")}>
            {c.revoked ? "Resume entry" : "Pause entry"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(linkUrl(c.id)).catch(() => {});
              flash("Link copied");
            }}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-[8px] border border-stone-300 px-3 text-[12px] font-semibold text-ink-900 hover:border-ink-900"
          >
            <Copy size={12} /> Copy link
          </button>
          <a
            href={previewUrl(c, settings)}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold text-white"
            style={{ background: C }}
          >
            <Eye size={12} /> Try it as a visitor
          </a>
        </div>
      </aside>
    </div>
  );
}

/* ───────────────────────── audit trail ───────────────────────── */

function AuditTrail({ room, docs, act }: { room: Room; docs: RoomDoc[]; act: Act }) {
  const [party, setParty] = useState("all");
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const byId = new Map(docs.map((d) => [d.id, d]));
    const reads = Object.values(
      act.pv.reduce<Record<string, { at: string; who: string; firm: string; doc: string; s: number; p: number }>>((m, v) => {
        const k = `${v.viewer}|${v.docId}`;
        const r = (m[k] ??= { at: v.at, who: v.viewer, firm: v.firm, doc: v.docId, s: 0, p: 0 });
        r.s += v.seconds;
        r.p += 1;
        return m;
      }, {}),
    ).map((r) => ({
      at: r.at,
      who: r.who,
      firm: r.firm,
      action: "Read",
      item: `${byId.get(r.doc)?.index ?? ""} ${byId.get(r.doc)?.name ?? r.doc}`,
      detail: `${r.p} pages · ${dur(r.s)}`,
    }));
    const events = act.ev.map((e) => {
      const d = docs.find((x) => x.name === e.doc);
      return {
        at: e.at,
        who: e.who,
        firm: e.firm,
        action: e.action === "Viewed" ? "Opened" : e.action === "Downloaded" ? "Downloaded" : "Printed",
        item: `${d?.index ?? ""} ${e.doc}`,
        detail: e.seconds ? dur(e.seconds) : "",
      };
    });
    return [...events, ...reads].sort((a, b) => b.at.localeCompare(a.at));
  }, [act, docs]);
  const firms = [...new Set(rows.map((r) => r.firm))];
  const shown = rows.filter(
    (r) => (party === "all" || r.firm === party) && (action === "all" || r.action === action) && (!q || `${r.who} ${r.item}`.toLowerCase().includes(q.toLowerCase())),
  );
  const exportCsv = () => {
    const lines = [["Time (UTC)", "Person", "Party", "Action", "Item", "Detail"], ...shown.map((r) => [r.at, r.who, r.firm, r.action, r.item.trim(), r.detail])];
    const url = URL.createObjectURL(new Blob([lines.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${room.name.replace(/[^\w]+/g, "_")}_audit.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const sel = "h-8 rounded-[8px] border border-stone-200 bg-white px-2 text-[12.5px] focus:border-ink-900 focus:outline-none";
  return (
    <div className="px-8 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <select value={party} onChange={(e) => setParty(e.target.value)} className={sel} aria-label="Party">
          <option value="all">Every party</option>
          {firms.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={sel} aria-label="Action">
          <option value="all">Every action</option>
          {["Opened", "Read", "Downloaded", "Printed"].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Person or document" className={cx(sel, "w-[220px] pl-8")} />
        </div>
        <span className="ml-auto text-[12px] text-stone-500">{shown.length} entries</span>
        <GhostButton onClick={exportCsv}>
          <Download size={13} /> Export
        </GhostButton>
      </div>
      <div className="mt-3 overflow-hidden rounded-[10px] border border-stone-200 bg-white">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">
              <th className="px-4 py-2">When (ET)</th>
              <th className="px-3 py-2">Person</th>
              <th className="px-3 py-2">Party</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-4 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-b border-stone-100 last:border-0">
                <td className="num whitespace-nowrap px-4 py-2 text-stone-500">{stamp(r.at)}</td>
                <td className="px-3 py-2 text-ink-900">{r.who}</td>
                <td className="px-3 py-2 text-stone-600">{r.firm}</td>
                <td className="px-3 py-2">
                  <span className={cx("font-semibold", r.action === "Downloaded" || r.action === "Printed" ? "text-[#9A4422]" : "text-ink-900")}>{r.action}</span>
                </td>
                <td className="px-3 py-2 text-ink-900">{r.item.trim()}</td>
                <td className="num px-4 py-2 text-stone-500">{r.detail}</td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-400">
                  No entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11.5px] text-stone-500">Entries are append-only and record time and IP address. Times shown in Eastern Time; the export is in UTC.</p>
    </div>
  );
}

/* ───────────────────────── setup ───────────────────────── */

function Setup({ settings, onChange }: { settings: RoomSettings; onChange: (s: RoomSettings) => void }) {
  const set = (p: Partial<RoomSettings>) => onChange({ ...settings, ...p });
  const groups: [string, [keyof RoomSettings, string, string][]][] = [
    [
      "Index",
      [
        ["indexNumbers", "Reference numbers", "Prefix folders and files with 1, 1.1, 1.2 so everyone can cite the same document."],
        ["hideNewContent", "Hold new uploads", "New files stay invisible to every audience until you release them in Permissions."],
      ],
    ],
    [
      "Visitors",
      [
        ["visitorQa", "Question button", "Visitors can raise a question from any page they are reading."],
        ["newFileDigest", "Daily digest", "One email a day to visitors when documents they can see were added."],
      ],
    ],
    [
      "Presentation",
      [
        ["showCover", "Cover band", "A branded band on the entry page."],
        ["showLogo", "Sponsor mark", "The sponsor’s logo on the entry page and viewer."],
      ],
    ],
  ];
  return (
    <div className="max-w-[860px] space-y-6 px-8 py-6">
      {groups.map(([title, rows]) => (
        <section key={title}>
          <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">{title}</div>
          <div className="divide-y divide-stone-100 rounded-[10px] border border-stone-200 bg-white">
            {rows.map(([k, label, help]) => (
              <label key={k} className="flex cursor-pointer items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(settings[k])}
                  onChange={() => set({ [k]: !settings[k] } as Partial<RoomSettings>)}
                  className="mt-0.5 h-4 w-4"
                  style={{ accentColor: C }}
                />
                <span>
                  <span className="block text-[13px] font-semibold text-ink-900">{label}</span>
                  <span className="block text-[12px] text-stone-500">{help}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
      <section>
        <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Address</div>
        <div className="flex items-center justify-between gap-4 rounded-[10px] border border-stone-200 bg-white px-4 py-3">
          <span>
            <span className="block text-[13px] font-semibold text-ink-900">Link domain</span>
            <span className="block text-[12px] text-stone-500">The web address in every invitation.</span>
          </span>
          <select
            value={settings.domain}
            onChange={(e) => set({ domain: e.target.value })}
            className="h-9 rounded-[8px] border border-stone-300 bg-white px-2 text-[12.5px]"
            aria-label="Domain"
          >
            <option value="aurum-platform-6sal.vercel.app">aurum-platform-6sal.vercel.app (current)</option>
            <option value="dataroom.aurumasset.us">dataroom.aurumasset.us (needs DNS)</option>
          </select>
        </div>
      </section>
    </div>
  );
}

export { size as fileSize, dur as duration, fmtShort as shortDate };
