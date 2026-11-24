import type React from "react";
/**
 * GP clients — the fund managers Aurum administers for. Each carries the brand
 * used on its white-labeled GP portal, investor portal, notices and reports.
 */
export type Brand = {
  primary: string; // buttons, active navigation, brand surfaces
  secondary: string; // accents: rules, highlights, eyebrow labels
  primaryInk: string; // text on primary — chosen for contrast
  soft: string; // tinted backgrounds
};

export type GpClient = {
  id: string;
  name: string;
  shortName: string;
  /** logo for light backgrounds */
  logo?: { src: string; width: number; height: number };
  /** logo for dark backgrounds (brand-coloured surfaces) */
  logoDark?: { src: string; width: number; height: number };
  mark?: { src: string; width: number; height: number };
  markDark?: { src: string; width: number; height: number };
  /** typographic wordmark for sample clients without artwork */
  wordmark?: { text: string; sub: string; serif?: boolean };
  brand: Brand;
  portalDomain: string;
  customDomain: string | null;
  emailFrom: string;
  emailDomains: string[];
  clientSince: string;
  status: "Live" | "Onboarding";
  sample?: boolean;
};

export const gps: GpClient[] = [
  {
    id: "strlex",
    name: "Strlex Capital Group Inc.",
    shortName: "Strlex Capital",
    logo: { src: "/gp/strlex-logo.png", width: 921, height: 197 },
    logoDark: { src: "/gp/strlex-logo-dark.png", width: 921, height: 197 },
    mark: { src: "/gp/strlex-mark.png", width: 201, height: 197 },
    markDark: { src: "/gp/strlex-mark-dark.png", width: 201, height: 197 },
    brand: { primary: "#191E31", secondary: "#8A93AD", primaryInk: "#FFFFFF", soft: "#F2F3F7" },
    portalDomain: "strlex.portal.aurumasset.us",
    customDomain: null,
    emailFrom: "Strlex Capital Group via Aurum <notices@portal.aurumasset.us>",
    emailDomains: ["strlex.com", "strlexcapital.com"],
    clientSince: "2024-08-15",
    status: "Live",
  },
  {
    id: "arbor",
    name: "Arbor Partners Inc.",
    shortName: "Arbor Partners",
    logo: { src: "/gp/arbor-logo.png", width: 1531, height: 643 },
    logoDark: { src: "/gp/arbor-logo-dark.png", width: 1531, height: 643 },
    mark: { src: "/gp/arbor-mark.png", width: 234, height: 643 },
    markDark: { src: "/gp/arbor-mark-dark.png", width: 234, height: 643 },
    brand: { primary: "#28463A", secondary: "#A9B99E", primaryInk: "#FFFFFF", soft: "#F1F5F2" },
    portalDomain: "arbor.portal.aurumasset.us",
    customDomain: null,
    emailFrom: "Arbor Partners via Aurum <notices@portal.aurumasset.us>",
    emailDomains: ["arborpartners.com"],
    clientSince: "2026-11-24",
    status: "Onboarding",
  },
  {
    id: "cordillera",
    name: "Cordillera Infrastructure Advisors",
    shortName: "Cordillera",
    wordmark: { text: "CORDILLERA", sub: "Infrastructure Advisors" },
    brand: { primary: "#1F3A5F", secondary: "#9DB4CF", primaryInk: "#FFFFFF", soft: "#EFF3F8" },
    portalDomain: "cordillera.portal.aurumasset.us",
    customDomain: "investors.cordillera-infra.com",
    emailFrom: "Cordillera Investor Relations <ir@cordillera-infra.com>",
    emailDomains: ["cordillera-infra.com"],
    clientSince: "2023-01-10",
    status: "Live",
    sample: true,
  },
  {
    id: "atlantico",
    name: "Atlântico Capital Gestão",
    shortName: "Atlântico Capital",
    wordmark: { text: "Atlântico", sub: "Capital", serif: true },
    brand: { primary: "#0E5E6F", secondary: "#E0A458", primaryInk: "#FFFFFF", soft: "#EEF6F7" },
    portalDomain: "atlantico.portal.aurumasset.us",
    customDomain: null,
    emailFrom: "Atlântico Capital via Aurum <notices@portal.aurumasset.us>",
    emailDomains: ["atlanticocapital.com.br"],
    clientSince: "2025-06-02",
    status: "Live",
    sample: true,
  },
  {
    id: "serra",
    name: "Serra Partners",
    shortName: "Serra Partners",
    wordmark: { text: "SERRA", sub: "Partners" },
    brand: { primary: "#7A3E26", secondary: "#D9B79A", primaryInk: "#FFFFFF", soft: "#F8F1EE" },
    portalDomain: "serra.portal.aurumasset.us",
    customDomain: null,
    emailFrom: "Serra Partners via Aurum <notices@portal.aurumasset.us>",
    emailDomains: ["serrapartners.com"],
    clientSince: "2024-04-18",
    status: "Live",
    sample: true,
  },
  {
    id: "horizonte",
    name: "Horizonte Gestão de Recursos Ltda.",
    shortName: "Horizonte Gestão",
    wordmark: { text: "Horizonte", sub: "Gestão de Recursos", serif: true },
    brand: { primary: "#5A4A1E", secondary: "#C9A94B", primaryInk: "#FFFFFF", soft: "#F7F4EC" },
    portalDomain: "horizonte.portal.aurumasset.us",
    customDomain: null,
    emailFrom: "Horizonte Gestão via Aurum <notices@portal.aurumasset.us>",
    emailDomains: ["horizontegestao.com.br"],
    clientSince: "2022-03-01",
    status: "Live",
    sample: true,
  },
  {
    id: "meridian",
    name: "Meridian Industrial Holdings",
    shortName: "Meridian Ventures",
    wordmark: { text: "MERIDIAN", sub: "Ventures" },
    brand: { primary: "#2E3338", secondary: "#B3261E", primaryInk: "#FFFFFF", soft: "#F2F3F4" },
    portalDomain: "meridian.portal.aurumasset.us",
    customDomain: null,
    emailFrom: "Meridian Ventures via Aurum <notices@portal.aurumasset.us>",
    emailDomains: ["meridianindustrial.com"],
    clientSince: "2023-11-20",
    status: "Live",
    sample: true,
  },
];

export const gpById = (id: string) => gps.find((g) => g.id === id);

export const gpForEmail = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return gps.find((g) => g.emailDomains.includes(domain ?? ""));
};

export function brandStyle(b: Brand) {
  return { "--brand": b.primary, "--brand-2": b.secondary, "--brand-ink": b.primaryInk, "--brand-soft": b.soft } as React.CSSProperties;
}

/** WCAG relative luminance and contrast, used to pick text colour on brand surfaces. */
function luminance(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
export function inkFor(primary: string) {
  return contrast(primary, "#FFFFFF") >= contrast(primary, "#0B1519") ? "#FFFFFF" : "#0B1519";
}
