"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Droplets, Eye, FileSignature, FolderClosed, Plus, Printer, X } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { solutions } from "@/lib/solutions";
import {
  docs as seedDocs,
  questions as seedQuestions,
  roomUsers as seedUsers,
  rooms as seedRooms,
  shareLinks as seedLinks,
  roomSettings,
  type RoomSettings,
  views,
  type ShareLink,
  type Permission,
  type Question,
  type Room,
  type RoomDoc,
  type RoomPurpose,
  type RoomUser,
} from "@/lib/dataroom";
import { QuestionCard, RoomConsole } from "@/components/dataroom/RoomConsole";
import { localAnswerDrafts, localQuestions } from "@/lib/dataroom-local";
import { ROOM_TEMPLATES, loadRoomBrands, type RoomTemplate } from "@/lib/dataroom-extras";
import { coverSrc, roomCover } from "@/lib/covers";
import { ActionButton, Card, GhostButton, Kpi, ModuleHeader, ModuleTabs, Pill, Toast, field, fieldLabel, fmtShort, td, th, useTab, useToast } from "./kit";

const C = FIRM.dataroom;
export type DataRoomTab = "rooms" | "qa" | "activity" | "access" | "new";
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
const dur = (s: number) => (s >= 60 ? `${Math.round(s / 60)} min` : s ? `${s}s` : "—");

export function DataRoomWorkspace({ tab: initial }: { tab: DataRoomTab }) {
  const [tab, setTab] = useTab<Exclude<DataRoomTab, "new">>(initial === "new" ? "rooms" : initial);
  const [rooms, setRooms] = useState<Room[]>(seedRooms);
  const [docs, setDocs] = useState<RoomDoc[]>(seedDocs);
  const [users, setUsers] = useState<RoomUser[]>(seedUsers);
  const [qs, setQs] = useState<Question[]>(seedQuestions);
  const [links, setLinks] = useState<ShareLink[]>(seedLinks);
  const [settings, setSettings] = useState<Record<string, RoomSettings>>(roomSettings);
  const draftAnswer = (id: string, text: string) => setQs((all) => all.map((x) => (x.id === id ? { ...x, draft: text, status: "Draft" } : x)));
  const releaseAnswer = (id: string) => {
    setQs((all) => all.map((x) => (x.id === id ? { ...x, answer: x.draft, answeredBy: "Managing Partner", status: "Answered" } : x)));
  };
  // Questions asked from a preview visit in this browser (until the database is connected).
  useEffect(() => {
    const local = localQuestions();
    const drafts = localAnswerDrafts();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (local.length) setQs((all) => [...all, ...local.filter((l) => !all.some((a) => a.id === l.id))]);
    // Draft answers converted from Corporate Chat still go through review and release here.
    if (drafts.length)
      setQs((all) =>
        all.map((x) => {
          const d = drafts.find((y) => y.questionId === x.id);
          return d && x.status !== "Answered" ? { ...x, draft: d.text, status: "Draft" } : x;
        }),
      );
  }, []);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [banners, setBanners] = useState<Record<string, string>>({});
  useEffect(() => {
    const all = loadRoomBrands();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBanners(Object.fromEntries(Object.entries(all).flatMap(([k, b]) => (b.banner ? [[k, b.banner]] : []))));
  }, [roomId]);
  const [creating, setCreating] = useState(initial === "new");
  const [toast, flash] = useToast();
  const room = rooms.find((r) => r.id === roomId);
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? "";

  if (tab === "rooms" && room)
    return (
      <>
        <RoomConsole
          room={room}
          docs={docs.filter((x) => x.roomId === room.id)}
          users={users.filter((u) => u.roomId === room.id)}
          questions={qs.filter((q) => q.roomId === room.id)}
          links={links.filter((l) => l.roomId === room.id)}
          settings={settings[room.id] ?? roomSettings[room.id]}
          onBack={() => setRoomId(null)}
          onRename={(name) => setRooms((all) => all.map((r) => (r.id === room.id ? { ...r, name } : r)))}
          onSaveLink={(l) => {
            setLinks((all) => (all.some((x) => x.id === l.id) ? all.map((x) => (x.id === l.id ? l : x)) : [...all, l]));
            flash(`Group “${l.name}” saved`);
          }}
          onSettings={(st) => setSettings((all) => ({ ...all, [room.id]: st }))}
          onDraft={draftAnswer}
          onRelease={releaseAnswer}
          flash={flash}
          onUpload={(folder, files) => {
            const existing = docs.filter((x) => x.roomId === room.id && x.folder === folder);
            const n = Number(folder.split(" ")[0]) || 1;
            setDocs((all) => [...all, ...files.map((f, i) => ({ id: `doc${Date.now()}${i}`, roomId: room.id, folder, index: `${n}.${existing.length + i + 1}`, name: f.name, size: f.size, views: 0 }))]);
            flash(`${files.length} file${files.length > 1 ? "s" : ""} added to ${folder.replace(/^\d+ /, "")}`);
          }}
        />
        <Toast text={toast} />
      </>
    );

  return (
    <div className="mx-auto max-w-[1256px] pb-16">
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
                    className="group overflow-hidden rounded-[12px] border border-stone-200/80 bg-white text-left shadow-card transition-shadow hover:shadow-lift"
                  >
                    <div className="relative h-[112px] overflow-hidden bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banners[r.id] ?? roomCover(r)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="p-5">
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
                    </div>
                  </button>
                );
              })}
            </div>
          </>
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
                  needsApproval={(settings[q.roomId] ?? roomSettings[q.roomId])?.qaApprover ?? true}
                  onDraft={(text) => draftAnswer(q.id, text)}
                  onRelease={() => releaseAnswer(q.id)}
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
          onSave={(r, t) => {
            setRooms((all) => [r, ...all]);
            if (t)
              setDocs((all) => [
                ...all,
                ...t.folders.flatMap((f, fi) =>
                  f.items.map((it, ii) => ({ id: `doc${Date.now()}${fi}${ii}`, roomId: r.id, folder: `${fi + 1} ${f.name}`, index: `${fi + 1}.${ii + 1}`, name: it, size: 0, views: 0 })),
                ),
              ]);
            setCreating(false);
            setTab("rooms");
            setRoomId(r.id);
            flash(`${r.name} created`);
          }}
        />
      )}
      <Toast text={toast} />
    </div>
  );
}

