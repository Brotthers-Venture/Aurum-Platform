"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cx } from "@/components/ui";
import { Panel, Seg, useWealth } from "./ui";
import { entityName, heldBy, money, type Entity, type Family, type Totals } from "@/lib/wealth";

const NW = 210;
const NH = 60;
const COL = 240;
const ROW = 118;

/** Value attributable to an entity: what it holds directly plus its share of each subsidiary. */
function lookThrough(f: Family, t: Totals, id: string): number {
  return heldBy(t, id) + f.entities.filter((e) => e.parent === id).reduce((s, c) => s + ((c.pct ?? 100) / 100) * lookThrough(f, t, c.id), 0);
}

function layout(f: Family) {
  const kids = (id?: string) => f.entities.filter((e) => e.parent === id && !e.separate);
  const roots = f.entities.filter((e) => !e.parent && !e.separate);
  const pos: Record<string, { x: number; y: number }> = {};
  let slot = 0;
  const place = (e: Entity, depth: number): number => {
    const c = kids(e.id);
    const x = c.length ? c.map((k) => place(k, depth + 1)).reduce((a, b) => a + b, 0) / c.length : slot++ * COL;
    pos[e.id] = { x, y: depth };
    return x;
  };
  roots.forEach((r) => place(r, 0));
  f.entities.filter((e) => e.separate).forEach((e) => (pos[e.id] = { x: slot++ * COL, y: 0 }));
  const depth = Math.max(0, ...Object.values(pos).map((p) => p.y));
  return { pos, width: Math.max(1, slot) * COL, depth, roots };
}

