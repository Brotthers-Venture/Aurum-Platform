/**
 * The six solution marks of the Hexa Room sidebar, drawn for this platform.
 *
 * Grid 20 × 20, strokes 1.5 with square ends and mitred joins, no fills. Every mark is built on the same
 * hidden pointy-top hexagonal grid as the brand mark, but only the ones whose idea is a container or a
 * sequence show a hexagon outright. Colour always comes from the text (currentColor), so the active and
 * inactive states follow the theme and any tenant's brand.
 */
import type { SVGProps } from "react";

type P = { size?: number } & Omit<SVGProps<SVGSVGElement>, "children">;

/** A pointy-top hexagon of radius r around (cx, cy), as an SVG points list. */
const hex = (cx: number, cy: number, r: number) =>
  [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = ((-90 + 60 * i) * Math.PI) / 180;
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    })
    .join(" ");

function Mark({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Fund: a structure holding a smaller one, the vehicle inside the fund. */
export function FundMark(p: P) {
  return (
    <Mark {...p}>
      <polygon points={hex(10, 10, 8.25)} />
      <polygon points={hex(10, 12.1, 3.1)} />
    </Mark>
  );
}

/** Corporate: an ownership tree, one parent over three holdings. */
export function CorporateMark(p: P) {
  return (
    <Mark {...p}>
      <polygon points={hex(10, 4.6, 2.85)} />
      <path d="M10 7.45V10.25M3.75 10.25H16.25M3.75 10.25V13.75M10 10.25V13.75M16.25 10.25V13.75" />
      <rect x="2" y="13.75" width="3.5" height="3.5" />
      <rect x="8.25" y="13.75" width="3.5" height="3.5" />
      <rect x="14.5" y="13.75" width="3.5" height="3.5" />
    </Mark>
  );
}

/** Multi-family office: two related holdings that share common ground. */
export function FamilyMark(p: P) {
  return (
    <Mark {...p}>
      <polygon points={hex(7.1, 10, 5.4)} />
      <polygon points={hex(12.9, 10, 5.4)} />
    </Mark>
  );
}

/** Offering: capital rising from one base and opening into two. */
export function OfferingMark(p: P) {
  return (
    <Mark {...p}>
      <path d="M3.25 17.25H16.75M10 17.25V11.25L5.25 7.25V2.75M10 11.25L14.75 7.25V2.75" />
    </Mark>
  );
}

/** Blockchain: linked segments in sequence. */
export function ChainMark(p: P) {
  return (
    <Mark {...p}>
      <polygon points={hex(4.4, 15.1, 2.9)} />
      <polygon points={hex(10, 10, 2.9)} />
      <polygon points={hex(15.6, 4.9, 2.9)} />
      <path d="M6.55 13.1L7.85 11.95M12.15 8.05L13.45 6.9" />
    </Mark>
  );
}

/** Banking: two accounts with money moving between them, one way and back. */
export function BankingMark(p: P) {
  return (
    <Mark {...p}>
      <path d="M3.25 3.75V16.25M16.75 3.75V16.25" />
      <path d="M6.25 7.75H13.25M11.25 5.75L13.25 7.75L11.25 9.75" />
      <path d="M13.75 12.25H6.75M8.75 10.25L6.75 12.25L8.75 14.25" />
    </Mark>
  );
}
