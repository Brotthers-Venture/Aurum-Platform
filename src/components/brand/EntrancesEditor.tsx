"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ExternalLink, ImageUp, RotateCcw } from "lucide-react";
import { cx } from "@/components/ui";
import type { Brand, LoginBackdrop } from "@/lib/brand";
import { entrances, ownLook, resolveLook, type Entrance, type EntranceGroup, type EntranceLook } from "@/lib/entrances";
import { gpById } from "@/lib/gps";

const field = "h-10 w-full rounded-[8px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none";
const lab = "mb-1.5 block text-[11.5px] font-semibold text-stone-600";
const GROUPS: { g: EntranceGroup; about: string }[] = [
  { g: "Firm", about: "Your own team" },
  { g: "Investors", about: "A default, and one per manager" },
  { g: "Clients", about: "A default, and one per client company" },
  { g: "Solutions", about: "One per solution" },
];

/** Shrinks a photograph in the browser (longest side 1920px, JPEG) so several entrances fit in storage. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => {
      const i = new window.Image();
      i.onload = () => ok(i);
      i.onerror = bad;
      i.src = url;
    });
    const k = Math.min(1, 1920 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A small swatch of each backdrop, in the brand's own colours. */
function Thumb({ kind, brand, image, gpId }: { kind: LoginBackdrop | "inherit"; brand: Brand; image?: string; gpId?: string }) {
  const gp = gpId ? gpById(gpId) : undefined;
  const ink = gp?.brand.primary ?? brand.colors.ink;
  const accent = gp?.brand.secondary ?? brand.colors.accent;
  if (kind === "image")
    return image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" className="h-full w-full object-cover" />
    ) : (
      <span className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400">
        <ImageUp size={18} />
      </span>
    );
  if (kind === "gold") return <Image src="/brand/login-bg.jpg" alt="" fill sizes="120px" className="object-cover" />;
  if (kind === "ink")
    return (
      <span className="block h-full w-full" style={{ background: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, ${brand.colors.metal} 45%, ${ink}) 0%, ${ink} 60%)` }} />
    );
  if (kind === "stone")
    return (
      <span
        className="block h-full w-full"
        style={{ background: `radial-gradient(120% 90% at 70% 30%, ${accent} 0%, color-mix(in oklab, ${ink} 70%, ${brand.colors.canvas}) 70%)` }}
      />
    );
  return (
    <span className="block h-full w-full" style={{ background: `radial-gradient(90% 80% at 75% 30%, color-mix(in oklab, ${accent} 45%, ${ink}) 0%, ${ink} 65%)` }}>
      <span className="block h-full w-full opacity-30" style={{ backgroundImage: `repeating-linear-gradient(60deg, transparent 0 14px, ${accent}22 14px 15px)` }} />
    </span>
  );
}

const BACKDROPS: [LoginBackdrop, string][] = [
  ["field", "Brand field"],
  ["gold", "Gold photograph"],
  ["ink", "Ink"],
  ["stone", "Accent glow"],
  ["image", "Your picture"],
];

/**
 * Every entrance into the platform, organised by who comes through it. Each door can have its own picture and
 * words; a door left alone inherits its group's default, and the defaults inherit the console sign-in.
 */
export function EntrancesEditor({ d, set, selected, onSelect }: { d: Brand; set: (b: Brand) => void; selected: string; onSelect: (id: string) => void }) {
  const list = entrances(d);
  const door = list.find((e) => e.id === selected) ?? list[0];
  const own = ownLook(d, door.id);
  const look = resolveLook(d, door.id);
  const parent = door.parent ? list.find((e) => e.id === door.parent) : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isFirm = door.id === "firm";
  const custom = (e: Entrance) => {
    if (e.id === "firm") return true;
    const l = d.entrances?.[e.id];
    return !!l && Object.values(l).some((v) => v !== undefined && v !== "");
  };

  const write = (patch: EntranceLook) => {
    if (isFirm) {
      set({ ...d, login: { ...d.login, ...(patch as Partial<Brand["login"]>) } });
      return;
    }
    const next: EntranceLook = { ...own, ...patch };
    for (const k of Object.keys(next) as (keyof EntranceLook)[]) if (next[k] === undefined || next[k] === "") delete next[k];
    const all = { ...d.entrances };
    if (Object.keys(next).length) all[door.id] = next;
    else delete all[door.id];
    set({ ...d, entrances: all });
  };
  const reset = () => {
    const all = { ...d.entrances };
    delete all[door.id];
    set({ ...d, entrances: all });
  };

  const chosen: LoginBackdrop | "inherit" = own.backdrop ?? (isFirm ? "field" : "inherit");
  const options: [LoginBackdrop | "inherit", string][] = isFirm ? BACKDROPS : [["inherit", door.gpId ? "Manager’s colours" : `Same as ${parent?.name ?? "default"}`], ...BACKDROPS];

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      {/* the doors */}
      <nav aria-label="Entrances" className="max-h-[620px] overflow-y-auto rounded-[12px] border border-stone-200 p-1.5">
        {GROUPS.map(({ g, about }) => (
          <div key={g} className="mb-1">
            <div className="px-2.5 pb-1 pt-2.5">
              <div className="text-[12px] font-semibold text-ink-900">{g}</div>
              <div className="text-[11px] text-stone-500">{about}</div>
            </div>
            {list
              .filter((e) => e.group === g)
              .map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelect(e.id)}
                  aria-current={e.id === door.id ? "true" : undefined}
                  className={cx(
                    "flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left text-[12.5px]",
                    e.id === door.id ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50 hover:text-ink-900",
                    e.parent && e.parent !== "firm" && "pl-5",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{e.name}</span>
                  {custom(e) && e.id !== "firm" && <span aria-label="Own look" title="Own look" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tenant-accent)]" />}
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* the selected door */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11.5px] text-stone-500">{door.group}</div>
            <h3 className="text-[17px] font-semibold text-ink-900">{door.name}</h3>
            <p className="mt-0.5 text-[12.5px] text-stone-500">
              {door.who} · <span className="font-mono text-[11.5px]">{door.path}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12.5px]">
            {!isFirm && custom(door) && (
              <button type="button" onClick={reset} className="flex items-center gap-1 font-semibold text-stone-500 hover:text-ink-900">
                <RotateCcw size={12} /> Inherit everything
              </button>
            )}
            <a href={door.path} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-ink-900 hover:underline">
              Open <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="mt-5">
          <span className={lab}>Background</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {options.map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={chosen === k}
                onClick={() => {
                  setErr(null);
                  if (k === "image" && !(isFirm ? d.login.image : own.image)) fileRef.current?.click();
                  write(k === "inherit" ? { backdrop: undefined } : { backdrop: k });
                }}
                className={cx("rounded-[10px] border p-1 text-left", chosen === k ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-200 hover:border-stone-400")}
              >
                <span className="relative block h-14 overflow-hidden rounded-[7px]">
                  {k === "inherit" ? (
                    <Thumb kind={look.backdrop === "image" && !own.backdrop ? "image" : !own.backdrop ? look.backdrop : "field"} image={look.image} brand={d} gpId={door.gpId} />
                  ) : (
                    <Thumb kind={k} image={isFirm ? d.login.image : own.image} brand={d} gpId={door.gpId} />
                  )}
                </span>
                <span className="mt-1 block truncate px-0.5 text-[11px] font-medium text-ink-900">{label}</span>
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 15_000_000) return setErr("Choose a picture under 15 MB.");
              setBusy(true);
              try {
                const img = await shrink(f);
                write({ backdrop: "image", image: img });
              } catch {
                setErr("That file couldn’t be read as a picture.");
              } finally {
                setBusy(false);
              }
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
            {(chosen === "image" || (isFirm && d.login.backdrop === "image")) && (
              <button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-ink-900 hover:underline">
                {busy ? "Preparing the picture…" : (isFirm ? d.login.image : own.image) ? "Replace picture" : "Upload a picture"}
              </button>
            )}
            {chosen === "inherit" && (
              <span className="text-stone-500">{look.from ? `Showing ${look.from}’s background.` : door.gpId ? "Showing the manager’s colours." : "Showing the brand field."}</span>
            )}
            <span className="text-stone-500">Landscape photographs work best; they are resized to 1920px. Text sits on the left, so keep the subject on the right.</span>
            {err && <span className="text-[#9A4422]">{err}</span>}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {(
            [
              ["eyebrow", "Line above the headline", 60],
              ["headline", "Headline", 60],
              ["text", "Statement", 220],
            ] as const
          ).map(([k, label, max]) => {
            const value = isFirm ? d.login[k] : (own[k] ?? "");
            const placeholder = isFirm ? "" : resolveLook({ ...d, entrances: { ...d.entrances, [door.id]: { ...own, [k]: undefined } } }, door.id)[k];
            return (
              <label key={k} className="block">
                <span className={lab}>
                  {label}
                  {!isFirm && !own[k] && <span className="ml-1.5 font-normal text-stone-400">inherited</span>}
                </span>
                {k === "text" ? (
                  <textarea
                    value={value}
                    placeholder={placeholder}
                    maxLength={max}
                    rows={2}
                    onChange={(e) => write({ [k]: e.target.value })}
                    className="w-full resize-none rounded-[8px] border border-stone-300 px-3 py-2 text-[13px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none"
                  />
                ) : (
                  <input value={value} placeholder={placeholder} maxLength={max} onChange={(e) => write({ [k]: e.target.value })} className={field} />
                )}
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-stone-500">
          {isFirm
            ? "The console sign-in is the base: the investor, client and solution defaults inherit from it until you change them."
            : "Leave a field empty to inherit it. Changes preview on the right; publish to put them on the live entrance."}
        </p>
      </div>
    </div>
  );
}
