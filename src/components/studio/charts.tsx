/**
 * Report Studio charts: plain SVG, drawn from the data layer, sized for an A4 content column and identical on
 * screen, in the digital report and in print (vector, selectable labels). Colours come from the report's brand;
 * text uses the report's ink colours, never the series colour.
 */
import { moneyShort, pct } from "@/lib/format";
import type { Holding, SeriesPoint } from "@/lib/studio/data";

export type ChartTheme = { primary: string; secondary: string; ink: string; muted: string; rule: string; font: string };
const W = 664;

/** Round numbers for an axis, 0 … max (≥ max), about n steps. */
function ticks(max: number, n = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}
/** Show at most ~8 quarter labels. */
const every = (n: number) => Math.max(1, Math.ceil(n / 8));

function Empty({ t, text }: { t: ChartTheme; text: string }) {
  return (
    <svg viewBox={`0 0 ${W} 120`} width="100%" role="img" aria-label={text} style={{ fontFamily: t.font }}>
      <rect x={0.5} y={0.5} width={W - 1} height={119} fill="none" stroke={t.rule} strokeDasharray="3 3" />
      <text x={W / 2} y={64} textAnchor="middle" fontSize={11} fill={t.muted}>
        {text}
      </text>
    </svg>
  );
}

/** NAV (line) against cumulative paid-in capital (dashed), by quarter. */
export function NavChart({ s, t, currency }: { s: SeriesPoint[]; t: ChartTheme; currency: "USD" | "BRL" }) {
  if (s.length < 2) return <Empty t={t} text="Two or more quarters are needed to chart net asset value." />;
  const H = 230;
  const L = 58;
  const R = 92;
  const T = 14;
  const B = 28;
  const max = Math.max(...s.map((p) => Math.max(p.nav, p.paidIn)));
  const ys = ticks(max);
  const top = ys[ys.length - 1];
  const x = (i: number) => L + (i * (W - L - R)) / (s.length - 1);
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const path = (k: "nav" | "paidIn") => s.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join("");
  const area = `${path("nav")}L${x(s.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const last = s[s.length - 1];
  const k = every(s.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Net asset value and paid-in capital by quarter" style={{ fontFamily: t.font }}>
      {ys.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={t.rule} strokeWidth={v === 0 ? 1 : 0.6} />
          <text x={L - 8} y={y(v) + 3.5} textAnchor="end" fontSize={9.5} fill={t.muted}>
            {moneyShort(v, currency)}
          </text>
        </g>
      ))}
      <path d={area} fill={t.primary} fillOpacity={0.07} />
      <path d={path("paidIn")} fill="none" stroke={t.muted} strokeWidth={1.25} strokeDasharray="4 3" />
      <path d={path("nav")} fill="none" stroke={t.primary} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={x(s.length - 1)} cy={y(last.nav)} r={3} fill={t.primary} />
      <text x={x(s.length - 1) + 8} y={y(last.nav) + 3.5} fontSize={10} fontWeight={600} fill={t.ink}>
        NAV {moneyShort(last.nav, currency)}
      </text>
      <text x={x(s.length - 1) + 8} y={y(last.paidIn) + (Math.abs(y(last.paidIn) - y(last.nav)) < 14 ? 16 : 3.5)} fontSize={10} fill={t.muted}>
        Paid-in {moneyShort(last.paidIn, currency)}
      </text>
      {s.map((p, i) =>
        i % k === 0 || i === s.length - 1 ? (
          <text key={p.period} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill={t.muted}>
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/** Paid-in capital as a share of commitments, by quarter. */
export function UtilizationChart({ s, t }: { s: SeriesPoint[]; t: ChartTheme }) {
  if (!s.length) return <Empty t={t} text="No commitments recorded yet." />;
  const H = 150;
  const L = 36;
  const T = 10;
  const B = 26;
  const bw = Math.min(34, ((W - L) / s.length) * 0.62);
  const x = (i: number) => L + ((i + 0.5) * (W - L)) / s.length;
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const k = every(s.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Commitment utilization by quarter" style={{ fontFamily: t.font }}>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke={t.rule} strokeWidth={v === 0 ? 1 : 0.6} />
          <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize={9.5} fill={t.muted}>
            {pct(v, 0)}
          </text>
        </g>
      ))}
      {s.map((p, i) => {
        const u = p.commitments ? p.paidIn / p.commitments : 0;
        return (
          <g key={p.period}>
            <rect x={x(i) - bw / 2} y={y(1)} width={bw} height={y(0) - y(1)} fill={t.primary} fillOpacity={0.08} />
            <rect x={x(i) - bw / 2} y={y(u)} width={bw} height={Math.max(0, y(0) - y(u))} fill={t.primary} />
            {i === s.length - 1 && (
              <text x={x(i)} y={y(u) - 5} textAnchor="middle" fontSize={10} fontWeight={600} fill={t.ink}>
                {pct(u, 0)}
              </text>
            )}
            {(i % k === 0 || i === s.length - 1) && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill={t.muted}>
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Contributions above the line and distributions below, by quarter. */
export function FlowsChart({ s, t, currency }: { s: SeriesPoint[]; t: ChartTheme; currency: "USD" | "BRL" }) {
  if (!s.some((p) => p.called || p.distributedQ)) return <Empty t={t} text="No capital activity in the periods shown." />;
  const H = 200;
  const L = 58;
  const T = 12;
  const B = 26;
  const up = Math.max(...s.map((p) => p.called), 1);
  const down = Math.max(...s.map((p) => p.distributedQ), 0);
  const total = up + down;
  const zero = T + (up / total) * (H - T - B);
  const scale = (H - T - B) / total;
  const bw = Math.min(26, ((W - L) / s.length) * 0.55);
  const x = (i: number) => L + ((i + 0.5) * (W - L)) / s.length;
  const k = every(s.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Contributions and distributions by quarter" style={{ fontFamily: t.font }}>
      <text x={L - 8} y={T + 8} textAnchor="end" fontSize={9.5} fill={t.muted}>
        {moneyShort(up, currency)}
      </text>
      {down > 0 && (
        <text x={L - 8} y={H - B} textAnchor="end" fontSize={9.5} fill={t.muted}>
          −{moneyShort(down, currency)}
        </text>
      )}
      <line x1={L} x2={W} y1={zero} y2={zero} stroke={t.ink} strokeWidth={0.8} />
      {s.map((p, i) => (
        <g key={p.period}>
          {p.called > 0 && <rect x={x(i) - bw / 2} y={zero - p.called * scale} width={bw} height={p.called * scale} fill={t.primary} />}
          {p.distributedQ > 0 && <rect x={x(i) - bw / 2} y={zero + 1} width={bw} height={p.distributedQ * scale} fill={t.secondary} />}
          {(i % k === 0 || i === s.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill={t.muted}>
              {p.label}
            </text>
          )}
        </g>
      ))}
      <g transform={`translate(${W - 210} ${T})`} fontSize={9.5} fill={t.ink}>
        <rect width={9} height={9} fill={t.primary} />
        <text x={14} y={8}>
          Contributions
        </text>
        <rect x={100} width={9} height={9} fill={t.secondary} />
        <text x={114} y={8}>
          Distributions
        </text>
      </g>
    </svg>
  );
}

/** Cumulative paid-in capital by quarter. */
export function DeploymentChart({ s, t, currency }: { s: SeriesPoint[]; t: ChartTheme; currency: "USD" | "BRL" }) {
  return <NavChart s={s.map((p) => ({ ...p, nav: p.paidIn }))} t={t} currency={currency} />;
}

/** Investments at cost, largest first, as labelled horizontal bars. */
export function AllocationChart({ h, t, currency }: { h: Holding[]; t: ChartTheme; currency: "USD" | "BRL" }) {
  if (!h.length) return <Empty t={t} text="No investments recorded yet." />;
  const row = 30;
  const H = h.length * row + 6;
  const L = 250;
  const R = 120;
  const max = Math.max(...h.map((x) => x.share));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Investments at cost" style={{ fontFamily: t.font }}>
      {h.map((x, i) => {
        const w = ((W - L - R) * x.share) / max;
        const yy = i * row + 4;
        return (
          <g key={x.name}>
            <text x={0} y={yy + 15} fontSize={10.5} fill={t.ink}>
              {x.name.length > 40 ? `${x.name.slice(0, 39)}…` : x.name}
            </text>
            <rect x={L} y={yy + 5} width={W - L - R} height={14} fill={t.primary} fillOpacity={0.07} />
            <rect x={L} y={yy + 5} width={w} height={14} fill={i === 0 ? t.primary : t.secondary} />
            <text x={W - R + 10} y={yy + 15} fontSize={10.5} fontWeight={600} fill={t.ink}>
              {pct(x.share, 0)}
            </text>
            <text x={W} y={yy + 15} textAnchor="end" fontSize={10} fill={t.muted}>
              {moneyShort(x.cost, currency)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
