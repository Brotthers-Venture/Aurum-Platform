"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { BrandCenter, DarkCenter, HexNav, ringOrder, type Cell } from "./HexNav";
import { GpLogo, GpMark } from "@/components/brand/GpLogo";
import { solutions } from "@/lib/solutions";
import { gps, gpById } from "@/lib/gps";
import { gpTotals } from "@/lib/gpData";
import { capitalCalls, funds, fundTotals, investors, onboarding, toUSD } from "@/lib/data";
import { moneyShort } from "@/lib/format";
import { cx } from "@/components/ui";

type Level = { kind: "root" } | { kind: "fund" } | { kind: "gp"; gpId: string };

const fundModules = [
  {
    id: "gps",
    lines: ["GPs"] as [string],
    href: "/admin/fund/gps",
    summary: "Fund managers Aurum administers for. Each has its own white-labeled GP and investor portals.",
  },
  { id: "funds", lines: ["Funds"] as [string], href: "/admin/fund/funds", summary: "Every vehicle under administration, with terms, capital accounts and performance." },
  { id: "investors", lines: ["Investors"] as [string], href: "/admin/fund/investors", summary: "Investor master records, KYC status and profile change requests across all GPs." },
  { id: "onboarding", lines: ["Onboarding"] as [string], href: "/admin/fund/onboarding", summary: "Subscription pipeline: invitations, documents, KYC/AML review and countersignature." },
  {
    id: "capital",
    lines: ["Capital calls &", "Distributions"] as [string, string],
    href: "/admin/fund/capital-calls",
    summary: "Prepare, approve and issue calls and distributions; track receipts against the bank.",
  },
  { id: "reports", lines: ["Reports"] as [string], href: "/admin/fund/reports", summary: "Capital account statements, investor reports, ILPA templates, K-1 and CVM packages." },
];

