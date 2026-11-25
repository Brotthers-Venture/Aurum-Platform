"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { can, roleById, roles, users, type Permission, type RoleId } from "@/lib/access";
import { Avatar } from "@/components/ui";
import { initials } from "@/lib/format";

type Ctx = { role: RoleId; setRole: (r: RoleId) => void; user: { name: string; title: string }; can: (p: Permission) => boolean };

const PreviewRoleContext = createContext<Ctx | null>(null);

function userFor(role: RoleId) {
  const u = users.find((x) => x.role === role);
  return { name: u?.name ?? roleById(role).name, title: roleById(role).name };
}

/** Preview-only: lets you see the platform as each role. Replaced by Supabase Auth claims. */
export function PreviewRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("fund_services_head");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("aurum-preview-role") as RoleId | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v && roles.some((r) => r.id === v)) setRoleState(v);
    } catch {
      /* no storage */
    }
  }, []);
  const setRole = (r: RoleId) => {
    setRoleState(r);
    try {
      window.localStorage.setItem("aurum-preview-role", r);
    } catch {
      /* no storage */
    }
  };
  return (
    <PreviewRoleContext.Provider value={{ role, setRole, user: userFor(role), can: (p) => can(role, p) }}>{children}</PreviewRoleContext.Provider>
  );
}

export function usePreviewRole() {
  const ctx = useContext(PreviewRoleContext);
  if (!ctx) throw new Error("usePreviewRole outside provider");
  return ctx;
}

export function RoleSwitcher() {
  const { role, setRole, user } = usePreviewRole();
  const [open, setOpen] = useState(false);
  const staffAndGp = roles.filter((r) => r.audience !== "Investor");
  return (
    <div className="relative ml-2 border-l border-stone-200 pl-4">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 text-left" aria-expanded={open}>
        <Avatar label={initials(user.name)} />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[12px] font-semibold text-ink-900">{user.name}</span>
          <span className="block text-[11px] text-stone-500">{user.title}</span>
        </span>
        <ChevronDown size={14} className="text-stone-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[300px] text-ink-900 rounded-[8px] border border-stone-200/70 bg-white shadow-card py-2 shadow-[0_8px_24px_rgba(11,21,25,0.10)]">
          <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Preview as role</div>
          {staffAndGp.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRole(r.id);
                setOpen(false);
              }}
              className={`flex w-full items-start justify-between gap-3 px-4 py-2 text-left hover:bg-stone-50 ${role === r.id ? "bg-stone-50" : ""}`}
            >
              <span>
                <span className="block text-[13px] font-semibold text-ink-900">{r.name}</span>
                <span className="block text-[11px] text-stone-500">
                  {r.audience} · {userFor(r.id).name}
                </span>
              </span>
              {role === r.id && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold-400" />}
            </button>
          ))}
          <div className="mt-1 border-t border-stone-100 px-4 pt-2 text-[11px] leading-relaxed text-stone-500">
            Preview only. In production your role comes from your sign-in.
          </div>
        </div>
      )}
    </div>
  );
}
