/**
 * Source events per vehicle. In production these rows come from Supabase
 * (capital_calls, distributions, valuations, transfers); the engine turns them
 * into journal entries. Amounts are in the fund's base currency.
 */

export type CallEvent = {
  t: "call";
  number: number;
  notice: string;
  due: string;
  investments: { name: string; amount: number }[];
  fees?: number;
  expenses?: number;
  organizational?: number;
  /** omit = everyone paid on the due date; otherwise only these investors have paid */
  paid?: { investorId: string; date: string }[];
  draft?: boolean;
};

export type DistributionEvent = {
  t: "dist";
  date: string;
  source: string;
  returnOfCapital?: number;
  realizedGain?: number;
  income?: number;
  scheduled?: boolean;
};

export type ValuationEvent = { t: "val"; date: string; amount: number; memo: string };

export type TransferEvent = {
  t: "transfer";
  id: string;
  requested: string;
  date: string;
  from: string;
  to: string;
  fraction: number;
  status: "Requested" | "GP consent" | "Documentation" | "Completed";
  consideration?: string;
};

export type FundEvent = CallEvent | DistributionEvent | ValuationEvent | TransferEvent;

/** Simple annual rate charged to late-closing investors on prior contributions. */
export const EQUALIZATION_RATE = 0.08;

