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
    <nav className="flex w-[232px] shrink-0 flex-col bg-ink-900 text-white">
      <div className="border-b border-white/10 p-3">
        <button className="flex w-full items-center justify-between rounded-[3px] border border-white/15 px-3 py-2 text-left hover:border-gold-400/60">
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-400">Fund Solution</span>
            <span className="block text-[13px] font-semibold text-white">All vehicles</span>
          </span>
          <ChevronsUpDown size={14} strokeWidth={1.8} className="text-white/40" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {g.label && <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{g.label}</div>}
            <ul className="space-y-px">
              {g.items.map((it) => {
                const active = "exact" in it && it.exact ? path === it.href : path.startsWith(it.href);
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cx(
                        "relative flex items-center gap-2.5 rounded-[3px] px-2 py-[7px] text-[13px] transition-colors",
                        active ? "bg-white/[0.07] font-semibold text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      {active && <span className="absolute -left-3 top-1 bottom-1 w-[3px] bg-gold-400" />}
                      <Icon size={15} strokeWidth={active ? 2 : 1.6} className={active ? "text-gold-400" : ""} />
                      <span className="flex-1">{it.label}</span>
                      {"badge" in it && it.badge ? (
                        <span className="num rounded-[2px] bg-gold-400 px-1.5 py-px text-[10px] font-semibold text-ink-900">{it.badge}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <Link href="/admin" className="flex items-center gap-2 rounded-[3px] px-2 py-2 text-[12px] font-medium text-white/50 hover:bg-white/[0.04] hover:text-white">
          <ArrowLeft size={14} strokeWidth={1.8} /> Aurum Platform
        </Link>
      </div>
    </nav>
  );
}
