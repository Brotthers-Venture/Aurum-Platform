import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AurumLogo } from "@/components/brand/Logo";
import { LoginStage } from "./LoginStage";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <LoginStage
      background={<Image src="/brand/login-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />}
      logo={<AurumLogo variant="white" height={44} priority />}
      statement={
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">Aurum Asset Management</div>
          <h1 className="mt-4 font-serif text-[68px] font-normal leading-[1.02] tracking-[-0.015em] drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)]">Built to endure.</h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/80">
            Fiduciary administration for funds, offerings, companies and families across the United States, Brazil and offshore jurisdictions.
          </p>
        </>
      }
      footer={
        <>
          <span>© 2026 Aurum Asset Management · Orlando, Florida</span>
          <span className="flex gap-6">
            <Link href="#" className="hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-white">Legal</Link>
            <Link href="#" className="hover:text-white">Regulatory notices</Link>
            <a href="mailto:clientservices@aurumasset.us" className="hover:text-white">Client services</a>
          </span>
        </>
      }
    >
      {children}
    </LoginStage>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
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
