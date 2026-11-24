import { AdministeredByAurum } from "@/components/brand/GpLogo";
import type { GpClient } from "@/lib/gps";

export function BrandedFooter({ gp, preview }: { gp: GpClient; preview?: boolean }) {
  return (
    <footer className="mx-auto mt-16 flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-8 py-6 text-[11px] text-stone-400">
      <span>
        © 2026 {gp.name}
        {preview ? " · Preview data" : ""}
      </span>
      <AdministeredByAurum />
    </footer>
  );
}
