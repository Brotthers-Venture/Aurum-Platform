"use client";

import { ModuleName } from "@/components/brand/ModuleName";
import { TenantName } from "@/components/brand/TenantName";
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
import { AurumMark } from "@/components/brand/Logo";
import { totalUnread } from "@/lib/comms";
import { FIRM } from "@/lib/firm-colors";
import { onboarding } from "@/lib/data";

const COMM = FIRM.communication;
const unread = totalUnread();
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
    <nav aria-label="Fund Solution" className="hidden w-[232px] shrink-0 flex-col border-r border-d-line bg-d-chrome text-[13px] md:flex">
      <div className="px-3 pb-2 pt-3">
        <button type="button" className="flex w-full items-center justify-between rounded-[6px] border border-d-line bg-d-surface px-2.5 py-2 text-left hover:border-d-line-strong">
          <span className="min-w-0">
            <span className="block text-[11px] text-d-text-3">Fund Solution</span>
            <span className="block truncate font-medium text-d-text">All vehicles</span>
          </span>
          <ChevronsUpDown size={14} strokeWidth={1.8} className="text-d-text-3" />
        </button>
      </div>
      <div className="scroll-quiet flex-1 overflow-y-auto px-2 pb-3">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : "mt-1"}>
            {g.label && <div className="px-2.5 pb-1 text-[11px] font-medium text-d-text-3">{g.label}</div>}
            <ul>
              {g.items.map((it) => {
                const active = "exact" in it && it.exact ? path === it.href : path.startsWith(it.href);
                const Icon = it.icon;
                return (
                  <li key={it.href} className="relative">
                    {active && <span aria-hidden className="absolute -left-2 top-1.5 bottom-1.5 w-[2px] rounded-full bg-d-accent-fill" />}
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex h-[30px] items-center gap-2.5 rounded-[5px] px-2.5 transition-colors",
                        active ? "bg-d-raise font-medium text-d-text" : "text-d-text-2 hover:bg-d-raise hover:text-d-text",
                      )}
                    >
                      <Icon size={15} strokeWidth={1.7} className={active ? "text-d-text" : "text-d-text-3"} />
                      <span className="flex-1 truncate">{it.label}</span>
                      {"badge" in it && it.badge ? <span className="tnum text-[11.5px] text-d-text-3">{it.badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-d-line p-2">
        <Link
          href="/admin/communication"
          className="flex h-[30px] items-center gap-2.5 rounded-[5px] px-2.5 text-d-text-2 transition-colors hover:bg-d-raise hover:text-d-text"
        >
          <AurumMark size={15} color={COMM} className="shrink-0" />
          <span className="flex-1 truncate">
            <ModuleName id="communication" />
          </span>
          {unread > 0 && <span className="tnum text-[11.5px] font-medium text-d-text">{unread}</span>}
        </Link>
        <Link href="/admin" className="flex h-[30px] items-center gap-2.5 rounded-[5px] px-2.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
          <ArrowLeft size={14} strokeWidth={1.8} /> <TenantName /> ecosystem
        </Link>
      </div>
    </nav>
  );
}
