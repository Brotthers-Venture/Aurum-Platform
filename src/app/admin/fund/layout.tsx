import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { FundSidebar } from "@/components/fund/FundSidebar";

/** Floating cream sidebar on the ivory canvas; light top bar over the content column. */
export default function FundLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-stone-50">
      <FundSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar context="Fund Solution" logo={false} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1640px] px-8 pb-10 pt-2 2xl:px-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
