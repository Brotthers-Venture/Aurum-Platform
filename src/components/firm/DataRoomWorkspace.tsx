"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Droplets, Eye, FileSignature, FileSpreadsheet, FileText, Folder, Lock, Plus, Printer, Upload, X } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { solutions } from "@/lib/solutions";
import {
  docs as seedDocs,
  questions as seedQuestions,
  roomUsers as seedUsers,
  rooms as seedRooms,
  shareLinks as seedLinks,
  views,
  type ShareLink,
  type Permission,
  type Question,
  type Room,
  type RoomDoc,
  type RoomPurpose,
  type RoomUser,
} from "@/lib/dataroom";
import { AnalyticsPanel, LinksPanel } from "@/components/dataroom/RoomAdmin";
import { localQuestions } from "@/lib/dataroom-local";
import { ActionButton, Card, GhostButton, Kpi, ModuleHeader, ModuleTabs, Pill, Toast, field, fieldLabel, fmtDate, fmtShort, td, th, useTab, useToast } from "./kit";

const C = FIRM.dataroom;
export type DataRoomTab = "rooms" | "qa" | "activity" | "access" | "new";
const size = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
const dur = (s: number) => (s >= 60 ? `${Math.round(s / 60)} min` : s ? `${s}s` : "—");
const Glyph = ({ name }: { name: string }) =>
  /\.(xlsx|csv)$/i.test(name) ? <FileSpreadsheet size={15} className="shrink-0 text-[#1F6F6A]" /> : <FileText size={15} className="shrink-0 text-[#B5542A]" />;

