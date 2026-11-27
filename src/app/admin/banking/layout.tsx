import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** Banking Solution: accounts, cash and payments for the entities we administer. Prototype. */
export default function BankingLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell context="Banking Solution">
      <div className="mx-auto w-full max-w-[1640px] px-6 pb-10 pt-4 2xl:px-8">{children}</div>
    </AppShell>
  );
}
