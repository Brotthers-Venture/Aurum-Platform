"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Check, ChevronDown, EllipsisVertical, LogOut, Palette, Search, ShieldCheck, UserCog } from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { useTheme } from "./ThemeProvider";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { moduleName, withTenant } from "@/lib/brand";
import { loadChat, visibleInbox, type InboxItem } from "@/lib/chat-store";
import { personName } from "@/lib/chat";
import type { ThemePref } from "@/lib/theme";
import { roleById } from "@/lib/access";
import { MEMBERS, PARTY_LABEL, homeOf, type PartyType } from "@/lib/parties";
import { useRouter } from "next/navigation";

const PREVIEW_ORDER: PartyType[] = ["employee", "tenant", "gp", "client", "lp", "guest"];
/** A representative person of each kind, to preview the platform as them. */
const PREVIEW_PEOPLE = ["thiago", "luiza", "rafael", "carla", "helena", "eleanor", "samito", "marcus", "lucas", "tom", "anamazal", "pedro", "margaret", "gt-audit"];

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


export function Menu({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("absolute z-50 rounded-[6px] bg-d-surface p-1.5 text-[12.5px] text-d-text shadow-[var(--d-pop)]", className)}>{children}</div>;
}
export const menuItem = "flex h-8 w-full items-center gap-2.5 rounded-[4px] px-2.5 text-left text-d-text hover:bg-d-raise focus-visible:bg-d-raise";
export const menuHead = "px-2.5 pb-1.5 pt-2 text-[11px] font-semibold text-d-text-3";

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid rounded-[4px] border border-d-line bg-d-bg p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cx("h-7 rounded-[3px] text-[12px] text-d-text-3 hover:text-d-text", value === o.v && "bg-d-raise font-medium text-d-text shadow-[0_0_0_1px_var(--d-line-strong)]")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Direction D global header: logo, applications, app switcher, (optional) entity switcher, search and command,
 * notifications and the account. Appearance (Light / Dark / System) lives in the account menu.
 */
