import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export function ModulePage({ context, wide, children }: { context: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminTopBar context={context} />
      <div className={wide ? "px-8 pt-4" : "mx-auto max-w-[1320px] px-8 pb-16 pt-4"}>{children}</div>
    </div>
  );
}
