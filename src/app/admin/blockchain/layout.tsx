import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** Blockchain Solution: tokenized share registers for the companies we form and administer. */
export default function BlockchainLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell context="Blockchain Solution">
      <div className="mx-auto w-full max-w-[1640px] px-6 pb-10 pt-4 2xl:px-8">{children}</div>
    </AppShell>
  );
}
