"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { AurumWordmark } from "@/components/brand/Logo";
import { Avatar, cx } from "@/components/ui";

const nav = [
  { href: "/portal", label: "Overview", exact: true },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/onboarding", label: "Subscriptions" },
];

export function PortalHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-10 px-8">
        <Link href="/portal">
          <AurumWordmark />
        </Link>
        <nav className="flex h-full items-stretch gap-7">
          {nav.map((n) => {
            const active = n.exact ? path === n.href : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cx(
                  "flex items-center border-b-2 text-[13px] transition-colors",
                  active ? "border-gold-400 font-semibold text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-[3px] border border-stone-200 px-3 py-1.5 text-left hover:border-stone-400">
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Investing entity</span>
              <span className="block text-[12px] font-semibold">Calloway Family Trust</span>
            </span>
            <ChevronDown size={14} className="text-stone-400" />
          </button>
          <Avatar label="MC" size={30} />
          <Link href="/login" className="text-stone-400 hover:text-ink-900" aria-label="Sign out">
            <LogOut size={16} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </header>
  );
}
