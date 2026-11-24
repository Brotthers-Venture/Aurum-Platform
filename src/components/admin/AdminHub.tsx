"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { BrandCenter, DarkCenter, HexNav, MarkCenter, ringOrder, type Cell } from "./HexNav";
import { GpLogo, GpMark } from "@/components/brand/GpLogo";
import { solutions } from "@/lib/solutions";
import { gps, gpById, type GpClient } from "@/lib/gps";
import { gpTotals } from "@/lib/gpData";
import { funds, fundTotals, toUSD } from "@/lib/data";
import { moneyShort } from "@/lib/format";
import { cx } from "@/components/ui";

type Level = { kind: "root" } | { kind: "fund" } | { kind: "gp"; gpId: string };

const gpModules = [
  { id: "funds", lines: ["Funds"] as [string], path: "funds", summary: "The GP’s vehicles, terms, capital accounts and performance." },
  { id: "investors", lines: ["Investors"] as [string], path: "investors", summary: "Limited partners in this GP’s funds, with KYC status and holdings." },
  { id: "onboarding", lines: ["Onboarding"] as [string], path: "onboarding", summary: "Subscriptions in progress for this GP’s funds." },
  {
    id: "capital",
    lines: ["Capital calls &", "Distributions"] as [string, string],
    path: "capital",
    summary: "Calls and distributions for this GP, with collection status and GP approvals.",
  },
  { id: "reports", lines: ["Reports"] as [string], path: "reports", summary: "Statements, notices and reports issued under the GP’s brand." },
  { id: "portal", lines: ["Portal &", "Brand"] as [string, string], path: "portal", summary: "Logos, colours, portal address and email sender for the white-labeled portals." },
];

const crossClient = [
  ["Funds", "/admin/fund/funds"],
  ["Investors", "/admin/fund/investors"],
  ["Onboarding", "/admin/fund/onboarding"],
  ["Capital calls", "/admin/fund/capital-calls"],
  ["Distributions", "/admin/fund/distributions"],
  ["General ledger", "/admin/fund/accounting"],
  ["Reports", "/admin/fund/reports"],
] as const;

/** Real clients first, then by assets under administration. */
const orderedGps = [...gps].sort((a, b) => Number(!!a.sample) - Number(!!b.sample) || gpTotals(b.id).nav - gpTotals(a.id).nav);
const tallLogo = (g: GpClient) => !!g.logo && g.logo.width / g.logo.height < 3;

