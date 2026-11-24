import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AurumLogo } from "@/components/brand/Logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(560px,0.85fr)]">
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden>
        <Image src="/brand/login-bg.jpg" alt="" fill priority sizes="55vw" className="object-cover" />
      </aside>

      <main className="flex min-h-screen flex-col bg-ink-900 text-white">
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">
          <div className="w-full max-w-[400px]">
            <AurumLogo variant="white" height={46} priority />
            <h1 className="mt-10 font-serif text-[30px] font-normal leading-tight tracking-[-0.01em]">Welcome to Aurum Asset Management</h1>
            <p className="mt-2 text-[14px] text-white/60">Access your account, follow your investments and documents.</p>
            <div className="mt-8 rounded-[10px] bg-white p-7 text-ink-900 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]">{children}</div>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 px-8 py-5 text-[12px] text-white/45">
          <Link href="#" className="hover:text-white">Privacy Policy</Link>
          <Link href="#" className="hover:text-white">Legal Disclaimer</Link>
          <Link href="#" className="hover:text-white">Regulatory Notices</Link>
          <a href="mailto:clientservices@aurumasset.us" className="hover:text-white">Client Services</a>
          <span className="w-full text-center text-[11px] text-white/30">© 2026 Aurum Asset Management · Orlando, Florida</span>
        </footer>
      </main>
    </div>
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
