import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { GpMark } from "@/components/brand/GpLogo";
import { cx } from "@/components/ui";
import type { GpClient } from "@/lib/gps";
import type { Offering } from "@/lib/offerings";

/* ---------- deterministic generative cover in the GP's colours ---------- */

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}

const hex = (cx: number, cy: number, r: number, rot = 0) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 90 + rot) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

export function FundCover({ id, primary, secondary, className }: { id: string; primary: string; secondary: string; className?: string }) {
  const r = rng(id);
  const W = 400;
  const H = 180;
  const gx = 60 + r() * 280;
  const gy = 20 + r() * 140;
  const prisms = Array.from({ length: 4 }, (_, i) => ({ x: 40 + r() * 320, y: 20 + r() * 140, s: 26 + r() * 70 + i * 6, rot: r() * 30 - 15, o: 0.1 + r() * 0.22 }));
  const uid = id.replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(primary, -0.35)} />
          <stop offset="0.55" stopColor={primary} />
          <stop offset="1" stopColor={shade(primary, 0.18)} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor={secondary} stopOpacity="0.75" />
          <stop offset="1" stopColor={secondary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={`url(#bg-${uid})`} />
      <circle cx={gx} cy={gy} r={150} fill={`url(#glow-${uid})`} />
      {prisms.map((p, i) => (
        <g key={i} opacity={0.9}>
          <polygon points={hex(p.x, p.y, p.s, p.rot)} fill={`url(#face-${uid})`} fillOpacity={p.o * 2} />
          <polygon points={hex(p.x, p.y, p.s, p.rot)} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1} />
          <polygon points={hex(p.x, p.y, p.s * 0.72, p.rot)} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={1} />
        </g>
      ))}
      <rect width={W} height={H} filter={`url(#grain-${uid})`} />
      <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.28" />
      </linearGradient>
      <rect width={W} height={H} fill={`url(#fade-${uid})`} />
    </svg>
  );
}

/* ---------- card ---------- */

export function FundCard({
  fund,
  gp,
  offering,
  terms,
  href,
  action,
  footer,
}: {
  fund: { id: string; name: string };
  gp: GpClient;
  offering: Offering;
  terms: [string, string][];
  href?: string;
  action?: ReactNode;
  footer?: ReactNode;
}) {
  const logo = gp.logoDark ?? null;
  const body = (
    <>
      <div className="relative h-[168px] overflow-hidden">
        {offering.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offering.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <FundCover id={fund.id} primary={gp.brand.primary} secondary={gp.brand.secondary} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.04]" />
        )}
        {offering.badge && <span className="absolute left-3 top-3 rounded-[4px] bg-white/95 px-2 py-[3px] text-[11px] font-semibold text-ink-900 shadow-sm">{offering.badge}</span>}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <div className="text-[28px] font-semibold leading-none tracking-[0.02em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">{offering.code}</div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-white/85">
            by
            {logo ? (
              <Image src={logo.src} alt={gp.shortName} width={Math.round((14 * logo.width) / logo.height)} height={14} className="h-[14px] w-auto" />
            ) : (
              <span className="font-semibold uppercase tracking-[0.14em]">{gp.shortName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white">
            <GpMark gp={gp} size={22} />
          </span>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold leading-snug text-ink-900">{fund.name}</div>
            <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500">{gp.shortName}</div>
          </div>
        </div>

        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-stone-600">{offering.tagline}</p>

        <dl className="mt-3 divide-y divide-stone-100 border-t border-stone-100 text-[12.5px]">
          {terms.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2">
              <dt className="text-stone-500">{k}</dt>
              <dd className={cx("num font-semibold", v.startsWith("Pending") ? "text-stone-400" : "text-ink-900")}>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {offering.tags.map((t) => (
            <span key={t} className="rounded-[4px] bg-stone-100 px-2 py-[3px] text-[11px] font-medium text-stone-600">
              {t}
            </span>
          ))}
        </div>
        {(action || footer) && <div className="mt-4 flex items-center gap-2">{action}{footer}</div>}
      </div>
    </>
  );

  const cls = "group flex flex-col overflow-hidden rounded-[10px] border border-stone-200/70 bg-white shadow-card transition-shadow hover:shadow-lift";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <article className={cls}>{body}</article>
  );
}
