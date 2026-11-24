"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LineChart,
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  BookOpen,
  Briefcase,
  Scale,
  Building2,
  ChevronsUpDown,
  FileText,
  Landmark,
  LayoutGrid,
  UserPlus,
  Users,
} from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo, AurumMark } from "@/components/brand/Logo";
import { firmModules } from "@/lib/firm";
import { onboarding } from "@/lib/data";

const openFiles = onboarding.filter((o) => o.status === "Submitted" || o.status === "Changes requested").length;

const groups = [
  {
    label: null,
    items: [
      { href: "/admin/fund", label: "Overview", icon: LayoutGrid, exact: true },
      { href: "/admin/fund/analytics", label: "Analytics", icon: LineChart },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/fund/gps", label: "GPs", icon: Briefcase },
      { href: "/admin/fund/funds", label: "Funds", icon: Building2 },
      { href: "/admin/fund/investors", label: "Investors", icon: Users },
      { href: "/admin/fund/onboarding", label: "Onboarding", icon: UserPlus, badge: openFiles },
    ],
  },
  {
    label: "Capital activity",
    items: [
      { href: "/admin/fund/capital-calls", label: "Capital calls", icon: ArrowDownToLine },
      { href: "/admin/fund/distributions", label: "Distributions", icon: ArrowUpFromLine },
    ],
  },
  {
    label: "Accounting",
    items: [
      { href: "/admin/fund/accounting", label: "General ledger", icon: BookOpen },
      { href: "/admin/fund/transfers", label: "Transfers", icon: ArrowLeftRight },
      { href: "/admin/fund/closes", label: "Closes & equalization", icon: Scale },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/admin/fund/documents", label: "Documents", icon: FileText },
      { href: "/admin/fund/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/fund/banking", label: "Banking", icon: Landmark },
    ],
  },
];

export function FundSidebar() {
  const path = usePathname();
  return (
    <div className="shrink-0 p-3 pr-0">
      <nav className="flex h-full w-[236px] flex-col rounded-[18px] border border-stone-200 bg-cream text-ink-900 shadow-card">
        <Link href="/admin" aria-label="Aurum home" className="block px-5 pb-4 pt-5">
          <AurumLogo variant="dark" height={40} priority />
        </Link>
        <div className="px-3">
          <button className="flex w-full items-center justify-between rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-left hover:border-stone-300">
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700">Fund Solution</span>
              <span className="block text-[13px] font-semibold text-ink-900">All vehicles</span>
            </span>
            <ChevronsUpDown size={14} strokeWidth={1.8} className="text-stone-400" />
          </button>
        </div>
        <div className="scroll-quiet flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g, gi) => (
            <div key={gi} className={gi > 0 ? "mt-5" : ""}>
              {g.label && <div className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">{g.label}</div>}
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = "exact" in it && it.exact ? path === it.href : path.startsWith(it.href);
                  const Icon = it.icon;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cx(
                          "flex items-center gap-2.5 rounded-[10px] px-2.5 py-[8px] text-[13px] transition-colors",
                          active ? "bg-champagne font-semibold text-ink-900 shadow-[inset_0_0_0_1px_rgba(184,151,90,0.45)]" : "text-stone-600 hover:bg-stone-100 hover:text-ink-900",
                        )}
                      >
                        <Icon size={15} strokeWidth={active ? 2 : 1.6} />
                        <span className="flex-1">{it.label}</span>
                        {"badge" in it && it.badge ? (
                          <span className={cx("num rounded-[6px] px-1.5 py-px text-[10px] font-semibold", active ? "bg-champagne text-ink-900" : "bg-champagne text-ink-900")}>{it.badge}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-200 p-3">
          <div className="mb-1.5 flex items-center justify-between rounded-[12px] border border-stone-200 bg-white/70 px-2 py-1.5">
            {firmModules.map((m) => {
              const on = path.startsWith(m.href);
              return (
                <Link
                  key={m.id}
                  href={m.href}
                  title={`${m.name}${m.badge ? ` — ${m.badge} ${m.badgeLabel}` : ""}`}
                  aria-label={m.name}
                  className={cx("relative flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors", on ? "bg-white shadow-card" : "hover:bg-white")}
                >
                  <AurumMark size={16} color={m.color} className="shrink-0" />
                  {m.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8.5px] font-bold text-white ring-2 ring-cream" style={{ background: m.color }}>
                      {m.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <Link href="/admin" className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12px] font-medium text-stone-500 hover:bg-stone-100 hover:text-ink-900">
            <ArrowLeft size={14} strokeWidth={1.8} /> Aurum Platform
          </Link>
        </div>
      </nav>
    </div>
  );
}
