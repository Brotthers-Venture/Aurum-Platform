import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** Fund Solution: its pages live in the Hexa Room under the Fund hexagon. */
export default function FundLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell context="Fund Solution">
      <div className="mx-auto w-full max-w-[1640px] px-6 pb-10 pt-4 2xl:px-8">{children}</div>
    </AppShell>
  );
}