export function DataRoomWorkspace({ tab: initial }: { tab: DataRoomTab }) {
  const [tab, setTab] = useTab<Exclude<DataRoomTab, "new">>(initial === "new" ? "rooms" : initial);
  const [rooms, setRooms] = useState<Room[]>(seedRooms);
  const [docs, setDocs] = useState<RoomDoc[]>(seedDocs);
  const [users, setUsers] = useState<RoomUser[]>(seedUsers);
  const [qs, setQs] = useState<Question[]>(seedQuestions);
  const [links, setLinks] = useState<ShareLink[]>(seedLinks);
  // Questions asked from a preview visit in this browser (until the database is connected).
  useEffect(() => {
    const local = localQuestions();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (local.length) setQs((all) => [...all, ...local.filter((l) => !all.some((a) => a.id === l.id))]);
  }, []);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [creating, setCreating] = useState(initial === "new");
  const [toast, flash] = useToast();
  const room = rooms.find((r) => r.id === roomId);
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? "";

  return (
    <>
      <ModuleHeader
        color={C}
        title="Data rooms"
        action={
          <ActionButton color={C} onClick={() => setCreating(true)}>
            <Plus size={15} /> New room
          </ActionButton>
        }
      />
      <ModuleTabs
        color={C}
        tab={tab}
        setTab={(t) => {
          setTab(t);
          setRoomId(null);
        }}
        tabs={[
          { id: "rooms", label: "Rooms", count: rooms.length },
          {
            id: "qa",
            label: "Q&A",
            count: qs.filter((q) => q.status === "Open").length,
          },
          { id: "activity", label: "Activity" },
          {
            id: "access",
            label: "NDAs & access",
            count: users.filter((u) => u.nda === "Pending").length,
          },
        ]}
      />
      <div className="mt-6 space-y-5">
        {tab === "rooms" && !room && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <Kpi label="Open rooms" value={rooms.filter((r) => r.status === "Open").length} note={`${rooms.filter((r) => r.status === "Preparing").length} being prepared`} />
              <Kpi label="Documents" value={docs.length} />
              <Kpi label="External people" value={users.filter((u) => u.nda !== "Not required").length} note={`${users.filter((u) => u.nda === "Pending").length} NDAs pending`} />
              <Kpi label="Open questions" value={qs.filter((q) => q.status === "Open").length} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {rooms.map((r) => {
                const rd = docs.filter((x) => x.roomId === r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => setRoomId(r.id)}
                    className="rounded-[16px] border border-stone-200/80 bg-white p-5 text-left shadow-card transition-shadow hover:shadow-lift"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: C }}>
                        {r.purpose}
                      </span>
                      <Pill tone={r.status === "Open" ? "good" : r.status === "Preparing" ? "gold" : "neutral"}>{r.status}</Pill>
                    </div>
                    <div className="mt-2 text-[15px] font-semibold leading-snug text-ink-900">{r.name}</div>
                    <div className="text-[12px] text-stone-500">{r.client}</div>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
                      <span>
                        <b className="num block text-[15px] text-ink-900">{rd.length}</b>
                        documents
                      </span>
                      <span>
                        <b className="num block text-[15px] text-ink-900">{users.filter((u) => u.roomId === r.id).length}</b>
                        people
                      </span>
                      <span>
                        <b className="num block text-[15px] text-ink-900">{rd.reduce((s, x) => s + x.views, 0)}</b>
                        views
                      </span>
                    </div>
                    <div className="mt-3 flex gap-3 text-[11px] text-stone-500">
                      {r.nda && (
                        <span className="flex items-center gap-1">
                          <FileSignature size={12} /> NDA
                        </span>
                      )}
                      {r.watermark && (
                        <span className="flex items-center gap-1">
                          <Droplets size={12} /> Watermark
                        </span>
                      )}
                      <span className="ml-auto">until {fmtShort(r.expires)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "rooms" && room && (
          <RoomView
            room={room}
            docs={docs.filter((x) => x.roomId === room.id)}
            users={users.filter((u) => u.roomId === room.id)}
            questions={qs.filter((q) => q.roomId === room.id)}
            links={links.filter((l) => l.roomId === room.id)}
            onSaveLink={(l) => {
              setLinks((all) => (all.some((x) => x.id === l.id) ? all.map((x) => (x.id === l.id ? l : x)) : [...all, l]));
              flash(`Link “${l.name}” saved`);
            }}
            onRevokeLink={(id) => setLinks((all) => all.map((x) => (x.id === id ? { ...x, revoked: !x.revoked } : x)))}
            flash={flash}
            onBack={() => setRoomId(null)}
            onUpload={(folder, files) => {
              const existing = docs.filter((x) => x.roomId === room.id && x.folder === folder);
              const n = Number(folder.split(" ")[0]) || 1;
              setDocs((all) => [
                ...all,
                ...files.map((f, i) => ({
                  id: `doc${Date.now()}${i}`,
                  roomId: room.id,
                  folder,
                  index: `${n}.${existing.length + i + 1}`,
                  name: f.name,
                  size: f.size,
                  views: 0,
                })),
              ]);
              flash(`${files.length} file${files.length > 1 ? "s" : ""} added to ${folder.replace(/^\d+ /, "")}`);
            }}
            onToggle={(k) => setRooms((all) => all.map((r) => (r.id === room.id ? { ...r, [k]: !r[k] } : r)))}
          />
        )}

        {tab === "qa" && (
          <div className="space-y-3">
            {[...qs]
              .sort((a, b) => ["Open", "Draft", "Answered"].indexOf(a.status) - ["Open", "Draft", "Answered"].indexOf(b.status) || b.at.localeCompare(a.at))
              .map((q) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  room={roomName(q.roomId)}
                  onDraft={(text) => {
                    setQs((all) => all.map((x) => (x.id === q.id ? { ...x, draft: text, status: "Draft" } : x)));
                    flash("Answer drafted — release it after review");
                  }}
                  onRelease={() => {
                    setQs((all) =>
                      all.map((x) =>
                        x.id === q.id
                          ? {
                              ...x,
                              answer: x.draft,
                              answeredBy: "Managing Partner",
                              status: "Answered",
                            }
                          : x,
                      ),
                    );
                    flash(`Answer released to ${q.from}`);
                  }}
                />
              ))}
          </div>
        )}

        {tab === "activity" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["When", "Who", "Room", "Document", "Action", "Time spent"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...views]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((v) => (
                    <tr key={v.id} className="border-b border-stone-100">
                      <td className={cx(td, "whitespace-nowrap text-stone-600")}>{when(v.at)}</td>
                      <td className={td}>
                        <div className="font-medium text-ink-900">{v.who}</div>
                        <div className="text-[11px] text-stone-500">{v.firm}</div>
                      </td>
                      <td className={cx(td, "text-stone-600")}>{roomName(v.roomId)}</td>
                      <td className={cx(td, "text-ink-900")}>{v.doc}</td>
                      <td className={td}>
                        <span className="flex items-center gap-1.5 text-stone-600">
                          {v.action === "Viewed" ? <Eye size={13} /> : v.action === "Downloaded" ? <Download size={13} /> : <Printer size={13} />}
                          {v.action}
                        </span>
                      </td>
                      <td className={cx(td, "num text-stone-600")}>{dur(v.seconds)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "access" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["Person", "Room", "Group", "Permission", "NDA", "Last seen", ""].map((h, i) => (
                    <th key={i} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...users]
                  .sort((a, b) => Number(b.nda === "Pending") - Number(a.nda === "Pending"))
                  .map((u) => (
                    <tr key={u.id} className="border-b border-stone-100">
                      <td className={td}>
                        <div className="font-medium text-ink-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">{u.firm}</div>
                      </td>
                      <td className={cx(td, "text-stone-600")}>{roomName(u.roomId)}</td>
                      <td className={cx(td, "text-stone-600")}>{u.group}</td>
                      <td className={td}>
                        <select
                          value={u.permission}
                          onChange={(e) =>
                            setUsers((all) =>
                              all.map((x) =>
                                x.id === u.id
                                  ? {
                                      ...x,
                                      permission: e.target.value as Permission,
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="h-7 rounded-[7px] border border-stone-200 bg-white px-2 text-[12px]"
                          aria-label={`Permission for ${u.name}`}
                        >
                          {(["View", "Download", "Print", "Manage"] as const).map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className={td}>
                        <Pill tone={u.nda === "Signed" ? "good" : u.nda === "Pending" ? "warn" : "neutral"}>{u.nda}</Pill>
                      </td>
                      <td className={cx(td, "text-stone-600")}>{u.lastSeen ? fmtShort(u.lastSeen) : "Never"}</td>
                      <td className={cx(td, "text-right")}>
                        {u.nda === "Pending" ? (
                          <button onClick={() => flash(`NDA re-sent to ${u.name}`)} className="text-[12px] font-semibold hover:underline" style={{ color: C }}>
                            Resend NDA
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setUsers((all) => all.filter((x) => x.id !== u.id));
                              flash(`${u.name}'s access revoked`);
                            }}
                            className="text-[12px] font-semibold text-stone-500 hover:text-[#9A4422]"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {creating && (
        <NewRoom
          onClose={() => setCreating(false)}
          onSave={(r) => {
            setRooms((all) => [r, ...all]);
            setCreating(false);
            setTab("rooms");
            setRoomId(r.id);
            flash(`${r.name} created`);
          }}
        />
      )}
      <Toast text={toast} />
    </>
  );
}

function RoomView({
  room,
  docs,
  users,
  questions,
  links,
  onSaveLink,
  onRevokeLink,
  flash,
  onBack,
  onUpload,
  onToggle,
}: {
  room: Room;
  docs: RoomDoc[];
  users: RoomUser[];
  questions: Question[];
  links: ShareLink[];
  onSaveLink: (l: ShareLink) => void;
  onRevokeLink: (id: string) => void;
  flash: (t: string) => void;
  onBack: () => void;
  onUpload: (folder: string, files: File[]) => void;
  onToggle: (k: "nda" | "watermark") => void;
}) {
  const folders = [...new Set(docs.map((x) => x.folder))];
  const [folder, setFolder] = useState<string | "all">("all");
  const input = useRef<HTMLInputElement>(null);
  const shown = folder === "all" ? docs : docs.filter((x) => x.folder === folder);
  const target = folder === "all" ? (folders[0] ?? "1 Documents") : folder;
  const [view, setView] = useState<"documents" | "links" | "analytics">("documents");
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] font-semibold text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} /> All rooms
      </button>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: C }}>
            {room.purpose} · {room.client}
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-900">{room.name}</h2>
        </div>
        <div className="flex gap-2">
          <input ref={input} type="file" multiple hidden onChange={(e) => (e.target.files?.length && onUpload(target, Array.from(e.target.files)), (e.target.value = ""))} />
          <ActionButton color={C} onClick={() => input.current?.click()}>
            <Upload size={14} /> Upload to {target.replace(/^\d+ /, "")}
          </ActionButton>
        </div>
      </div>
      <div className="flex gap-1.5">
        {(
          [
            ["documents", `Documents · ${docs.length}`],
            ["links", `Links & protection · ${links.length}`],
            ["analytics", "Analytics"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cx("h-8 rounded-full px-3.5 text-[12.5px] font-semibold", view === id ? "text-white" : "bg-white text-stone-600 shadow-card hover:text-ink-900")}
            style={view === id ? { background: C } : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "links" && <LinksPanel room={room} links={links} folders={folders} onSave={onSaveLink} onRevoke={onRevokeLink} flash={flash} />}
      {view === "analytics" && <AnalyticsPanel docs={docs} />}
      {view === "documents" && (
        <div className="grid grid-cols-[220px_1fr_280px] gap-4">
          <Card className="p-2">
            {[["all", "All documents", docs.length] as const, ...folders.map((f) => [f, f.replace(/^(\d+) /, "$1  "), docs.filter((x) => x.folder === f).length] as const)].map(
              ([id, label, n]) => (
                <button
                  key={id}
                  onClick={() => setFolder(id)}
                  className={cx(
                    "flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-[12.5px]",
                    folder === id ? "bg-champagne font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50",
                  )}
                >
                  <Folder size={14} className="shrink-0 text-gold-700" />
                  <span className="flex-1 truncate whitespace-pre">{label}</span>
                  <span className="text-[11px] text-stone-400">{n}</span>
                </button>
              ),
            )}
          </Card>
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["#", "Document", "Size", "Views", "Last viewed"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className={cx(td, "num w-12 text-stone-400")}>{x.index}</td>
                    <td className={td}>
                      <span className="flex items-center gap-2 font-medium text-ink-900">
                        <Glyph name={x.name} /> {x.name}
                      </span>
                    </td>
                    <td className={cx(td, "num text-stone-500")}>{size(x.size)}</td>
                    <td className={cx(td, "num font-semibold text-ink-900")}>{x.views}</td>
                    <td className={cx(td, "text-[11.5px] text-stone-500")}>{x.lastViewed ? `${x.lastViewer} · ${fmtShort(x.lastViewed)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Protection</div>
              {(
                [
                  ["nda", "NDA before entry", FileSignature],
                  ["watermark", "Watermark with viewer’s name", Droplets],
                ] as const
              ).map(([k, label, Icon]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[12.5px] text-ink-900">
                  <Icon size={14} className="text-stone-500" />
                  <span className="flex-1">{label}</span>
                  <input type="checkbox" checked={room[k]} onChange={() => onToggle(k)} className="h-4 w-4" style={{ accentColor: C }} />
                </label>
              ))}
              <div className="mt-2 flex items-center gap-2.5 border-t border-stone-100 pt-2.5 text-[12px] text-stone-500">
                <Lock size={14} /> Access ends {fmtDate(room.expires)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">People · {users.length}</div>
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink-900">{u.name}</span>
                      <span className="block truncate text-[11px] text-stone-500">
                        {u.group} · {u.permission}
                      </span>
                    </span>
                    {u.nda === "Pending" && <Pill tone="warn">NDA</Pill>}
                  </li>
                ))}
                {!users.length && <li className="text-[12px] text-stone-400">No one invited yet.</li>}
              </ul>
            </Card>
            {questions.some((q) => q.status === "Open") && (
              <Card className="p-4">
                <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Open questions</div>
                {questions
                  .filter((q) => q.status === "Open")
                  .map((q) => (
                    <p key={q.id} className="mb-2 text-[12px] text-stone-700">
                      <span className="font-semibold text-ink-900">{q.from}:</span> {q.text}
                    </p>
                  ))}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, room, onDraft, onRelease }: { q: Question; room: string; onDraft: (t: string) => void; onRelease: () => void }) {
  const [text, setText] = useState(q.draft ?? "");
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="text-[12px] text-stone-500">
          <span className="font-semibold text-ink-900">{q.from}</span> · {q.firm} · {room}
          {q.docIndex && (
            <>
              {" "}
              · re {q.docIndex}
              {q.page ? `, page ${q.page}` : ""}
            </>
          )}{" "}
          · {when(q.at)}
        </div>
        <Pill tone={q.status === "Open" ? "warn" : q.status === "Draft" ? "gold" : "good"}>{q.status === "Draft" ? "Awaiting release" : q.status}</Pill>
      </div>
      <p className="mt-2 text-[14px] text-ink-900">{q.text}</p>
      {q.status === "Answered" ? (
        <div className="mt-3 rounded-[10px] bg-stone-50 px-4 py-3 text-[13px] text-stone-700">
          <span className="font-semibold text-ink-900">{q.answeredBy}:</span> {q.answer}
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Draft an answer — it’s released only after review" className={field} />
          {q.status === "Draft" && text === q.draft ? (
            <ActionButton color={C} onClick={onRelease}>
              Release
            </ActionButton>
          ) : (
            <GhostButton onClick={() => text.trim() && onDraft(text.trim())}>Save draft</GhostButton>
          )}
        </div>
      )}
    </Card>
  );
}

function NewRoom({ onClose, onSave }: { onClose: () => void; onSave: (r: Room) => void }) {
  const [f, setF] = useState({
    name: "",
    purpose: "Fundraising" as RoomPurpose,
    client: "",
    solution: "fund",
    expires: "2027-06-30",
    nda: true,
    watermark: true,
  });
  const set = (k: "name" | "purpose" | "client" | "solution" | "expires") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6" role="dialog" aria-modal aria-label="New data room">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: `rm${Date.now()}`,
            name: f.name,
            purpose: f.purpose,
            client: f.client,
            solution: f.solution,
            status: "Preparing",
            owner: "Managing Partner",
            nda: f.nda,
            watermark: f.watermark,
            expires: f.expires,
            created: "2026-11-24",
          });
        }}
        className="w-full max-w-[520px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[17px] font-semibold text-ink-900">New data room</h2>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <label className="block">
          <span className={fieldLabel}>Room name</span>
          <input required value={f.name} onChange={set("name")} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={fieldLabel}>Purpose</span>
            <select value={f.purpose} onChange={set("purpose")} className={field}>
              {["Fundraising", "Offering", "Due diligence", "Audit", "M&A", "Operational due diligence"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={fieldLabel}>Client</span>
            <input required value={f.client} onChange={set("client")} className={field} />
          </label>
          <label>
            <span className={fieldLabel}>Solution</span>
            <select value={f.solution} onChange={set("solution")} className={field}>
              {solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="aurum">Aurum (internal)</option>
            </select>
          </label>
          <label>
            <span className={fieldLabel}>Access ends</span>
            <input type="date" value={f.expires} onChange={set("expires")} className={field} />
          </label>
        </div>
        <div className="space-y-1.5">
          {(
            [
              ["nda", "Require an NDA before entry"],
              ["watermark", "Watermark documents with the viewer’s name"],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-[13px] text-ink-900">
              <input type="checkbox" checked={f[k]} onChange={() => setF((x) => ({ ...x, [k]: !x[k] }))} style={{ accentColor: C }} /> {l}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <ActionButton color={C} type="submit">
            Create room
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
