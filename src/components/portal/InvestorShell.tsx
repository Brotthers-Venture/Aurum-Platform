"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, FileSignature, FileText, Landmark, LayoutGrid, MessagesSquare, UserRound, Wallet, type LucideIcon } from "lucide-react";
import type { Hit } from "@/components/shell/GlobalSearch";
import { PortalShell, type PortalNav, type PortalNotice } from "@/components/portal/PortalShell";
import type { GpClient } from "@/lib/gps";

export type InvSearchItem = { id: string; group: string; label: string; detail?: string; href: string; keys: string; kind: "page" | "fund" | "call" | "document" };
const ICON: Record<InvSearchItem["kind"], LucideIcon> = { page: ArrowRight, fund: Landmark, call: Wallet, document: FileText };

/** The investor (LP) portal on the shared portal shell, in the sponsor's brand. */
export function InvestorShell({
  gp,
  entity,
  person,
  funds,
  search,
  notices,
  openCalls,
  openSubscriptions,
  preview,
  children,
}: {
  gp: GpClient;
  entity: string;
  person: string;
  funds: { id: string; shortName: string }[];
  search: InvSearchItem[];
  notices: PortalNotice[];
  openCalls: number;
  openSubscriptions: number;
  preview?: boolean;
  children: ReactNode;
}) {
  const base = `/investor/${gp.id}`;
  const nav: PortalNav[] = [
    { href: base, label: "Overview", Icon: LayoutGrid, exact: true },
    { href: `${base}/investments`, label: "Investments", Icon: Landmark, children: funds.map((f) => ({ href: `${base}/investments/${f.id}`, label: f.shortName })) },
    { href: `${base}/activity`, label: "Capital activity", Icon: ArrowLeftRight, badge: openCalls },
    { href: `${base}/documents`, label: "Documents", Icon: FileText },
    { href: `${base}/subscriptions`, label: "Subscriptions", Icon: FileSignature, badge: openSubscriptions },
    { href: `${base}/messages`, label: "Messages", Icon: MessagesSquare },
    { href: `${base}/profile`, label: "Profile", Icon: UserRound },
  ];
  const index: Hit[] = useMemo(() => search.map((s) => ({ ...s, Icon: ICON[s.kind] })), [search]);
  return (
    <PortalShell
      gp={gp}
      storageKey="lp-room-collapsed"
      room={{ title: entity, detail: "Investor portal" }}
      user={{ name: person, title: entity }}
      nav={nav}
      search={index}
      searchLabel="Search investments, documents, calls"
      searchPlaceholder="Search your investments, capital calls and documents…"
      notices={notices}
      noticesTitle="Waiting for you"
      noticesEmpty="Nothing needs your attention right now."
      accountLinks={[
        { href: `${base}/profile`, label: "Profile and bank details", Icon: UserRound },
        { href: `${base}/messages`, label: "Contact your administrator", Icon: MessagesSquare },
      ]}
      signOut={`${base}/login`}
      preview={preview}
    >
      {children}
    </PortalShell>
  );
}