export function AdminHub() {
  const [level, setLevel] = useState<Level>({ kind: "root" });
  const [hovered, setHovered] = useState<string | null>(null);

  const totalNav = funds.reduce((a, f) => a + toUSD(fundTotals(f.id).nav, f.currency), 0);
  const counts: Record<string, string> = {
    gps: `${gps.length} CLIENTS`,
    funds: `${funds.length} VEHICLES`,
    investors: `${investors.length} INVESTORS`,
    onboarding: `${onboarding.filter((o) => o.status === "Submitted" || o.status === "Changes requested").length} TO REVIEW`,
    capital: `${capitalCalls.filter((c) => c.status !== "Funded").length} OPEN`,
    reports: "STATEMENTS",
  };

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
      sub: s.live ? "LIVE" : "COMING SOON",
      subTone: s.live ? "accent" : "muted",
      outline: s.live,
      ...(s.id === "fund" ? { onSelect: () => setLvl({ kind: "fund" }) } : { href: s.href }),
    }));
    center = (open: boolean) => <DarkCenter lines={["Client", "Portal"]} expanded={open} />;
    centerLabel = "Client Portal — show solutions";
  } else if (level.kind === "fund") {
    cells = fundModules.map((m, i) => ({
      id: m.id,
      slot: ringOrder[i],
      lines: m.lines,
      sub: counts[m.id],
      subTone: m.id === "gps" ? "accent" : "muted",
      outline: m.id === "gps",
      href: m.href,
    }));
    center = <DarkCenter lines={["Fund", "Solution"]} />;
    centerLabel = "Fund Solution — back to Client Portal";
  } else {
    const gp = gpById(level.gpId)!;
    const t = gpTotals(gp.id);
    const base = `/admin/fund/gps/${gp.id}`;
    const gpCells: [string, [string, string?], string, string][] = [
      ["funds", ["Funds"], `${t.funds} VEHICLES`, `${base}/funds`],
      ["investors", ["Investors"], `${t.investors} INVESTORS`, `${base}/investors`],
      ["onboarding", ["Onboarding"], `${t.onboarding} OPEN`, `${base}/onboarding`],
      ["capital", ["Capital calls &", "Distributions"], `${t.openCalls} OPEN`, `${base}/capital`],
      ["reports", ["Reports"], "DOCUMENTS", `${base}/reports`],
      ["portal", ["Portal &", "Brand"], gp.status === "Live" ? "LIVE" : "SETTING UP", `${base}/portal`],
    ];
    cells = gpCells.map(([id, lines, sub, href], i) => ({ id, slot: ringOrder[i], lines, sub, href }));
    center = (
      <BrandCenter color={gp.brand.primary}>
        <GpLogo gp={gp} height={gp.logo && gp.logo.width / gp.logo.height < 3 ? 52 : 26} />
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

  const activeSolution = level.kind === "root" && hovered ? solutions.find((s) => s.id === hovered) : null;
  const activeModule = level.kind === "fund" && hovered ? fundModules.find((m) => m.id === hovered) : null;

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
                ? "Hover over the Client Portal to open the solutions. Select a solution to enter it."
                : level.kind === "fund"
                  ? "Work across every client, or select a GP to work inside its book. Select the centre to go back."
                  : "Everything below is limited to this GP’s funds and investors. Select the centre to go back."}
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
              onHover={setHovered}
              onCenterClick={() => setLvl(level.kind === "gp" ? { kind: "fund" } : { kind: "root" })}
            />
          </div>
        </section>

        <aside className="space-y-4 lg:pt-[96px]">
          {level.kind === "root" && (
            <div className="rounded-[4px] border border-stone-200 bg-white p-6">
              {activeSolution ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">Solution</span>
                    <span className={cx("text-[10px] font-semibold uppercase tracking-[0.16em]", activeSolution.live ? "text-gold-700" : "text-stone-400")}>
                      {activeSolution.live ? "Live" : "Coming soon"}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.015em]">{activeSolution.name}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{activeSolution.summary}</p>
                  <p className="mt-5 text-[12px] font-semibold text-ink-900">{activeSolution.live ? "Select to open its modules →" : "Select to view the roadmap →"}</p>
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
          )}

          {level.kind === "fund" && (
            <>
              <div className="rounded-[4px] border border-stone-200 bg-white p-6">
                {activeModule ? (
                  <>
                    <span className="eyebrow">Module</span>
                    <h2 className="mt-3 text-[20px] font-semibold tracking-[-0.015em]">{activeModule.lines.join(" ")}</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{activeModule.summary}</p>
                  </>
                ) : (
                  <>
                    <span className="eyebrow">Fund Solution · all clients</span>
                    <div className="num mt-3 text-[26px] font-medium tracking-[-0.02em]">{moneyShort(totalNav)}</div>
                    <div className="text-[12px] text-stone-500">Net asset value under administration</div>
                  </>
                )}
              </div>
              <div className="rounded-[4px] border border-stone-200 bg-white">
                <div className="border-b border-stone-200 px-5 py-3 text-[13px] font-semibold">Work inside a GP</div>
                <ul className="divide-y divide-stone-100">
                  {gps.map((g) => {
                    const t = gpTotals(g.id);
                    return (
                      <li key={g.id}>
                        <button onClick={() => setLvl({ kind: "gp", gpId: g.id })} className="group flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-stone-50">
                          <span className="flex w-7 justify-center">
                            <GpMark gp={g} size={22} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold">{g.name}</span>
                            <span className="num block text-[11px] text-stone-500">
                              {t.funds ? `${t.funds} fund${t.funds > 1 ? "s" : ""} · ${moneyShort(t.nav)} NAV` : "No funds yet"}
                              {g.status === "Onboarding" ? " · onboarding" : ""}
                            </span>
                          </span>
                          <ArrowRight size={14} className="text-stone-300 group-hover:text-ink-900" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          {level.kind === "gp" &&
            (() => {
              const gp = gpById(level.gpId)!;
              const t = gpTotals(gp.id);
              return (
                <>
                  <div className="rounded-[4px] border border-stone-200 bg-white p-6">
                    <span className="eyebrow">GP client · since {gp.clientSince.slice(0, 4)}</span>
                    <div className="mt-4">
                      <GpLogo gp={gp} height={gp.logo && gp.logo.width / gp.logo.height < 3 ? 48 : 30} />
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-stone-100 pt-4 text-[13px]">
                      {[
                        ["Funds", String(t.funds)],
                        ["Investors", String(t.investors)],
                        ["Commitments", moneyShort(t.commitment)],
                        ["NAV", moneyShort(t.nav)],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[11px] uppercase tracking-[0.08em] text-stone-500">{k}</dt>
                          <dd className="num mt-0.5 text-[17px] font-medium">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
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
