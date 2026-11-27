"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AURUM, BRAND_KEY, brandVars, loadBrand, serialiseBrand, type Brand } from "@/lib/brand";

/** `brand` is what the page shows (may be a live preview); `published` is what is saved. */
type Ctx = { brand: Brand; published: Brand; preview: (b: Brand) => void; save: (b: Brand) => boolean; reset: () => void };
const BrandCtx = createContext<Ctx>({ brand: AURUM, published: AURUM, preview: () => {}, save: () => true, reset: () => {} });

function apply(b: Brand) {
  const s = document.documentElement.style;
  for (const [k, v] of Object.entries(brandVars(b))) s.setProperty(k, v);
  document.title = document.title.replace(/Aurum|Northbridge|Halcyon/g, b.name);
}

/** Holds the tenant brand for the whole app and writes it to the page as CSS variables. */
export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<Brand>(AURUM);
  const [published, setPublished] = useState<Brand>(AURUM);
  useEffect(() => {
    const b = loadBrand();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrand(b);
    setPublished(b);
    apply(b);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== BRAND_KEY) return;
      const n = loadBrand();
      setBrand(n);
      setPublished(n);
      apply(n);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const preview = useCallback((b: Brand) => {
    setBrand(b);
    apply(b);
  }, []);
  const save = useCallback((b: Brand) => {
    try {
      window.localStorage.setItem(BRAND_KEY, serialiseBrand(b));
    } catch {
      // storage full (large pictures) or unavailable: keep the published brand as it was
      return false;
    }
    setBrand(b);
    setPublished(b);
    apply(b);
    return true;
  }, []);
  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(BRAND_KEY);
    } catch {}
    const s = document.documentElement.style;
    for (const k of Object.keys(brandVars(AURUM))) s.removeProperty(k);
    setBrand(AURUM);
    setPublished(AURUM);
  }, []);
  return <BrandCtx.Provider value={{ brand, published, preview, save, reset }}>{children}</BrandCtx.Provider>;
}

export const useBrand = () => useContext(BrandCtx);
