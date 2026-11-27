"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ImageUp, RotateCcw, Search, X } from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo, AurumMark } from "./Logo";
import { useBrand } from "./BrandProvider";
import { EntranceBackdrop } from "@/components/auth/AuthShell";
import { EntrancesEditor } from "./EntrancesEditor";
import { entranceById, resolveLook } from "@/lib/entrances";
import { gpById } from "@/lib/gps";
import { GpLogo } from "./GpLogo";
import { AMBIENT_MOTIONS, AURUM, MODULE_DEFAULTS, PRESETS, SANS, SERIF, contrast, hexOk, moduleName, type Brand } from "@/lib/brand";
import type { FirmId } from "@/lib/firm-colors";

/* Brand & white label: one place where a B2B client makes the platform theirs. Every change previews live
   across the whole interface; Publish keeps it. */

const field = "h-10 w-full rounded-[8px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none";
const lab = "mb-1.5 block text-[11.5px] font-semibold text-stone-600";

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-stone-200 bg-white p-6 shadow-card">
      <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
      {sub && <p className="mt-0.5 text-[12.5px] text-stone-500">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Swatch({ label, value, onChange, note }: { label: string; value: string; onChange: (v: string) => void; note?: ReactNode }) {
  const [text, setText] = useState(value);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(value);
  }, [value]);
  return (
    <div>
      <span className={lab}>{label}</span>
      <div className="flex h-10 items-center gap-2 rounded-[8px] border border-stone-300 bg-white pl-1.5 pr-3 focus-within:border-ink-900">
        <input
          type="color"
          value={hexOk(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-7 w-8 cursor-pointer rounded-[5px] border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (hexOk(e.target.value)) onChange(e.target.value.toUpperCase());
          }}
          className="num w-full bg-transparent text-[13px] uppercase text-ink-900 focus:outline-none"
        />
      </div>
      {note && <div className="mt-1 text-[11px]">{note}</div>}
    </div>
  );
}

function Contrast({ a, b, min = 4.5 }: { a: string; b: string; min?: number }) {
  const r = contrast(a, b);
  const ok = r >= min;
  return <span className={ok ? "text-[#1F6F44]" : "text-[#9A4422]"}>{`${r.toFixed(1)}:1 ${ok ? "readable" : "too low for text"}`}</span>;
}

function Upload({ label, value, onChange, dark }: { label: string; value?: string; onChange: (v?: string) => void; dark?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <span className={lab}>{label}</span>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/svg+xml,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (f.size > 600_000) return setErr("Keep the file under 600 KB — SVG or a trimmed PNG works best.");
          setErr(null);
          const r = new FileReader();
          r.onload = () => onChange(String(r.result));
          r.readAsDataURL(f);
        }}
      />
      <div className={cx("flex h-24 items-center justify-center rounded-[10px] border border-dashed px-4", dark ? "border-white/20 bg-ink-900" : "border-stone-300 bg-stone-25")}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="max-h-14 max-w-full object-contain" />
        ) : (
          <button onClick={() => ref.current?.click()} className={cx("flex flex-col items-center gap-1 text-[12px]", dark ? "text-white/70" : "text-stone-500")}>
            <ImageUp size={18} /> Upload SVG or PNG
          </button>
        )}
      </div>
      <div className="mt-1.5 flex gap-3 text-[11.5px]">
        {value && (
          <>
            <button onClick={() => ref.current?.click()} className="font-semibold text-ink-900 hover:underline">
              Replace
            </button>
            <button onClick={() => onChange(undefined)} className="font-semibold text-stone-500 hover:text-[#9A4422]">
              Remove
            </button>
          </>
        )}
        {err && <span className="text-[#9A4422]">{err}</span>}
      </div>
    </div>
  );
}

