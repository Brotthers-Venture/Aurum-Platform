"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, FileText, FolderLock, Landmark, Search, Users, Wallet, type LucideIcon } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { moduleName } from "@/lib/brand";
import { capitalCalls, documents, funds, investors } from "@/lib/data";
import { gps } from "@/lib/gps";
import { rooms } from "@/lib/dataroom";
import { formations } from "@/lib/formation";
import { FAMILIES } from "@/lib/wealth";
import { allows, hexaHref } from "@/lib/hexa";
import { useHexas } from "./useHexas";

type Hit = { id: string; group: string; label: string; detail?: string; href: string; Icon: LucideIcon; keys: string };

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fundName = (id: string) => funds.find((f) => f.id === id)?.shortName ?? id;

/** Everything a person can open, limited to the workspaces they have access to. */
function useIndex(): Hit[] {
  const { allow, list, member } = useHexas();
  const { brand } = useBrand();
  return useMemo(() => {
    const hits: Hit[] = [];
    // workspaces and their pages
    for (const h of list) {
      const name = h.firm ? moduleName(brand, h.firm) : h.name;
      hits.push({ id: `ws-${h.id}`, group: "Go to", label: name, href: hexaHref(h, member), Icon: ArrowRight, keys: name });
      if (member.party === "employee")
        for (const p of h.pages)
          hits.push({ id: `pg-${p.href}`, group: "Go to", label: `${name} · ${p.label}`, href: p.href, Icon: ArrowRight, keys: `${name} ${p.group ?? ""} ${p.label}` });
    }
    const staff = member.party === "employee" || member.party === "tenant";
    if (allows(allow, "fund") && member.party === "employee") {
      gps.forEach((g) =>
        hits.push({ id: `gp-${g.id}`, group: "GPs", label: g.name, detail: g.shortName, href: `/admin/fund/gps/${g.id}`, Icon: Landmark, keys: `${g.name} ${g.shortName}` }),
      );
      funds.forEach((f) =>
        hits.push({
          id: `fd-${f.id}`,
          group: "Funds",
          label: f.name,
          detail: `${f.gp} · ${f.status} · ${f.currency}`,
          href: `/admin/fund/funds/${f.id}`,
          Icon: Wallet,
          keys: `${f.name} ${f.shortName} ${f.gp} ${f.strategy}`,
        }),
      );
      investors.forEach((i) =>
        hits.push({
          id: `in-${i.id}`,
          group: "Investors",
          label: i.name,
          detail: `${i.type} · ${i.contact}`,
          href: `/admin/fund/investors?q=${encodeURIComponent(i.name)}&view=investor`,
          Icon: Users,
          keys: `${i.name} ${i.contact} ${i.email}`,
        }),
      );
      capitalCalls
        .slice(0, 40)
        .forEach((c) =>
          hits.push({
            id: `cc-${c.id}`,
            group: "Capital calls",
            label: `Capital call No. ${c.number}`,
            detail: `${fundName(c.fundId)} · due ${c.dueDate}`,
            href: `/admin/fund/capital-calls/${c.id}`,
            Icon: Wallet,
            keys: `capital call ${c.number} ${fundName(c.fundId)}`,
          }),
        );
      documents.forEach((d) =>
        hits.push({
          id: `dc-${d.id}`,
          group: "Documents",
          label: d.name,
          detail: `${fundName(d.fundId)} · ${d.category}`,
          href: "/admin/fund/documents",
          Icon: FileText,
          keys: `${d.name} ${d.category} ${fundName(d.fundId)}`,
        }),
      );
    }
    if (allows(allow, "corporate") && staff)
      formations.forEach((f) =>
        hits.push({
          id: `co-${f.ref}`,
          group: "Companies",
          label: f.company,
          detail: `${f.jurisdiction} · ${f.client}`,
          href: "/admin/corporate",
          Icon: Building2,
          keys: `${f.company} ${f.client} ${f.jurisdiction} ${f.ref}`,
        }),
      );
    if (allows(allow, "multi-family") && staff)
      FAMILIES.filter((f) => member.party === "employee" || f.tenantId === member.org).forEach((f) =>
        hits.push({
          id: `fm-${f.id}`,
          group: "Families",
          label: f.name,
          detail: f.rm.name,
          href: `/admin/multi-family/${f.id}`,
          Icon: Users,
          keys: `${f.name} ${f.entities.map((e) => e.name).join(" ")}`,
        }),
      );
    if (allows(allow, "dataroom") && member.party === "employee")
      rooms.forEach((r) =>
        hits.push({
          id: `dr-${r.id}`,
          group: "Data rooms",
          label: r.name,
          detail: `${r.client} · ${r.status}`,
          href: `/admin/dataroom?room=${r.id}`,
          Icon: FolderLock,
          keys: `${r.name} ${r.client} ${r.purpose}`,
        }),
      );
    return hits;
  }, [allow, list, member, brand]);
}

