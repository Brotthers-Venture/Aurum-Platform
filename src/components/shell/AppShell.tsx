import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { HexaRoom } from "./HexaRoom";

/**
 * Every admin page: the ecosystem header on top, the Hexa Room on the left, the page on the right.
 * The page scrolls on its own so the header and the Hexa Room stay in place.
 */
export function AppShell({ context, children, collapsed }: { context?: string; children: ReactNode; collapsed?: boolean }) {
  return (
    <div className="ws ws-bridge flex h-dvh flex-col bg-d-bg">
      <AdminTopBar context={context} />
      <div className="flex min-h-0 flex-1">
        <HexaRoom defaultCollapsed={collapsed} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
