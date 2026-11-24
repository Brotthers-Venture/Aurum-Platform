/**
 * Colours of Aurum's firm-wide workspaces. Each one is recognised by colour alone on the hub,
 * so the order on the dock keeps similar hues apart (checked for colour-blind separation).
 */
export const FIRM = {
  sales: "#C46A1E", // copper
  pmo: "#8A4A9E", // plum
  communication: "#1F8A84", // deep turquoise
  dataroom: "#3558C0", // blue
  billing: "#4F8A2B", // green
  compliance: "#9B2F3F", // oxblood
} as const;
export type FirmId = keyof typeof FIRM;
