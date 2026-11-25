"use client";

import { useEffect, useState } from "react";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { GRANTS_EVENT, allowedFor, hexasFrom, readInvites, type Invitation } from "@/lib/hexa";

/** The current person's hexagons — party defaults plus live invitations — kept in step with any change. */
export function useHexas() {
  const { member } = usePreviewRole();
  const [invites, setInvites] = useState<Invitation[] | undefined>(undefined);
  useEffect(() => {
    const read = () => setInvites(readInvites());
    read();
    window.addEventListener(GRANTS_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(GRANTS_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  const allow = allowedFor(member, invites);
  return { allow, list: hexasFrom(allow), member };
}
