import { capitalAccounts, capitalCalls, distributions, documents, fundById, funds, fundTotals, investorById, onboarding, toUSD } from "./data";
import { gpById } from "./gps";

export const fundsForGp = (gpId: string) => funds.filter((f) => f.gpId === gpId);
const fundIds = (gpId: string) => new Set(fundsForGp(gpId).map((f) => f.id));

/** Totals in USD; brlPerUsd from fx-server (PTAX). */
export function gpTotals(gpId: string, brlPerUsd: number) {
  const fs = fundsForGp(gpId);
  const ids = fundIds(gpId);
  const investorIds = new Set(capitalAccounts.filter((c) => ids.has(c.fundId)).map((c) => c.investorId));
  const agg = fs.reduce(
    (a, f) => {
      const t = fundTotals(f.id);
      a.commitment += toUSD(t.commitment, f.currency, brlPerUsd);
      a.nav += toUSD(t.nav, f.currency, brlPerUsd);
      a.contributed += toUSD(t.contributed, f.currency, brlPerUsd);
      a.distributed += toUSD(t.distributed, f.currency, brlPerUsd);
      return a;
    },
    { commitment: 0, nav: 0, contributed: 0, distributed: 0 },
  );
  return {
    ...agg,
    funds: fs.length,
    investors: investorIds.size,
    openCalls: capitalCalls.filter((c) => ids.has(c.fundId) && c.status !== "Funded").length,
    onboarding: onboarding.filter((o) => ids.has(o.fundId) && o.status !== "Countersigned").length,
  };
}

export const callsForGp = (gpId: string) => capitalCalls.filter((c) => fundIds(gpId).has(c.fundId));
export const distributionsForGp = (gpId: string) => distributions.filter((d) => fundIds(gpId).has(d.fundId));
export const documentsForGp = (gpId: string) => documents.filter((d) => fundIds(gpId).has(d.fundId));
export const onboardingForGp = (gpId: string) => onboarding.filter((o) => fundIds(gpId).has(o.fundId));

export function investorsForGp(gpId: string, brlPerUsd: number) {
  const ids = fundIds(gpId);
  const map = new Map<string, { commitment: number; nav: number; funds: string[] }>();
  for (const c of capitalAccounts.filter((x) => ids.has(x.fundId))) {
    const f = fundById(c.fundId)!;
    const r = map.get(c.investorId) ?? { commitment: 0, nav: 0, funds: [] };
    r.commitment += toUSD(c.commitment, f.currency, brlPerUsd);
    r.nav += toUSD(c.nav, f.currency, brlPerUsd);
    r.funds.push(f.shortName);
    map.set(c.investorId, r);
  }
  return [...map.entries()].map(([id, r]) => ({ investor: investorById(id)!, ...r })).sort((a, b) => b.commitment - a.commitment);
}

/** GPs an investor has holdings or a subscription with — one portal each. */
export function gpsForInvestor(investorId: string, investorName: string) {
  const ids = new Set<string>();
  capitalAccounts.filter((c) => c.investorId === investorId).forEach((c) => ids.add(fundById(c.fundId)!.gpId));
  onboarding.filter((o) => o.investorName === investorName).forEach((o) => ids.add(fundById(o.fundId)!.gpId));
  return [...ids].map((id) => gpById(id)!).filter(Boolean);
}
