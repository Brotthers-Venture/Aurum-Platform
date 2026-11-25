"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cx } from "@/components/ui";
import { CLASS_COLOR, Empty, Fresh, Panel, Seg, input, useWealth } from "./ui";
import { GROUPS, entityName, freshness, groupBy, money, pct, signed, type GroupKey, type Valued } from "@/lib/wealth";

type View = "list" | "cards" | "map";

/** Every holding, grouped and filtered any way the family thinks about it. */
export function Explorer() {
  const { f, t, ccy, open } = useWealth();
  const [by, setBy] = useState<GroupKey>("cls");
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("list");
  const m = (v: number, d = 2) => money(v, ccy, d);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? t.assets.filter((a) => [a.name, a.cls, a.custodian, a.manager, a.country, entityName(f, a.owner)].some((x) => x?.toLowerCase().includes(s))) : t.assets;
  }, [q, t.assets, f]);
  const groups = groupBy(f, list, by);
  const total = list.reduce((s, a) => s + a.usd, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-d-text-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search holdings, custodians, countries" className={cx(input, "w-[280px] pl-8")} />
        </label>
        <span className="text-[12px] text-d-text-3">Group by</span>
        <select value={by} onChange={(e) => setBy(e.target.value as GroupKey)} className={input}>
          {GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[12px] tabular-nums text-d-text-3">
          {list.length} holdings · {m(total, 1)}
        </span>
        <Seg
          value={view}
          onChange={setView}
          options={[
            { id: "list", label: "List" },
            { id: "cards", label: "Cards" },
            { id: "map", label: "Return map" },
          ]}
        />
      </div>

      {!list.length ? (
        <Panel>
          <Empty>Nothing matches “{q}”.</Empty>
        </Panel>
      ) : view === "map" ? (
        <ReturnMap list={list} />
      ) : view === "cards" ? (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="mb-2 flex items-baseline gap-2 text-[13px]">
                <b className="font-semibold text-d-text">{g.key}</b>
                <span className="tabular-nums text-d-text-3">
                  {m(g.usd, 1)} · {pct(g.usd / t.net)} of net worth
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {g.list.map((a) => (
                  <button key={a.id} onClick={() => open(a.id)} className="rounded-[10px] border border-d-line bg-d-surface p-3.5 text-left hover:border-d-line-strong">
                    <div className="flex items-center gap-2 text-[11px] text-d-text-3">
                      <span className="h-2 w-2 rounded-full" style={{ background: CLASS_COLOR[a.cls] }} />
                      {a.cls}
                    </div>
                    <div className="mt-1.5 truncate text-[13.5px] font-semibold text-d-text">{a.name}</div>
                    <div className="truncate text-[11.5px] text-d-text-3">{a.custodian ?? a.manager ?? entityName(f, a.owner)}</div>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="font-display text-[20px] font-light tabular-nums text-d-text">{m(a.usd, 1)}</span>
                      <span className={cx("text-[12px] font-semibold tabular-nums", a.ytd > 0 ? "text-d-pos" : a.ytd < 0 ? "text-d-neg" : "text-d-text-3")}>
                        {a.ytd ? signed(pct(a.ytdPct), a.ytdPct) : "—"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Panel pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-d-line text-left text-[11px] font-medium text-d-text-3">
                  <th className="px-4 py-2 font-medium">Holding</th>
                  <th className="px-3 py-2 font-medium">Legal owner</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-right font-medium">% of net worth</th>
                  <th className="px-3 py-2 text-right font-medium">Return YTD</th>
                  <th className="px-3 py-2 text-right font-medium">Unrealised</th>
                  <th className="px-3 py-2 font-medium">Valuation</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Group key={g.key} label={g.key} usd={g.usd} ytd={g.ytd} list={g.list} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Group({ label, usd, ytd, list }: { label: string; usd: number; ytd: number; list: Valued[] }) {
  const { f, t, ccy, open } = useWealth();
  const m = (v: number, d = 2) => money(v, ccy, d);
  return (
    <>
      <tr className="bg-d-surface-2 text-[12px] font-semibold text-d-text-2">
        <td className="px-4 py-2" colSpan={2}>
          {label}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{m(usd, 1)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{pct(usd / t.net)}</td>
        <td className={cx("px-3 py-2 text-right tabular-nums", ytd > 0 && "text-d-pos")}>{ytd ? signed(m(ytd, 2), ytd) : "—"}</td>
        <td colSpan={2} />
      </tr>
      {list.map((a) => {
        const fr = freshness(a.asOf);
        const gain = a.usdCost === undefined ? undefined : a.usd - a.usdCost;
        return (
          <tr key={a.id} onClick={() => open(a.id)} className="cursor-pointer border-b border-d-line-soft hover:bg-d-raise">
            <td className="px-4 py-2 pl-6">
              <div className="text-d-text">
                {a.name}
                {a.manual && <span className="ml-1.5 text-[11px] text-d-text-3">· entered manually</span>}
              </div>
              <div className="text-[11px] text-d-text-3">{a.custodian ?? a.manager ?? a.cls}</div>
            </td>
            <td className="px-3 py-2 text-d-text-2">{entityName(f, a.owner)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-d-text">
              {m(a.usd)}
              {a.ccy !== ccy && <div className="text-[10.5px] text-d-text-3">{a.ccy}</div>}
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-d-text-2">{pct(a.usd / t.net)}</td>
            <td className={cx("px-3 py-2 text-right tabular-nums", a.ytd > 0 ? "text-d-pos" : a.ytd < 0 ? "text-d-neg" : "text-d-text-3")}>
              {a.ytd ? signed(pct(a.ytdPct), a.ytdPct) : "—"}
              {a.ytd !== 0 && <div className="text-[10.5px] text-d-text-3">{signed(m(a.ytd, 2), a.ytd)}</div>}
            </td>
            <td className={cx("px-3 py-2 text-right tabular-nums", gain && gain > 0 ? "text-d-pos" : "text-d-text-3")}>{gain === undefined ? "—" : signed(m(gain), gain)}</td>
            <td className="px-3 py-2">
              <div className="text-[11.5px] text-d-text-2">{a.source}</div>
              <Fresh {...fr} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

/** Bubble map: return this year (x) against size (y); bubble area is value. */
function ReturnMap({ list }: { list: Valued[] }) {
  const { ccy, open } = useWealth();
  const W = 1000;
  const H = 420;
  const xs = list.map((a) => a.ytdPct);
  const lo = Math.min(-0.02, ...xs) - 0.02;
  const hi = Math.max(...xs) + 0.03;
  const vmax = Math.max(...list.map((a) => a.usd));
  const X = (v: number) => 60 + ((v - lo) / (hi - lo)) * (W - 90);
  const Y = (v: number) => H - 40 - Math.sqrt(v / vmax) * (H - 80);
  const R = (v: number) => 6 + Math.sqrt(v / vmax) * 30;
  const ticks = [lo, 0, (hi + 0) / 2, hi].map((v) => Math.round(v * 100) / 100);
  return (
    <Panel title="Return map" note="return this year against size · bubble area is value · select a bubble to open the holding" pad={false}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        <line x1={X(0)} x2={X(0)} y1={20} y2={H - 40} stroke="var(--d-line-strong)" strokeDasharray="3 3" />
        <line x1={60} x2={W - 30} y1={H - 40} y2={H - 40} stroke="var(--d-line)" />
        {ticks.map((v) => (
          <text key={v} x={X(v)} y={H - 18} textAnchor="middle" fontSize={11} fill="var(--d-text-3)">
            {pct(v, 0)}
          </text>
        ))}
        <text x={60} y={16} fontSize={11} fill="var(--d-text-3)">
          Larger holdings ↑
        </text>
        {[...list]
          .sort((a, b) => b.usd - a.usd)
          .map((a) => (
            <g key={a.id} onClick={() => open(a.id)} className="cursor-pointer">
              <circle cx={X(a.ytdPct)} cy={Y(a.usd)} r={R(a.usd)} fill={CLASS_COLOR[a.cls]} fillOpacity={0.5} stroke={CLASS_COLOR[a.cls]} strokeWidth={1.5}>
                <title>{`${a.name} · ${money(a.usd, ccy, 2)} · ${signed(pct(a.ytdPct), a.ytdPct)}`}</title>
              </circle>
              {a.usd > vmax * 0.18 && (
                <text x={X(a.ytdPct)} y={Y(a.usd) - R(a.usd) - 6} textAnchor="middle" fontSize={11} fill="var(--d-text-2)">
                  {a.name}
                </text>
              )}
            </g>
          ))}
      </svg>
    </Panel>
  );
}
