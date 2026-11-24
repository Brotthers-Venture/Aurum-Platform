/**
 * European (whole-of-fund) distribution waterfall.
 *  1. Return of contributed capital
 *  2. Preferred return (compounded annually on each contribution)
 *  3. GP catch-up until the GP holds `carry` of cumulative profit
 *  4. Residual split (1 − carry) to LPs / carry to GP
 * Prior distributions are applied to the same tiers first, so the result is
 * the split of the *incremental* proceeds.
 */
export type WaterfallInput = {
  contributions: { date: string; amount: number }[];
  priorDistributions: number;
  proceeds: number;
  date: string;
  hurdle: number;
  carry: number;
  catchUp: number; // share of tier-3 proceeds going to GP, 1 = full catch-up
};

export type Tier = { key: string; name: string; lp: number; gp: number };

function tiers(i: Omit<WaterfallInput, "proceeds"> & { amount: number }) {
  const capital = i.contributions.reduce((a, c) => a + c.amount, 0);
  const years = (from: string) => Math.max(0, (Date.parse(i.date) - Date.parse(from)) / (365.25 * 86_400_000));
  const pref = i.contributions.reduce((a, c) => a + c.amount * (Math.pow(1 + i.hurdle, years(c.date)) - 1), 0);
  let left = i.amount;
  const t1 = Math.min(left, capital);
  left -= t1;
  const t2 = Math.min(left, pref);
  left -= t2;
  // GP receives catchUp share of tier 3 until GP = carry × (pref + catch-up)
  const catchTarget = i.catchUp > 0 ? (i.carry * t2) / (1 - i.carry) : 0;
  const t3Total = i.catchUp > 0 ? Math.min(left, catchTarget / i.catchUp) : 0;
  const t3Gp = t3Total * i.catchUp;
  left -= t3Total;
  return {
    roc: t1,
    pref: t2,
    catchGp: t3Gp,
    catchLp: t3Total - t3Gp,
    splitLp: left * (1 - i.carry),
    splitGp: left * i.carry,
    capital,
    prefAccrued: pref,
  };
}

export function runWaterfall(input: WaterfallInput) {
  const base = { ...input, amount: input.priorDistributions };
  const before = tiers(base);
  const after = tiers({ ...input, amount: input.priorDistributions + input.proceeds });
  const delta = (k: keyof typeof after) => (after[k] as number) - (before[k] as number);
  const result: Tier[] = [
    { key: "roc", name: "Return of capital", lp: delta("roc"), gp: 0 },
    { key: "pref", name: `Preferred return (${(input.hurdle * 100).toFixed(0)}%)`, lp: delta("pref"), gp: 0 },
    { key: "catch", name: "GP catch-up", lp: delta("catchLp"), gp: delta("catchGp") },
    { key: "split", name: `Carried interest split (${Math.round((1 - input.carry) * 100)}/${Math.round(input.carry * 100)})`, lp: delta("splitLp"), gp: delta("splitGp") },
  ];
  const lp = result.reduce((a, t) => a + t.lp, 0);
  const gp = result.reduce((a, t) => a + t.gp, 0);
  return { tiers: result, lp, gp, capital: after.capital, prefAccrued: after.prefAccrued };
}
