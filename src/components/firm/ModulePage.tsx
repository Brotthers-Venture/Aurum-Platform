import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** Direction D page frame for the firm workspaces: ecosystem header, Hexa Room, then the page. */
export function ModulePage({ context, wide, children }: { context: string; wide?: boolean; children: ReactNode }) {
  return (
    <AppShell context={context}>
      <div className={wide ? "px-8 pb-10 pt-4" : "mx-auto max-w-[1320px] px-8 pb-16 pt-4"}>{children}</div>
    </AppShell>
  );
}
