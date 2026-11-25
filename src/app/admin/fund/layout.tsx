import type { ReactNode } from "react";
import { WorkstationTopBar } from "@/components/shell/WorkstationTopBar";
import { FundSidebar } from "@/components/fund/FundSidebar";

/** Direction D workstation: shared top bar, sidebar and content on the Obsidian / Platinum tokens. */
export default function FundLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ws ws-bridge flex h-dvh flex-col bg-d-bg">
      <WorkstationTopBar app="fund" />
      <div className="flex min-h-0 flex-1">
        <FundSidebar />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1640px] px-6 pb-10 pt-4 2xl:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
