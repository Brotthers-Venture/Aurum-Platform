import Image from "next/image";

/**
 * Aurum hexagon mark, redrawn as vector from the master logo so it stays
 * crisp at any size. Proportions measured from the supplied artwork:
 * outer band, gap, inner band, open centre.
 */
function hexPoints(r: number, cx = 0, cy = 0) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts;
}

function hexPath(r: number) {
  const p = hexPoints(r);
  return `M${p.join("L")}Z`;
}

export function AurumMark({
  size = 28,
  className,
  color = "#F8C618",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  const d = [hexPath(174), hexPath(142), hexPath(117), hexPath(86)].join(" ");
  return (
    <svg
      width={size}
      height={size * (348 / 302)}
      viewBox="-151 -174 302 348"
      className={className}
      aria-hidden="true"
    >
      <path d={d} fill={color} fillRule="evenodd" />
    </svg>
  );
}

export function AurumLogo({
  variant = "dark",
  height = 32,
  className,
  priority,
}: {
  variant?: "dark" | "white";
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const src = variant === "dark" ? "/brand/aurum-logo-dark.png" : "/brand/aurum-logo-white.png";
  const ratio = variant === "dark" ? 1276 / 405 : 1404 / 408;
  return (
    <Image
      src={src}
      alt="Aurum Asset Management"
      width={Math.round(height * ratio)}
      height={height}
      className={className}
      priority={priority}
    />
  );
}

/** Compact lockup for app chrome: vector mark + set wordmark. */
export function AurumWordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <AurumMark size={20} />
      <span
        className={`font-serif text-[17px] font-semibold tracking-[0.16em] ${
          tone === "light" ? "text-white" : "text-ink-900"
        }`}
      >
        AURUM
      </span>
    </span>
  );
}