/** Search across funds, investors, GPs, companies, families, data rooms, documents and pages. Ctrl K or ⌘K. */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const index = useIndex();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return index.filter((h) => h.group === "Go to" && !h.id.startsWith("pg-")).concat(index.filter((h) => h.group === "Funds").slice(0, 4));
    const scored = index
      .map((h) => {
        const k = fold(`${h.label} ${h.keys}`);
        if (!words.every((w) => k.includes(w))) return null;
        const l = fold(h.label);
        return { h, s: (l.startsWith(words[0]) ? 0 : l.includes(words[0]) ? 1 : 2) + (h.group === "Go to" ? 0.5 : 0) };
      })
      .filter((x): x is { h: Hit; s: number } => !!x)
      .sort((a, b) => a.s - b.s);
    // keep groups together, in order of their best hit
    const order: string[] = [];
    scored.forEach(({ h }) => !order.includes(h.group) && order.push(h.group));
    return order.flatMap((g) =>
      scored
        .filter((x) => x.h.group === g)
        .slice(0, 6)
        .map((x) => x.h),
    );
  }, [q, index]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a fresh search each time it opens
    setQ("");
    setI(0);
    requestAnimationFrame(() => input.current?.focus());
  }, [open]);
  useEffect(() => {
    list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }, [i]);

  if (!open) return null;
  const go = (h?: Hit) => {
    if (!h) return;
    onClose();
    router.push(h.href);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-black/35" />
      <div className="picker-in relative w-full max-w-[640px] overflow-hidden rounded-[10px] bg-d-raise shadow-[0_24px_64px_rgba(0,0,0,0.38)] ring-1 ring-d-line-strong">
        <label className="flex h-14 items-center gap-3 border-b border-d-line px-4">
          <Search size={18} className="shrink-0 text-d-text-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((n) => Math.min(n + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((n) => Math.max(n - 1, 0));
              } else if (e.key === "Enter") go(results[i]);
            }}
            placeholder="Search funds, investors, companies, families, documents…"
            aria-label="Search"
            aria-activedescendant={results[i] ? `gs-${i}` : undefined}
            style={{ outline: "none", boxShadow: "none" }}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-d-text placeholder:text-d-text-3 focus:outline-none focus-visible:outline-none"
          />
          <kbd className="rounded-[4px] border border-d-line px-1.5 text-[11px] text-d-text-3">Esc</kbd>
        </label>
        <div ref={list} role="listbox" className="max-h-[min(460px,60vh)] overflow-y-auto p-1.5">
          {results.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-d-text-3">Nothing matches “{q}”. Try a fund, an investor, a company or a page name.</p>}
          {results.map((h, n) => {
            const head = n === 0 || results[n - 1].group !== h.group ? h.group : null;
            return (
              <div key={h.id}>
                {head && <div className="px-2.5 pb-1 pt-2.5 text-[11.5px] text-d-text-3">{head}</div>}
                <button
                  id={`gs-${n}`}
                  data-i={n}
                  role="option"
                  aria-selected={n === i}
                  onMouseMove={() => setI(n)}
                  onClick={() => go(h)}
                  className={cx("flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left", n === i && "bg-d-surface")}
                >
                  <h.Icon size={15} strokeWidth={1.7} className="shrink-0 text-d-text-3" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-d-text">{h.label}</span>
                    {h.detail && <span className="block truncate text-[12px] text-d-text-3">{h.detail}</span>}
                  </span>
                  {n === i && <span className="text-[11.5px] text-d-text-3">Open ↵</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 border-t border-d-line px-4 py-2 text-[11.5px] text-d-text-3">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span className="ml-auto">Only what you have access to</span>
        </div>
      </div>
    </div>
  );
}
