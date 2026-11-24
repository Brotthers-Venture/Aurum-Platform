/**
 * GLEIF — Global Legal Entity Identifier Foundation.
 * Public, free, no API key: https://api.gleif.org/api/v1
 * Shared types and helpers. Network calls live in gleif-server.ts, called server-side only (via /api/gleif/*) so the browser never depends on GLEIF CORS
 * and responses can be cached.
 */

export type GleifAddress = {
  lines: string[];
  city: string;
  region: string | null;
  country: string;
  postalCode: string | null;
  mailRouting: string | null;
};

export type GleifEntity = {
  lei: string;
  legalName: string;
  otherNames: string[];
  category: string | null; // FUND | GENERAL | BRANCH | SOLE_PROPRIETOR ...
  jurisdiction: string | null; // e.g. US-DE, KY, BR
  jurisdictionLabel: string;
  legalFormCode: string | null; // ELF code, e.g. T91T
  legalFormName: string | null; // resolved via entity-legal-forms
  entityStatus: string | null; // ACTIVE | INACTIVE
  registrationStatus: string | null; // ISSUED | LAPSED | ...
  creationDate: string | null; // formation date, YYYY-MM-DD
  registeredAs: string | null; // registry number (e.g. Delaware file number)
  legalAddress: GleifAddress | null;
  hqAddress: GleifAddress | null;
  lastUpdate: string | null;
  nextRenewal: string | null;
  corroboration: string | null;
  hasFundManager: boolean;
  hasManagedFunds: boolean;
};

export type GleifDetail = GleifEntity & {
  fundManager: GleifEntity | null;
  managedFunds: GleifEntity[];
};

const JURISDICTIONS: Record<string, string> = {
  "US-DE": "Delaware, USA",
  "US-FL": "Florida, USA",
  "US-NY": "New York, USA",
  "US-TX": "Texas, USA",
  "US-CA": "California, USA",
  "US-NV": "Nevada, USA",
  "US-WY": "Wyoming, USA",
  KY: "Cayman Islands",
  VG: "British Virgin Islands",
  BM: "Bermuda",
  BR: "Brazil",
  LU: "Luxembourg",
  IE: "Ireland",
  GB: "United Kingdom",
  JE: "Jersey",
  GG: "Guernsey",
  BS: "Bahamas",
  PA: "Panama",
  SG: "Singapore",
  US: "United States",
};

export const jurisdictionLabel = (j: string | null) => (j ? (JURISDICTIONS[j] ?? (j.startsWith("BR-") ? "Brazil" : j)) : "—");

const day = (iso: unknown) => (typeof iso === "string" && iso.length >= 10 ? iso.slice(0, 10) : null);

/* eslint-disable @typescript-eslint/no-explicit-any */
function address(a: any): GleifAddress | null {
  if (!a) return null;
  return {
    lines: (a.addressLines ?? []).filter(Boolean),
    city: a.city ?? "",
    region: a.region ?? null,
    country: a.country ?? "",
    postalCode: a.postalCode ?? null,
    mailRouting: a.mailRouting ?? null,
  };
}

export function normalize(rec: any): GleifEntity {
  const a = rec?.attributes ?? {};
  const e = a.entity ?? {};
  const r = a.registration ?? {};
  const rel = rec?.relationships ?? {};
  return {
    lei: a.lei ?? rec?.id,
    legalName: e.legalName?.name ?? "",
    otherNames: (e.otherNames ?? []).map((n: any) => n?.name).filter(Boolean),
    category: e.category ?? null,
    jurisdiction: e.jurisdiction ?? null,
    jurisdictionLabel: jurisdictionLabel(e.jurisdiction ?? null),
    legalFormCode: e.legalForm?.id ?? null,
    legalFormName: e.legalForm?.other ?? null,
    entityStatus: e.status ?? null,
    registrationStatus: r.status ?? null,
    creationDate: day(e.creationDate),
    registeredAs: e.registeredAs ?? null,
    legalAddress: address(e.legalAddress),
    hqAddress: address(e.headquartersAddress),
    lastUpdate: day(r.lastUpdateDate),
    nextRenewal: day(r.nextRenewalDate),
    corroboration: r.corroborationLevel ?? null,
    hasFundManager: Boolean(rel["fund-manager"]),
    hasManagedFunds: Boolean(rel["managed-funds"]),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const isLei = (s: string) => /^[A-Z0-9]{18}[0-9]{2}$/.test(s.trim().toUpperCase());

export const formatAddress = (a: GleifAddress | null) =>
  a ? [...a.lines, [a.city, a.region?.replace(/^[A-Z]{2}-/, ""), a.postalCode].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ") : "—";
