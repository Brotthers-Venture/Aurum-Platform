import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

/** Direction D page frame for the firm workspaces: workstation bar over the Obsidian / Platinum canvas. */
export function ModulePage({ context, wide, children }: { context: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className="ws ws-bridge min-h-dvh bg-d-bg">
      <AdminTopBar context={context} />
      <div className={wide ? "px-8 pt-4" : "mx-auto max-w-[1320px] px-8 pb-16 pt-4"}>{children}</div>
    </div>
  );
}
