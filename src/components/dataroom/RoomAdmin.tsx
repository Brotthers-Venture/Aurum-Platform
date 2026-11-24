"use client";

import { useMemo, useState } from "react";
import { Copy, ExternalLink, Eye, FileSignature, Fingerprint, KeyRound, Link2, ListChecks, Lock, Mail, Plus, Printer, ShieldOff, Timer, Trash2, Users, X } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { pageCount, pageViews, type FolderAccess, type Room, type RoomDoc, type ShareLink } from "@/lib/dataroom";
import { localPageViews } from "@/lib/dataroom-local";
import { ActionButton, Card, GhostButton, Kpi, Pill, field, fieldLabel, fmtDate, fmtShort, td, th } from "@/components/firm/kit";

const C = FIRM.dataroom;
const mins = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${Math.round(s / 60)} min` : `${s}s`);

export const linkUrl = (id: string) => (typeof window === "undefined" ? `/room/${id}` : `${window.location.origin}/room/${id}`);
export function previewUrl(l: ShareLink) {
  const json = JSON.stringify(l);
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `/room/${l.id}?preview=1&cfg=${b64}`;
}

function Layers({ l }: { l: ShareLink }) {
  const items: [boolean, string, typeof Mail][] = [
    [l.verifyEmail, "Email verified", Mail],
    [!!l.password, "Password", KeyRound],
    [l.nda !== "off", l.nda === "esign" ? "NDA e-signature" : "NDA accept", FileSignature],
    [l.questions.length > 0, `${l.questions.length} entry question${l.questions.length === 1 ? "" : "s"}`, ListChecks],
    [l.watermark, "Watermark", Fingerprint],
    [l.screenshot, "Screenshot shield", ShieldOff],
    [!l.download, "No downloads", Lock],
    [!l.print, "No printing", Printer],
    [!!l.expires, `Until ${l.expires ? fmtShort(l.expires) : ""}`, Timer],
    [l.allowDomains.length > 0, `Only ${l.allowDomains.join(", ")}`, Users],
    [l.blockDomains.length > 0, `Blocks ${l.blockDomains.length} domain${l.blockDomains.length === 1 ? "" : "s"}`, Users],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items
        .filter(([on]) => on)
        .map(([, label, Icon]) => (
          <span key={label} className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            <Icon size={11} /> {label}
          </span>
        ))}
    </div>
  );
}

export function LinksPanel({ room, links, folders, onSave, onRevoke, flash }: { room: Room; links: ShareLink[]; folders: string[]; onSave: (l: ShareLink) => void; onRevoke: (id: string) => void; flash: (t: string) => void }) {
  const [editing, setEditing] = useState<ShareLink | null>(null);
  const blank = (): ShareLink => ({
    id: `${room.id.replace("rm-", "")}-${Date.now().toString(36)}`,
    roomId: room.id,
    name: "",
    mode: "link",
    invited: [],
    verifyEmail: true,
    nda: "acknowledge",
    questions: [],
    watermark: true,
    screenshot: true,
    download: false,
    print: false,
    expires: room.expires,
    allowDomains: [],
    blockDomains: [],
    folders: Object.fromEntries(folders.map((f) => [f, "view" as FolderAccess])),
    welcome: `Welcome to the ${room.name} data room.`,
    created: "2026-11-24",
  });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-stone-500">One link per audience. Each has its own protections, folder access and analytics.</p>
        <ActionButton color={C} onClick={() => setEditing(blank())}>
          <Plus size={14} /> New link
        </ActionButton>
      </div>
      {links.map((l) => (
        <Card key={l.id} className={cx("p-5", l.revoked && "opacity-60")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-ink-900">{l.name}</span>
                <Pill tone={l.revoked ? "bad" : l.mode === "invite" ? "info" : "neutral"}>{l.revoked ? "Revoked" : l.mode === "invite" ? `Invite only · ${l.invited.length}` : "Anyone with the link"}</Pill>
              </div>
              <div className="mt-2">
                <Layers l={l} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-stone-500">
                {folders.map((f) => (
                  <span key={f}>
                    {f.replace(/^\d+ /, "")}: <b className={cx("font-semibold", l.folders[f] === "none" ? "text-[#9A4422]" : "text-ink-900")}>{l.folders[f] === "download" ? "download" : l.folders[f] === "none" ? "hidden" : "view"}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <a href={previewUrl(l)} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-1.5 rounded-[10px] border border-stone-300 bg-white px-3 text-[12.5px] font-semibold text-ink-900 hover:border-ink-900">
                <Eye size={14} /> Preview
              </a>
              <GhostButton onClick={() => setEditing(l)}>Edit</GhostButton>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-stone-50 px-3 py-2">
            <Link2 size={14} className="text-stone-400" />
            <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-stone-600">{linkUrl(l.id)}</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(linkUrl(l.id)).catch(() => {});
                flash("Link copied");
              }}
              className="flex items-center gap-1 text-[12px] font-semibold hover:underline"
              style={{ color: C }}
            >
              <Copy size={12} /> Copy
            </button>
            <a href={`/room/${l.id}`} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-ink-900" aria-label="Open link">
              <ExternalLink size={13} />
            </a>
            <span className="mx-1 h-4 w-px bg-stone-200" />
            <button onClick={() => onRevoke(l.id)} className="text-[12px] font-semibold text-stone-500 hover:text-[#9A4422]">
              {l.revoked ? "Restore" : "Revoke"}
            </button>
          </div>
        </Card>
      ))}
      {!links.length && <Card className="p-10 text-center text-[13px] text-stone-400">No links yet. Create one to share this room.</Card>}
      {editing && (
        <LinkEditor
          link={editing}
          folders={folders}
          isNew={!links.some((x) => x.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(l) => {
            onSave(l);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: () => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-[13px] font-medium text-ink-900">{label}</span>
        {hint && <span className="block text-[11.5px] text-stone-500">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cx("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors", on ? "" : "bg-stone-300")} style={on ? { background: C } : undefined}>
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </button>
    </label>
  );
}

function LinkEditor({ link, folders, isNew, onClose, onSave }: { link: ShareLink; folders: string[]; isNew: boolean; onClose: () => void; onSave: (l: ShareLink) => void }) {
  const [l, setL] = useState<ShareLink>(link);
  const [newQ, setNewQ] = useState("");
  const set = <K extends keyof ShareLink>(k: K, v: ShareLink[K]) => setL((x) => ({ ...x, [k]: v }));
  const list = (s: string) =>
    s
      .split(/[\s,;]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  const section = "border-t border-stone-100 pt-4";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/25" onClick={onClose}>
      <aside className="flex h-full w-[560px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label="Link settings">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-[17px] font-semibold text-ink-900">{isNew ? "New link" : "Link settings"}</h2>
          <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className={fieldLabel}>Audience name</span>
            <input value={l.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Series A investors, Buyer: Acme Corp." className={field} />
          </label>
          <div>
            <span className={fieldLabel}>Who can open it</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["link", "Anyone with the link", "Gated by the protections below"],
                  ["invite", "Invited people only", "Named email addresses"],
                ] as const
              ).map(([v, t, h]) => (
                <button key={v} type="button" onClick={() => set("mode", v)} className={cx("rounded-[12px] border p-3 text-left", l.mode === v ? "border-transparent ring-2" : "border-stone-200")} style={l.mode === v ? { ["--tw-ring-color" as string]: C } : undefined}>
                  <span className="block text-[13px] font-semibold text-ink-900">{t}</span>
                  <span className="block text-[11.5px] text-stone-500">{h}</span>
                </button>
              ))}
            </div>
            {l.mode === "invite" && (
              <textarea value={l.invited.join(", ")} onChange={(e) => set("invited", list(e.target.value))} rows={2} placeholder="name@firm.com, other@firm.com" className="mt-2 w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none" />
            )}
          </div>

          <div className={section}>
            <div className={fieldLabel}>Entry</div>
            <Toggle on={l.verifyEmail} onChange={() => set("verifyEmail", !l.verifyEmail)} label="Verify email" hint="A 6-digit code to the visitor’s inbox before entry" />
            <Toggle on={!!l.password} onChange={() => set("password", l.password ? undefined : "")} label="Password" />
            {l.password !== undefined && <input value={l.password} onChange={(e) => set("password", e.target.value)} placeholder="Shared password" className={cx(field, "mb-2")} />}
            <div className="flex items-center justify-between py-2">
              <span>
                <span className="block text-[13px] font-medium text-ink-900">NDA</span>
                <span className="block text-[11.5px] text-stone-500">Accept, or sign with full name — kept with the audit trail</span>
              </span>
              <select value={l.nda} onChange={(e) => set("nda", e.target.value as ShareLink["nda"])} className="h-8 rounded-[8px] border border-stone-300 bg-white px-2 text-[12.5px]" aria-label="NDA">
                <option value="off">Off</option>
                <option value="acknowledge">Accept</option>
                <option value="esign">E-signature</option>
              </select>
            </div>
            <div className="py-2">
              <span className="block text-[13px] font-medium text-ink-900">Entry questions</span>
              <div className="mt-1.5 space-y-1.5">
                {l.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-[8px] bg-stone-50 px-2.5 py-1.5 text-[12.5px]">
                    <span className="flex-1">{q}</span>
                    <button onClick={() => set("questions", l.questions.filter((_, j) => j !== i))} className="text-stone-400 hover:text-[#9A4422]" aria-label="Remove question">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="e.g. Are you an accredited investor?" className={field} />
                  <GhostButton
                    onClick={() => {
                      if (newQ.trim()) set("questions", [...l.questions, newQ.trim()]);
                      setNewQ("");
                    }}
                  >
                    Add
                  </GhostButton>
                </div>
              </div>
            </div>
          </div>

          <div className={section}>
            <div className={fieldLabel}>Inside the room</div>
            <Toggle on={l.watermark} onChange={() => set("watermark", !l.watermark)} label="Dynamic watermark" hint="Viewer’s email, IP and time across every page" />
            <Toggle on={l.screenshot} onChange={() => set("screenshot", !l.screenshot)} label="Screenshot protection" hint="Hides pages when the window loses focus or a capture shortcut is used; no right-click or text copy" />
            <Toggle on={l.download} onChange={() => set("download", !l.download)} label="Allow downloads" hint="Only from folders set to Download below" />
            <Toggle on={l.print} onChange={() => set("print", !l.print)} label="Allow printing" />
          </div>

          <div className={section}>
            <div className={fieldLabel}>Folder access</div>
            {folders.map((f) => (
              <div key={f} className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-ink-900">{f}</span>
                <div className="flex rounded-[8px] border border-stone-200 p-0.5">
                  {(["download", "view", "none"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => set("folders", { ...l.folders, [f]: a })}
                      className={cx("h-7 rounded-[6px] px-2.5 text-[11.5px] font-semibold", l.folders[f] === a ? "text-white" : "text-stone-500 hover:text-ink-900")}
                      style={l.folders[f] === a ? { background: a === "none" ? "#9A4422" : C } : undefined}
                    >
                      {a === "download" ? "Download" : a === "view" ? "View" : "Hidden"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={cx(section, "grid grid-cols-2 gap-3")}>
            <label>
              <span className={fieldLabel}>Expires</span>
              <input type="date" value={l.expires ?? ""} onChange={(e) => set("expires", e.target.value || undefined)} className={field} />
            </label>
            <div />
            <label>
              <span className={fieldLabel}>Only these domains</span>
              <input value={l.allowDomains.join(", ")} onChange={(e) => set("allowDomains", list(e.target.value))} placeholder="firm.com" className={field} />
            </label>
            <label>
              <span className={fieldLabel}>Block these domains</span>
              <input value={l.blockDomains.join(", ")} onChange={(e) => set("blockDomains", list(e.target.value))} placeholder="gmail.com" className={field} />
            </label>
          </div>
          <label className={cx(section, "block")}>
            <span className={fieldLabel}>Welcome message</span>
            <textarea value={l.welcome} onChange={(e) => set("welcome", e.target.value)} rows={3} className="w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none" />
          </label>
        </div>
        <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
          <a href={previewUrl(l)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12.5px] font-semibold text-stone-600 hover:text-ink-900">
            <Eye size={14} /> Preview as a visitor
          </a>
          <div className="flex gap-2">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <ActionButton color={C} disabled={!l.name.trim() || (l.mode === "invite" && !l.invited.length)} onClick={() => onSave(l)}>
              {isNew ? "Create link" : "Save"}
            </ActionButton>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ───────────────────────── analytics ───────────────────────── */

export function AnalyticsPanel({ docs }: { docs: RoomDoc[] }) {
  // Rendered only after the admin opens a room (client-side), so reading local preview activity here is safe.
  const [all] = useState(() => {
    const ids = new Set(docs.map((d) => d.id));
    return [...pageViews, ...localPageViews()].filter((v) => ids.has(v.docId));
  });
  const viewers = useMemo(() => {
    const m = new Map<string, { viewer: string; firm: string; seconds: number; docs: Set<string>; last: string }>();
    for (const v of all) {
      const r = m.get(v.viewer) ?? { viewer: v.viewer, firm: v.firm, seconds: 0, docs: new Set<string>(), last: v.at };
      r.seconds += v.seconds;
      r.docs.add(v.docId);
      if (v.at > r.last) r.last = v.at;
      m.set(v.viewer, r);
    }
    return [...m.values()].sort((a, b) => b.seconds - a.seconds);
  }, [all]);
  const byDoc = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of all) m.set(v.docId, (m.get(v.docId) ?? 0) + v.seconds);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);
  const [docId, setDocId] = useState(byDoc[0]?.[0] ?? docs[0]?.id);
  const doc = docs.find((d) => d.id === docId);
  const n = doc ? pageCount(doc.name) : 0;
  const readers = new Set(all.filter((v) => v.docId === docId).map((v) => v.viewer));
  const perPage = Array.from({ length: n }, (_, i) => {
    const vs = all.filter((v) => v.docId === docId && v.page === i + 1);
    return { page: i + 1, seconds: vs.reduce((s, v) => s + v.seconds, 0), reached: new Set(vs.map((v) => v.viewer)).size };
  });
  const max = Math.max(1, ...perPage.map((p) => p.seconds));
  const total = all.reduce((s, v) => s + v.seconds, 0);

  if (!all.length) return <Card className="p-10 text-center text-[13px] text-stone-400">No views yet. Activity appears here page by page as people read.</Card>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Viewers" value={viewers.length} />
        <Kpi label="Reading time" value={mins(total)} />
        <Kpi label="Documents opened" value={byDoc.length} note={`of ${docs.length}`} />
        <Kpi label="Most read" value={<span className="text-[15px]">{docs.find((d) => d.id === byDoc[0]?.[0])?.name.replace(/\.[a-z]+$/i, "")}</span>} />
      </div>
      <div className="grid grid-cols-[1.1fr_1fr] gap-4">
        <Card>
          <div className="px-5 pt-4 text-[14px] font-semibold text-ink-900">Who is reading</div>
          <table className="mt-2 w-full text-[12.5px]">
            <thead>
              <tr className="border-y border-stone-100">
                {["Viewer", "Documents", "Time", "Last active"].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viewers.map((v) => (
                <tr key={v.viewer} className="border-b border-stone-100">
                  <td className={td}>
                    <div className="font-medium text-ink-900">{v.viewer}</div>
                    <div className="text-[11px] text-stone-500">{v.firm || "Preview visit"}</div>
                  </td>
                  <td className={cx(td, "num text-stone-600")}>{v.docs.size}</td>
                  <td className={cx(td, "num font-semibold text-ink-900")}>{mins(v.seconds)}</td>
                  <td className={cx(td, "text-stone-600")}>{fmtDate(v.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[14px] font-semibold text-ink-900">Page by page</div>
            <select value={docId} onChange={(e) => setDocId(e.target.value)} className="h-8 max-w-[260px] rounded-[8px] border border-stone-300 bg-white px-2 text-[12px]" aria-label="Document">
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.index} {d.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[11.5px] text-stone-500">
            {readers.size} reader{readers.size === 1 ? "" : "s"} · time on each page and how many reached it
          </p>
          <ul className="mt-4 space-y-2">
            {perPage.map((p) => (
              <li key={p.page} className="grid grid-cols-[52px_1fr_92px] items-center gap-3 text-[12px]">
                <span className="text-stone-500">Page {p.page}</span>
                <div className="h-3 rounded-full bg-stone-100">
                  <div className="h-3 rounded-full" style={{ width: `${(p.seconds / max) * 100}%`, background: C, opacity: 0.35 + 0.65 * (p.seconds / max) }} />
                </div>
                <span className="num text-right text-stone-600">
                  {p.seconds ? mins(p.seconds) : "—"} · {p.reached}/{readers.size || 0}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