function NewRoom({ onClose, onSave }: { onClose: () => void; onSave: (r: Room, t?: RoomTemplate) => void }) {
  const [template, setTemplate] = useState<RoomTemplate | null | undefined>(undefined);
  const [peek, setPeek] = useState<string | null>(null);
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
  if (template === undefined)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6" role="dialog" aria-modal aria-label="Choose a starting point">
        <div className="max-h-[88vh] w-full max-w-[980px] overflow-y-auto rounded-[14px] bg-white p-6 shadow-lift">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-ink-900">New data room</h2>
              <p className="mt-0.5 text-[12.5px] text-stone-500">Start from an index built for the deal, or from an empty room.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROOM_TEMPLATES.map((t) => (
              <div key={t.id} className="flex flex-col rounded-[10px] border border-stone-200 bg-white hover:border-stone-300">
                <div className="relative h-[128px] overflow-hidden rounded-t-[10px] bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverSrc(t.cover)} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-[5px] bg-black/45 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-[2px]">
                    <FolderClosed size={11} strokeWidth={1.8} /> {t.folders.length} folders · {t.folders.reduce((n, x) => n + x.items.length, 0)} documents
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[14px] font-semibold text-ink-900">{t.name}</div>
                  <p className="mt-1 flex-1 text-[12px] leading-relaxed text-stone-500">{t.about}</p>
                  {peek === t.id && (
                    <ol className="mt-3 space-y-2 border-t border-stone-100 pt-3 text-[12px]">
                      {t.folders.map((fo, i) => (
                        <li key={fo.name}>
                          <div className="font-medium text-ink-900">
                            {i + 1} {fo.name}
                          </div>
                          <div className="text-[11.5px] text-stone-500">{fo.items.join(" · ")}</div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPeek(peek === t.id ? null : t.id)} className="h-8 rounded-[8px] border border-stone-200 text-[12.5px] font-medium text-ink-900 hover:border-stone-300">
                      {peek === t.id ? "Hide index" : "View index"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplate(t);
                        setF((x) => ({ ...x, purpose: t.purpose }));
                      }}
                      className="h-8 rounded-[8px] bg-ink-900 text-[12.5px] font-semibold text-white hover:opacity-90"
                    >
                      Use template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setTemplate(null)} className="mt-4 text-[12.5px] font-medium text-stone-600 underline-offset-2 hover:text-ink-900 hover:underline">
            Start with an empty room
          </button>
        </div>
      </div>
    );

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
          }, template ?? undefined);
        }}
        className="w-full max-w-[520px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <div>
            <button type="button" onClick={() => setTemplate(undefined)} className="flex items-center gap-1 text-[12px] font-medium text-stone-500 hover:text-ink-900">
              <ArrowLeft size={13} /> Starting points
            </button>
            <h2 className="mt-1 text-[17px] font-semibold text-ink-900">New data room{template ? ` · ${template.name}` : ""}</h2>
            {template && <p className="text-[12px] text-stone-500">{template.folders.length} folders and {template.folders.reduce((n, x) => n + x.items.length, 0)} document slots will be created.</p>}
          </div>
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
