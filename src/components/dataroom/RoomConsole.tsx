"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Folder,
  Globe,
  Hash,
  History,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  List,
  ListChecks,
  Mail,
  MessagesSquare,
  PanelTop,
  Pencil,
  Search,
  Settings2,
  Shield,
  ShieldOff,
  Timer,
  Upload,
  UserCheck,
  UserCog,
} from "lucide-react";
import { cx } from "@/components/ui";
import { FundCover } from "@/components/fund/FundCard";
import { GpLogo } from "@/components/brand/GpLogo";
import { gpById } from "@/lib/gps";
import { FIRM } from "@/lib/firm-colors";
import {
  pageCount,
  pageViews,
  roomBrand,
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

const C = FIRM.dataroom;
type Section = "documents" | "analytics" | "audit" | "qa" | "permissions" | "settings";
const size = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
const dur = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${Math.round(s / 60)} min` : `${Math.round(s)} secs`);
const ago = (iso: string) => {
  const d = Math.round((Date.parse("2026-11-24T22:00:00Z") - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
};
const ext = (n: string) => (n.split(".").pop() ?? "").toUpperCase();
const Glyph = ({ name, s = 16 }: { name: string; s?: number }) =>
  /\.(xlsx|csv)$/i.test(name) ? <FileSpreadsheet size={s} className="shrink-0 text-[#1F6F6A]" /> : <FileText size={s} className="shrink-0 text-[#B5542A]" />;

export function previewUrl(l: ShareLink, settings: RoomSettings) {
  const json = JSON.stringify({ link: l, settings });
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `/room/${l.id}?preview=1&cfg=${b64}`;
}
const linkUrl = (id: string) => (typeof window === "undefined" ? `/room/${id}` : `${window.location.origin}/room/${id}`);

export function RoomConsole({
  room,
  docs,
  users,
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
  const [section, setSection] = useState<Section>("documents");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const nav: [Section, string, typeof Folder][] = [
    ["documents", "Documents", FileText],
    ["analytics", "Analytics", BarChart3],
    ["audit", "Activity log", History],
    ["qa", "Questions", MessagesSquare],
    ["permissions", "Access", Shield],
    ["settings", "Settings", Settings2],
  ];
  return (
    <div className="-mx-8 -mt-4 flex min-h-[calc(100vh-64px)] flex-col border-t border-stone-200 bg-stone-50">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-stone-500 hover:bg-stone-100 hover:text-ink-900" aria-label="All rooms">
          <ArrowLeft size={16} />
        </button>
        <span className="text-[13.5px] font-semibold text-ink-900">{room.name}</span>
        {section === "documents" && (
          <div className="ml-1 flex rounded-[8px] bg-stone-100 p-0.5">
            {(
              [
                ["grid", LayoutGrid],
                ["list", List],
              ] as const
            ).map(([l, Icon]) => (
              <button key={l} onClick={() => setLayout(l)} className={cx("flex h-7 w-7 items-center justify-center rounded-[6px]", layout === l ? "bg-white text-ink-900 shadow-card" : "text-stone-500")} aria-label={`${l} view`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setSection("permissions")} className="ml-auto flex h-8 items-center gap-1.5 rounded-[8px] px-3.5 text-[12.5px] font-semibold text-white" style={{ background: C }}>
          <Shield size={13} /> Share room
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="w-[200px] shrink-0 border-r border-stone-200 bg-white p-2.5">
          {nav.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setSection(id)} className={cx("mb-0.5 flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px]", section === id ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50")}>
              <Icon size={15} style={section === id ? { color: C } : undefined} /> {label}
              {id === "qa" && questions.some((q) => q.status !== "Answered") && <span className="ml-auto rounded-full px-1.5 text-[10.5px] font-bold text-white" style={{ background: C }}>{questions.filter((q) => q.status !== "Answered").length}</span>}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          {section === "documents" && <Documents room={room} docs={docs} settings={settings} layout={layout} onUpload={onUpload} onRename={onRename} flash={flash} />}
          {section === "analytics" && <Analytics room={room} docs={docs} />}
          {section === "audit" && <Audit room={room} docs={docs} />}
          {section === "qa" && <Qa settings={settings} onSettings={onSettings} questions={questions} onDraft={onDraft} onRelease={onRelease} flash={flash} />}
          {section === "permissions" && <Permissions room={room} docs={docs} users={users} links={links} settings={settings} onSave={onSaveLink} flash={flash} />}
          {section === "settings" && <SettingsPanel settings={settings} onChange={onSettings} />}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── documents ───────────────────────── */

function Brand({ room, light }: { room: Room; light?: boolean }) {
  const b = roomBrand[room.id];
  const gp = b?.gpId ? gpById(b.gpId) : undefined;
  if (gp) return <GpLogo gp={gp} height={44} tone={light ? "dark" : "light"} compact />;
  return (
    <span className="text-center leading-none">
      <span className={cx("block font-serif text-[34px] tracking-[0.02em]", light ? "text-white" : "text-ink-900")}>{b?.wordmark ?? room.client}</span>
      <span className={cx("mt-1 block text-[11px] font-semibold uppercase tracking-[0.3em]", light ? "text-white/75" : "text-stone-500")}>{b?.tagline}</span>
    </span>
  );
}

function Documents({ room, docs, settings, layout, onUpload, onRename, flash }: { room: Room; docs: RoomDoc[]; settings: RoomSettings; layout: "grid" | "list"; onUpload: (folder: string, files: File[]) => void; onRename: (n: string) => void; flash: (t: string) => void }) {
  const folders = [...new Set(docs.map((d) => d.folder))];
  const [folder, setFolder] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const b = roomBrand[room.id];
  const files = (folder ? docs.filter((d) => d.folder === folder) : []).filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()));
  const found = q && !folder ? docs.filter((d) => d.name.toLowerCase().includes(q.toLowerCase())) : null;
  const label = (f: string) => (settings.indexNumbers ? f.replace(/^(\d+) /, "$1. ") : f.replace(/^\d+ /, ""));
  return (
    <div>
      {settings.showCover && (
        <div className="relative h-[190px] overflow-hidden">
          <FundCover id={room.id} primary={b?.primary ?? "#0F2340"} secondary={b?.secondary ?? "#B8975A"} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 flex items-center justify-center">{settings.showLogo && <Brand room={room} light />}</div>
          <button onClick={() => flash("Cover image upload opens here once file storage is connected")} className="absolute bottom-3 right-3 rounded-[8px] bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-ink-900 hover:bg-white">
            Edit
          </button>
        </div>
      )}
      <div className="px-8 pb-10">
        <div className="flex flex-wrap items-center gap-3 pt-6">
          {folder ? (
            <div className="flex items-center gap-1.5 text-[20px] font-semibold text-ink-900">
              <button onClick={() => setFolder(null)} className="text-stone-500 hover:text-ink-900">
                {room.name}
              </button>
              <ChevronRight size={18} className="text-stone-400" /> {label(folder)}
            </div>
          ) : editing ? (
            <input
              autoFocus
              defaultValue={room.name}
              onBlur={(e) => {
                if (e.target.value.trim()) onRename(e.target.value.trim());
                setEditing(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="h-10 w-[420px] rounded-[8px] border border-ink-900 px-2 text-[20px] font-semibold focus:outline-none"
            />
          ) : (
            <h2 className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.01em] text-ink-900">
              {room.name}
              <button onClick={() => setEditing(true)} className="text-stone-400 hover:text-ink-900" aria-label="Rename room">
                <Pencil size={15} />
              </button>
            </h2>
          )}
          <button onClick={() => flash("Index exported")} className="flex items-center gap-1.5 text-[12.5px] font-medium text-stone-600 hover:text-ink-900">
            <Download size={14} /> Download index
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-[220px] rounded-[9px] border border-stone-200 bg-white pl-8 pr-3 text-[13px] focus:border-ink-900 focus:outline-none" />
            </div>
            <input ref={input} type="file" multiple hidden onChange={(e) => (e.target.files?.length && onUpload(folder ?? folders[0], Array.from(e.target.files)), (e.target.value = ""))} />
            <ActionButton color={C} onClick={() => input.current?.click()}>
              <Upload size={14} /> Upload
            </ActionButton>
          </div>
        </div>

        <div className="mt-6">
          {!folder && !found ? (
            layout === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                {folders.map((f) => (
                  <button key={f} onClick={() => setFolder(f)} className="group text-left">
                    <div className="flex aspect-[4/3] items-center justify-center rounded-[12px] border border-stone-200 bg-white shadow-card transition-shadow group-hover:shadow-lift">
                      <Folder size={34} style={{ color: C }} />
                    </div>
                    <div className="mt-2 text-[13px] font-semibold text-ink-900">{label(f)}</div>
                    <div className="text-[11.5px] text-stone-500">Folder · {docs.filter((d) => d.folder === f).length} files</div>
                  </button>
                ))}
              </div>
            ) : (
              <DocTable rows={folders.map((f) => ({ key: f, index: settings.indexNumbers ? `${f.split(" ")[0]}.` : "", name: f.replace(/^\d+ /, ""), size: "—", type: "Folder", folder: true, onClick: () => setFolder(f) }))} />
            )
          ) : (
            <DocTable
              rows={(found ?? files).map((d) => ({
                key: d.id,
                index: settings.indexNumbers ? d.index : "",
                name: d.name,
                size: size(d.size),
                type: ext(d.name),
                folder: false,
                pages: pageCount(d.name),
                views: d.views,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DocTable({ rows }: { rows: { key: string; index: string; name: string; size: string; type: string; folder: boolean; pages?: number; views?: number; onClick?: () => void }[] }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-card">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-stone-200 text-left text-[11.5px] text-stone-500">
            <th className="w-16 px-4 py-2.5 font-medium">Index</th>
            <th className="px-3 py-2.5 font-medium">Name</th>
            <th className="px-3 py-2.5 font-medium">File size</th>
            <th className="px-3 py-2.5 font-medium">File type</th>
            <th className="px-3 py-2.5 font-medium">Pages</th>
            <th className="px-3 py-2.5 font-medium">Views</th>
            <th className="px-3 py-2.5 font-medium">Date uploaded</th>
            <th className="px-4 py-2.5 font-medium">Uploaded by</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} onClick={r.onClick} className={cx("border-b border-stone-100 last:border-0 hover:bg-stone-50", r.onClick && "cursor-pointer")}>
              <td className="num px-4 py-2.5 text-stone-500">{r.index}</td>
              <td className="px-3 py-2.5">
                <span className="flex items-center gap-2 font-medium text-ink-900">
                  {r.folder ? <Folder size={16} style={{ color: C }} /> : <Glyph name={r.name} />} {r.name}
                </span>
              </td>
              <td className="num px-3 py-2.5 text-stone-600">{r.size}</td>
              <td className="px-3 py-2.5 text-stone-600">{r.type}</td>
              <td className="num px-3 py-2.5 text-stone-600">{r.pages ?? "—"}</td>
              <td className="num px-3 py-2.5 text-stone-600">{r.views ?? "—"}</td>
              <td className="px-3 py-2.5 text-stone-600">Sep 24, 2026</td>
              <td className="px-4 py-2.5 text-stone-600">Managing Partner</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-stone-400">
                Nothing here yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── analytics & audit ───────────────────────── */

function useActivity(room: Room, docs: RoomDoc[]) {
  const [local] = useState(localPageViews);
  return useMemo(() => {
    const ids = new Set(docs.map((d) => d.id));
    const pv = [...pageViews, ...local].filter((v) => ids.has(v.docId));
    const ev = seedViews.filter((v) => v.roomId === room.id);
    const people = new Map<string, { who: string; firm: string; seconds: number; visits: number; last: string; docs: Set<string>; downloads: number }>();
    for (const v of pv) {
      const p = people.get(v.viewer) ?? { who: v.viewer, firm: v.firm, seconds: 0, visits: 0, last: v.at, docs: new Set<string>(), downloads: 0 };
      p.seconds += v.seconds;
      p.docs.add(v.docId);
      if (v.at > p.last) p.last = v.at;
      people.set(v.viewer, p);
    }
    for (const e of ev) {
      const p = people.get(e.who) ?? { who: e.who, firm: e.firm, seconds: 0, visits: 0, last: e.at, docs: new Set<string>(), downloads: 0 };
      p.visits += 1;
      if (e.action === "Downloaded") p.downloads += 1;
      if (e.at > p.last) p.last = e.at;
      people.set(e.who, p);
    }
    for (const p of people.values()) p.visits = Math.max(p.visits, p.docs.size);
    return { pv, ev, people: [...people.values()] };
  }, [docs, local, room.id]);
}

function Bars({ title, sub, rows, unit }: { title: string; sub: string; rows: { label: string; value: number }[]; unit: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-[14px] border border-stone-200 bg-white p-5 shadow-card">
      <div className="text-[13.5px] font-semibold text-ink-900">{title}</div>
      <div className="text-[11.5px] text-stone-500">{sub}</div>
      <ul className="mt-4 space-y-3">
        {rows.length ? (
          rows.slice(0, 5).map((r) => (
            <li key={r.label}>
              <div className="flex justify-between text-[12px]">
                <span className="truncate text-ink-900">{r.label}</span>
                <span className="num shrink-0 text-stone-500">{unit(r.value)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                <div className="h-1.5 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: C }} />
              </div>
            </li>
          ))
        ) : (
          <li className="py-6 text-center text-[12px] text-stone-400">No data yet.</li>
        )}
      </ul>
    </div>
  );
}

function Analytics({ room, docs }: { room: Room; docs: RoomDoc[] }) {
  const { pv, ev, people } = useActivity(room, docs);
  const [docId, setDocId] = useState<string | null>(null);
  const totalSec = pv.reduce((s, v) => s + v.seconds, 0);
  const sessions = Math.max(1, people.reduce((s, p) => s + p.visits, 0));
  const views = docs.reduce((s, d) => s + d.views, 0);
  const fileDl = ev.filter((e) => e.action === "Downloaded").length;
  const timeBy = (id: string) => pv.filter((v) => v.docId === id).reduce((s, v) => s + v.seconds, 0);
  const doc = docs.find((d) => d.id === docId);
  const perPage = doc
    ? Array.from({ length: pageCount(doc.name) }, (_, i) => {
        const vs = pv.filter((v) => v.docId === doc.id && v.page === i + 1);
        return { page: i + 1, seconds: vs.reduce((s, v) => s + v.seconds, 0), readers: new Set(vs.map((v) => v.viewer)).size };
      })
    : [];
  const pmax = Math.max(1, ...perPage.map((p) => p.seconds));
  const folders = [...new Set(docs.map((d) => d.folder))];
  return (
    <div className="flex min-h-full">
      <aside className="w-[240px] shrink-0 border-r border-stone-200 bg-white p-3">
        <div className="px-2 pb-2 text-[11.5px] font-semibold text-stone-500">Documents</div>
        <button onClick={() => setDocId(null)} className={cx("flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[12.5px]", !docId ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50")}>
          <Folder size={14} style={{ color: C }} /> {room.name}
        </button>
        {folders.map((f) => (
          <div key={f} className="ml-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-[12.5px] text-stone-600">
              <Folder size={14} style={{ color: C }} /> {f.replace(/^\d+ /, "")}
            </div>
            {docs
              .filter((d) => d.folder === f)
              .map((d) => (
                <button key={d.id} onClick={() => setDocId(d.id)} className={cx("ml-3 flex w-[calc(100%-12px)] items-center gap-2 rounded-[8px] px-2 py-1 text-left text-[12px]", docId === d.id ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-500 hover:bg-stone-50")}>
                  <Glyph name={d.name} s={13} /> <span className="truncate">{d.name.replace(/\.[a-z]+$/i, "")}</span>
                </button>
              ))}
          </div>
        ))}
      </aside>
      <div className="min-w-0 flex-1 space-y-4 p-6">
        <div className="flex items-center gap-1.5 text-[13px] text-stone-500">
          Analytics <ChevronRight size={13} /> <span className="font-semibold text-ink-900">{doc ? doc.name : room.name}</span>
        </div>
        {!doc ? (
          <>
            <div className="grid grid-cols-4 gap-3">
              {(
                [
                  [Eye, "Views", String(views)],
                  [Timer, "Average visit", dur(totalSec / sessions)],
                  [Folder, "Folders saved", "0"],
                  [Download, "Files saved", String(fileDl)],
                ] as const
              ).map(([Icon, l, v]) => (
                <div key={l} className="rounded-[14px] border border-stone-200 bg-white px-5 py-4 shadow-card">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-500">
                    <Icon size={12} /> {l}
                  </div>
                  <div className="num mt-1.5 text-[24px] font-semibold text-ink-900">{v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Bars title="Most frequent visitors" sub="Ranked by number of visits" rows={[...people].sort((a, b) => b.visits - a.visits).map((p) => ({ label: p.who, value: p.visits }))} unit={(n) => `${n} visit${n === 1 ? "" : "s"}`} />
              <Bars title="Longest time in the room" sub="Ranked by total reading time" rows={[...people].sort((a, b) => b.seconds - a.seconds).map((p) => ({ label: p.who, value: p.seconds }))} unit={dur} />
              <Bars title="Most-read documents" sub="Ranked by views" rows={[...docs].sort((a, b) => timeBy(b.id) - timeBy(a.id) || b.views - a.views).filter((d) => d.views || timeBy(d.id)).map((d) => ({ label: d.name, value: d.views }))} unit={(n) => `${n} views`} />
              <Bars
                title="Most-saved documents"
                sub="Ranked by downloads"
                rows={Object.entries(ev.filter((e) => e.action === "Downloaded").reduce<Record<string, number>>((m, e) => ((m[e.doc] = (m[e.doc] ?? 0) + 1), m), {})).map(([label, value]) => ({ label, value }))}
                unit={(n) => `${n}`}
              />
            </div>
          </>
        ) : (
          <div className="rounded-[14px] border border-stone-200 bg-white p-5 shadow-card">
            <div className="text-[13.5px] font-semibold text-ink-900">Reading by page</div>
            <div className="text-[11.5px] text-stone-500">Minutes on each page and how many readers got that far.</div>
            <ul className="mt-4 space-y-2">
              {perPage.map((p) => (
                <li key={p.page} className="grid grid-cols-[60px_1fr_110px] items-center gap-3 text-[12px]">
                  <span className="text-stone-500">Page {p.page}</span>
                  <div className="h-3 rounded-full bg-stone-100">
                    <div className="h-3 rounded-full" style={{ width: `${(p.seconds / pmax) * 100}%`, background: C, opacity: 0.35 + 0.65 * (p.seconds / pmax) }} />
                  </div>
                  <span className="num text-right text-stone-600">
                    {p.seconds ? dur(p.seconds) : "—"} · {p.readers} reader{p.readers === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <VisitorList people={people} />
      </div>
    </div>
  );
}

function VisitorList({ people, onOpen }: { people: ReturnType<typeof useActivity>["people"]; onOpen?: (who: string) => void }) {
  return (
    <div className="rounded-[14px] border border-stone-200 bg-white shadow-card">
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-stone-100 text-stone-600">
          <UserCheck size={16} />
        </span>
        <div>
          <div className="text-[14px] font-semibold text-ink-900">
            {people.length} visitor{people.length === 1 ? "" : "s"}
          </div>
          <div className="text-[11.5px] text-stone-500">Latest first. Select someone to see everything they did.</div>
        </div>
      </div>
      <ul>
        {[...people]
          .sort((a, b) => b.last.localeCompare(a.last))
          .map((p) => (
            <li key={p.who}>
              <button onClick={() => onOpen?.(p.who)} className="flex w-full items-center gap-3 border-b border-stone-100 px-5 py-3 text-left last:border-0 hover:bg-stone-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] font-bold text-white" style={{ background: C }}>
                  {p.who[0]?.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink-900">{p.who}</span>
                  <span className="block text-[11.5px] text-stone-500">
                    {p.firm ? `${p.firm} · ` : ""}{dur(p.seconds)} reading
                    {p.downloads ? ` · ${p.downloads} download${p.downloads === 1 ? "" : "s"}` : ""}
                  </span>
                </span>
                <span className="text-[12px] text-stone-500">{ago(p.last)}</span>
                {onOpen && <ChevronRight size={14} className="text-stone-400" />}
              </button>
            </li>
          ))}
        {!people.length && <li className="px-5 py-8 text-center text-[12.5px] text-stone-400">No visitors yet.</li>}
      </ul>
    </div>
  );
}

function Audit({ room, docs }: { room: Room; docs: RoomDoc[] }) {
  const { pv, ev, people } = useActivity(room, docs);
  const [who, setWho] = useState<string | null>(null);
  const docName = (id: string) => docs.find((d) => d.id === id)?.name ?? id;
  const timeline = who
    ? [
        ...ev.filter((e) => e.who === who).map((e) => ({ at: e.at, text: `${e.action} ${e.doc}`, extra: e.seconds ? dur(e.seconds) : "" })),
        ...Object.values(
          pv
            .filter((v) => v.viewer === who)
            .reduce<Record<string, { at: string; doc: string; seconds: number; pages: number }>>((m, v) => {
              const r = (m[v.docId] ??= { at: v.at, doc: v.docId, seconds: 0, pages: 0 });
              r.seconds += v.seconds;
              r.pages += 1;
              if (v.at > r.at) r.at = v.at;
              return m;
            }, {}),
        ).map((r) => ({ at: r.at, text: `Read ${docName(r.doc)} — ${r.pages} pages`, extra: dur(r.seconds) })),
      ].sort((a, b) => b.at.localeCompare(a.at))
    : [];
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-1.5 text-[13px] text-stone-500">
        <button onClick={() => setWho(null)} className={cx(who && "hover:text-ink-900")}>
          Activity log
        </button>
        <ChevronRight size={13} /> <span className="font-semibold text-ink-900">{who ?? room.name}</span>
      </div>
      {!who ? (
        <VisitorList people={people} onOpen={setWho} />
      ) : (
        <div className="rounded-[14px] border border-stone-200 bg-white shadow-card">
          <ul>
            {timeline.map((t, i) => (
              <li key={i} className="flex items-center gap-4 border-b border-stone-100 px-5 py-3 text-[12.5px] last:border-0">
                <span className="w-[130px] shrink-0 text-stone-500">{new Date(t.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}</span>
                <span className="flex-1 text-ink-900">{t.text}</span>
                <span className="text-stone-500">{t.extra}</span>
              </li>
            ))}
            {!timeline.length && <li className="px-5 py-8 text-center text-stone-400">No activity recorded.</li>}
          </ul>
        </div>
      )}
      <p className="text-[11.5px] text-stone-500">Each view, page turn, download and print is logged with time and IP. Entries can’t be changed.</p>
    </div>
  );
}

/* ───────────────────────── Q&A ───────────────────────── */

function Step({ icon, title, body, tag, onClick }: { icon: ReactNode; title: string; body: string; tag: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx("block w-[280px] rounded-[12px] border bg-white p-3.5 text-left shadow-card", tag === "Off" ? "border-dashed border-stone-300" : "border-stone-200", onClick && "hover:border-stone-400")}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          {icon} {title}
        </span>
        <span className={cx("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", tag === "Off" ? "bg-stone-100 text-stone-500" : "bg-[#E7F2EB] text-[#245F3C]")}>{tag}</span>
      </div>
      <p className="mt-1.5 text-[12px] text-stone-600">{body}</p>
    </button>
  );
}

function Qa({ settings, onSettings, questions, onDraft, onRelease, flash }: { settings: RoomSettings; onSettings: (s: RoomSettings) => void; questions: Question[]; onDraft: (id: string, t: string) => void; onRelease: (id: string) => void; flash: (t: string) => void }) {
  const set = (p: Partial<RoomSettings>) => onSettings({ ...settings, ...p });
  return (
    <div className="space-y-6 p-6">
      {!settings.visitorQa && <div className="rounded-[10px] bg-[#FBF1E4] px-4 py-2.5 text-[12.5px] text-[#8A5A1E]">Visitors can’t ask questions in this room right now. Turn it on in Settings.</div>}
      <div className="rounded-[14px] border border-stone-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-semibold text-ink-900">How questions are answered</div>
          <div className="flex rounded-[9px] bg-stone-100 p-0.5">
            {(["basic", "advanced"] as const).map((f) => (
              <button key={f} onClick={() => set({ qaFlow: f })} className={cx("h-7 rounded-[7px] px-3 text-[12px] font-semibold", settings.qaFlow === f ? "bg-white text-ink-900 shadow-card" : "text-stone-500")}>
                {f === "basic" ? "Direct answers" : "Reviewed answers"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-10">
          <Step icon={<MessagesSquare size={14} />} title="Visitor asks" body="A visitor sends a question, optionally tied to a document and page." tag="1" />
          <ChevronRight size={22} style={{ color: C }} />
          <div className="space-y-3">
            {settings.qaFlow === "advanced" && <Step icon={<UserCog size={14} />} title="Specialist drafts" body={`A subject expert prepares the first draft. ${settings.qaExpert ? "On — click to remove" : "Off — click to add"}.`} tag={settings.qaExpert ? "On" : "Off"} onClick={() => set({ qaExpert: !settings.qaExpert })} />}
            <Step icon={<UserCheck size={14} />} title="Deal team answers" body={settings.qaFlow === "advanced" ? "Owns the reply and finalises the wording." : "Replies to the visitor directly."} tag="2" />
            {settings.qaFlow === "advanced" && <Step icon={<Shield size={14} />} title="Partner approves" body={`Signs off before anything reaches the visitor. ${settings.qaApprover ? "On — click to remove" : "Off — click to add"}.`} tag={settings.qaApprover ? "On" : "Off"} onClick={() => set({ qaApprover: !settings.qaApprover })} />}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-[13.5px] font-semibold text-ink-900">Questions</div>
        {[...questions]
          .sort((a, b) => ["Open", "Draft", "Answered"].indexOf(a.status) - ["Open", "Draft", "Answered"].indexOf(b.status) || b.at.localeCompare(a.at))
          .map((q) => (
            <QuestionCard key={q.id} q={q} needsApproval={settings.qaFlow === "advanced" && settings.qaApprover} onDraft={(t) => (onDraft(q.id, t), flash(settings.qaApprover ? "Draft saved — approve it to release" : "Draft saved"))} onRelease={() => (onRelease(q.id), flash(`Answer released to ${q.from}`))} />
          ))}
        {!questions.length && <div className="rounded-[14px] border border-dashed border-stone-300 py-10 text-center text-[12.5px] text-stone-400">No questions yet.</div>}
      </div>
    </div>
  );
}

export function QuestionCard({ q, room, needsApproval = true, onDraft, onRelease }: { q: Question; room?: string; needsApproval?: boolean; onDraft: (t: string) => void; onRelease: () => void }) {
  const [text, setText] = useState(q.draft ?? "");
  const when = new Date(q.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  return (
    <div className="rounded-[14px] border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[12px] text-stone-500">
          <span className="font-semibold text-ink-900">{q.from}</span> · {q.firm}
          {room ? ` · ${room}` : ""}
          {q.docIndex ? ` · re ${q.docIndex}${q.page ? `, page ${q.page}` : ""}` : ""} · {when}
        </div>
        <Pill tone={q.status === "Open" ? "warn" : q.status === "Draft" ? "gold" : "good"}>{q.status === "Draft" ? "Awaiting approval" : q.status}</Pill>
      </div>
      <p className="mt-2 text-[14px] text-ink-900">{q.text}</p>
      {q.status === "Answered" ? (
        <div className="mt-3 rounded-[10px] bg-stone-50 px-4 py-3 text-[13px] text-stone-700">
          <span className="font-semibold text-ink-900">{q.answeredBy}:</span> {q.answer}
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={needsApproval ? "Draft an answer — released after approval" : "Write the answer"} className={field} />
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

/* ───────────────────────── permissions ───────────────────────── */

const LEVELS: FolderAccess[] = ["none", "view", "download", "upload"];
const LEVEL_LABEL: Record<FolderAccess, string> = { none: "Hidden", view: "View", download: "Download", upload: "Upload" };

function Permissions({ room, docs, users, links, settings, onSave, flash }: { room: Room; docs: RoomDoc[]; users: RoomUser[]; links: ShareLink[]; settings: RoomSettings; onSave: (l: ShareLink) => void; flash: (t: string) => void }) {
  const folders = [...new Set(docs.map((d) => d.folder))];
  const blank = (): ShareLink => ({
    id: `${room.id.replace("rm-", "")}-${Date.now().toString(36)}`,
    roomId: room.id,
    name: "New audience",
    mode: "link",
    invited: [],
    verifyEmail: true,
    nda: "off",
    questions: [],
    watermark: false,
    screenshot: false,
    download: false,
    print: false,
    expires: undefined,
    allowDomains: [],
    blockDomains: [],
    folders: Object.fromEntries(folders.map((f) => [f, "view" as FolderAccess])),
    welcome: `Welcome to ${room.name}.`,
    created: "2026-11-24",
  });
  const [list, setList] = useState<ShareLink[]>(links);
  const [selId, setSelId] = useState<string | null>(links[0]?.id ?? null);
  const sel = list.find((l) => l.id === selId);
  const [draft, setDraft] = useState<ShareLink | null>(sel ?? null);
  const [tab, setTab] = useState<"protection" | "audience">("protection");
  const [tile, setTile] = useState<string | null>(null);
  const pick = (l: ShareLink) => {
    setSelId(l.id);
    setDraft(l);
    setTile(null);
  };
  const set = <K extends keyof ShareLink>(k: K, v: ShareLink[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(sel);
  const csv = (s: string) =>
    s
      .split(/[\s,;]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

  const tiles = draft
    ? ([
        ["email", Mail, "Email verification", draft.verifyEmail ? "On" : "Off"],
        ["password", KeyRound, "Password", draft.password ? "On" : "Off"],
        ["expiry", Timer, "Access ends", draft.expires ? fmtDate(draft.expires) : "No end date"],
        ["watermark", Fingerprint, "Watermark", draft.watermark ? "On" : "Off"],
        ["nda", FileSignature, "NDA", draft.nda === "off" ? "Off" : draft.nda === "esign" ? "E-signature" : "Accept"],
        ["screenshot", ShieldOff, "Capture shield", draft.screenshot ? "On" : "Off"],
        ["questions", ListChecks, "Entry questions", draft.questions.length ? `${draft.questions.length}` : "Off"],
        ["domains", Globe, "Email domains", draft.allowDomains.length || draft.blockDomains.length ? "On" : "Off"],
      ] as const)
    : [];

  return (
    <div className="flex min-h-full">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="px-4 pb-2 pt-4 text-[12px] font-semibold text-stone-500">Audiences</div>
        <div className="flex-1 space-y-1 px-2">
          {list.map((l) => (
            <button key={l.id} onClick={() => pick(l)} className={cx("w-full rounded-[10px] px-3 py-2.5 text-left", selId === l.id ? "bg-stone-100" : "hover:bg-stone-50")}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-semibold text-ink-900">{l.name}</span>
                <span className={cx("relative h-4 w-7 shrink-0 rounded-full", l.revoked ? "bg-stone-300" : "")} style={!l.revoked ? { background: C } : undefined} aria-label={l.revoked ? "Off" : "On"}>
                  <span className={cx("absolute top-0.5 h-3 w-3 rounded-full bg-white", l.revoked ? "left-0.5" : "left-[14px]")} />
                </span>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(linkUrl(l.id)).catch(() => {});
                  flash("Link copied");
                }}
                className="mt-1 flex items-center gap-1 text-[11.5px] text-stone-500 hover:text-ink-900"
              >
                <Copy size={11} /> Copy link
              </span>
            </button>
          ))}
        </div>
        <div className="p-3">
          <button
            onClick={() => {
              const n = blank();
              setList((x) => [...x, n]);
              pick(n);
              setTab("audience");
            }}
            className="h-9 w-full rounded-[10px] text-[12.5px] font-semibold text-white"
            style={{ background: C }}
          >
            New audience
          </button>
        </div>
      </aside>
      {draft ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-5 border-b border-stone-200 bg-white px-6">
            {(["protection", "audience"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cx("-mb-px border-b-2 py-3 text-[13px] font-semibold capitalize", tab === t ? "text-ink-900" : "border-transparent text-stone-500")} style={tab === t ? { borderColor: C } : undefined}>
                {t}
              </button>
            ))}
            <a href={previewUrl(draft, settings)} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1.5 self-center text-[12.5px] font-semibold text-stone-600 hover:text-ink-900">
              <Eye size={14} /> Preview as a visitor
            </a>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {tab === "protection" ? (
              <>
                <div>
                  <div className="text-[14px] font-semibold text-ink-900">Protection</div>
                  <div className="text-[12px] text-stone-500">Each layer is independent. Select one to adjust it.</div>
                  <div className="mt-3 grid grid-cols-4 gap-2.5">
                    {tiles.map(([id, Icon, label, value]) => (
                      <button
                        key={id}
                        onClick={() => setTile((t) => (t === id ? null : id))}
                        className={cx("rounded-[12px] border bg-white p-3 text-left shadow-card", tile === id ? "border-transparent ring-2" : "border-stone-200 hover:border-stone-400")}
                        style={tile === id ? { ["--tw-ring-color" as string]: C } : undefined}
                      >
                        <Icon size={15} className="text-stone-500" />
                        <div className="mt-2 text-[12.5px] font-semibold text-ink-900">{label}</div>
                        <div className={cx("text-[11.5px]", value === "Off" || value === "No end date" ? "text-stone-500" : "font-semibold")} style={value !== "Off" && value !== "No end date" ? { color: C } : undefined}>
                          {value}
                        </div>
                      </button>
                    ))}
                  </div>
                  {tile && (
                    <div className="mt-3 rounded-[12px] border border-stone-200 bg-white p-4 shadow-card">
                      {tile === "email" && <Switch on={draft.verifyEmail} onChange={() => set("verifyEmail", !draft.verifyEmail)} label="Visitors confirm their email with a 6-digit code before entering" />}
                      {tile === "password" && (
                        <div className="flex items-center gap-3">
                          <Switch on={draft.password !== undefined} onChange={() => set("password", draft.password !== undefined ? undefined : "")} label="Require a shared password" />
                          {draft.password !== undefined && <input value={draft.password} onChange={(e) => set("password", e.target.value)} placeholder="Password" className={cx(field, "max-w-[240px]")} />}
                        </div>
                      )}
                      {tile === "expiry" && (
                        <div className="flex items-center gap-3 text-[13px]">
                          <span className="text-ink-900">Access ends on</span>
                          <input type="date" value={draft.expires ?? ""} onChange={(e) => set("expires", e.target.value || undefined)} className={cx(field, "max-w-[180px]")} />
                          {draft.expires && (
                            <button onClick={() => set("expires", undefined)} className="text-[12px] font-semibold text-stone-500 hover:text-ink-900">
                              Never expire
                            </button>
                          )}
                        </div>
                      )}
                      {tile === "watermark" && <Switch on={draft.watermark} onChange={() => set("watermark", !draft.watermark)} label="Overlay the visitor’s email, IP and time on every page" />}
                      {tile === "nda" && (
                        <div className="flex gap-2">
                          {(
                            [
                              ["off", "Off"],
                              ["acknowledge", "Accept to enter"],
                              ["esign", "E-signature"],
                            ] as const
                          ).map(([v, l]) => (
                            <button key={v} onClick={() => set("nda", v)} className={cx("h-8 rounded-[8px] border px-3 text-[12.5px] font-semibold", draft.nda === v ? "border-transparent text-white" : "border-stone-200 text-stone-600")} style={draft.nda === v ? { background: C } : undefined}>
                              {l}
                            </button>
                          ))}
                        </div>
                      )}
                      {tile === "screenshot" && (
                        <div className="space-y-1">
                          <Switch on={draft.screenshot} onChange={() => set("screenshot", !draft.screenshot)} label="Hide pages when the window loses focus or a capture shortcut is pressed; no copy or right-click" />
                          <Switch on={!draft.print} onChange={() => set("print", !draft.print)} label="Block printing" />
                          <Switch on={draft.download} onChange={() => set("download", !draft.download)} label="Allow downloads from folders set to Download" />
                        </div>
                      )}
                      {tile === "questions" && (
                        <textarea
                          value={draft.questions.join("\n")}
                          onChange={(e) => set("questions", e.target.value.split("\n").filter((x) => x.trim()))}
                          rows={3}
                          placeholder={"One question per line, e.g.\nAre you an accredited investor?"}
                          className="w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none"
                        />
                      )}
                      {tile === "domains" && (
                        <div className="grid grid-cols-2 gap-3">
                          <input value={draft.allowDomains.join(", ")} onChange={(e) => set("allowDomains", csv(e.target.value))} placeholder="Only these domains, e.g. firm.com" className={field} />
                          <input value={draft.blockDomains.join(", ")} onChange={(e) => set("blockDomains", csv(e.target.value))} placeholder="Block, e.g. gmail.com" className={field} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink-900">Folders</div>
                  <div className="text-[12px] text-stone-500">What this audience can do in each folder.</div>
                  <div className="mt-3 overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-card">
                    {folders.map((f) => (
                      <div key={f} className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5 last:border-0">
                        <span className="flex items-center gap-2 text-[13px] text-ink-900">
                          <Folder size={15} style={{ color: C }} /> {f.replace(/^\d+ /, "")}
                        </span>
                        <div className="flex rounded-[8px] border border-stone-200 p-0.5">
                          {LEVELS.map((l) => {
                            const on = (draft.folders[f] ?? "view") === l;
                            return (
                              <button
                                key={l}
                                onClick={() => set("folders", { ...draft.folders, [f]: l })}
                                className={cx("flex h-7 items-center gap-1 rounded-[6px] px-2.5 text-[11.5px] font-semibold", on ? "text-white" : "text-stone-500 hover:text-ink-900")}
                                style={on ? { background: l === "none" ? "#9A4422" : C } : undefined}
                              >
                                {l === "none" ? <EyeOff size={12} /> : l === "view" ? <Eye size={12} /> : l === "download" ? <Download size={12} /> : <Upload size={12} />} {LEVEL_LABEL[l]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="max-w-[720px] space-y-5">
                <label className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <span className="text-[13px] text-stone-600">Audience</span>
                  <input value={draft.name} onChange={(e) => set("name", e.target.value)} className={field} />
                </label>
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="pt-2 text-[13px] text-stone-600">How they get in</span>
                  <div className="space-y-2">
                    {(
                      [
                        ["invite", "Named people", "Each person is invited by email and signs in as themselves."],
                        ["link", "Shareable link", "One link for the whole audience, behind the protections you choose."],
                      ] as const
                    ).map(([v, t, h]) => (
                      <label key={v} className={cx("flex cursor-pointer items-start gap-3 rounded-[10px] border p-3", draft.mode === v ? "border-transparent bg-white ring-2" : "border-stone-200 bg-white")} style={draft.mode === v ? { ["--tw-ring-color" as string]: C } : undefined}>
                        <input type="radio" checked={draft.mode === v} onChange={() => set("mode", v)} className="mt-1" style={{ accentColor: C }} />
                        <span>
                          <span className="block text-[13px] font-semibold text-ink-900">{t}</span>
                          <span className="block text-[12px] text-stone-500">{h}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {draft.mode === "invite" && (
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="pt-2 text-[13px] text-stone-600">People</span>
                    <textarea value={draft.invited.join(", ")} onChange={(e) => set("invited", csv(e.target.value))} rows={3} placeholder="name@firm.com, other@firm.com" className="w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none" />
                  </div>
                )}
                <label className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="pt-2 text-[13px] text-stone-600">Welcome message</span>
                  <textarea value={draft.welcome} onChange={(e) => set("welcome", e.target.value)} rows={3} className="w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none" />
                </label>
                {users.length > 0 && (
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="pt-1 text-[13px] text-stone-600">Visitors so far</span>
                    <ul className="space-y-1.5 text-[12.5px]">
                      {users.map((u) => (
                        <li key={u.id} className="flex items-center justify-between">
                          <span>
                            <span className="font-medium text-ink-900">{u.name}</span> <span className="text-stone-500">· {u.firm}</span>
                          </span>
                          <Pill tone={u.nda === "Signed" ? "good" : u.nda === "Pending" ? "warn" : "neutral"}>{u.nda === "Not required" ? "No NDA" : `NDA ${u.nda.toLowerCase()}`}</Pill>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 bg-white px-6 py-3">
            <button
              onClick={() => {
                const r = { ...draft, revoked: !draft.revoked };
                setDraft(r);
              }}
              className="text-[12.5px] font-semibold text-stone-500 hover:text-[#9A4422]"
            >
              {draft.revoked ? "Reopen access" : "Pause access"}
            </button>
            <div className="flex gap-2">
              <GhostButton onClick={() => setDraft(sel ?? null)}>Cancel</GhostButton>
              <ActionButton
                color={C}
                disabled={!dirty || !draft.name.trim()}
                onClick={() => {
                  setList((x) => x.map((l) => (l.id === draft.id ? draft : l)));
                  onSave(draft);
                }}
              >
                Save
              </ActionButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13px] text-stone-400">Add an audience to share this room.</div>
      )}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1 text-[13px] text-ink-900">
      <button type="button" role="switch" aria-checked={on} onClick={onChange} className={cx("relative h-5 w-9 shrink-0 rounded-full", !on && "bg-stone-300")} style={on ? { background: C } : undefined}>
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </button>
      {label}
    </label>
  );
}

/* ───────────────────────── settings ───────────────────────── */

function SettingsPanel({ settings, onChange }: { settings: RoomSettings; onChange: (s: RoomSettings) => void }) {
  const set = (p: Partial<RoomSettings>) => onChange({ ...settings, ...p });
  const cards: [keyof RoomSettings, typeof Hash, string, string][] = [
    ["indexNumbers", Hash, "Number documents", "Adds 1.1, 1.2… so everyone can refer to the same file on a call."],
    ["visitorQa", MessagesSquare, "Questions from visitors", "Shows the “Ask a question” button inside the room."],
    ["showCover", ImageIcon, "Cover image", "Banner on the entry page and above the documents."],
    ["showLogo", PanelTop, "Sponsor logo", "Shown on the entry page and in the room’s top bar."],
    ["newFileDigest", Bell, "Daily update email", "Tells visitors once a day when documents were added."],
    ["hideNewContent", EyeOff, "New uploads start hidden", "Nothing new is visible to any audience until you open it up under Access."],
  ];
  return (
    <div className="max-w-[1000px] p-8">
      <div className="text-[12px] text-stone-500">Settings</div>
      <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-ink-900">Room settings</h2>
      <p className="mt-1 max-w-[520px] text-[13px] text-stone-600">Applies to every audience of this room.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {cards.map(([k, Icon, title, body]) => (
          <div key={k} className="rounded-[14px] border border-stone-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-stone-100 text-stone-600">
                <Icon size={16} />
              </span>
              <Switch on={Boolean(settings[k])} onChange={() => set({ [k]: !settings[k] } as Partial<RoomSettings>)} label="" />
            </div>
            <div className="mt-3 text-[13.5px] font-semibold text-ink-900">{title}</div>
            <p className="mt-1 text-[12.5px] text-stone-600">{body}</p>
          </div>
        ))}
        <div className="rounded-[14px] border border-stone-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-stone-100 text-stone-600">
              <Globe size={16} />
            </span>
            <select value={settings.domain} onChange={(e) => set({ domain: e.target.value })} className="h-9 rounded-[9px] border border-stone-300 bg-white px-2 text-[12.5px]" aria-label="Domain">
              <option value="aurum-platform-6sal.vercel.app">aurum-platform-6sal.vercel.app (current)</option>
              <option value="dataroom.aurumasset.us">dataroom.aurumasset.us (needs DNS)</option>
            </select>
          </div>
          <div className="mt-3 text-[13.5px] font-semibold text-ink-900">Link address</div>
          <p className="mt-1 text-[12.5px] text-stone-600">The web address visitors see in their links.</p>
        </div>
      </div>
    </div>
  );
}

export { size as fileSize, dur as duration, fmtShort as shortDate };
