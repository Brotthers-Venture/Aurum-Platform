"use client";

import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { CLASS_COLOR, useWealth } from "./ui";
import { money, pct, type AssetClass, type Valued } from "@/lib/wealth";

/** A unit that gives roughly 60–120 cells: $250K, $500K, $1M, $2M, $5M … */
function unitFor(gross: number) {
  const steps = [250e3, 500e3, 1e6, 2e6, 5e6, 10e6, 25e6, 50e6];
  return steps.find((u) => gross / u <= 120) ?? 100e6;
}

/**
 * The family's wealth as a honeycomb: each hexagon is one unit of value, coloured by asset class and laid out
 * holding by holding, so the share of each class is read by area. Hover a cell to see its holding; click to open it.
 */
export function Honeycomb() {
  const { t, ccy, open } = useWealth();
  const [hover, setHover] = useState<Valued | null>(null);
  const [cls, setCls] = useState<AssetClass | null>(null);
  const unit = unitFor(t.gross);
  const cells = useMemo(() => {
    const tot = (c: AssetClass) => t.assets.filter((a) => a.cls === c).reduce((x, a) => x + a.usd, 0);
    const order = [...new Set(t.assets.map((a) => a.cls))].sort((a, b) => tot(b) - tot(a));
    const byClass = order.map((c) => ({ c, list: t.assets.filter((a) => a.cls === c).sort((a, b) => b.usd - a.usd) }));
    // largest-remainder rounding so the cell count matches gross / unit and small holdings still show
    const raw = byClass.flatMap((g) => g.list.map((a) => ({ a, exact: a.usd / unit })));
    const total = Math.round(t.gross / unit);
    const base = raw.map((r) => ({ ...r, n: Math.max(1, Math.floor(r.exact)) }));
    let left = total - base.reduce((s, r) => s + r.n, 0);
    [...base]
      .sort((x, y) => y.exact - Math.floor(y.exact) - (x.exact - Math.floor(x.exact)))
      .forEach((r) => {
        if (left > 0) {
          r.n++;
          left--;
        }
      });
    return base.flatMap((r) => Array.from({ length: r.n }, () => r.a));
  }, [t, unit]);

  // filled column by column, so each asset class reads as one band from left to right
  const ROWS = 6;
  const R = 15; // circumradius
  const w = Math.sqrt(3) * R;
  const h = 1.5 * R;
  const cols = Math.ceil(cells.length / ROWS);
  const W = cols * w + w / 2 + 4;
  const H = ROWS * h + R / 2 + 4;
  const hex = (cx0: number, cy0: number, r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const ang = (Math.PI / 3) * k - Math.PI / 6;
      return `${(cx0 + r * Math.cos(ang)).toFixed(1)},${(cy0 + r * Math.sin(ang)).toFixed(1)}`;
    }).join(" ");
  const classes = [...new Set(cells.map((a) => a.cls))];
  const focus = hover?.cls ?? cls;

  return (
    <div className="space-y-4">
      <div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Wealth by asset class, one hexagon per ${money(unit, ccy, 2)}`}
          onPointerLeave={() => setHover(null)}
        >
          {cells.map((a, i) => {
            const c = Math.floor(i / ROWS);
            const r = c % 2 ? ROWS - 1 - (i % ROWS) : i % ROWS; // snake down and up, so a holding's cells stay together
            const x = 2 + w / 2 + c * w + (r % 2 ? w / 2 : 0);
            const y = 2 + R + r * h;
            const dim = focus && a.cls !== focus;
            const same = hover && a.id === hover.id;
            return (
              <polygon
                key={i}
                points={hex(x, y, R - 1.6)}
                fill={CLASS_COLOR[a.cls]}
                opacity={dim ? 0.16 : same ? 1 : 0.86}
                stroke={same ? "var(--d-text)" : "none"}
                strokeWidth={1.2}
                className="cursor-pointer transition-opacity duration-150"
                onPointerEnter={() => setHover(a)}
                onClick={() => open(a.id)}
              />
            );
          })}
        </svg>
        <div className="mt-2 h-5 text-[12.5px] text-d-text-2">
          {hover ? (
            <>
              <b className="font-semibold text-d-text">{hover.name}</b> · {money(hover.usd, ccy, 2)} · {pct(hover.usd / t.gross)} of assets
            </>
          ) : (
            <span className="text-d-text-3">One hexagon is {money(unit, ccy, 2)} of assets. Point at a cell to see the holding; select it to open.</span>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5 sm:grid-cols-3 xl:grid-cols-4">
        {classes.map((c) => {
          const v = t.assets.filter((a) => a.cls === c).reduce((s, a) => s + a.usd, 0);
          return (
            <li key={c}>
              <button
                onPointerEnter={() => setCls(c)}
                onPointerLeave={() => setCls(null)}
                onFocus={() => setCls(c)}
                onBlur={() => setCls(null)}
                className={cx("grid w-full grid-cols-[12px_1fr_auto] items-center gap-2 rounded-[6px] px-1.5 py-1 text-left text-[12.5px]", focus === c && "bg-d-raise")}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <polygon points={hex(6, 6, 5.6)} fill={CLASS_COLOR[c]} />
                </svg>
                <span className="truncate text-d-text">{c}</span>
                <span className="tabular-nums text-d-text-2">{pct(v / t.gross, 0)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
