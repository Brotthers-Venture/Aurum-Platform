import Link from "next/link";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { AurumWordmark } from "@/components/brand/Logo";
import { RoleSwitcher } from "./PreviewRole";

/** Aurum chrome: black bar, gold rule — the administrator's own brand. */
export function AdminTopBar({ context }: { context?: string }) {
  return (
    <header className="relative z-20 bg-ink-950 text-white">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <Link href="/admin" aria-label="Aurum home">
            <AurumWordmark tone="light" />
          </Link>
          <span className="h-5 w-px bg-white/15" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-400">{context ?? "Administration"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              placeholder="Search funds, investors, documents"
              className="h-8 w-[300px] rounded-[3px] border border-white/10 bg-white/[0.06] pl-8 pr-12 text-[13px] text-white placeholder:text-white/40 focus:border-gold-400 focus:bg-white/10 focus:outline-none"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[2px] border border-white/15 px-1.5 font-mono text-[10px] text-white/50">⌘K</kbd>
          </div>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-[3px] text-white/60 hover:bg-white/10 hover:text-white" aria-label="Notifications">
            <Bell size={16} strokeWidth={1.6} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-400" />
          </button>
          <Link
            href="/admin/access"
            className="flex h-8 items-center gap-1.5 rounded-[3px] px-2 text-[12px] font-medium text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ShieldCheck size={15} strokeWidth={1.6} /> Access
          </Link>
          <RoleSwitcher />
        </div>
      </div>
      <div className="h-[2px] bg-gradient-to-r from-gold-400 via-gold-500 to-gold-700" />
    </header>
  );
}