export function WorkstationTopBar({
  onSearch,
  entity,
  variant = "default",
  moreExtra,
  onActivity,
}: {
  /** the current application (kept for callers; the Hexa Room shows where you are) */
  app?: string;
  onSearch?: () => void;
  entity?: ReactNode;
  /** "ecosystem": the hub — no application row (the hexagons are the navigation), transparent over the ambient light */
  variant?: "default" | "ecosystem";
  /** extra items for the ⋮ menu (e.g. the temporary prototype switcher) */
  moreExtra?: ReactNode;
  /** tells the page a menu or search is in use, so decorative motion stays quiet */
  onActivity?: (busy: boolean) => void;
}) {
  const [open, setOpen] = useState<null | "bell" | "account" | "more">(null);
  const close = () => setOpen(null);
  const ref = useDismiss(open !== null, close);
  const toggle = (k: NonNullable<typeof open>) => setOpen((o) => (o === k ? null : k));
  const { brand } = useBrand();
  const { pref, theme, setPref, motion, setMotion } = useTheme();
  const eco = variant === "ecosystem";
  useEffect(() => {
    onActivity?.(open !== null);
  }, [open, onActivity]);
  const { user, member, setPerson } = usePreviewRole();
  const router = useRouter();
  const [notes, setNotes] = useState<{ items: InboxItem[]; unread: number }>({ items: [], unread: 0 });

  useEffect(() => {
    const read = () => {
      const s = loadChat();
      const items = visibleInbox(s).filter((i) => i.reason === "Mention" || i.reason === "Assigned" || i.reason === "Approval requested");
      setNotes({ items: items.slice(0, 8), unread: items.filter((i) => !s.inbox[i.id]?.read).length });
    };
    read();
    window.addEventListener("aurum-chat", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("aurum-chat", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return (
    <header ref={ref} className={cx("relative z-40 flex h-[56px] shrink-0 items-center gap-3 pl-4 pr-3 text-[13px]", eco ? "border-b border-transparent bg-transparent" : "border-b border-d-line bg-d-chrome")}>
      <Link href="/admin" aria-label={`${brand.name} home`} className="shrink-0">
        <AurumLogo variant={theme === "dark" ? "white" : "dark"} height={32} />
      </Link>
      {entity}

      <div className="flex-1" />
      {onSearch ? (
        <button
          onClick={onSearch}
          className="flex h-9 w-full min-w-0 max-w-[520px] items-center gap-2 rounded-full border border-d-line bg-[color-mix(in_oklab,var(--d-surface)_70%,transparent)] px-3.5 text-left text-d-text-3 hover:border-d-line-strong"
          aria-label="Search or run a command"
        >
          <Search size={15} className="shrink-0" />
          <span className="truncate text-[13px]">Search funds, investors, documents</span>
          <kbd className="ml-auto hidden shrink-0 whitespace-nowrap rounded-[4px] border border-d-line px-1.5 font-sans text-[10.5px] text-d-text-3 sm:inline">Ctrl K</kbd>
        </button>
      ) : (
        <label className="flex h-9 w-full min-w-0 max-w-[520px] items-center gap-2 rounded-full border border-d-line bg-[color-mix(in_oklab,var(--d-surface)_70%,transparent)] px-3.5 text-d-text-3 focus-within:border-d-line-strong">
          <Search size={15} className="shrink-0" />
          <input
            placeholder="Search funds, investors, documents"
            aria-label="Search funds, investors, documents"
            onFocus={() => onActivity?.(true)}
            onBlur={() => onActivity?.(false)}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-d-text placeholder:text-d-text-3 focus:outline-none focus-visible:outline-none"
          />
        </label>
      )}
      <div className="flex-1" />

      <div className="relative">
        <button onClick={() => toggle("more")} aria-label="More" aria-expanded={open === "more"} className="flex h-8 w-8 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
          <EllipsisVertical size={16} />
        </button>
        {open === "more" && (
          <Menu className="right-0 top-10 w-[230px]">
            <Link href="/admin/access" onClick={close} className={menuItem}>
              <ShieldCheck size={15} className="text-d-text-2" /> Access & permissions
            </Link>
            <Link href="/admin/brand" onClick={close} className={menuItem}>
              <Palette size={15} className="text-d-text-2" /> Brand & white label
            </Link>
            {moreExtra}
          </Menu>
        )}
      </div>

      <div className="relative">
        <button onClick={() => toggle("bell")} aria-label={`Notifications, ${notes.unread} new`} aria-expanded={open === "bell"} className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-d-text-2 hover:bg-d-raise hover:text-d-text">
          <Bell size={16} />
          {notes.unread > 0 && <span className="tnum absolute right-0.5 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-d-text px-1 text-[9.5px] font-semibold text-d-bg">{notes.unread}</span>}
        </button>
        {open === "bell" && (
          <Menu className="right-0 top-10 w-[360px]">
            <div className={menuHead}>{moduleName(brand, "communication")}</div>
            {notes.items.length === 0 && <div className="px-2.5 py-6 text-center text-d-text-3">Nothing needs you right now.</div>}
            {notes.items.map((i) => (
              <Link key={i.id} href={`/admin/communication?m=${i.where}`} onClick={close} className="block rounded-[4px] px-2.5 py-2 hover:bg-d-raise">
                <div className="flex items-baseline justify-between gap-3 text-[11px] text-d-text-3">
                  <span>{i.reason}</span>
                  <span className="tnum">{new Date(i.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-d-text">
                  {i.reason === "Assigned" ? i.text : <><span className="font-medium">{personName(i.author)}</span> <span className="text-d-text-2">{withTenant(i.text, brand.name)}</span></>}
                </div>
              </Link>
            ))}
          </Menu>
        )}
      </div>

      <div className="relative">
        <button onClick={() => toggle("account")} aria-label={`Account: ${user.name}`} aria-expanded={open === "account"} className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 hover:bg-d-raise">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-d-line-strong bg-d-raise text-[11px] font-semibold">{user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
          <ChevronDown size={13} className="text-d-text-3" />
        </button>
        {open === "account" && (
          <Menu className="right-0 top-10 w-[280px]">
            <div className="flex items-center gap-2.5 px-2.5 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-d-line-strong bg-d-raise text-[11.5px] font-semibold">{user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{user.name}</span>
                <span className="block truncate text-[11.5px] text-d-text-3">{user.title}</span>
              </span>
            </div>
            <div className="mx-1 my-1 h-px bg-d-line-soft" />
            <div className={menuHead}>Appearance</div>
            <div className="px-2 pb-2">
              <Segmented<ThemePref>
                label="Appearance"
                value={pref}
                onChange={setPref}
                options={[
                  { v: "light", label: "Light" },
                  { v: "dark", label: "Dark" },
                  { v: "system", label: "System" },
                ]}
              />
            </div>
            <div className={menuHead}>Motion · just for you</div>
            <div className="px-2 pb-2">
              <Segmented<"auto" | "off">
                label="Ambient motion"
                value={motion}
                onChange={setMotion}
                options={[
                  { v: "auto", label: "On" },
                  { v: "off", label: "Off" },
                ]}
              />
            </div>
            <div className="mx-1 my-1 h-px bg-d-line-soft" />
            <div className={menuHead}>Preview as · who is looking</div>
            <div className="max-h-[240px] overflow-y-auto">
              {PREVIEW_ORDER.map((party) => (
                <div key={party}>
                  <div className="px-2.5 pb-0.5 pt-1.5 text-[10.5px] font-medium text-d-text-3">{PARTY_LABEL[party]}</div>
                  {MEMBERS.filter((m) => m.party === party && PREVIEW_PEOPLE.includes(m.id)).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setPerson(m.id);
                        close();
                        router.push(homeOf(m));
                      }}
                      className={cx(menuItem, "h-auto py-1 text-[12.5px]")}
                    >
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate">{m.name}</span>
                        <span className="block truncate text-[11px] text-d-text-3">{m.role ? roleById(m.role).name : m.orgName}</span>
                      </span>
                      {member.id === m.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="mx-1 my-1 h-px bg-d-line-soft" />
            <Link href="/admin/access" onClick={close} className={menuItem}>
              <UserCog size={15} className="text-d-text-2" /> Profile and security
            </Link>
            <Link href="/login" onClick={close} className={menuItem}>
              <LogOut size={15} className="text-d-text-2" /> Sign out
            </Link>
          </Menu>
        )}
      </div>
    </header>
  );
}
