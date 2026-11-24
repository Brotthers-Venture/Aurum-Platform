/**
 * Colours of Aurum's firm-wide workspaces. Each one is recognised by colour alone on the hub,
 * so the order on the dock keeps similar hues apart (checked for colour-blind separation).
 */
export const FIRM = {
  sales: "var(--module-sales, #C46A1E)", // copper
  pmo: "var(--module-pmo, #8A4A9E)", // plum
  communication: "var(--module-communication, #1F8A84)", // deep turquoise
  dataroom: "var(--module-dataroom, #3558C0)", // blue
  billing: "var(--module-billing, #4F8A2B)", // green
  compliance: "var(--module-compliance, #9B2F3F)", // oxblood
} as const;
/** Aurum's default module colours as plain hex, for places that need a literal colour. */
export const FIRM_DEFAULT = { sales: "#C46A1E", pmo: "#8A4A9E", communication: "#1F8A84", dataroom: "#3558C0", billing: "#4F8A2B", compliance: "#9B2F3F" } as const;
export type FirmId = keyof typeof FIRM;