export function BrandStudio() {
  const { published: saved, preview, save, reset } = useBrand();
  const [d, setD] = useState<Brand>(saved);
  const [flash, setFlash] = useState<string | null>(null);
  const [door, setDoor] = useState("firm");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setD(saved);
    // only when the saved brand changes (first load, publish, reset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.id, saved.name]);
  // Live preview across the whole page while editing; leaving without publishing restores the saved brand.
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);
  useEffect(() => () => preview(savedRef.current), [preview]);
  const set = (b: Brand) => {
    setD(b);
    preview(b);
  };
  const up = <K extends keyof Brand>(k: K, v: Brand[K]) => set({ ...d, [k]: v });
  const col = (k: keyof Brand["colors"], v: string) => set({ ...d, colors: { ...d.colors, [k]: v } });
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const toast = (t: string) => {
    setFlash(t);
    setTimeout(() => setFlash(null), 2400);
  };

  return (
    <div className="pb-28">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-ink-900">Brand & white label</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-stone-600">
            Everything your clients see — sign-in, portals, data rooms, the formation form and every workspace — takes the name, logo, colours and type set here. Changes preview
            live on this page until you publish.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <Section title="Start from" sub="Load a complete brand, then adjust. The two below Aurum are fictional examples.">
            <div className="grid gap-3 sm:grid-cols-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => set({ ...p })}
                  className={cx(
                    "rounded-[12px] border p-3 text-left transition-shadow hover:shadow-card",
                    d.id === p.id ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-200",
                  )}
                >
                  <div className="flex h-16 items-center gap-2 rounded-[8px] px-3" style={{ background: p.colors.canvas }}>
                    <AurumMark size={22} shape={p.mark} color={p.colors.accent} />
                    <span className="font-serif text-[15px] uppercase tracking-[0.06em]" style={{ color: p.colors.ink, fontFamily: SERIF[p.fonts.serif].stack }}>
                      {p.name}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[p.colors.ink, p.colors.accent, p.colors.metal, ...Object.values(p.modules)].map((c, i) => (
                      <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-2 text-[12px] font-semibold text-ink-900">{p.legalName}</div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Identity" sub="Names and contact details shown across the platform and in every email.">
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Short name", "Used in sentences: “Speak to a Northbridge officer”"],
                  ["legalName", "Legal name", "Footers, agreements and the NDA"],
                  ["tagline", "Tagline under the name", "Shown when no logo is uploaded"],
                  ["domain", "Domain", "Client links and sender addresses"],
                  ["supportEmail", "Support email", ""],
                  ["city", "Head office", ""],
                ] as const
              ).map(([k, l, h]) => (
                <label key={k} className="block">
                  <span className={lab}>{l}</span>
                  <input value={d[k]} onChange={(e) => up(k, e.target.value)} className={field} />
                  {h && <span className="mt-1 block text-[11px] text-stone-500">{h}</span>}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Logo" sub="Upload both versions of the logo: one for light backgrounds, one for dark.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Upload label="Logo for light backgrounds" value={d.logo} onChange={(v) => up("logo", v)} />
              <Upload label="Logo for dark backgrounds" value={d.logoLight} onChange={(v) => up("logoLight", v)} dark />
            </div>
          </Section>

          <Section title="Colours" sub="Six colours drive every screen. Contrast is checked against the text that sits on each one.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Swatch label="Ink — text and dark surfaces" value={d.colors.ink} onChange={(v) => col("ink", v)} note={<Contrast a={d.colors.ink} b={d.colors.canvas} />} />
              <Swatch label="Accent — buttons and mark" value={d.colors.accent} onChange={(v) => col("accent", v)} />
              <Swatch label="Text on accent" value={d.colors.accentInk} onChange={(v) => col("accentInk", v)} note={<Contrast a={d.colors.accentInk} b={d.colors.accent} />} />
              <Swatch label="Metal — rules and highlights" value={d.colors.metal} onChange={(v) => col("metal", v)} />
              <Swatch label="Canvas — page background" value={d.colors.canvas} onChange={(v) => col("canvas", v)} />
              <Swatch label="Surface — cards" value={d.colors.surface} onChange={(v) => col("surface", v)} note={<Contrast a={d.colors.ink} b={d.colors.surface} />} />
            </div>
          </Section>

          <Section title="Workspace colours" sub="Each firm workspace is recognised by its colour alone on the hub. Keep them distinct from each other.">
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(d.modules) as FirmId[]).map((k) => (
                <Swatch
                  key={k}
                  label={moduleName(d, k)}
                  value={d.modules[k]}
                  onChange={(v) => set({ ...d, modules: { ...d.modules, [k]: v } })}
                  note={<Contrast a="#FFFFFF" b={d.modules[k]} min={3} />}
                />
              ))}
            </div>
          </Section>

          <Section title="Module names" sub="What your team calls each firm workspace. Shown in navigation, notifications and menus. Leave blank to use the default.">
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(MODULE_DEFAULTS) as FirmId[]).map((k) => (
                <label key={k} className="block">
                  <span className={lab}>{MODULE_DEFAULTS[k]}</span>
                  <input
                    value={d.moduleNames?.[k] ?? ""}
                    placeholder={MODULE_DEFAULTS[k]}
                    maxLength={28}
                    onChange={(e) => set({ ...d, moduleNames: { ...d.moduleNames, [k]: e.target.value } })}
                    className={field}
                  />
                </label>
              ))}
            </div>
          </Section>

          <Section
            title="Ambient motion"
            sub="The default atmosphere of the ecosystem hub for everyone in your firm. Each user can still switch motion off for themselves, and the device's reduced-motion setting always wins."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {AMBIENT_MOTIONS.map((m) => (
                <label
                  key={m.id}
                  className={cx(
                    "flex cursor-pointer gap-3 rounded-[10px] border p-3",
                    (d.ambientMotion ?? "ambient") === m.id ? "border-ink-900 bg-stone-25" : "border-stone-200 hover:border-stone-300",
                  )}
                >
                  <input
                    type="radio"
                    name="ambient-motion"
                    checked={(d.ambientMotion ?? "ambient") === m.id}
                    onChange={() => set({ ...d, ambientMotion: m.id })}
                    className="mt-0.5 accent-[var(--tenant-ink)]"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-ink-900">{m.label}</span>
                    <span className="block text-[12px] text-stone-600">{m.about}</span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Typography" sub="A serif for headings and figures of note, a sans for everything else.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={lab}>Headings</span>
                <select value={d.fonts.serif} onChange={(e) => set({ ...d, fonts: { ...d.fonts, serif: e.target.value as Brand["fonts"]["serif"] } })} className={field}>
                  {Object.entries(SERIF).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-[22px] text-ink-900" style={{ fontFamily: SERIF[d.fonts.serif].stack }}>
                  Formed properly.
                </span>
              </label>
              <label className="block">
                <span className={lab}>Body</span>
                <select value={d.fonts.sans} onChange={(e) => set({ ...d, fonts: { ...d.fonts, sans: e.target.value as Brand["fonts"]["sans"] } })} className={field}>
                  {Object.entries(SANS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-[14px] text-stone-600" style={{ fontFamily: SANS[d.fonts.sans].stack }}>
                  Capital call 3 of 4 is due on 15 December 2026.
                </span>
              </label>
            </div>
          </Section>

          <Section
            title="Entrances"
            sub="Every door into the platform has its own look: a picture or background, and its own words. Doors you leave alone inherit their group’s default, and the defaults inherit the console sign-in."
          >
            <EntrancesEditor d={d} set={set} selected={door} onSelect={setDoor} />
          </Section>

          <Section title="Legal" sub="Footer line and the documents linked from every public page.">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-3">
                <span className={lab}>Footer line</span>
                <input value={d.legal.footer} onChange={(e) => set({ ...d, legal: { ...d.legal, footer: e.target.value } })} className={field} />
              </label>
              <label className="block">
                <span className={lab}>Privacy notice URL</span>
                <input value={d.legal.privacyUrl} onChange={(e) => set({ ...d, legal: { ...d.legal, privacyUrl: e.target.value } })} className={field} />
              </label>
              <label className="block">
                <span className={lab}>Terms URL</span>
                <input value={d.legal.termsUrl} onChange={(e) => set({ ...d, legal: { ...d.legal, termsUrl: e.target.value } })} className={field} />
              </label>
            </div>
          </Section>
        </div>

        {/* preview */}
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-500">Preview</div>
          <div className="overflow-hidden rounded-[14px] border border-stone-200 shadow-card" style={{ background: d.colors.canvas }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <AurumLogo height={24} />
              <div className="ml-auto flex h-8 flex-1 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-[11px] text-stone-400">
                <Search size={12} /> Search
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: d.colors.ink, color: d.colors.accent }}>
                L
              </span>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <div className="rounded-[10px] p-4" style={{ background: d.colors.surface }}>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: d.colors.metal }}>
                  Capital account
                </div>
                <div className="mt-1 font-serif text-[22px]" style={{ color: d.colors.ink }}>
                  $4,250,000
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-stone-100">
                  <div className="h-1.5 w-2/3 rounded-full" style={{ background: d.colors.metal }} />
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-[6px] px-3 py-1.5 text-[11.5px] font-semibold" style={{ background: d.colors.accent, color: d.colors.accentInk }}>
                    Approve
                  </span>
                  <span className="rounded-[6px] border px-3 py-1.5 text-[11.5px] font-semibold" style={{ borderColor: d.colors.ink, color: d.colors.ink }}>
                    Details
                  </span>
                </div>
              </div>
              <div className="flex justify-between rounded-[10px] px-4 py-3" style={{ background: d.colors.surface }}>
                {(Object.keys(d.modules) as FirmId[]).map((k) => (
                  <span key={k} className="flex flex-col items-center gap-1 text-[9.5px] text-stone-500">
                    <AurumMark size={18} shape={d.mark} color={d.modules[k]} />
                    {moduleName(d, k)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-500">Entrance · {entranceById(d, door)?.name}</div>
          <EntrancePreview d={d} door={door} />
          <p className="text-[11.5px] leading-relaxed text-stone-500">
            In production each client’s brand is tied to their own domain, so <span className="num">portal.{d.domain}</span> opens with it automatically. GP portals and data rooms
            keep their own sponsor branding on top.
          </p>
        </aside>
      </div>

      {/* publish bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-8 py-3">
          <span className="text-[12.5px] text-stone-600">{dirty ? "Previewing unpublished changes" : `Live: ${saved.legalName}`}</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                reset();
                setD(AURUM);
                toast("Restored the Aurum brand");
              }}
              className="flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-[12.5px] font-semibold text-stone-600 hover:text-ink-900"
            >
              <RotateCcw size={13} /> Restore Aurum
            </button>
            <button
              disabled={!dirty}
              onClick={() => set(saved)}
              className="flex h-9 items-center gap-1.5 rounded-[9px] border border-stone-300 px-3 text-[12.5px] font-semibold text-ink-900 disabled:opacity-40"
            >
              <X size={13} /> Discard
            </button>
            <button
              disabled={!dirty || !d.name.trim()}
              onClick={() => {
                toast(
                  save(d)
                    ? `${d.name} is now live across the platform`
                    : "Not published: the pictures are too large for this browser’s storage. Remove one or use smaller pictures.",
                );
              }}
              className="flex h-9 items-center gap-1.5 rounded-[9px] px-4 text-[12.5px] font-semibold disabled:opacity-40"
              style={{ background: d.colors.accent, color: d.colors.accentInk }}
            >
              <Check size={13} /> Publish
            </button>
          </div>
        </div>
      </div>
      {flash && <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-[12px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">{flash}</div>}
    </div>
  );
}

/** A small version of the selected entrance, in its resolved look. */
function EntrancePreview({ d, door }: { d: Brand; door: string }) {
  const look = resolveLook(d, door);
  const e = entranceById(d, door);
  const gp = e?.gpId ? gpById(e.gpId) : undefined;
  const dark = look.backdrop !== "field";
  return (
    <div className="relative isolate h-[240px] overflow-hidden rounded-[14px] border border-stone-200 text-white shadow-card">
      <div className="absolute inset-0 -z-10">
        <EntranceBackdrop brand={d} look={look} tone="dark" still field={gp ? { ink: gp.brand.primary, accent: gp.brand.secondary } : undefined} />
      </div>
      <div className="absolute inset-0 -z-10 bg-black/25" />
      <div className="p-4">{gp ? <GpLogo gp={gp} height={20} tone="dark" /> : <AurumLogo variant="white" height={22} />}</div>
      <div className="absolute bottom-4 left-4 max-w-[190px]">
        <div className="text-[9.5px] font-medium text-white/80">{look.eyebrow}</div>
        <div className="mt-1 font-serif text-[21px] leading-tight">{look.headline}</div>
        <div className="mt-1 line-clamp-2 text-[9.5px] leading-snug text-white/75">{look.text}</div>
      </div>
      <div className="absolute bottom-4 right-4 w-[140px] rounded-[8px] bg-white/95 p-3 text-ink-900">
        <div className="font-serif text-[11.5px] leading-snug">{e?.org ? e.name : gp ? gp.shortName : d.legalName}</div>
        <div className="mt-2 h-5 rounded-[3px] border border-stone-300" />
        <div
          className="mt-2 h-6 rounded-[3px] text-center text-[9.5px] font-semibold leading-6"
          style={gp ? { background: gp.brand.primary, color: gp.brand.primaryInk } : { background: d.colors.accent, color: d.colors.accentInk }}
        >
          Continue
        </div>
      </div>
      {!dark && <span className="sr-only">Brand field</span>}
    </div>
  );
}
