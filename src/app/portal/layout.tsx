import type { ReactNode } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <PortalHeader />
      {children}
      <footer className="mx-auto mt-16 max-w-[1200px] border-t border-stone-200 px-8 py-6 text-[11px] leading-relaxed text-stone-400">
        Aurum Asset Management provides fiduciary and administrative services and is not an investment adviser or
        broker-dealer. Figures are unaudited unless stated. Questions: clientservices@aurumasset.us
      </footer>
    </div>
  );
}
