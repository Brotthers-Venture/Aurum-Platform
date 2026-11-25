"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHub } from "@/components/admin/AdminHub";
import { WorkstationTopBar } from "@/components/shell/WorkstationTopBar";
import { useTheme } from "@/components/shell/ThemeProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import type { AmbientMotion } from "@/lib/brand";
import { ECO_ENTERED_KEY, ECO_PREVIEW_KEY } from "@/lib/theme";

/**
 * The ecosystem hub (/admin): ambient atmosphere + the hexagonal navigation, on the Direction D theme.
 * Which variation shows: the tenant default from Brand & white label (Ambient unless a tenant changes it).
 * Whether it moves: not if the OS asks for reduced motion, the user switched motion off, or the variation is Off.
 */
export function EcosystemPage() {
  const { brand } = useBrand();
  const { motion, reducedMotion } = useTheme();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.removeItem(ECO_PREVIEW_KEY); // retire the review switcher's choice
    } catch {
      /* no storage */
    }
    // First arrival: the entrance (if ECO_BOOT allowed it) plays once; then the session is marked.
    const html = document.documentElement;
    try {
      window.sessionStorage.setItem(ECO_ENTERED_KEY, "1");
    } catch {
      /* no session storage: the entrance may replay, nothing breaks */
    }
    const t = window.setTimeout(() => html.removeAttribute("data-eco-enter"), 1400);
    return () => window.clearTimeout(t);
  }, []);

  const variation: AmbientMotion = brand.ambientMotion ?? "ambient";
  const animate = variation !== "off" && motion !== "off" && !reducedMotion;
  const onActivity = useCallback((b: boolean) => setBusy(b), []);

  return (
    <div className="ws eco-stage relative flex min-h-dvh flex-col overflow-x-hidden" data-variation={variation}>
      <WorkstationTopBar app="home" variant="ecosystem" onActivity={onActivity} />
      <AdminHub variation={variation} animate={animate} quiet={busy} />
    </div>
  );
}
