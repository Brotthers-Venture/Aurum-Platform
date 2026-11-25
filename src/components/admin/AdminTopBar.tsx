import { WorkstationTopBar } from "@/components/shell/WorkstationTopBar";

const APP: Record<string, string> = {
  "Fund Solution": "fund",
  "Corporate Solution": "corporate",
  "Data rooms": "dataroom",
  Treasury: "billing",
  Compliance: "compliance",
  "Project management office": "pmo",
  Sales: "sales",
};

/**
 * Every admin page uses the Direction D workstation bar. The page's context picks the active application;
 * settings pages (brand, access) and solutions in development show no active tab.
 */
export function AdminTopBar({ context }: { context?: string; logo?: boolean }) {
  return <WorkstationTopBar app={(context && APP[context]) || "settings"} />;
}
