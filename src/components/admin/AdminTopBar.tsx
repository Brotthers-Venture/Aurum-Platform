import Link from "next/link";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { AurumLogo } from "@/components/brand/Logo";
import { RoleSwitcher } from "./PreviewRole";

/**
 * Light top bar on the ivory canvas. Inside Fund Solution the logo lives in the floating
 * sidebar, so the bar shows only the context; on standalone pages it carries the logo.
 */
export function AdminTopBar({ context, logo = true }: { context?: string; logo?: boolean }) {
  return (
    <header className="relative z-20">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-5">
          {logo && (
            <>
              <Link href="/admin" aria-label="Aurum home">
                <AurumLogo variant="dark" height={34} priority />
              </Link>
              <span className="h-5 w-px bg-stone-300" />
            </>
          )}
          {logo && <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{context ?? "Administration"}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              placeholder="Search funds, investors, documents"
              className="h-9 w-[320px] rounded-[10px] border border-stone-200 bg-white pl-8 pr-12 text-[13px] text-ink-900 shadow-card placeholder:text-stone-400 focus:border-ink-900 focus:outline-none"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[4px] border border-stone-200 px-1.5 font-mono text-[10px] text-stone-400">⌘K</kbd>
          </div>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-stone-500 hover:bg-white hover:text-ink-900" aria-label="Notifications">
            <Bell size={16} strokeWidth={1.6} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-500" />
          </button>
          <Link href="/admin/access" className="flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-medium text-stone-500 hover:bg-white hover:text-ink-900">
            <ShieldCheck size={15} strokeWidth={1.6} /> Access
          </Link>
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
