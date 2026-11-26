"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHub } from "@/components/admin/AdminHub";
import { WorkstationTopBar } from "@/components/shell/WorkstationTopBar";
import { useTheme } from "@/components/shell/ThemeProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import type { AmbientMotion } from "@/lib/brand";
import { ECO_ENTERED_KEY, ECO_PREVIEW_KEY } from "@/lib/theme";
import { cx } from "@/components/ui";
import { usePageHidden } from "./Ambient";

type Hub = "pure" | "atmos" | "depth";
const HUBS: { id: Hub; label: string }[] = [
  { id: "pure", label: "A · Pure matte" },
  { id: "atmos", label: "B · Atmosphere" },
  { id: "depth", label: "C · Depth" },
];

/**
 * The ecosystem hub (/admin): ambient atmosphere + the hexagonal navigation, on the Direction D theme.
 * Which variation shows: the tenant default from Brand & white label (Ambient unless a tenant changes it).
 * Whether it moves: not if the OS asks for reduced motion, the user switched motion off, or the variation is Off.
 */
export function EcosystemPage() {
  const { brand } = useBrand();
  const { motion, reducedMotion } = useTheme();
  const [busy, setBusy] = useState(false);
  // Temporary preview of the landing atmosphere: A pure, B atmosphere (default), C depth. ?hub= shows the switcher.
  const [hub, setHub] = useState<Hub>("atmos");
  const [compare, setCompare] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("hub") as Hub | null;
    if (q && HUBS.some((h) => h.id === q)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preview flag read after hydration
      setHub(q);
      setCompare(true);
    }
  }, []);
  const hidden = usePageHidden();

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
    <div className={cx("ws eco-stage relative flex min-h-dvh flex-col overflow-x-hidden", hidden && "eco-paused")} data-variation={variation} data-hub={hub}>
      <WorkstationTopBar app="home" variant="ecosystem" onActivity={onActivity} />
      <AdminHub variation={variation} animate={animate} quiet={busy} />
      {compare && (
        <div
          role="radiogroup"
          aria-label="Landing preview"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[6px] bg-d-raise p-1 text-[12px] ring-1 ring-d-line-strong"
        >
          {HUBS.map((h) => (
            <button
              key={h.id}
              role="radio"
              aria-checked={hub === h.id}
              onClick={() => setHub(h.id)}
              className={cx("rounded-[4px] px-2.5 py-1.5 font-semibold", hub === h.id ? "bg-d-surface text-d-text ring-1 ring-d-line-strong" : "text-d-text-2 hover:text-d-text")}
            >
              {h.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
