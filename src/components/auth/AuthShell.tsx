import Link from "next/link";
import type { ReactNode } from "react";
import { AurumLogo } from "@/components/brand/Logo";

/** Concentric hexagon linework, echoing the mark, drawn off-canvas. */
function HexLinework() {
  const rings = [140, 220, 300, 380, 460, 540, 620];
  const pts = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return (
    <svg
      className="pointer-events-none absolute -right-[380px] -top-[300px] h-[1000px] w-[1000px]"
      viewBox="-650 -650 1300 1300"
      aria-hidden="true"
    >
      {rings.map((r, i) => (
        <polygon
          key={r}
          points={pts(r)}
          fill="none"
          stroke={i === 1 ? "#F8C618" : "#ffffff"}
          strokeOpacity={i === 1 ? 0.55 : 0.07}
          strokeWidth={i === 1 ? 1.25 : 1}
        />
      ))}
    </svg>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-ink-900 text-white lg:flex lg:flex-col">
        <HexLinework />
        <div className="relative px-14 pt-12">
          <AurumLogo variant="white" height={52} priority />
        </div>
        <div className="relative mt-auto max-w-[520px] px-14 pb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">Client Portal</div>
          <h1 className="mt-5 font-serif text-[52px] font-normal leading-[1.04] tracking-[-0.01em]">
            Built to endure.
          </h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/65">
            Fiduciary administration for funds, offerings, companies and families operating across the United
            States, Brazil and offshore jurisdictions.
          </p>
          <dl className="mt-12 grid max-w-[460px] grid-cols-3 gap-6 border-t border-white/15 pt-6">
            {[
              ["25", "Years of practice"],
              ["25", "Jurisdictions served"],
              ["3,000+", "Entities formed"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="num text-[22px] font-medium tracking-[-0.01em]">{v}</dt>
                <dd className="mt-1 text-[12px] text-white/50">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative flex items-center justify-between border-t border-white/10 px-14 py-5 text-[11px] text-white/40">
          <span>© 2026 Aurum Asset Management · Orlando, Florida</span>
          <span>Not an investment adviser or broker-dealer</span>
        </div>
      </aside>

      <main className="flex flex-col bg-white">
        <div className="px-8 pt-8 lg:hidden">
          <AurumLogo variant="dark" height={34} priority />
        </div>
        <div className="flex flex-1 items-center justify-center px-8 py-14">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-stone-100 px-8 py-5 text-[12px] text-stone-500">
          <Link href="#" className="hover:text-ink-900">Privacy Policy</Link>
          <Link href="#" className="hover:text-ink-900">Legal Disclaimer</Link>
          <Link href="#" className="hover:text-ink-900">Regulatory Notices</Link>
          <a href="mailto:clientservices@aurumasset.us" className="hover:text-ink-900">Client Services</a>
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
