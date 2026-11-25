/**
 * Cover library: original artwork made for the platform (no third-party photography), used for data-room
 * covers, banners and template cards. A room shows its own uploaded banner first, then its assigned cover.
 */
export type Cover = { id: string; label: string; src: string };

export const COVERS: Cover[] = [
  { id: "dawn-silk", label: "Dawn", src: "/covers/dawn-silk.jpg" },
  { id: "skyline-dusk", label: "Skyline", src: "/covers/skyline-dusk.jpg" },
  { id: "glass-fold", label: "Silk", src: "/covers/glass-fold.jpg" },
  { id: "market-glow", label: "Markets", src: "/covers/market-glow.jpg" },
  { id: "light-streaks", label: "Light", src: "/covers/light-streaks.jpg" },
  { id: "facade-grid", label: "Facade", src: "/covers/facade-grid.jpg" },
  { id: "ridges", label: "Ridges", src: "/covers/ridges.jpg" },
  { id: "harbor", label: "Harbour", src: "/covers/harbor.jpg" },
];

const ROOM: Record<string, string> = {
  "rm-cascade": "skyline-dusk",
  "rm-stx": "market-glow",
  "rm-odd": "dawn-silk",
  "rm-ledger": "glass-fold",
  "rm-altamira": "facade-grid",
  "rm-cord-audit": "ridges",
};
const PURPOSE: Record<string, string> = {
  Fundraising: "dawn-silk",
  Offering: "light-streaks",
  "Due diligence": "harbor",
  Audit: "ridges",
  "M&A": "glass-fold",
  "Operational due diligence": "facade-grid",
};

export const coverSrc = (id: string) => COVERS.find((c) => c.id === id)?.src ?? COVERS[0].src;

/** The cover a room shows when it has no uploaded banner. */
export function roomCover(room: { id: string; purpose: string }) {
  return coverSrc(ROOM[room.id] ?? PURPOSE[room.purpose] ?? "dawn-silk");
}
