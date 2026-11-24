"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AurumLogo } from "@/components/brand/Logo";
import { LoginStage } from "./LoginStage";
import { useBrand } from "@/components/brand/BrandProvider";
import type { Brand } from "@/lib/brand";

/** The full-screen backdrop for a tenant’s sign-in: the gold photograph, a plain field in their ink or canvas colour, or their own image. */
export function Backdrop({ brand }: { brand: Brand }) {
  if (brand.login.backdrop === "image" && brand.login.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.login.image} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  }
  if (brand.login.backdrop === "ink")
    return (
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, ${brand.colors.metal} 45%, ${brand.colors.ink}) 0%, ${brand.colors.ink} 60%)` }}
      />
    );
  if (brand.login.backdrop === "stone")
    return (
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 70% 30%, ${brand.colors.accent} 0%, color-mix(in oklab, ${brand.colors.ink} 70%, ${brand.colors.canvas}) 70%)` }}
      />
    );
  return <Image src="/brand/login-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />;
}

export function AuthShell({ children }: { children: ReactNode }) {
  const { brand } = useBrand();
  return (
    <LoginStage
      background={<Backdrop brand={brand} />}
      logo={<AurumLogo variant={brand.login.backdrop === "gold" ? "dark" : "white"} height={44} priority />}
      statement={
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">{brand.login.eyebrow}</div>
          <h1 className="mt-4 font-serif text-[68px] font-normal leading-[1.02] tracking-[-0.015em] drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)]">{brand.login.headline}</h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/80">{brand.login.text}</p>
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
