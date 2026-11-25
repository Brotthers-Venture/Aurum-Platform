"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AdminHub } from "@/components/admin/AdminHub";
import { WorkstationTopBar, menuHead, menuItem } from "@/components/shell/WorkstationTopBar";
import { useTheme } from "@/components/shell/ThemeProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import { AMBIENT_MOTIONS, type AmbientMotion } from "@/lib/brand";
import { ECO_ENTERED_KEY, ECO_PREVIEW_KEY } from "@/lib/theme";

/**
 * The ecosystem hub (/admin): ambient atmosphere + the hexagonal navigation, on the Direction D theme.
 * Which variation shows: the temporary preview choice (owner review) → the tenant default → Ambient.
 * Whether it moves: not if the OS asks for reduced motion, the user switched motion off, or the variation is Off.
 */
export function EcosystemPage() {
  const { brand } = useBrand();
  const { motion, reducedMotion } = useTheme();
  const [preview, setPreviewState] = useState<AmbientMotion | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(ECO_PREVIEW_KEY) as AmbientMotion | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v && AMBIENT_MOTIONS.some((m) => m.id === v)) setPreviewState(v);
    } catch {
      /* no storage: tenant default */
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

  const setPreview = (v: AmbientMotion | null) => {
    setPreviewState(v);
    try {
      if (v) window.localStorage.setItem(ECO_PREVIEW_KEY, v);
      else window.localStorage.removeItem(ECO_PREVIEW_KEY);
    } catch {
      /* storage unavailable: lasts for this visit */
    }
  };

  const variation: AmbientMotion = preview ?? brand.ambientMotion ?? "ambient";
  const animate = variation !== "off" && motion !== "off" && !reducedMotion;
  const onActivity = useCallback((b: boolean) => setBusy(b), []);
  const tenantDefault = brand.ambientMotion ?? "ambient";

  const switcher = (
    <>
      <div className="mx-1 my-1 h-px bg-d-line-soft" />
      <div className={menuHead}>Prototype · ecosystem variation</div>
      <button className={menuItem} onClick={() => setPreview(null)} aria-pressed={preview === null}>
        Tenant default ({AMBIENT_MOTIONS.find((m) => m.id === tenantDefault)?.label})
        {preview === null && <Check size={13} className="ml-auto" />}
      </button>
      {AMBIENT_MOTIONS.map((m) => (
        <button key={m.id} className={menuItem} onClick={() => setPreview(m.id)} aria-pressed={preview === m.id}>
          {m.label}
          {preview === m.id && <Check size={13} className="ml-auto" />}
        </button>
      ))}
      <p className="px-2.5 pb-1.5 pt-1 text-[11px] leading-snug text-d-text-3">Temporary, for review. Not saved to the tenant brand.</p>
    </>
  );

  return (
    <div className="ws eco-stage relative flex min-h-dvh flex-col overflow-x-hidden" data-variation={variation}>
      <WorkstationTopBar app="home" variant="ecosystem" moreExtra={switcher} onActivity={onActivity} />
      <AdminHub variation={variation} animate={animate} quiet={busy} />
    </div>
  );
}
