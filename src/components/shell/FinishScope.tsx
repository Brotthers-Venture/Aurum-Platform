"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { readMotionPref } from "@/lib/theme";

export type Finish = "pure" | "arch" | "atmos";
const FINISHES: { id: Finish; label: string; about: string }[] = [
  { id: "pure", label: "A · Pure matte", about: "Tonal layers, no light" },
  { id: "arch", label: "B · Architectural", about: "Soft champagne light" },
  { id: "atmos", label: "C · Atmospheric", about: "Stronger light, slow drift" },
];
const KEY = "aurum-finish-preview";
/** Pages that carry the prototype finish while it is under review. */
const PROTOTYPE = ["/admin/fund/investors"];

/**
 * The workstation's root. On prototype pages it applies the selected matte finish and the ambient light,
 * and shows a temporary switcher for comparing the three variations. Everywhere else it renders as before.
 */
export function FinishScope({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { brand } = useBrand();
  const on = PROTOTYPE.includes(path);
  const [finish, setFinish] = useState<Finish>("arch");
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("finish") as Finish | null;
      const saved = (q ?? window.localStorage.getItem(KEY)) as Finish | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the reviewer's choice after hydration
      if (saved && FINISHES.some((f) => f.id === saved)) setFinish(saved);
      setMotion(readMotionPref() !== "off");
    } catch {}
  }, []);
  const pick = (f: Finish) => {
    setFinish(f);
    try {
      window.localStorage.setItem(KEY, f);
    } catch {}
  };
  const ambient = motion && (brand.ambientMotion ?? "ambient") !== "off";
  return (
    <div className="ws ws-bridge relative flex h-dvh flex-col bg-d-bg" data-finish={on ? finish : undefined} data-ambient={on && ambient ? "on" : undefined}>
      {on && finish !== "pure" && <div aria-hidden className="ws-light-layer" />}
      <div className={cx("flex min-h-0 flex-1 flex-col", on && "ws-stage")}>{children}</div>
      {on && (
        <div
          role="radiogroup"
          aria-label="Finish preview"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-[6px] bg-d-raise p-1 text-[12px] shadow-[0_8px_28px_rgba(0,0,0,0.28)] ring-1 ring-d-line-strong"
        >
          <span className="px-2 text-d-text-3 max-sm:hidden">Finish preview</span>
          {FINISHES.map((f) => (
            <button
              key={f.id}
              role="radio"
              aria-checked={finish === f.id}
              title={f.about}
              onClick={() => pick(f.id)}
              className={cx(
                "rounded-[4px] px-2.5 py-1.5 font-semibold",
                finish === f.id ? "bg-d-surface text-d-text ring-1 ring-d-line-strong" : "text-d-text-2 hover:text-d-text",
              )}
            >
              <span className="sm:hidden">{f.label.slice(0, 1)}</span>
              <span className="max-sm:hidden">{f.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
