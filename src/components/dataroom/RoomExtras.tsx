"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Copy, ExternalLink, Image as ImageIcon, Link2, Plus, RotateCcw, Upload, X } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { contrast } from "@/lib/brand";
import { pageCount, pageText, type PageView, type Room, type RoomDoc, type RoomSettings, type ShareLink } from "@/lib/dataroom";
import {
  ENTRY_TONES,
  addVersion,
  defaultRoomBrand,
  loadRoomBrands,
  saveRoomBrand,
  versionAt,
  versionsOf,
  type DocVersion,
  type RoomBrandOverride,
} from "@/lib/dataroom-extras";
import { Pill, field, fieldLabel } from "@/components/firm/kit";
import { COVERS, coverPosition, roomCover } from "@/lib/covers";

/* Document analytics (time per page by version), share links, and per-room branding with a live preview. */

const TODAY = "2026-11-24";
const dur = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : `0:${String(Math.round(s)).padStart(2, "0")}`);
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
const VCOL = ["var(--color-gold-500)", "var(--color-stone-400)", "var(--color-stone-300)"];

/* ───────────────────────── document analytics ───────────────────────── */

export function DocAnalytics({ room, doc, pv: allPv, onBack, flash }: { room: Room; doc: RoomDoc; pv: PageView[]; onBack: () => void; flash: (t: string) => void }) {
  const { brand } = useBrand();
  const [versions, setVersions] = useState<DocVersion[]>(() => versionsOf(doc.id, room.created));
  const [excludeInternal, setExclude] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pages = pageCount(doc.name);
  const internal = (firm: string) => !firm || firm.toLowerCase().includes(brand.name.toLowerCase());

  const pv = allPv.filter((v) => v.docId === doc.id && !(excludeInternal && internal(v.firm)));
  const current = versions[versions.length - 1].version;
  const shown = [...new Set([current, ...pv.map((v) => versionAt(versions, v.at))])].sort((a, b) => b - a).slice(0, 3);

  // seconds per page per version
  const grid = Array.from({ length: pages }, (_, i) => shown.map((ver) => pv.filter((v) => v.page === i + 1 && versionAt(versions, v.at) === ver).reduce((s, v) => s + v.seconds, 0)));
  const max = Math.max(1, ...grid.flat());

  // visits = one viewer on one day
  const visits = new Set(pv.map((v) => `${v.viewer}|${v.at.slice(0, 10)}`));
  const viewers = Object.values(
    pv.reduce<Record<string, { who: string; firm: string; s: number; pages: Set<number>; last: string; ver: number; per: number[] }>>((m, v) => {
      const r = (m[v.viewer] ??= { who: v.viewer, firm: v.firm, s: 0, pages: new Set(), last: v.at, ver: versionAt(versions, v.at), per: Array(pages).fill(0) });
      r.s += v.seconds;
      r.pages.add(v.page);
      r.per[v.page - 1] += v.seconds;
      if (v.at > r.last) {
        r.last = v.at;
        r.ver = versionAt(versions, v.at);
      }
      return m;
    }, {}),
  ).sort((a, b) => b.last.localeCompare(a.last));
  const total = pv.reduce((s, v) => s + v.seconds, 0);
  const completion = viewers.length ? viewers.reduce((s, r) => s + r.pages.size / pages, 0) / viewers.length : 0;
  const ticks = [1, 0.5, 0].map((f) => f * max);

  const upload = (f: File | undefined) => {
    const v = addVersion(doc.id, room.created, "You", f ? `Replaced with ${f.name}` : "New version", f?.name);
    setVersions(versionsOf(doc.id, room.created));
    flash(`Version ${v.version} is now what visitors see`);
  };

  return (
    <div className="px-8 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={13} /> Documents
      </button>
      <div className="mt-2 flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <div className="num text-[11.5px] font-semibold text-stone-500">
            {doc.index} · {pages} pages · version {current}
          </div>
          <h2 className="mt-0.5 truncate text-[20px] font-semibold tracking-[-0.01em] text-ink-900">{doc.name}</h2>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-stone-600">
            <button
              type="button"
              role="switch"
              aria-checked={excludeInternal}
              onClick={() => setExclude((x) => !x)}
              className={cx("relative h-[18px] w-8 rounded-full transition-colors", excludeInternal ? "bg-ink-900" : "bg-stone-300")}
            >
              <span className={cx("absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all", excludeInternal ? "left-[16px]" : "left-[2px]")} />
            </button>
            Exclude internal visits
          </label>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => (upload(e.target.files?.[0]), (e.target.value = ""))} />
          <button onClick={() => fileRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-stone-200 bg-white px-3 text-[12.5px] font-semibold text-ink-900 hover:border-stone-300">
            <Upload size={13} /> Upload new version
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-stone-200 bg-stone-200 lg:grid-cols-4">
        {[
          ["Visits", String(visits.size), "one viewer on one day"],
          ["Unique viewers", String(viewers.length), `${new Set(viewers.map((v) => v.firm)).size} firms`],
          ["Average time per visit", visits.size ? dur(total / visits.size) : "—", `${dur(total)} in total`],
          ["Completion", viewers.length ? `${Math.round(completion * 100)}%` : "—", "pages opened ÷ pages, per viewer"],
        ].map(([k, v, sub]) => (
          <div key={k} className="bg-white px-4 py-3.5">
            <div className="text-[11.5px] text-stone-500">{k}</div>
            <div className="fig num mt-1 text-[26px] leading-none text-ink-900">{v}</div>
            <div className="mt-1.5 text-[11px] text-stone-400">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* time per page */}
        <section className="rounded-[10px] border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[13px] font-semibold text-ink-900">Time on each page</h3>
            <span className="text-[11.5px] text-stone-500">minutes:seconds, all viewers</span>
            <div className="ml-auto flex items-center gap-3 text-[11.5px] text-stone-600">
              {shown.map((ver, i) => (
                <span key={ver} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: VCOL[i] }} /> Version {ver}
                  {ver === current && <span className="text-stone-400">· current</span>}
                </span>
              ))}
            </div>
          </div>
          {pv.length ? (
            <div className="relative mt-4 flex gap-3">
              <div className="flex h-[220px] flex-col justify-between pb-5 text-right text-[10.5px] text-stone-400">
                {ticks.map((t, i) => (
                  <span key={i} className="num">
                    {dur(t)}
                  </span>
                ))}
              </div>
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px]">
                  {[0, 50, 100].map((p) => (
                    <div key={p} className="absolute inset-x-0 border-t border-stone-100" style={{ top: `${p}%` }} />
                  ))}
                </div>
                <div className="relative flex h-[200px] items-end gap-2">
                  {grid.map((vals, i) => (
                    <div
                      key={i}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      className={cx("flex h-full flex-1 items-end justify-center gap-[3px] rounded-t-[3px] px-[3px]", hover === i && "bg-stone-100/70")}
                    >
                      {vals.map((s, k) => (
                        <div key={k} className="w-full max-w-[22px] rounded-t-[3px]" style={{ height: s ? `${Math.max(2, (s / max) * 100)}%` : 0, background: VCOL[k] }} />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2">
                  {grid.map((_, i) => (
                    <div key={i} className={cx("num flex-1 text-center text-[10.5px]", hover === i ? "font-semibold text-ink-900" : "text-stone-400")}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                {hover !== null && (
                  <div
                    className="pointer-events-none absolute top-2 z-10 w-[210px] rounded-[8px] border border-stone-200 bg-white p-3 text-[12px] shadow-lift"
                    style={{ left: `clamp(0px, calc(${((hover + 0.5) / pages) * 100}% - 105px), calc(100% - 210px))` }}
                  >
                    <div className="font-semibold text-ink-900">Page {hover + 1}</div>
                    {(() => {
                      const pt = pageText(doc.name, hover + 1);
                      return (
                        <div className="ws ws-light ws-bridge mt-2 h-[112px] overflow-hidden rounded-[4px] border border-black/10 bg-white px-3 py-2.5 text-[#14181D]">
                          <div className="truncate text-[8.5px] font-semibold">{pt.heading}</div>
                          {pt.body.slice(0, 3).map((line, i) => (
                            <p key={i} className="mt-1 line-clamp-3 text-[6.5px] leading-[1.35] text-[#5A6069]">
                              {line}
                            </p>
                          ))}
                        </div>
                      );
                    })()}
                    <ul className="mt-2 space-y-1">
                      {shown.map((ver, k) => (
                        <li key={ver} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-[2px]" style={{ background: VCOL[k] }} />
                          <span className="flex-1 text-stone-600">Version {ver}</span>
                          <span className="num font-semibold text-ink-900">{dur(grid[hover][k])}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-[13px] text-stone-500">{excludeInternal ? "No external visits yet." : "Not opened yet."}</p>
          )}
        </section>

        {/* versions */}
        <section className="rounded-[10px] border border-stone-200 bg-white p-4">
          <h3 className="text-[13px] font-semibold text-ink-900">Versions</h3>
          <ol className="mt-3 space-y-3">
            {[...versions].reverse().map((v) => {
              const seen = new Set(allPv.filter((x) => x.docId === doc.id && versionAt(versions, x.at) === v.version).map((x) => x.viewer)).size;
              return (
                <li key={v.version} className="flex gap-3">
                  <span className={cx("num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", v.version === current ? "bg-ink-900 text-white" : "bg-stone-100 text-stone-600")}>
                    {v.version}
                  </span>
                  <div className="min-w-0 text-[12.5px]">
                    <div className="font-medium text-ink-900">
                      {v.note}
                      {v.version === current && <span className="ml-1.5 text-[11px] font-normal text-stone-500">· shown to visitors</span>}
                    </div>
                    <div className="text-[11.5px] text-stone-500">
                      {v.by} · {when(v.at)} · {seen} {seen === 1 ? "viewer" : "viewers"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-stone-100 pt-3 text-[11.5px] leading-relaxed text-stone-500">
            Visitors always see the current version. Earlier versions stay in the audit trail with who read them.
          </p>
        </section>
      </div>

      {/* viewers */}
      <section className="mt-4 overflow-hidden rounded-[10px] border border-stone-200 bg-white">
        <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-ink-900">Viewers</h3>
          <span className="text-[11.5px] text-stone-500">Open a row to see the pages they read</span>
        </div>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100 text-left text-[11.5px] text-stone-500">
              <th className="w-8" />
              <th className="py-2 font-medium">Viewer</th>
              <th className="py-2 font-medium">Firm</th>
              <th className="py-2 font-medium">Version read</th>
              <th className="py-2 text-right font-medium">Time</th>
              <th className="py-2 text-right font-medium">Pages reached</th>
              <th className="py-2 pr-4 text-right font-medium">Last viewed</th>
            </tr>
          </thead>
          <tbody>
            {viewers.map((r) => (
              <Fragment key={r.who}>
                <tr onClick={() => setOpen(open === r.who ? null : r.who)} className="cursor-pointer border-b border-stone-100 hover:bg-stone-100/60">
                  <td className="pl-3 text-stone-400">{open === r.who ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                  <td className="py-2.5 font-medium text-ink-900">{r.who}</td>
                  <td className="py-2.5 text-stone-600">{r.firm || "Internal preview"}</td>
                  <td className="num py-2.5 text-stone-600">v{r.ver}</td>
                  <td className="num py-2.5 text-right text-ink-900">{dur(r.s)}</td>
                  <td className="num py-2.5 text-right text-stone-600">
                    {r.pages.size}/{pages}
                  </td>
                  <td className="num py-2.5 pr-4 text-right text-stone-500">{when(r.last)}</td>
                </tr>
                {open === r.who && (
                  <tr className="border-b border-stone-100 bg-stone-25">
                    <td />
                    <td colSpan={6} className="py-3 pr-4">
                      <div className="flex h-12 items-end gap-1">
                        {r.per.map((s, i) => (
                          <div key={i} title={`Page ${i + 1}: ${dur(s)}`} className="flex flex-1 flex-col items-center gap-1">
                            <div className="w-full rounded-t-[2px] bg-ink-900" style={{ height: s ? `${Math.max(8, (s / Math.max(...r.per)) * 36)}px` : 2, opacity: s ? 0.85 : 0.15 }} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-1 flex gap-1 text-[10px] text-stone-400">
                        {r.per.map((_, i) => (
                          <span key={i} className="num flex-1 text-center">
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!viewers.length && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-500">
                  No viewers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ───────────────────────── links ───────────────────────── */

const linkUrl = (id: string) => (typeof window === "undefined" ? `/room/${id}` : `${window.location.origin}/room/${id}`);

export function LinksPanel({
  links,
  settings,
  preview,
  onSave,
  onEdit,
  flash,
}: {
  links: ShareLink[];
  settings: RoomSettings;
  preview: (l: ShareLink, s: RoomSettings) => string;
  onSave: (l: ShareLink) => void;
  onEdit: () => void;
  flash: (t: string) => void;
}) {
  const status = (l: ShareLink) => (l.revoked ? "Revoked" : l.expires && l.expires < TODAY ? "Expired" : "Active");
  const copy = async (l: ShareLink) => {
    try {
      await navigator.clipboard.writeText(linkUrl(l.id));
      flash("Link copied");
    } catch {
      flash(linkUrl(l.id));
    }
  };
  return (
    <div className="px-8 py-6">
      <div className="flex items-end gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink-900">Share links</h2>
          <p className="mt-0.5 text-[12.5px] text-stone-500">Each link is one audience with its own controls. Revoking a link closes it immediately for everyone holding it.</p>
        </div>
        <button onClick={onEdit} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-ink-900 px-3 text-[12.5px] font-semibold text-white hover:opacity-90">
          <Plus size={14} /> New link
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-[10px] border border-stone-200 bg-white">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100 text-left text-[11.5px] text-stone-500">
              <th className="px-4 py-2.5 font-medium">Audience</th>
              <th className="py-2.5 font-medium">Link</th>
              <th className="py-2.5 font-medium">Controls</th>
              <th className="py-2.5 font-medium">Expires</th>
              <th className="py-2.5 font-medium">Status</th>
              <th className="py-2.5 pr-4 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {links.map((l) => {
              const st = status(l);
              const chips = [
                l.mode === "invite" ? `${l.invited.length} invited` : l.verifyEmail ? "Email verified" : "Open link",
                l.password && "Password",
                l.nda !== "off" && (l.nda === "esign" ? "NDA signature" : "NDA"),
                l.watermark && "Watermark",
                l.download ? "Download" : "View only",
              ].filter(Boolean) as string[];
              return (
                <tr key={l.id} className={cx("border-b border-stone-100 last:border-0", st !== "Active" && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{l.name}</div>
                    <div className="text-[11.5px] text-stone-500">Created {new Date(l.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </td>
                  <td className="py-3">
                    <button onClick={() => copy(l)} className="group inline-flex max-w-[260px] items-center gap-2 rounded-[6px] border border-stone-200 bg-stone-25 px-2 py-1 text-left hover:border-stone-300">
                      <Link2 size={12} className="shrink-0 text-stone-400" />
                      <span className="num truncate text-[11.5px] text-stone-600">/room/{l.id}</span>
                      <Copy size={12} className="shrink-0 text-stone-400 group-hover:text-ink-900" />
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex max-w-[340px] flex-wrap gap-1">
                      {chips.map((c) => (
                        <span key={c} className="rounded-[5px] border border-stone-200 px-1.5 py-px text-[11px] text-stone-600">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="num py-3 text-stone-600">{l.expires ? new Date(`${l.expires}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No expiry"}</td>
                  <td className="py-3">
                    <Pill tone={st === "Active" ? "good" : st === "Expired" ? "gold" : "neutral"}>{st}</Pill>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <a href={preview(l, settings)} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-stone-600 hover:bg-stone-100 hover:text-ink-900">
                        <ExternalLink size={12} /> Open as visitor
                      </a>
                      <button onClick={onEdit} className="h-7 rounded-[6px] px-2 text-[12px] font-medium text-stone-600 hover:bg-stone-100 hover:text-ink-900">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onSave({ ...l, revoked: !l.revoked });
                          flash(l.revoked ? `${l.name} reopened` : `${l.name} revoked`);
                        }}
                        className={cx("h-7 rounded-[6px] px-2 text-[12px] font-medium hover:bg-stone-100", l.revoked ? "text-ink-900" : "text-negative")}
                      >
                        {l.revoked ? "Restore" : "Revoke"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!links.length && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-500">
                  No links yet. Create one to let an audience in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── branding ───────────────────────── */

type PreviewTab = "room" | "document" | "entry";

function readImage(f: File, maxBytes: number, flash: (t: string) => void, done: (url: string) => void) {
  if (f.size > maxBytes) {
    flash(`That image is ${(f.size / 1_000_000).toFixed(1)} MB — the limit here is ${(maxBytes / 1_000_000).toFixed(1)} MB`);
    return;
  }
  const r = new FileReader();
  r.onload = () => done(String(r.result));
  r.readAsDataURL(f);
}

export function RoomBranding({ room, docs, previewHref, flash, onSaved }: { room: Room; docs: RoomDoc[]; previewHref?: string; flash: (t: string) => void; onSaved?: (banner?: string) => void }) {
  const base = useMemo(() => defaultRoomBrand(room.id, room.name), [room.id, room.name]);
  const [saved, setSaved] = useState<RoomBrandOverride | null>(() => (typeof window === "undefined" ? null : (loadRoomBrands()[room.id] ?? null)));
  const [d, setD] = useState<RoomBrandOverride>(() => saved ?? base);
  const [tab, setTab] = useState<PreviewTab>("room");
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved ?? base);
  const ratio = contrast(d.primary, "#FFFFFF");
  const tone = ENTRY_TONES.find((t) => t.id === d.entry) ?? ENTRY_TONES[1];
  const folders = [...new Set(docs.map((x) => x.folder))].slice(0, 4);
  const set = (p: Partial<RoomBrandOverride>) => setD((x) => ({ ...x, ...p }));
  const cover = roomCover(room);
  const bannerImg = d.banner ?? cover;

  const mark = (light?: boolean) =>
    d.logo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={d.logo} alt="" className="h-5 w-auto max-w-[120px] object-contain" />
    ) : (
      <span className="leading-none">
        <span className={cx("block font-serif text-[13px]", light ? "text-white" : "text-[#14181D]")}>{d.wordmark}</span>
        {d.tagline && <span className={cx("block text-[7px] font-semibold uppercase tracking-[0.2em]", light ? "text-white/70" : "text-[#6A7684]")}>{d.tagline}</span>}
      </span>
    );

  return (
    <div className="grid gap-5 px-8 py-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className="self-start rounded-[10px] border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink-900">Room branding</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">How this room looks to visitors. Anything left unchanged follows the sponsor&apos;s brand.</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={fieldLabel}>Name shown</span>
              <input className={field} value={d.wordmark} onChange={(e) => set({ wordmark: e.target.value })} />
            </label>
            <label>
              <span className={fieldLabel}>Line under the name</span>
              <input className={field} value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </label>
          </div>

          <div>
            <span className={fieldLabel}>Logo · up to 1 MB</span>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], 1_000_000, flash, (logo) => set({ logo }))} />
            <div className="flex items-center gap-2">
              <button onClick={() => logoRef.current?.click()} className="flex h-14 flex-1 items-center justify-center rounded-[8px] border border-dashed border-stone-300 bg-stone-25 hover:border-stone-400">
                {d.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.logo} alt="Room logo" className="max-h-9 max-w-[200px] object-contain" />
                ) : (
                  <span className="flex items-center gap-1.5 text-[12px] text-stone-500">
                    <Plus size={13} /> Upload logo
                  </span>
                )}
              </button>
              {d.logo && (
                <button onClick={() => set({ logo: undefined })} aria-label="Remove logo" className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <span className={fieldLabel}>Banner · at least 1920 × 320, up to 1.5 MB</span>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], 1_500_000, flash, (banner) => set({ banner }))} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => bannerRef.current?.click()}
                className="relative flex h-14 flex-1 items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-stone-300 bg-stone-25 hover:border-stone-400"
              >
                {d.banner ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.banner} alt="Room banner" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="flex items-center gap-1.5 text-[12px] text-stone-500">
                    <ImageIcon size={13} /> Upload banner
                  </span>
                )}
              </button>
              {d.banner && (
                <button onClick={() => set({ banner: undefined })} aria-label="Remove banner" className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-2 text-[11px] text-stone-500">Or choose from the library</div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {COVERS.map((c) => {
                const on = (d.banner ?? cover) === c.src;
                return (
                  <button key={c.id} onClick={() => set({ banner: c.src })} title={c.label} aria-pressed={on} className={cx("relative h-10 overflow-hidden rounded-[6px] ring-offset-1", on ? "ring-2 ring-ink-900" : "ring-1 ring-stone-200 hover:ring-stone-400")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.src} alt={c.label} style={{ objectPosition: c.position }} className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["primary", "secondary"] as const).map((k) => (
              <label key={k}>
                <span className={fieldLabel}>{k === "primary" ? "Brand colour" : "Accent line"}</span>
                <span className="flex items-center gap-2">
                  <input type="color" value={d[k]} onChange={(e) => set({ [k]: e.target.value.toUpperCase() })} className="h-9 w-10 cursor-pointer rounded-[8px] border border-stone-300 bg-white p-1" />
                  <input className={cx(field, "num uppercase")} value={d[k]} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && set({ [k]: e.target.value })} />
                </span>
              </label>
            ))}
          </div>
          <p className={cx("-mt-2 text-[11.5px]", ratio >= 4.5 ? "text-stone-500" : "text-negative")}>
            {ratio >= 4.5 ? <Check size={11} className="mr-1 inline" /> : null}
            White text on the brand colour: {ratio.toFixed(1)}:1 {ratio >= 4.5 ? "— readable" : "— too faint, choose a darker colour"}
          </p>

          <div>
            <span className={fieldLabel}>Entry page background</span>
            <div className="flex gap-2">
              {ENTRY_TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => set({ entry: t.id })}
                  aria-pressed={d.entry === t.id}
                  className={cx("flex flex-1 flex-col items-center gap-1 rounded-[8px] border p-1.5 text-[11px]", d.entry === t.id ? "border-ink-900" : "border-stone-200 hover:border-stone-300")}
                >
                  <span className="h-7 w-full rounded-[5px] border border-black/10" style={{ background: t.bg }} />
                  <span className="text-stone-600">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={fieldLabel}>Welcome text</span>
            <textarea rows={3} value={d.welcome} onChange={(e) => set({ welcome: e.target.value })} className={cx(field, "h-auto py-2 leading-relaxed")} />
            <span className="mt-1 block text-[11px] text-stone-400">Used when a link has no welcome text of its own.</span>
          </label>
        </div>
        <div className="flex items-center gap-2 border-t border-stone-100 px-5 py-3">
          <button
            disabled={!dirty}
            onClick={() => {
              saveRoomBrand(room.id, d);
              setSaved(d);
              onSaved?.(d.banner);
              flash("Branding saved — visitors see it on their next visit");
            }}
            className="inline-flex h-8 items-center rounded-[8px] bg-ink-900 px-3.5 text-[12.5px] font-semibold text-white enabled:hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={() => {
              saveRoomBrand(room.id, null);
              setSaved(null);
              onSaved?.(undefined);
              setD(base);
              flash("Back to the sponsor's brand");
            }}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 text-[12.5px] font-medium text-stone-600 hover:bg-stone-100 hover:text-ink-900"
            title="Go back to the sponsor's brand"
          >
            <RotateCcw size={13} /> Reset
          </button>
          {previewHref && (
            <a href={previewHref} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-stone-600 hover:text-ink-900">
              Open as visitor <ExternalLink size={12} />
            </a>
          )}
        </div>
      </section>

      {/* live preview — drawn in the visitor's own colours, not the console theme */}
      <section className="min-w-0 rounded-[10px] border border-stone-200 bg-white">
        <div className="flex items-center gap-1 border-b border-stone-100 p-1.5">
          {(
            [
              ["room", "Room view"],
              ["document", "Document view"],
              ["entry", "Entry page"],
            ] as [PreviewTab, string][]
          ).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={cx("flex-1 rounded-[6px] py-1.5 text-[12.5px] font-medium", tab === id ? "bg-stone-100 text-ink-900" : "text-stone-500 hover:text-ink-900")}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex justify-center bg-stone-100 p-6">
          <div className="ws ws-light ws-bridge w-full max-w-[720px] overflow-hidden rounded-[8px] border border-black/10 bg-white text-[#14181D] shadow-lift">
            <div className="flex items-center gap-1.5 border-b border-black/5 bg-[#F4F4F2] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-black/15" />
              <span className="h-2 w-2 rounded-full bg-black/15" />
              <span className="h-2 w-2 rounded-full bg-black/15" />
              <span className="mx-auto rounded-[4px] bg-white px-3 py-0.5 text-[10px] text-[#6A7684]">/room/…</span>
            </div>

            {tab === "room" && (
              <div className="h-[380px]">
                <div className="relative h-[110px] overflow-hidden" style={{ background: d.primary }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerImg} alt="" style={{ objectPosition: coverPosition(bannerImg) }} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: d.secondary }} />
                  <div className="relative flex h-full flex-col justify-between p-4">
                    {mark(true)}
                    <div>
                      <div className="text-[15px] font-semibold text-white">{room.name}</div>
                      <div className="text-[10px] text-white/75">Updated today</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 p-4">
                  <ul className="space-y-1.5 text-[11px] text-[#5A6069]">
                    {folders.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <ChevronRight size={10} /> {f.replace(/^\d+ /, "")}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {docs.slice(0, 5).map((x) => (
                      <li key={x.id} className="flex items-center justify-between rounded-[5px] border border-black/10 px-2.5 py-1.5 text-[11px]">
                        <span className="truncate">{x.name}</span>
                        <span className="shrink-0 text-[10px] text-[#8A8F96]">{x.name.split(".").pop()?.toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === "document" && (
              <div className="h-[380px] bg-[#F4F2EE]">
                <div className="relative flex h-10 items-center gap-3 border-b border-black/10 bg-white px-3">
                  <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: d.secondary }} />
                  {mark()}
                  <span className="h-4 w-px bg-black/10" />
                  <span className="truncate text-[11px] font-semibold">{docs[0]?.name ?? room.name}</span>
                  <span className="ml-auto rounded-[4px] px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: d.primary }}>
                    Ask a question
                  </span>
                </div>
                <div className="flex justify-center p-5">
                  <div className="relative h-[290px] w-[220px] bg-white p-5 shadow-sm">
                    <div className="h-2 w-3/4 rounded bg-black/15" />
                    {Array.from({ length: 9 }, (_, i) => (
                      <div key={i} className="mt-2.5 h-1.5 rounded bg-black/[0.07]" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
                    ))}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-black/10 [transform:rotate(-28deg)]">visitor@firm.com · today</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "entry" && (
              <div className="grid h-[380px] grid-cols-[42%_1fr]">
                <div className="relative overflow-hidden" style={{ background: d.primary }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerImg} alt="" style={{ objectPosition: coverPosition(bannerImg) }} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                  <div className="relative flex h-full flex-col justify-between p-5">
                    {mark(true)}
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">{room.purpose}</div>
                      <div className="mt-1 text-[16px] font-semibold leading-tight text-white">{room.name}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center p-6" style={{ background: tone.bg, color: tone.fg }}>
                  <div className="w-full max-w-[230px]">
                    <div className="text-[14px] font-semibold">Enter the data room</div>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed opacity-70">{d.welcome}</p>
                    <div className="mt-4 h-8 rounded-[6px] border px-2.5 text-[10.5px] leading-8 opacity-60" style={{ borderColor: "currentColor" }}>
                      you@firm.com
                    </div>
                    <div className="mt-2 h-8 rounded-[6px] text-center text-[11px] font-semibold leading-8 text-white" style={{ background: d.primary }}>
                      Continue
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
