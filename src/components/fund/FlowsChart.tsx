"use client";

import { useState } from "react";

const C_CONTRIB = "var(--tenant-ink)";
const C_DIST = "#1F8A84";

export function FlowsChart({ flows: quarterlyFlows, note }: { flows: { q: string; contributions: number; distributions: number }[]; note: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 240;
  const pad = { l: 44, r: 8, t: 12, b: 28 };
  const top = Math.max(1, ...quarterlyFlows.flatMap((d) => [d.contributions, d.distributions]));
  const step = top > 40 ? 20 : top > 20 ? 10 : 5;
  const max = Math.ceil(top / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const band = iw / quarterlyFlows.length;
  const bw = Math.min(16, band / 3.2);
  const y = (v: number) => pad.t + ih - (v / max) * ih;

  const bar = (x: number, v: number, color: string) => {
    const top = y(v);
    const h = pad.t + ih - top;
    const r = Math.min(3, h);
    // rounded top, square baseline
    return (
      <path
        d={`M${x},${pad.t + ih}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${pad.t + ih}Z`}
        fill={color}
      />
    );
  };

  const h = hover !== null ? quarterlyFlows[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-5 text-[12px] text-stone-600">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px]" style={{ background: C_CONTRIB }} /> Contributions
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px]" style={{ background: C_DIST }} /> Distributions
        </span>
        <span className="ml-auto text-[11px] text-stone-400">{note}</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#D1C8B5" : "#EFEFEA"} />
              <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#6F6A61" className="num">
                {t}
              </text>
            </g>
          ))}
          {quarterlyFlows.map((d, i) => {
            const cx = pad.l + band * i + band / 2;
            return (
              <g key={d.q} onMouseEnter={() => setHover(i)}>
                <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill={hover === i ? "#F7F7F4" : "transparent"} />
                {bar(cx - bw - 1, d.contributions, C_CONTRIB)}
                {bar(cx + 1, d.distributions, C_DIST)}
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill={hover === i ? "var(--tenant-ink)" : "#6F6A61"}>
                  {d.q}
                </text>
              </g>
            );
          })}
        </svg>
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-[180px] rounded-[3px] border border-stone-200 bg-white px-3 py-2.5 text-[12px] shadow-[0_4px_16px_rgba(11,21,25,0.08)]"
            style={{
              left: `calc(${((44 + (iw / quarterlyFlows.length) * (hover + (hover > 5 ? -1.6 : 1))) / W) * 100}%)`,
            }}
          >
            <div className="font-semibold text-ink-900">{h.q}</div>
            <div className="mt-1.5 flex justify-between text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[1px]" style={{ background: C_CONTRIB }} />
                Contributions
              </span>
              <span className="num text-ink-900">${h.contributions.toFixed(1)}M</span>
            </div>
            <div className="mt-1 flex justify-between text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[1px]" style={{ background: C_DIST }} />
                Distributions
              </span>
              <span className="num text-ink-900">${h.distributions.toFixed(1)}M</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
