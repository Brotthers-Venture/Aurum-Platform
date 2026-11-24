/** Subscription commitments by vehicle. The close date admits the partner. */
export type CommitmentSeed = { fundId: string; investorId: string; commitment: number; closeDate: string };

export const commitmentSeeds: CommitmentSeed[] = [
  // Infrastructure Partners I (USD) — three closes
  { fundId: "cordillera-infra-i", investorId: "inv-brightwater", commitment: 50_000_000, closeDate: "2023-03-15" },
  { fundId: "cordillera-infra-i", investorId: "inv-northgate", commitment: 35_000_000, closeDate: "2023-03-15" },
  { fundId: "cordillera-infra-i", investorId: "inv-ridgeway", commitment: 30_000_000, closeDate: "2023-03-15" },
  { fundId: "cordillera-infra-i", investorId: "inv-corbel", commitment: 25_000_000, closeDate: "2023-09-29" },
  { fundId: "cordillera-infra-i", investorId: "inv-vasconcelos", commitment: 20_000_000, closeDate: "2023-09-29" },
  { fundId: "cordillera-infra-i", investorId: "inv-calloway", commitment: 15_000_000, closeDate: "2023-09-29" },
  { fundId: "cordillera-infra-i", investorId: "inv-sterling", commitment: 15_000_000, closeDate: "2024-03-15" },
  { fundId: "cordillera-infra-i", investorId: "inv-ferreira", commitment: 12_500_000, closeDate: "2024-03-15" },
  { fundId: "cordillera-infra-i", investorId: "inv-lakeshore", commitment: 10_000_000, closeDate: "2024-03-15" },
  // Atlântico Venture II (USD) — first close; second close in onboarding
  { fundId: "atlantico-vp-ii", investorId: "inv-vasconcelos", commitment: 20_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-ferreira", commitment: 15_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-corbel", commitment: 15_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-costa", commitment: 5_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-prado", commitment: 4_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-lakeshore", commitment: 5_000_000, closeDate: "2025-09-30" },
  // Serra SPV (USD)
  { fundId: "serra-re-spv", investorId: "inv-calloway", commitment: 8_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-vasconcelos", commitment: 10_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-monteiro", commitment: 2_400_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-ferreira", commitment: 9_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-costa", commitment: 4_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-prado", commitment: 5_000_000, closeDate: "2024-06-01" },
  // FIP Horizonte (BRL) — three closes
  { fundId: "fip-horizonte", investorId: "inv-previ-sul", commitment: 180_000_000, closeDate: "2022-05-10" },
  { fundId: "fip-horizonte", investorId: "inv-ferreira", commitment: 90_000_000, closeDate: "2022-05-10" },
  { fundId: "fip-horizonte", investorId: "inv-vasconcelos", commitment: 75_000_000, closeDate: "2022-11-18" },
  { fundId: "fip-horizonte", investorId: "inv-costa", commitment: 40_000_000, closeDate: "2023-05-10" },
  { fundId: "fip-horizonte", investorId: "inv-prado", commitment: 35_000_000, closeDate: "2023-05-10" },
  // Meridian CVC (USD) — two closes
  { fundId: "meridian-cvc", investorId: "inv-meridian", commitment: 60_000_000, closeDate: "2024-01-22" },
  { fundId: "meridian-cvc", investorId: "inv-calloway", commitment: 5_000_000, closeDate: "2024-11-30" },
  { fundId: "meridian-cvc", investorId: "inv-lakeshore", commitment: 7_500_000, closeDate: "2024-11-30" },
  // Strlex Capital Group — sample commitments (preview data)
  { fundId: "stx-anchor", investorId: "inv-vasconcelos", commitment: 12_000_000, closeDate: "2025-06-30" },
  { fundId: "stx-anchor", investorId: "inv-ferreira", commitment: 8_000_000, closeDate: "2025-06-30" },
  { fundId: "stx-anchor", investorId: "inv-sterling", commitment: 7_500_000, closeDate: "2025-06-30" },
  { fundId: "stx-anchor", investorId: "inv-calloway", commitment: 5_000_000, closeDate: "2025-06-30" },
  { fundId: "stx-anchor", investorId: "inv-lakeshore", commitment: 4_000_000, closeDate: "2025-06-30" },
  { fundId: "stx-brazil-housing", investorId: "inv-previ-sul", commitment: 15_000_000, closeDate: "2024-09-30" },
  { fundId: "stx-brazil-housing", investorId: "inv-ferreira", commitment: 10_000_000, closeDate: "2024-09-30" },
  { fundId: "stx-brazil-housing", investorId: "inv-vasconcelos", commitment: 8_000_000, closeDate: "2024-09-30" },
  { fundId: "stx-brazil-housing", investorId: "inv-prado", commitment: 4_000_000, closeDate: "2024-09-30" },
  { fundId: "stx-brazil-housing", investorId: "inv-costa", commitment: 3_000_000, closeDate: "2024-09-30" },
  { fundId: "stx-global", investorId: "inv-corbel", commitment: 15_000_000, closeDate: "2026-06-30" },
  { fundId: "stx-global", investorId: "inv-northgate", commitment: 12_000_000, closeDate: "2026-06-30" },
  { fundId: "stx-global", investorId: "inv-ridgeway", commitment: 10_000_000, closeDate: "2026-06-30" },
  { fundId: "stx-global", investorId: "inv-calloway", commitment: 3_000_000, closeDate: "2026-06-30" },
];
