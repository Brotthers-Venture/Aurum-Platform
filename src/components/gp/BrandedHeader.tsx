"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { GpLogo } from "@/components/brand/GpLogo";
import { AurumMark } from "@/components/brand/Logo";
import { Avatar, cx } from "@/components/ui";
import type { GpClient } from "@/lib/gps";
import type { ReactNode } from "react";

/** Header for white-labeled portals: the GP's logo, the GP's colour, no Aurum chrome. */
export function BrandedHeader({
  gp,
  nav,
  userName,
  userTitle,
  right,
}: {
  gp: GpClient;
  nav: { href: string; label: ReactNode; exact?: boolean; mark?: string }[];
  userName: string;
  userTitle: string;
  right?: ReactNode;
}) {
  const path = usePathname();
  const tall = gp.logo && gp.logo.width / gp.logo.height < 3;
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="h-[3px] bg-brand-2" />
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-10 px-8">
        <Link href={nav[0].href} className="flex items-center">
          <GpLogo gp={gp} height={tall ? 40 : 24} />
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
                  active ? "border-brand font-semibold text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900",
                )}
              >
                {n.mark && <AurumMark size={13} color={n.mark} className="mr-1.5 shrink-0" />}
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {right}
          <div className="flex items-center gap-2.5">
            <Avatar
              label={userName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
              size={30}
            />
            <span className="hidden leading-tight md:block">
              <span className="block text-[12px] font-semibold">{userName}</span>
              <span className="block text-[11px] text-stone-500">{userTitle}</span>
            </span>
          </div>
          <Link href="/login" className="text-stone-400 hover:text-ink-900" aria-label="Sign out">
            <LogOut size={16} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </header>
  );
}
