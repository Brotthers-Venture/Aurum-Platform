import Image from "next/image";
import type { GpClient } from "@/lib/gps";
import { cx } from "@/components/ui";

/** The GP's own logo, or a typographic wordmark for sample clients. */
export function GpLogo({ gp, height = 32, className }: { gp: GpClient; height?: number; className?: string }) {
  if (gp.logo) {
    return (
      <Image
        src={gp.logo.src}
        alt={gp.name}
        height={height}
        width={Math.round((height * gp.logo.width) / gp.logo.height)}
        className={className}
        priority
      />
    );
  }
  const w = gp.wordmark!;
  return (
    <span className={cx("inline-flex flex-col leading-none", className)} style={{ color: gp.brand.primary }} aria-label={gp.name}>
      <span
        className={w.serif ? "font-serif font-semibold" : "font-sans font-semibold tracking-[0.18em]"}
        style={{ fontSize: height * (w.serif ? 0.72 : 0.56) }}
      >
        {w.text}
      </span>
      <span className="mt-[3px] font-sans font-medium uppercase tracking-[0.24em] opacity-80" style={{ fontSize: Math.max(8, height * 0.24) }}>
        {w.sub}
      </span>
    </span>
  );
}

/** Square-ish mark for tight spaces (honeycomb centre, avatars). */
export function GpMark({ gp, size = 28 }: { gp: GpClient; size?: number }) {
  if (gp.mark) {
    return (
      <Image src={gp.mark.src} alt="" height={size} width={Math.round((size * gp.mark.width) / gp.mark.height)} />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px] font-semibold text-white"
      style={{ width: size, height: size, background: gp.brand.primary, fontSize: size * 0.42 }}
      aria-hidden
    >
      {gp.wordmark!.text[0]}
    </span>
  );
}

export function AdministeredByAurum({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[11px] text-stone-500", className)}>
      Administered by
      <span className="font-serif text-[11px] font-semibold tracking-[0.12em] text-ink-900">AURUM</span>
      Asset Management
    </span>
  );
}
