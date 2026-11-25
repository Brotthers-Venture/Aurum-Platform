"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Palette, ChevronDown, ChevronUp, CircleHelp, EllipsisVertical, Grip, LogOut, Plus, Search, ShieldCheck, UserCog, X } from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo, AurumMark } from "@/components/brand/Logo";
import { roles, users, roleById } from "@/lib/access";
import { solutions } from "@/lib/solutions";
import { firmModules } from "@/lib/firm";
import { usePreviewRole } from "./PreviewRole";
import { useBrand } from "@/components/brand/BrandProvider";
import { ModuleName } from "@/components/brand/ModuleName";

/** Close a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function RoundButton({ label, onClick, active, children }: { label: string; onClick: () => void; active: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={active}
      className={cx("flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-200/70", active && "bg-stone-200/70")}
    >
      {children}
    </button>
  );
}

/**
 * The hub's top bar, kept as quiet as a search engine's home page: the mark on the left, one search
 * field in the middle, and on the right a menu, an app launcher and the account.
 */
export function HubTopBar({ context, logo = true }: { context?: string; logo?: boolean } = {}) {
  const [open, setOpen] = useState<null | "menu" | "apps" | "account">(null);
  const close = () => setOpen(null);
  const ref = useDismiss(open !== null, close);
  const toggle = (k: "menu" | "apps" | "account") => setOpen((o) => (o === k ? null : k));
  const { role, setRole, user } = usePreviewRole();
  const [roleList, setRoleList] = useState(false);
  const { brand } = useBrand();
  const email = (users.find((u) => u.role === role)?.email ?? "admin@aurumasset.us").replace("aurumasset.us", brand.domain);

  return (
    <header className="relative z-30 grid h-16 grid-cols-[1fr_minmax(0,640px)_1fr] items-center gap-6 px-5">
      <div className="flex min-w-0 items-center gap-4 justify-self-start">
        {logo && (
          <Link href="/admin" aria-label="Home" className="shrink-0">
            <AurumLogo variant="dark" height={30} priority />
          </Link>
        )}
        {logo && context && <span className="h-5 w-px shrink-0 bg-stone-300" />}
        {context && <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{context}</span>}
      </div>

      <label className="flex h-11 items-center gap-3 rounded-full border border-stone-200 bg-white px-5 shadow-[0_1px_6px_rgba(32,33,36,0.08)] transition-shadow focus-within:shadow-[0_1px_10px_rgba(32,33,36,0.16)] hover:shadow-[0_1px_10px_rgba(32,33,36,0.14)]">
        <Search size={18} className="text-stone-500" />
        <input placeholder="Search funds, investors, documents" className="h-full w-full bg-transparent text-[14px] text-ink-900 placeholder:text-stone-500 focus:outline-none" />
        <kbd className="rounded-[5px] border border-stone-200 px-1.5 font-mono text-[10px] text-stone-400">⌘K</kbd>
      </label>

      <div ref={ref} className="relative flex items-center gap-1 justify-self-end">
        <RoundButton label="More" onClick={() => toggle("menu")} active={open === "menu"}>
          <EllipsisVertical size={20} />
        </RoundButton>
        <RoundButton label="Apps" onClick={() => toggle("apps")} active={open === "apps"}>
          <Grip size={20} />
        </RoundButton>
        <button
          onClick={() => toggle("account")}
          aria-label={`Account: ${user.name}`}
          aria-expanded={open === "account"}
          className="ml-1 flex h-10 w-10 items-center justify-center rounded-full p-1 hover:bg-stone-200/70"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-[14px] font-semibold text-[var(--tenant-accent)]">{user.name[0]}</span>
        </button>

        {open === "menu" && (
          <div className="absolute right-24 top-12 w-[240px] rounded-[16px] border border-stone-200 bg-white p-1.5 shadow-lift">
            {(
              [
                [Bell, "Notifications", "/admin"],
                [ShieldCheck, "Access & permissions", "/admin/access"],
                [Palette, "Brand & white label", "/admin/brand"],
                [CircleHelp, "Help", "/admin"],
              ] as const
            ).map(([Icon, label, href]) => (
              <Link key={label} href={href} onClick={close} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] text-ink-900 hover:bg-stone-100">
                <Icon size={17} className="text-stone-500" /> {label}
              </Link>
            ))}
          </div>
        )}

        {open === "apps" && (
          <div className="absolute right-12 top-12 w-[340px] rounded-[28px] bg-stone-100 p-2 shadow-lift">
            <div className="max-h-[70vh] overflow-y-auto rounded-[22px] bg-white p-3">
              <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Solutions</div>
              <div className="grid grid-cols-3 gap-1">
                {solutions.map((s) => (
                  <Link key={s.id} href={s.href} onClick={close} className="flex flex-col items-center gap-1.5 rounded-[14px] px-1 py-3 text-center hover:bg-stone-100">
                    <AurumMark size={26} color={s.live ? "var(--tenant-accent)" : "#D1C8B5"} />
                    <span className="text-[12px] leading-tight text-ink-900">{s.name.replace(" Solution", "").replace("Multi-Family Office", "Multi-Family")}</span>
                  </Link>
                ))}
              </div>
              <div className="mx-2 my-2 h-px bg-stone-200" />
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{brand.name}</div>
              <div className="grid grid-cols-3 gap-1">
                {firmModules.map((m) => (
                  <Link key={m.id} href={m.href} onClick={close} className="relative flex flex-col items-center gap-1.5 rounded-[14px] px-1 py-3 text-center hover:bg-stone-100">
                    <AurumMark size={26} color={m.color} />
                    <span className="text-[12px] leading-tight text-ink-900"><ModuleName id={m.id} /></span>
                    {m.badge > 0 && (
                      <span
                        className="absolute right-5 top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold text-white"
                        style={{ background: m.color }}
                      >
                        {m.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {open === "account" && (
          <div className="absolute right-0 top-12 w-[400px] rounded-[28px] bg-stone-100 px-3 pb-4 pt-3 shadow-lift">
            <div className="relative text-center">
              <div className="text-[12.5px] text-stone-600">Managed by {brand.domain}</div>
              <Link href="/admin/access" onClick={close} className="mt-1 inline-block text-[12.5px] font-medium text-[#2F5BB0] hover:underline">
                Admin console
              </Link>
              <button onClick={close} className="absolute right-1 top-0 flex h-8 w-8 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-[22px] bg-white">
              <button onClick={() => setRoleList((r) => !r)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-stone-50" aria-expanded={roleList}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[24px] font-semibold text-[var(--tenant-accent)]">
                  {user.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-medium text-ink-900">{user.name}</span>
                  <span className="block truncate text-[13px] text-stone-600">{email}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-stone-500">{user.title}</span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                  {roleList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              {roleList && (
                <div className="border-t border-stone-100 py-1">
                  <div className="px-5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-500">Preview the platform as</div>
                  {roles
                    .filter((r) => r.audience !== "Investor")
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setRoleList(false);
                        }}
                        className={cx("flex w-full items-center justify-between px-5 py-2 text-left text-[13px] hover:bg-stone-50", role === r.id && "font-semibold")}
                      >
                        <span>
                          {roleById(r.id).name}
                          <span className="ml-1.5 text-[11.5px] font-normal text-stone-500">{r.audience}</span>
                        </span>
                        {role === r.id && <span className="h-2 w-2 rounded-full bg-[var(--tenant-accent)]" />}
                      </button>
                    ))}
                </div>
              )}
              <Row icon={<Plus size={18} />} label="Add another account" href="/login" onClick={close} />
              <Row icon={<LogOut size={18} />} label="Sign out" href="/login" onClick={close} />
            </div>
            <div className="mt-2 overflow-hidden rounded-[22px] bg-white">
              <Row icon={<UserCog size={18} />} label={`Manage your ${brand.name} account`} href="/admin/access" onClick={close} />
            </div>
            <div className="mt-4 flex justify-center gap-2 text-[11.5px] text-stone-600">
              <span>Privacy Policy</span>·<span>Terms of Service</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Row({ icon, label, href, onClick }: { icon: ReactNode; label: string; href: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-4 border-t border-stone-100 px-6 py-3.5 text-[14px] text-ink-900 first:border-t-0 hover:bg-stone-50">
      <span className="text-stone-600">{icon}</span>
      {label}
    </Link>
  );
}
