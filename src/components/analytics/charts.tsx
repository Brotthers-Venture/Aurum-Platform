"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Brand palette only: ink, gold, then neutrals. Identity never rests on colour alone —
 * every chart has a legend, direct end labels and a table view.
 */
export const SERIES = ["#0F2340", "#B08D4E", "#A39B8A", "#5B6B82"] as const;
const GRID = "#ECE6DA";
const AXIS = "#D1C8B5";
const TICK = "#6F6A61";

export type Fmt = (v: number) => string;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** "Nice" axis ticks covering [min, max]. */
function ticks(min: number, max: number, count = 4) {
  if (min === max) max = min + 1;
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

export function Legend({ items }: { items: { name: string; color: string; line?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-stone-600">
      {items.map((i) => (
        <span key={i.name} className="inline-flex items-center gap-1.5">
          {i.line ? <span className="h-[2px] w-3.5 rounded-full" style={{ background: i.color }} /> : <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: i.color }} />}
          {i.name}
        </span>
      ))}
    </div>
  );
}

function Tooltip({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  const left = Math.min(Math.max(x + 12, 0), w - 190);
  return (
    <div className="pointer-events-none absolute z-10 min-w-[170px] rounded-[3px] border border-stone-200 bg-white px-3 py-2 text-[11.5px] shadow-[0_6px_20px_-8px_rgba(11,21,25,0.25)]" style={{ left: x + 200 > w ? x - 190 : left, top: Math.max(0, y - 10) }}>
      {children}
    </div>
  );
}

const TipRow = ({ color, label, value, line }: { color?: string; label: string; value: string; line?: boolean }) => (
  <div className="flex items-center justify-between gap-4 py-[1px]">
    <span className="inline-flex items-center gap-1.5 text-stone-600">
      {color && (line ? <span className="h-[2px] w-2.5" style={{ background: color }} /> : <span className="h-2 w-2 rounded-[1px]" style={{ background: color }} />)}
      {label}
    </span>
    <span className="num font-semibold text-ink-900">{value}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/** Grouped columns; values may be negative. */
export function Columns({ categories, series, fmt, height = 240 }: { categories: string[]; series: { name: string; color: string; values: number[] }[]; fmt: Fmt; height?: number }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 52, r: 8, t: 10, b: 26 };
  const all = series.flatMap((s) => s.values);
  const tk = ticks(Math.min(0, ...all), Math.max(0, ...all));
  const lo = tk[0];
  const hi = tk[tk.length - 1];
  const ih = height - pad.t - pad.b;
  const iw = Math.max(0, W - pad.l - pad.r);
  const y = (v: number) => pad.t + ((hi - v) / (hi - lo)) * ih;
  const band = categories.length ? iw / categories.length : 0;
  const gap = 2;
  const bw = Math.max(3, Math.min(18, (band * 0.62) / series.length - gap));
  const every = Math.ceil(categories.length / Math.max(1, Math.floor(iw / 56)));

  return (
    <div ref={ref} className="relative">
      {W > 0 && (
        <svg width={W} height={height} onMouseLeave={() => setHover(null)} role="img">
          {tk.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} />
              <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill={TICK} className="num">
                {fmt(t)}
              </text>
            </g>
          ))}
          {categories.map((c, i) => {
            const x0 = pad.l + band * i + (band - (bw + gap) * series.length + gap) / 2;
            return (
              <g key={c}>
                {hover === i && <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="#F4F3EE" />}
                {series.map((s, k) => {
                  const v = s.values[i] ?? 0;
                  const top = y(Math.max(0, v));
                  const h = Math.abs(y(v) - y(0));
                  const r = Math.min(3, h);
                  const x = x0 + k * (bw + gap);
                  const d =
                    v >= 0
                      ? `M${x},${y(0)}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${y(0)}Z`
                      : `M${x},${y(0)}V${y(v) - r}Q${x},${y(v)} ${x + r},${y(v)}H${x + bw - r}Q${x + bw},${y(v)} ${x + bw},${y(v) - r}V${y(0)}Z`;
                  return h > 0.5 ? <path key={s.name} d={d} fill={s.color} /> : null;
                })}
                {i % every === 0 && (
                  <text x={pad.l + band * i + band / 2} y={height - 8} textAnchor="middle" fontSize={10.5} fill={TICK}>
                    {c}
                  </text>
                )}
                <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && (
        <Tooltip x={pad.l + band * hover + band / 2} y={pad.t} w={W}>
          <div className="mb-1 font-semibold text-ink-900">{categories[hover]}</div>
          {series.map((s) => (
            <TipRow key={s.name} color={s.color} label={s.name} value={fmt(s.values[hover] ?? 0)} />
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** Time-series lines; the first series can be drawn as a soft area. Crosshair tooltip. */
export function Lines({ categories, series, fmt, height = 240, area = true }: { categories: string[]; series: { name: string; color: string; values: number[] }[]; fmt: Fmt; height?: number; area?: boolean }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 52, r: 86, t: 12, b: 26 };
  const all = series.flatMap((s) => s.values);
  const tk = ticks(Math.min(0, ...all), Math.max(...all, 1));
  const lo = tk[0];
  const hi = tk[tk.length - 1];
  const ih = height - pad.t - pad.b;
  const iw = Math.max(0, W - pad.l - pad.r);
  const n = categories.length;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ((hi - v) / (hi - lo)) * ih;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const every = Math.ceil(n / Math.max(1, Math.floor(iw / 56)));

  // direct labels at line ends, nudged apart
  const ends = series.map((s, k) => ({ k, y: y(s.values[n - 1] ?? 0) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  const endY = new Map(ends.map((e) => [e.k, e.y]));

  return (
    <div ref={ref} className="relative">
      {W > 0 && (
        <svg
          width={W}
          height={height}
          role="img"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left - pad.l) / iw) * (n - 1));
            setHover(i >= 0 && i < n ? i : null);
          }}
        >
          {tk.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} />
              <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill={TICK} className="num">
                {fmt(t)}
              </text>
            </g>
          ))}
          {categories.map((c, i) =>
            i % every === 0 || i === n - 1 ? (
              <text key={c} x={x(i)} y={height - 8} textAnchor="middle" fontSize={10.5} fill={TICK}>
                {c}
              </text>
            ) : null,
          )}
          {area && series[0] && (
            <>
              <defs>
                <linearGradient id="aurum-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={series[0].color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={series[0].color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <path d={`${path(series[0].values)}L${x(n - 1)},${y(lo < 0 ? 0 : lo)}L${x(0)},${y(lo < 0 ? 0 : lo)}Z`} fill="url(#aurum-area)" />
            </>
          )}
          {series.map((s, k) => (
            <g key={s.name}>
              <path d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(n - 1)} cy={y(s.values[n - 1] ?? 0)} r={3.5} fill={s.color} stroke="#fff" strokeWidth={2} />
              <text x={x(n - 1) + 9} y={(endY.get(k) ?? 0) + 3.5} fontSize={10.5} fill="#3F3F3A" className="num">
                {fmt(s.values[n - 1] ?? 0)}
              </text>
            </g>
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#0F2340" strokeOpacity={0.25} strokeDasharray="3 3" />
              {series.map((s) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
      )}
      {hover !== null && (
        <Tooltip x={x(hover)} y={pad.t} w={W}>
          <div className="mb-1 font-semibold text-ink-900">{categories[hover]}</div>
          {series.map((s) => (
            <TipRow key={s.name} color={s.color} line label={s.name} value={fmt(s.values[hover] ?? 0)} />
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** Horizontal bars, one row per item; optional stacking of two parts (e.g. DPI + RVPI = TVPI). */
export function HBars({
  rows,
  parts,
  fmt,
  totalFmt,
}: {
  rows: { label: string; values: number[]; note?: string }[];
  parts: { name: string; color: string }[];
  fmt: Fmt;
  totalFmt?: Fmt;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...rows.map((r) => r.values.reduce((a, v) => a + Math.max(0, v), 0)), 0.0001);
  return (
    <div className="space-y-[7px]">
      {rows.map((r, i) => {
        const total = r.values.reduce((a, v) => a + v, 0);
        return (
          <div key={r.label} className="grid grid-cols-[minmax(110px,32%)_1fr_64px] items-center gap-3" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="truncate text-[12px] text-ink-800" title={r.label}>
              {r.label}
            </span>
            <div className="relative flex h-[14px] items-center gap-[2px]">
              {r.values.map((v, k) =>
                v > 0 ? (
                  <span
                    key={k}
                    className="h-full first:rounded-l-[2px] last:rounded-r-[4px]"
                    style={{ width: `${(v / max) * 100}%`, background: parts[k].color, opacity: hover === null || hover === i ? 1 : 0.45, transition: "opacity 150ms" }}
                    title={`${parts[k].name}: ${fmt(v)}`}
                  />
                ) : null,
              )}
            </div>
            <span className="num text-right text-[12px] font-semibold text-ink-900">{(totalFmt ?? fmt)(total)}</span>
          </div>
        );
      })}
    </div>
  );
}
