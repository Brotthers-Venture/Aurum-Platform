import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/** The report editor uses the whole workstation height: no page padding. */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <AppShell context="Fund Solution">{children}</AppShell>;
}
