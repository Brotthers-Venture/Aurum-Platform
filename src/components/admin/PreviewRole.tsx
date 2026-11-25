"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { can, roleById, type Permission, type RoleId } from "@/lib/access";
import { MEMBERS, PARTY_LABEL, memberById, roleOf, type Member } from "@/lib/parties";

type Ctx = {
  role: RoleId;
  setRole: (r: RoleId) => void;
  /** the person being previewed — party type, organisation, tenant */
  member: Member;
  setPerson: (id: string) => void;
  user: { name: string; title: string };
  can: (p: Permission) => boolean;
};

const PreviewRoleContext = createContext<Ctx | null>(null);
const KEY = "aurum-preview-person";

/** Preview-only: see the platform as any person — employee, GP, LP, tenant, client or guest. Replaced by sign-in. */
export function PreviewRoleProvider({ children }: { children: ReactNode }) {
  const [personId, setPersonId] = useState("luiza");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v && memberById(v)) setPersonId(v);
    } catch {
      /* no storage */
    }
  }, []);
  const setPerson = (id: string) => {
    setPersonId(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* no storage */
    }
  };
  const member = memberById(personId) ?? memberById("luiza")!;
  const role = roleOf(member);
  const setRole = (r: RoleId) => {
    const m = MEMBERS.find((x) => x.role === r) ?? MEMBERS.find((x) => roleOf(x) === r);
    if (m) setPerson(m.id);
  };
  return (
    <PreviewRoleContext.Provider value={{ role, setRole, member, setPerson, user: { name: member.name, title: member.party === "employee" ? roleById(role).name : `${PARTY_LABEL[member.party]} · ${member.orgName}` }, can: (p) => can(role, p) }}>
      {children}
    </PreviewRoleContext.Provider>
  );
}

export function usePreviewRole() {
  const ctx = useContext(PreviewRoleContext);
  if (!ctx) throw new Error("usePreviewRole outside provider");
  return ctx;
}