export const schedules: Record<string, FundEvent[]> = {
  "aurum-infra-i": [
    { t: "call", number: 1, notice: "2023-04-10", due: "2023-04-24", investments: [{ name: "Porto Verde Logistics", amount: 10_200_000 }], fees: 500_000, organizational: 800_000 },
    { t: "call", number: 2, notice: "2023-07-12", due: "2023-07-26", investments: [{ name: "Atlas Fiber Networks", amount: 12_800_000 }], fees: 1_000_000 },
    { t: "call", number: 3, notice: "2023-11-08", due: "2023-11-22", investments: [{ name: "Ribeira Solar Holdings", amount: 17_750_000 }], fees: 1_500_000 },
    { t: "call", number: 4, notice: "2024-02-20", due: "2024-03-05", investments: [{ name: "Atlas Fiber Networks — follow-on", amount: 14_200_000 }], fees: 1_550_000 },
    { t: "val", date: "2024-12-31", amount: 3_500_000, memo: "Year-end valuation" },
    { t: "call", number: 5, notice: "2024-09-10", due: "2024-09-24", investments: [{ name: "Linha Verde Water", amount: 19_400_000 }], fees: 1_850_000 },
    { t: "val", date: "2025-06-30", amount: 4_200_000, memo: "Q2 2025 valuation" },
    { t: "dist", date: "2025-12-19", source: "Portfolio yield — Porto Verde Logistics", income: 3_120_000 },
    { t: "val", date: "2025-12-31", amount: 5_100_000, memo: "Year-end valuation" },
    { t: "val", date: "2026-06-30", amount: 4_000_000, memo: "Q2 2026 valuation" },
    { t: "transfer", id: "tr-01", requested: "2026-05-18", date: "2026-07-01", from: "inv-lakeshore", to: "inv-sterling", fraction: 0.5, status: "Completed", consideration: "Secondary sale at 98% of NAV" },
    { t: "call", number: 6, notice: "2026-08-12", due: "2026-08-26", investments: [{ name: "Porto Verde Logistics — add-on", amount: 16_300_000 }], fees: 1_900_000 },
    { t: "dist", date: "2026-09-30", source: "Partial exit — Atlas Fiber minority stake", returnOfCapital: 3_200_000, realizedGain: 1_500_000 },
    { t: "val", date: "2026-09-30", amount: 2_600_000, memo: "Q3 2026 valuation" },
    {
      t: "call",
      number: 7,
      notice: "2026-11-17",
      due: "2026-12-01",
      investments: [{ name: "Ribeira Solar Holdings — phase II", amount: 10_850_000 }],
      fees: 1_900_000,
      paid: [
        { investorId: "inv-brightwater", date: "2026-11-20" },
        { investorId: "inv-ridgeway", date: "2026-11-23" },
        { investorId: "inv-sterling", date: "2026-11-21" },
        { investorId: "inv-northgate", date: "2026-11-24" },
      ],
    },
    { t: "transfer", id: "tr-02", requested: "2026-11-12", date: "2027-01-01", from: "inv-ridgeway", to: "inv-corbel", fraction: 0.25, status: "GP consent", consideration: "Secondary sale — price confidential" },
  ],
  "atlantico-vp-ii": [
    { t: "call", number: 1, notice: "2025-10-14", due: "2025-10-28", investments: [{ name: "Seed portfolio — Kora, Lumio, Trama", amount: 4_220_000 }], fees: 1_280_000, organizational: 900_000 },
    { t: "val", date: "2026-06-30", amount: -150_000, memo: "Q2 2026 valuation" },
    { t: "call", number: 2, notice: "2026-11-24", due: "2026-12-08", investments: [{ name: "Series A follow-ons — Kora, Trama", amount: 5_120_000 }], fees: 1_280_000, draft: true },
  ],
  "serra-re-spv": [
    { t: "call", number: 1, notice: "2024-06-03", due: "2024-06-17", investments: [{ name: "Serra Office Tower, São Paulo", amount: 37_600_000 }], fees: 384_000, organizational: 416_000 },
    { t: "val", date: "2025-12-31", amount: 3_400_000, memo: "Independent appraisal" },
    { t: "dist", date: "2026-04-30", source: "Net operating income Q1 2026", income: 1_900_000 },
    { t: "val", date: "2026-06-30", amount: 600_000, memo: "Q2 2026 valuation" },
    { t: "dist", date: "2026-07-31", source: "Net operating income Q2 2026", income: 2_050_000 },
    { t: "dist", date: "2026-10-31", source: "Net operating income Q3 2026", income: 2_150_000 },
  ],
  "fip-horizonte": [
    { t: "call", number: 1, notice: "2022-06-01", due: "2022-06-15", investments: [{ name: "Linha de Transmissão Sul", amount: 24_490_000 }], fees: 1_010_000, organizational: 1_500_000 },
    { t: "call", number: 2, notice: "2022-09-05", due: "2022-09-19", investments: [{ name: "Linha de Transmissão Sul", amount: 25_990_000 }], fees: 1_010_000 },
    { t: "call", number: 3, notice: "2023-01-16", due: "2023-01-30", investments: [{ name: "Usina Eólica Serra Azul", amount: 33_200_000 }], fees: 1_300_000 },
    { t: "call", number: 4, notice: "2023-04-03", due: "2023-04-17", investments: [{ name: "Usina Eólica Serra Azul", amount: 33_200_000 }], fees: 1_300_000 },
    { t: "call", number: 5, notice: "2023-08-14", due: "2023-08-28", investments: [{ name: "Linha de Transmissão Norte", amount: 23_625_000 }], fees: 1_575_000 },
    { t: "call", number: 6, notice: "2023-11-20", due: "2023-12-04", investments: [{ name: "Linha de Transmissão Norte", amount: 23_625_000 }], fees: 1_575_000 },
    { t: "val", date: "2023-12-31", amount: 18_000_000, memo: "Laudo de avaliação anual" },
    { t: "call", number: 7, notice: "2024-03-11", due: "2024-03-25", investments: [{ name: "Solar Vale do Jequitinhonha", amount: 27_825_000 }], fees: 1_575_000 },
    { t: "call", number: 8, notice: "2024-08-19", due: "2024-09-02", investments: [{ name: "Solar Vale do Jequitinhonha", amount: 23_625_000 }], fees: 1_575_000 },
    { t: "dist", date: "2024-12-16", source: "Dividendos — Linha de Transmissão Sul", income: 20_000_000 },
    { t: "val", date: "2024-12-31", amount: 22_000_000, memo: "Laudo de avaliação anual" },
    { t: "call", number: 9, notice: "2025-02-10", due: "2025-02-24", investments: [{ name: "Linha de Transmissão Norte — reforço", amount: 19_425_000 }], fees: 1_575_000 },
    { t: "dist", date: "2025-06-16", source: "Dividendos — Linha de Transmissão Sul", income: 22_000_000 },
    { t: "call", number: 10, notice: "2025-09-15", due: "2025-09-29", investments: [{ name: "Solar Vale do Jequitinhonha — fase II", amount: 23_425_000 }], fees: 1_575_000 },
    { t: "dist", date: "2025-12-15", source: "Dividendos — Linha de Transmissão Norte", income: 24_000_000 },
    { t: "val", date: "2025-12-31", amount: 25_000_000, memo: "Laudo de avaliação anual" },
    { t: "dist", date: "2026-06-15", source: "Sale of 30% — Usina Eólica Serra Azul", returnOfCapital: 20_000_000, realizedGain: 11_000_000 },
    { t: "val", date: "2026-06-30", amount: 12_000_000, memo: "Avaliação semestral" },
    { t: "call", number: 11, notice: "2026-10-20", due: "2026-11-04", investments: [{ name: "Linha de Transmissão Norte — expansão", amount: 26_425_000 }], fees: 1_575_000 },
    { t: "dist", date: "2026-12-15", source: "Dividendos — Linha de Transmissão Sul", income: 24_500_000, scheduled: true },
  ],
  "meridian-cvc": [
    { t: "call", number: 1, notice: "2024-02-05", due: "2024-02-19", investments: [{ name: "Halcyon Sensors — Seed", amount: 3_300_000 }], organizational: 300_000 },
    { t: "call", number: 2, notice: "2024-07-15", due: "2024-07-29", investments: [{ name: "Northwind Fleet — Series A", amount: 4_200_000 }] },
    { t: "val", date: "2025-06-30", amount: 900_000, memo: "Mid-year valuation" },
    { t: "call", number: 3, notice: "2026-06-02", due: "2026-06-16", investments: [{ name: "Lumen Grid Analytics — Series A", amount: 6_000_000 }], expenses: 100_000 },
    { t: "val", date: "2026-09-30", amount: 400_000, memo: "Q3 2026 valuation" },
    { t: "call", number: 4, notice: "2026-11-03", due: "2026-11-17", investments: [{ name: "Tessera Robotics — Series B", amount: 4_250_000 }], expenses: 100_000 },
  ],
};
