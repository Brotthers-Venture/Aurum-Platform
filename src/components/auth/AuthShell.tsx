"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AurumLogo } from "@/components/brand/Logo";
import { LoginStage } from "./LoginStage";
import { BrandField } from "./BrandField";
import { useMotionAllowed } from "./useMotionAllowed";
import { useTheme } from "@/components/shell/ThemeProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import type { Brand } from "@/lib/brand";
import { resolveLook, type ResolvedLook } from "@/lib/entrances";

/** A door's backdrop: the brand field, the gold photograph, a plain field in the brand's ink, an accent glow, or a picture. */
export function EntranceBackdrop({
  brand,
  look,
  tone,
  still,
  field,
}: {
  brand: Brand;
  look: Pick<ResolvedLook, "backdrop" | "image">;
  tone: "dark" | "light";
  still?: boolean;
  /** colours for the brand field (a manager's portal uses its own) */
  field?: { ink: string; accent: string };
}) {
  if (look.backdrop === "image" && look.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={look.image} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  }
  if (look.backdrop === "ink")
    return (
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, ${brand.colors.metal} 45%, ${brand.colors.ink}) 0%, ${brand.colors.ink} 60%)` }}
      />
    );
  if (look.backdrop === "stone")
    return (
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 70% 30%, ${brand.colors.accent} 0%, color-mix(in oklab, ${brand.colors.ink} 70%, ${brand.colors.canvas}) 70%)` }}
      />
    );
  if (look.backdrop === "gold") return <Image src="/brand/login-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />;
  return <BrandField ink={field?.ink ?? brand.colors.ink} accent={field?.accent ?? brand.colors.accent} tone={tone} still={still} />;
}

/** Kept for older callers: the firm entrance's backdrop. */
export function Backdrop({ brand }: { brand: Brand }) {
  return <EntranceBackdrop brand={brand} look={resolveLook(brand, "firm")} tone="dark" still />;
}

/** The sign-in stage for any door into the platform, in that door's look (see lib/entrances). */
export function AuthShell({ children, entrance = "firm" }: { children: ReactNode; entrance?: string }) {
  const { brand } = useBrand();
  const { theme } = useTheme();
  const motion = useMotionAllowed(brand.ambientMotion);
  const look = resolveLook(brand, entrance);
  // pictures and the deep backdrops always carry white type; the brand field follows the theme
  const tone = look.backdrop === "field" ? (theme === "light" ? "light" : "dark") : "dark";
  return (
    <LoginStage
      sharp={look.backdrop !== "gold"}
      tone={tone}
      background={<EntranceBackdrop brand={brand} look={look} tone={tone} still={!motion} />}
      logo={<AurumLogo variant={tone === "light" ? "dark" : "white"} height={44} priority />}
      statement={
        <>
          <div className="text-[13px] font-medium text-white/80">{look.eyebrow}</div>
          <h1 className="mt-4 font-serif text-[68px] font-normal leading-[1.02] tracking-[-0.015em] drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)]">{look.headline}</h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/80">{look.text}</p>
        </>
      }
      footer={
        <>
          <span>© 2026 {brand.legal.footer}</span>
          <span className="flex gap-6">
            <Link href={brand.legal.privacyUrl} className="hover:text-white">
              Privacy
            </Link>
            <Link href={brand.legal.termsUrl} className="hover:text-white">
              Legal
            </Link>
            <Link href="#" className="hover:text-white">
              Regulatory notices
            </Link>
            <a href={`mailto:${brand.supportEmail}`} className="hover:text-white">
              Client services
            </a>
          </span>
        </>
      }
    >
      {children}
    </LoginStage>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[12px] font-semibold text-ink-900">
        {label}
        {hint}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-[3px] border border-stone-300 bg-white px-3.5 text-[14px] text-ink-900 placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900";
