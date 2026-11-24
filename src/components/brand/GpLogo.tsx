import Image from "next/image";
import type { GpClient } from "@/lib/gps";
import { cx } from "@/components/ui";

/** The GP's own logo, or a typographic wordmark for sample clients. */
export function GpLogo({
  gp,
  height = 32,
  className,
  tone = "light",
  compact = false,
}: {
  gp: GpClient;
  height?: number;
  className?: string;
  /** Tighter tracking and a wrapping subtitle, for narrow containers such as hub cells */
  compact?: boolean;
  /** "dark" when placed on a dark or brand-coloured surface */
  tone?: "light" | "dark";
}) {
  const art = tone === "dark" ? gp.logoDark ?? gp.logo : gp.logo;
  if (art) {
    return (
      <Image
        src={art.src}
        alt={gp.name}
        height={height}
        width={Math.round((height * art.width) / art.height)}
        className={className}
        priority
      />
    );
  }
  const w = gp.wordmark!;
  return (
    <span className={cx("inline-flex flex-col leading-none", compact && "max-w-[124px] items-center text-center", className)} style={{ color: tone === "dark" ? "#FFFFFF" : gp.brand.primary }} aria-label={gp.name}>
      <span
        className={w.serif ? "font-serif font-semibold" : cx("font-sans font-semibold", compact ? "tracking-[0.12em]" : "tracking-[0.18em]")}
        style={{ fontSize: height * (w.serif ? 0.72 : 0.56) }}
      >
        {w.text}
      </span>
      <span className={cx("mt-[3px] font-sans font-medium uppercase opacity-80", compact ? "leading-[1.35] tracking-[0.14em]" : "whitespace-nowrap tracking-[0.24em]")} style={{ fontSize: Math.max(8, height * 0.24) }}>
        {w.sub}
      </span>
    </span>
  );
}

/** Square-ish mark for tight spaces (honeycomb centre, avatars). */
export function GpMark({ gp, size = 28, tone = "light" }: { gp: GpClient; size?: number; tone?: "light" | "dark" }) {
  const art = tone === "dark" ? gp.markDark ?? gp.mark : gp.mark;
  if (art) {
    return <Image src={art.src} alt="" height={size} width={Math.round((size * art.width) / art.height)} />;
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

export function AdministeredByAurum({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[11px]", tone === "dark" ? "text-white/60" : "text-stone-500", className)}>
      Administered by
      <span className={cx("font-serif text-[11px] font-semibold tracking-[0.12em]", tone === "dark" ? "text-white" : "text-ink-900")}>AURUM</span>
      Asset Management
    </span>
  );
}