function GpPreview({ gp, hint }: { gp: GpClient; hint?: boolean }) {
  const t = gpTotals(gp.id);
  return (
    <div className="rounded-[4px] border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="eyebrow">GP client</span>
        <span className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", gp.status === "Live" ? "text-gold-700" : "text-stone-400")}>{gp.status}</span>
      </div>
      <div className="mt-4">
        <GpLogo gp={gp} height={tallLogo(gp) ? 48 : 28} />
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-stone-100 pt-4">
        {[
          ["Funds", String(t.funds)],
          ["Investors", String(t.investors)],
          ["NAV", t.nav ? moneyShort(t.nav) : "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">{k}</dt>
            <dd className="num mt-0.5 text-[16px] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="eyebrow mt-5">Inside</div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 text-[13px] text-ink-800">
        {gpModules.map((m) => (
          <li key={m.id} className="border-b border-stone-100 py-1.5">
            {m.lines.join(" ")}
          </li>
        ))}
      </ul>
      {hint && <p className="mt-4 text-[12px] font-semibold text-ink-900">Select to open →</p>}
    </div>
  );
}

export function AdminHub() {
  const [level, setLevel] = useState<Level>({ kind: "root" });
  const [hovered, setHovered] = useState<string | null>(null);
  const totalNav = funds.reduce((a, f) => a + toUSD(fundTotals(f.id).nav, f.currency), 0);

  const setLvl = (l: Level) => {
    setHovered(null);
    setLevel(l);
  };

  let cells: Cell[] = [];
  let center: React.ComponentProps<typeof HexNav>["center"];
  let centerLabel = "";
  let accent = "#0B1519";

  if (level.kind === "root") {
    cells = solutions.map((s) => ({
      id: s.id,
      slot: s.slot,
      lines: s.lines,
      sub: s.live ? `${gps.length} GPS` : "COMING SOON",
      subTone: s.live ? "accent" : "muted",
      outline: s.live,
      ...(s.id === "fund" ? { onSelect: () => setLvl({ kind: "fund" }) } : { href: s.href }),
    }));
    center = (open: boolean) => <MarkCenter expanded={open} />;
    centerLabel = "Aurum — show solutions";
  } else if (level.kind === "fund") {
    const ring = orderedGps.slice(0, 5);
    cells = ring.map((g, i) => {
      const t = gpTotals(g.id);
      return {
        id: g.id,
        slot: ringOrder[i],
        lines: [g.shortName] as [string],
        sub: t.funds ? `${t.funds} FUND${t.funds > 1 ? "S" : ""}` : "ONBOARDING",
        accent: g.brand.primary,
        art: (active: boolean) => <GpLogo gp={g} height={tallLogo(g) ? 50 : 20} tone={active ? "dark" : "light"} />,
        onSelect: () => setLvl({ kind: "gp", gpId: g.id }),
      };
    });
    cells.push({ id: "all", slot: ringOrder[5], lines: ["All GPs"], sub: `${gps.length} CLIENTS`, subTone: "accent", outline: true, href: "/admin/fund/gps" });
    center = <DarkCenter lines={["Fund", "Solution"]} />;
    centerLabel = "Fund Solution — back to Client Portal";
  } else {
    const gp = gpById(level.gpId)!;
    const t = gpTotals(gp.id);
    const subs: Record<string, string> = {
      funds: `${t.funds} VEHICLE${t.funds === 1 ? "" : "S"}`,
      investors: `${t.investors} INVESTORS`,
      onboarding: `${t.onboarding} OPEN`,
      capital: `${t.openCalls} OPEN`,
      reports: "DOCUMENTS",
      portal: gp.status === "Live" ? "LIVE" : "SETTING UP",
    };
    cells = gpModules.map((m, i) => ({ id: m.id, slot: ringOrder[i], lines: m.lines, sub: subs[m.id], href: `/admin/fund/gps/${gp.id}/${m.path}` }));
    center = (
      <BrandCenter color={gp.brand.primary} secondary={gp.brand.secondary}>
        <GpLogo gp={gp} height={tallLogo(gp) ? 52 : 26} />
      </BrandCenter>
    );
    centerLabel = `${gp.name} — back to Fund Solution`;
    accent = gp.brand.primary;
  }

  const crumbs: { label: string; to?: Level }[] =
    level.kind === "root"
      ? [{ label: "Client Portal" }]
      : level.kind === "fund"
        ? [{ label: "Client Portal", to: { kind: "root" } }, { label: "Fund Solution" }]
        : [{ label: "Client Portal", to: { kind: "root" } }, { label: "Fund Solution", to: { kind: "fund" } }, { label: gpById(level.gpId)!.shortName }];

  const hoveredSolution = level.kind === "root" && hovered ? solutions.find((s) => s.id === hovered) : null;
  const hoveredGp = level.kind === "fund" && hovered && hovered !== "all" ? gpById(hovered) : null;
  const hoveredModule = level.kind === "gp" && hovered ? gpModules.find((m) => m.id === hovered) : null;

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 gap-10 px-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex flex-col">
          <div>
            <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={c.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={12} className="text-stone-300" />}
                  {c.to ? (
                    <button onClick={() => setLvl(c.to!)} className="uppercase hover:text-ink-900">
                      {c.label}
                    </button>
                  ) : (
                    <span className="text-ink-900">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-ink-900">
              {level.kind === "root" ? "Aurum Platform" : level.kind === "fund" ? "Fund Solution" : gpById(level.gpId)!.name}
            </h1>
            <p className="mt-1 text-[14px] text-stone-600">
              {level.kind === "root"
                ? "Hover to preview, select to enter. Fund Solution opens your GP clients."
                : level.kind === "fund"
                  ? "Hover a GP to preview it; select it to work inside its book. Select the centre to go back."
                  : "Everything here is limited to this GP’s funds and investors. Select the centre to go back."}
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center py-6">
            <HexNav
              key={level.kind === "gp" ? level.gpId : level.kind}
              cells={cells}
              center={center}
              centerLabel={centerLabel}
              revealOnHover={level.kind === "root"}
              accent={accent}
              outlineColor={level.kind === "gp" ? gpById(level.gpId)!.brand.secondary : "#F8C618"}
              onHover={setHovered}
              onCenterClick={() => setLvl(level.kind === "gp" ? { kind: "fund" } : { kind: "root" })}
            />
          </div>
        </section>

        <aside className="space-y-4 lg:pt-[96px]">
          {level.kind === "root" &&
            (hoveredSolution?.id === "fund" ? (
              <div className="rounded-[4px] border border-stone-200 bg-white">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">Solution</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-700">Live</span>
                  </div>
                  <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.015em]">Fund Solution</h2>
                  <p className="mt-1 text-[13px] text-stone-600">
                    {gps.length} GP clients · {moneyShort(totalNav)} NAV under administration
                  </p>
                </div>
                <ul className="divide-y divide-stone-100 border-t border-stone-100">
                  {orderedGps.map((g) => (
                    <li key={g.id} className="flex items-center gap-3 px-6 py-2">
                      <span className="flex w-6 justify-center">
                        <GpMark gp={g} size={18} />
                      </span>
                      <span className="flex-1 truncate text-[13px] font-medium">{g.name}</span>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-stone-100 px-6 py-3 text-[12px] font-semibold">Select to open →</p>
              </div>
            ) : (
              <div className="rounded-[4px] border border-stone-200 bg-white p-6">
                {hoveredSolution ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="eyebrow">Solution</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Coming soon</span>
                    </div>
                    <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.015em]">{hoveredSolution.name}</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{hoveredSolution.summary}</p>
                  </>
                ) : (
                  <>
                    <span className="eyebrow">Client Portal</span>
                    <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.015em]">Six solutions, one client record</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
                      Every solution shares the same clients, entities, documents and permissions. Fund Solution is live; the remaining
                      solutions are in build.
                    </p>
                  </>
                )}
              </div>
            ))}

          {level.kind === "fund" &&
            (hoveredGp ? (
              <GpPreview gp={hoveredGp} hint />
            ) : (
              <>
                <div className="rounded-[4px] border border-stone-200 bg-white p-6">
                  <span className="eyebrow">Fund Solution · all clients</span>
                  <div className="num mt-3 text-[26px] font-medium tracking-[-0.02em]">{moneyShort(totalNav)}</div>
                  <div className="text-[12px] text-stone-500">Net asset value under administration</div>
                  <div className="eyebrow mt-6">Across all clients</div>
                  <ul className="mt-2 grid grid-cols-2 gap-x-4">
                    {crossClient.map(([l, h]) => (
                      <li key={h}>
                        <Link href={h} className="flex items-center justify-between border-b border-stone-100 py-2 text-[13px] text-ink-800 hover:text-ink-900">
                          {l} <ArrowRight size={12} className="text-stone-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/admin/fund/gps/new"
                  className="flex items-center justify-between rounded-[4px] border border-dashed border-stone-300 bg-white px-5 py-4 text-[13px] font-semibold hover:border-ink-900"
                >
                  <span className="flex items-center gap-2">
                    <Plus size={15} strokeWidth={2} /> New GP client
                  </span>
                  <ArrowRight size={14} className="text-stone-400" />
                </Link>
              </>
            ))}

          {level.kind === "gp" &&
            (() => {
              const gp = gpById(level.gpId)!;
              if (hoveredModule)
                return (
                  <div className="rounded-[4px] border border-stone-200 bg-white p-6">
                    <span className="eyebrow">{gp.shortName}</span>
                    <h2 className="mt-3 text-[20px] font-semibold tracking-[-0.015em]">{hoveredModule.lines.join(" ")}</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{hoveredModule.summary}</p>
                  </div>
                );
              return (
                <>
                  <GpPreview gp={gp} />
                  <div className="rounded-[4px] border border-stone-200 bg-white p-5">
                    <div className="text-[13px] font-semibold">White-labeled portals</div>
                    <div className="mt-1 font-mono text-[11px] text-stone-500">{gp.customDomain ?? gp.portalDomain}</div>
                    <div className="mt-4 grid gap-2">
                      <Link href={`/gp/${gp.id}`} className="flex items-center justify-between rounded-[3px] border border-stone-200 px-3 py-2.5 text-[13px] font-semibold hover:border-ink-900">
                        View GP portal <ExternalLink size={13} />
                      </Link>
                      <Link
                        href={`/investor/${gp.id}/login`}
                        className="flex items-center justify-between rounded-[3px] border border-stone-200 px-3 py-2.5 text-[13px] font-semibold hover:border-ink-900"
                      >
                        View as investor <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                </>
              );
            })()}
        </aside>
      </div>
    </main>
  );
}
