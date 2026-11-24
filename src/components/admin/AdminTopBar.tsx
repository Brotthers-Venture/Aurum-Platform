import Link from "next/link";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { AurumWordmark } from "@/components/brand/Logo";
import { RoleSwitcher } from "./PreviewRole";

export function AdminTopBar({ context }: { context?: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-6">
      <div className="flex items-center gap-5">
        <Link href="/admin" aria-label="Aurum home">
          <AurumWordmark />
        </Link>
        <span className="h-5 w-px bg-stone-200" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          {context ?? "Administration"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search size={14} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            placeholder="Search funds, investors, documents"
            className="h-8 w-[300px] rounded-[3px] border border-stone-200 bg-stone-50 pl-8 pr-12 text-[13px] placeholder:text-stone-400 focus:border-ink-900 focus:bg-white focus:outline-none"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[2px] border border-stone-200 bg-white px-1.5 font-mono text-[10px] text-stone-500">
            ⌘K
          </kbd>
        </div>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-[3px] text-stone-500 hover:bg-stone-100 hover:text-ink-900" aria-label="Notifications">
          <Bell size={16} strokeWidth={1.6} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold-400" />
        </button>
        <Link
          href="/admin/access"
          className="flex h-8 items-center gap-1.5 rounded-[3px] px-2 text-[12px] font-medium text-stone-500 hover:bg-stone-100 hover:text-ink-900"
        >
          <ShieldCheck size={15} strokeWidth={1.6} /> Access
        </Link>
        <RoleSwitcher />
      </div>
    </header>
  );
}
