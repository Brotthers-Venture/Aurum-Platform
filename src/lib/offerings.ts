/**
 * Offering card content per vehicle: what investors and GPs see on the fund tile.
 * Terms shown on the card come from the fund record (LPA-approved economics); this file only
 * holds presentation: the short code on the cover, a one-line description, minimum, liquidity, tags.
 */
import { fundById, type Fund } from "@/lib/data";

export type Offering = {
  /** big word on the cover, like a ticker */
  code: string;
  tagline: string;
  minInvestment: string;
  liquidity: string;
  tags: string[];
  /** small badge on the cover */
  badge?: string;
  /** uploaded cover image (otherwise artwork is generated in the GP's colours) */
  cover?: string;
};

export const offerings: Record<string, Offering> = {
  "cordillera-infra-i": {
    code: "CIP I",
    tagline: "Core-plus infrastructure across energy transition, digital and transport assets in the Americas.",
    minInvestment: "$5M",
    liquidity: "Closed-end · 10 yrs",
    tags: ["Infrastructure", "Qualified purchasers"],
  },
  "atlantico-vp-ii": {
    code: "AVP II",
    tagline: "Seed to Series B software and fintech companies across Latin America.",
    minInvestment: "$1M",
    liquidity: "Closed-end · 10 yrs",
    tags: ["Venture", "Cayman"],
    badge: "Second close",
  },
  "serra-re-spv": {
    code: "SERRA",
    tagline: "Single-asset co-investment in a stabilised Miami multifamily portfolio.",
    minInvestment: "$500K",
    liquidity: "Asset sale",
    tags: ["Real estate", "SPV"],
  },
  "fip-horizonte": {
    code: "FIP HZ",
    tagline: "Brazilian infrastructure equity across sanitation, logistics and renewable generation.",
    minInvestment: "R$1M",
    liquidity: "Closed-end · 8 yrs",
    tags: ["Infrastructure", "BRL", "CVM"],
  },
  "meridian-cvc": {
    code: "MCV",
    tagline: "Corporate venture programme investing alongside strategic partners in industrial technology.",
    minInvestment: "$2M",
    liquidity: "Closed-end · 10 yrs",
    tags: ["Corporate venture"],
  },
  "stx-anchor": {
    code: "ANCHOR",
    tagline: "Capital formation vehicle providing anchor commitments to emerging managers and platforms.",
    minInvestment: "$250K",
    liquidity: "Closed-end",
    tags: ["Capital formation", "Accredited investors"],
    badge: "Investing",
  },
  "stx-brazil-housing": {
    code: "STX HOUSING",
    tagline: "Affordable housing development in Brazil's high-growth metropolitan regions.",
    minInvestment: "$250K",
    liquidity: "Closed-end",
    tags: ["Affordable housing", "Brazil"],
    badge: "Investing",
  },
  "stx-global": {
    code: "ENGINE",
    tagline: "Global multi-strategy vehicle allocating across private credit, real assets and growth equity.",
    minInvestment: "$250K",
    liquidity: "Closed-end",
    tags: ["Multi-strategy", "Global"],
    badge: "Fundraising",
  },
  "sagewood-seed-i": {
    code: "SAGEWOOD",
    tagline: "Seed-stage investments in founders building in climate, health and the future of work.",
    minInvestment: "$100K",
    liquidity: "Closed-end · 10 yrs",
    tags: ["Seed", "Accredited investors"],
    badge: "Fundraising",
  },
};

export function offeringFor(f: Fund): Offering {
  return (
    offerings[f.id] ?? {
      code: f.shortName.split(" ")[0].toUpperCase(),
      tagline: f.strategy,
      minInvestment: "—",
      liquidity: "Closed-end",
      tags: [f.strategy],
    }
  );
}

/** Card terms: from the fund record; shown as pending until the LPA review is approved. */
export function cardTerms(f: Fund, o: Offering, targetLabel: string): [string, string][] {
  const pending = f.economicsPending;
  return [
    ["Min. investment", o.minInvestment],
    ["Target size", targetLabel],
    ["Management fee", pending ? "Pending LPA" : f.managementFee.split(" ")[0]],
    ["Liquidity", o.liquidity],
  ];
}

export const fundForOffering = (id: string) => fundById(id);
