import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** Offering Solution: capital formation, in the Hexa Room under its own hexagon. */
export default function OfferingLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell context="Offering Solution">
      <div className="mx-auto w-full max-w-[1640px] px-6 pb-10 pt-4 2xl:px-8">{children}</div>
    </AppShell>
  );
}
