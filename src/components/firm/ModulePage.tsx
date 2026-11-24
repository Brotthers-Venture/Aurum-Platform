import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export function ModulePage({ context, children }: { context: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminTopBar context={context} />
      <div className="mx-auto max-w-[1320px] px-8 pb-16 pt-4">{children}</div>
    </div>
  );
}
