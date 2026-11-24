import type { Currency } from "./data";

const symbol: Record<Currency, string> = { USD: "$", BRL: "R$ " };

export function money(amount: number, currency: Currency = "USD", opts: { decimals?: number } = {}) {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: opts.decimals ?? 0,
    maximumFractionDigits: opts.decimals ?? 0,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "(" : ""}${symbol[currency]}${n}${amount < 0 ? ")" : ""}`;
}

/** Compact amounts for headline figures: $212.5M, R$ 420.0M */
export function moneyShort(amount: number, currency: Currency = "USD") {
  const abs = Math.abs(amount);
  let v: string;
  if (abs >= 1e9) v = `${(abs / 1e9).toFixed(2)}B`;
  else if (abs >= 1e6) v = `${(abs / 1e6).toFixed(1)}M`;
  else if (abs >= 1e3) v = `${(abs / 1e3).toFixed(0)}K`;
  else v = abs.toFixed(0);
  return `${amount < 0 ? "−" : ""}${symbol[currency]}${v}`;
}

export function pct(v: number, digits = 1) {
  return `${(v * 100).toFixed(digits)}%`;
}

export function multiple(v: number) {
  return `${v.toFixed(2)}x`;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function date(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${months[m - 1]} ${d}, ${y}`;
}

export function dateTime(iso: string) {
  const t = iso.slice(11, 16);
  const [h, min] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${date(iso)} · ${hh}:${String(min).padStart(2, "0")} ${ampm}`;
}

export function initials(name: string) {
  return name
    .replace(/[^A-Za-zÀ-ÿ &]/g, "")
    .split(/\s+/)
    .filter((w) => w && w !== "&")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