export function Structure() {
  const { f, t, ccy, open } = useWealth();
  const [sel, setSel] = useState<string | null>(f.entities[1]?.id ?? f.entities[0]?.id ?? null);
  const [view, setView] = useState<"map" | "list">("map");
  const { pos, width, depth, roots } = layout(f);
  const PEOPLE_Y = 40;
  const top = 150;
  const Y = (d: number) => top + d * ROW;
  const H = Y(depth) + NH / 2 + 24;
  const W = width;
  const cx0 = (id: string) => pos[id].x + COL / 2;
  const peopleX = (i: number) => (W / (f.people.length + 1)) * (i + 1);
  const e = f.entities.find((x) => x.id === sel);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[12.5px] text-d-text-2">Percentages are legal ownership. Hexagons show what each entity holds directly, net of its own debt.</p>
        <div className="ml-auto">
          <Seg
            value={view}
            onChange={setView}
            options={[
              { id: "map", label: "Map" },
              { id: "list", label: "List" },
            ]}
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {view === "map" ? (
          <Panel pad={false} className="max-md:hidden">
            <div className="overflow-x-auto p-2">
              <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full" style={{ minWidth: Math.min(W, 820) }}>
                {/* people → top entities */}
                {f.people.map((p, i) =>
                  roots.map((r) => (
                    <path
                      key={p.id + r.id}
                      d={`M${peopleX(i)},${PEOPLE_Y + 20} C${peopleX(i)},${(PEOPLE_Y + top) / 2} ${cx0(r.id)},${(PEOPLE_Y + top) / 2} ${cx0(r.id)},${Y(0) - NH / 2}`}
                      fill="none"
                      stroke="var(--d-text-3)"
                      strokeWidth={1.2}
                      strokeDasharray={/trustee|principal/i.test(p.role) ? "1.5 4" : "5 4"}
                    />
                  )),
                )}
                {/* ownership edges */}
                {f.entities
                  .filter((x) => x.parent && pos[x.parent])
                  .map((x) => {
                    const a = pos[x.parent!];
                    const b = pos[x.id];
                    const x1 = a.x + COL / 2;
                    const y1 = Y(a.y) + NH / 2;
                    const x2 = b.x + COL / 2;
                    const y2 = Y(b.y) - NH / 2;
                    const my = (y1 + y2) / 2;
                    return (
                      <g key={x.id}>
                        <path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke="var(--d-text-2)" strokeWidth={1.3} />
                        <rect x={(x1 + x2) / 2 - 22} y={my - 10} width={44} height={18} rx={9} fill="var(--d-bg)" stroke="var(--d-line)" />
                        <text x={(x1 + x2) / 2} y={my + 3} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--d-text)">
                          {x.pct}%
                        </text>
                      </g>
                    );
                  })}
                {/* people */}
                {f.people.map((p, i) => (
                  <g key={p.id}>
                    <circle cx={peopleX(i)} cy={PEOPLE_Y} r={19} fill="var(--d-surface)" stroke="var(--d-line-strong)" />
                    <text x={peopleX(i)} y={PEOPLE_Y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--d-text)">
                      {p.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </text>
                    <text x={peopleX(i) + 26} y={PEOPLE_Y - 2} fontSize={12} fontWeight={600} fill="var(--d-text)">
                      {p.name}
                    </text>
                    <text x={peopleX(i) + 26} y={PEOPLE_Y + 13} fontSize={10.5} fill="var(--d-text-3)">
                      {p.role}
                    </text>
                  </g>
                ))}
                {/* entities + held value */}
                {f.entities.map((x) => {
                  const p = pos[x.id];
                  const held = heldBy(t, x.id);
                  const cxx = p.x + COL / 2;
                  const cy = Y(p.y);
                  const on = sel === x.id;
                  return (
                    <g key={x.id} onClick={() => setSel(x.id)} className="cursor-pointer">
                      <rect
                        x={cxx - NW / 2}
                        y={cy - NH / 2}
                        width={NW}
                        height={NH}
                        rx={7}
                        fill="var(--d-surface)"
                        stroke={on ? "var(--tenant-accent)" : "var(--d-line-strong)"}
                        strokeWidth={on ? 2 : 1}
                        strokeDasharray={x.separate ? "4 3" : undefined}
                      />
                      <text x={cxx - NW / 2 + 12} y={cy - 12} fontSize={12} fontWeight={600} fill="var(--d-text)">
                        {x.name.length > 30 ? `${x.name.slice(0, 29)}…` : x.name}
                      </text>
                      <text x={cxx - NW / 2 + 12} y={cy + 3} fontSize={10.5} fill="var(--d-text-3)">
                        {x.kind} · {x.where}
                      </text>
                      {held !== 0 && (
                        <g transform={`translate(${cxx - NW / 2 + 18},${cy + 18})`}>
                          <path d="M0,-6 5.2,-3 5.2,3 0,6 -5.2,3 -5.2,-3Z" fill="var(--tenant-accent)" />
                          <text x={11} y={4} fontSize={11} fontWeight={600} fill="var(--d-text-2)">
                            {money(held, ccy)} held directly
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap gap-4 border-t border-d-line-soft px-4 py-2.5 text-[11.5px] text-d-text-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-d-text-2" /> Legal ownership
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-d-text-3" /> Beneficiary
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dotted border-d-text-3" /> Principal or trustee
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-d-line-strong" /> Outside the consolidation (dashed box)
              </span>
            </div>
          </Panel>
        ) : null}
        <div className={view === "map" ? "md:hidden" : undefined}>
          <Panel title="Entities" pad={false}>
            {f.entities.map((x) => {
              const d = (() => {
                let n = 0;
                let p = x.parent;
                while (p) {
                  n++;
                  p = f.entities.find((y) => y.id === p)?.parent;
                }
                return n;
              })();
              return (
                <button
                  key={x.id}
                  onClick={() => setSel(x.id)}
                  className={cx(
                    "flex w-full items-center gap-3 border-b border-d-line-soft py-2.5 pr-4 text-left text-[12.5px] last:border-0 hover:bg-d-raise",
                    sel === x.id && "bg-d-raise",
                    x.separate && "opacity-80",
                  )}
                  style={{ paddingLeft: 16 + d * 18 }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-d-text">{x.name}</span>
                    <span className="text-[11px] text-d-text-3">
                      {x.kind} · {x.where}
                      {x.separate ? " · not consolidated" : ""}
                    </span>
                  </span>
                  {x.pct !== undefined && <span className="rounded-full border border-d-line px-2 text-[11px] font-semibold text-d-text">{x.pct}%</span>}
                  <span className="w-[64px] text-right tabular-nums text-d-text-2">{x.separate ? "—" : money(lookThrough(f, t, x.id), ccy)}</span>
                </button>
              );
            })}
          </Panel>
        </div>
        {e && (
          <Panel
            title={e.name}
            note={e.kind}
            action={
              <button onClick={() => setSel(null)} aria-label="Close" className="text-d-text-3 hover:text-d-text">
                <X size={15} />
              </button>
            }
            className="self-start"
          >
            <dl className="text-[12.5px]">
              {[
                ["Jurisdiction", e.where],
                ["Owned by", e.parent ? `${entityName(f, e.parent)} · ${e.pct}%` : e.separate ? "Independent" : "The family"],
                [
                  "Owns",
                  f.entities
                    .filter((c) => c.parent === e.id)
                    .map((c) => `${c.name} ${c.pct}%`)
                    .join(" · ") || "—",
                ],
                ["Held directly, net", money(heldBy(t, e.id), ccy, 2)],
                ["Value attributable (look-through)", e.separate ? "Not consolidated" : money(lookThrough(f, t, e.id), ccy, 2)],
                ...(e.formationRef ? [["Company record", `Corporate Solution · ${e.formationRef}`]] : []),
                ...(e.note ? [["Note", e.note]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-d-line-soft py-1.5">
                  <dt className="text-d-text-2">{k}</dt>
                  <dd className="text-right tabular-nums text-d-text">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 text-[12px] font-semibold text-d-text">Held directly</div>
            {t.assets.filter((a) => a.owner === e.id).length + t.liabs.filter((l) => l.owner === e.id).length === 0 ? (
              <div className="py-2 text-[12px] text-d-text-3">Nothing held directly.</div>
            ) : (
              <div className="text-[12.5px]">
                {t.assets
                  .filter((a) => a.owner === e.id)
                  .map((a) => (
                    <button key={a.id} onClick={() => open(a.id)} className="flex w-full justify-between gap-3 border-b border-d-line-soft py-1.5 text-left hover:opacity-80">
                      <span className="truncate text-d-text">{a.name}</span>
                      <span className="tabular-nums text-d-text">{money(a.usd, ccy, 2)}</span>
                    </button>
                  ))}
                {t.liabs
                  .filter((l) => l.owner === e.id)
                  .map((l) => (
                    <div key={l.id} className="flex justify-between gap-3 border-b border-d-line-soft py-1.5">
                      <span className="truncate text-d-text-2">{l.name}</span>
                      <span className="tabular-nums text-d-neg">{money(-l.usd, ccy, 2)}</span>
                    </div>
                  ))}
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
