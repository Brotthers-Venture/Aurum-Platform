import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { FundSidebar } from "@/components/fund/FundSidebar";

export default function FundLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <AdminTopBar context="Fund Solution" />
      <div className="flex min-h-0 flex-1">
        <FundSidebar />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-8 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
