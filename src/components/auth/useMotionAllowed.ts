"use client";

import { useEffect, useState } from "react";
import { readMotionPref } from "@/lib/theme";
import type { AmbientMotion } from "@/lib/brand";

/** Ambient motion is allowed unless the person turned it off or the brand's ambient motion is Off. */
export function useMotionAllowed(brandMotion?: AmbientMotion) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the person's preference after hydration
    setOk(readMotionPref() !== "off" && brandMotion !== "off");
  }, [brandMotion]);
  return ok;
}
