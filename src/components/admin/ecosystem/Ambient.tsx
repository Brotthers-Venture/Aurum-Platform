"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/components/ui";
import type { AmbientMotion } from "@/lib/brand";

/**
 * The hub's atmosphere: edgeless light that breathes behind the mark, a fine lattice that fades toward the edges,
 * and (Architectural) a restrained light on the lattice at the centre. Static gradients plus transform/opacity
 * keyframes only — no canvas, no animation loop. Everything here ignores the pointer.
 */
export function AmbientBackdrop({ variation, animate, accent2 }: { variation: AmbientMotion; animate: boolean; accent2?: string }) {
  const id = useId().replace(/:/g, "");
  const composition = variation === "off" ? "ambient" : variation;
  return (
    <div aria-hidden className={cx("eco-layer -z-10", animate && "eco-anim")}>
      <div className="eco-enter-light absolute inset-0">
        <div className="eco-light breathe" />
        <div className={cx("eco-light eco-tint", accent2 && "on")} style={accent2 ? ({ "--eco-accent2": accent2 } as React.CSSProperties) : undefined} />
        <div className="eco-light eco-halo breathe" />
      </div>
      {composition === "architectural" ? (
        <div className="eco-hide-sm absolute inset-0">
          <svg className="eco-hex absolute inset-0 h-full w-full">
            <defs>
              <pattern id={`hex-${id}`} width="56" height="96.99" patternUnits="userSpaceOnUse" patternTransform="translate(-28 -48.5)">
                <path d="M28 0 L56 16.17 L56 48.5 L28 64.66 L0 48.5 L0 16.17 Z M28 64.66 L28 96.99" fill="none" stroke="var(--eco-lattice)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </pattern>
              <pattern id={`hexlit-${id}`} width="56" height="96.99" patternUnits="userSpaceOnUse" patternTransform="translate(-28 -48.5)">
                <path d="M28 0 L56 16.17 L56 48.5 L28 64.66 L0 48.5 L0 16.17 Z M28 64.66 L28 96.99" fill="none" stroke="var(--eco-mark)" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#hex-${id})`} />
          </svg>
          <svg className="eco-hex-lit absolute inset-0 h-full w-full">
            <rect width="100%" height="100%" fill={`url(#hexlit-${id})`} />
          </svg>
        </div>
      ) : (
        <div className="eco-dots eco-hide-sm absolute inset-0" />
      )}
    </div>
  );
}

/**
 * Pulse: at most one faint transmission every 20–40 s from the centre to one application. Never while the user is
 * interacting (pointer, keys, focus, menus, typing), never while the tab is hidden, and missed ones are not queued.
 * Returns the index of the application currently receiving a transmission, or null.
 */
export function useTransmission(enabled: boolean, targets: number, quiet: boolean) {
  const [active, setActive] = useState<{ i: number; key: number } | null>(null);
  const lastInput = useRef(0);
  const quietRef = useRef(quiet);
  useEffect(() => {
    quietRef.current = quiet;
  }, [quiet]);

  useEffect(() => {
    if (!enabled || targets === 0) return;
    const mark = () => (lastInput.current = Date.now());
    const evs = ["pointermove", "pointerdown", "keydown", "wheel", "focusin", "input"] as const;
    for (const e of evs) window.addEventListener(e, mark, { passive: true });
    let timer = 0;
    let clear = 0;
    const schedule = () => {
      timer = window.setTimeout(fire, 20_000 + Math.random() * 20_000);
    };
    const fire = () => {
      const busy = Date.now() - lastInput.current < 6_000 || quietRef.current || document.hidden;
      if (!busy) {
        setActive({ i: Math.floor(Math.random() * targets), key: Date.now() });
        clear = window.setTimeout(() => setActive(null), 3_800);
      }
      schedule(); // a skipped transmission is simply dropped
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
      for (const e of evs) window.removeEventListener(e, mark);
    };
  }, [enabled, targets]);

  return enabled ? active : null;
}

/** True while the page is hidden — used to pause decorative keyframes. */
export function usePageHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return hidden;
}
