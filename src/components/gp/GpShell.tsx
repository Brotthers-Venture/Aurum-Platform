"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, FileText, Landmark, LayoutGrid, MessagesSquare, UserCog, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Hit } from "@/components/shell/GlobalSearch";
import { PortalShell, type PortalNav } from "@/components/portal/PortalShell";
import type { GpClient } from "@/lib/gps";
import { GpUserContext, useGpCloseTasks } from "@/components/reporting/GpClose";

export type GpSearchItem = { id: string; group: string; label: string; detail?: string; href: string; keys: string; kind: "page" | "fund" | "investor" | "call" | "document" };
export type GpApproval = { id: string; title: string; detail: string; href: string };

const ICON: Record<GpSearchItem["kind"], LucideIcon> = { page: ArrowRight, fund: Landmark, investor: Users, call: Wallet, document: FileText };

/** The manager (GP) portal on the shared portal shell. */
export function GpShell({
  gp,
  user,
  funds,
  search,
  approvals: serverApprovals,
  preview,
  children,
}: {
  gp: GpClient;
  user: { name: string; title: string };
  funds: { id: string; shortName: string }[];
  search: GpSearchItem[];
  approvals: GpApproval[];
  preview?: boolean;
  children: ReactNode;
}) {
  const closeTasks = useGpCloseTasks(gp.id);
  const approvals = useMemo(() => [...serverApprovals, ...closeTasks], [serverApprovals, closeTasks]);
  const userCtx = useMemo(() => ({ name: user.name }), [user.name]);
  const base = `/gp/${gp.id}`;
  const nav: PortalNav[] = [
    { href: base, label: "Overview", Icon: LayoutGrid, exact: true },
    { href: `${base}/funds`, label: "Funds", Icon: Landmark, children: funds.map((f) => ({ href: `${base}/funds/${f.id}`, label: f.shortName })) },
    { href: `${base}/investors`, label: "Investors", Icon: Users },
    { href: `${base}/activity`, label: "Capital activity", Icon: ArrowLeftRight, badge: serverApprovals.length },
    { href: `${base}/reports`, label: "Reports", Icon: FileText, badge: closeTasks.length },
    { href: `${base}/messages`, label: "Concourse", Icon: MessagesSquare },
  ];
  const index: Hit[] = useMemo(() => search.map((s) => ({ ...s, Icon: ICON[s.kind] })), [search]);
  return (
    <PortalShell
      gp={gp}
      storageKey="gp-room-collapsed"
      room={{ title: "Manager portal" }}
      user={user}
      nav={nav}
      search={index}
      searchLabel="Search funds, investors, documents"
      searchPlaceholder="Search your funds, investors, calls and documents…"
      notices={approvals}
      noticesTitle="Waiting for you"
      noticesEmpty="Nothing needs your approval right now."
      accountLinks={[{ href: `${base}/messages`, label: "Contact your administrator", Icon: UserCog }]}
      signOut={`/investor/${gp.id}/login`}
      preview={preview}
    >
      <GpUserContext.Provider value={userCtx}>{children}</GpUserContext.Provider>
    </PortalShell>
  );
}
