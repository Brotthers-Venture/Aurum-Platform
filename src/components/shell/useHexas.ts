"use client";

import { useEffect, useState } from "react";
import { users } from "@/lib/access";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { GRANTS_EVENT, allowedFor, hexasFrom, readGrants, type HexaId } from "@/lib/hexa";

/** The current person's hexagons, kept in step with the administrator's grants. */
export function useHexas() {
  const { role } = usePreviewRole();
  const email = users.find((u) => u.role === role)?.email;
  const [grants, setGrants] = useState<Record<string, HexaId[]> | undefined>(undefined);
  useEffect(() => {
    const read = () => setGrants(readGrants());
    read();
    window.addEventListener(GRANTS_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(GRANTS_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  const allow = allowedFor(role, email, grants);
  return { allow, list: hexasFrom(allow) };
}
