/**
 * Cover library: original artwork made for the platform (no third-party photography), used for data-room
 * covers, banners and template cards. A room shows its own uploaded banner first, then its assigned cover.
 */
export type Cover = { id: string; label: string; src: string; position?: string };

export const COVERS: Cover[] = [
  { id: "dawn-silk", label: "Dawn", src: "/covers/dawn-silk.jpg" },
  { id: "skyline-dusk", label: "Skyline", src: "/covers/skyline-dusk.jpg" },
  { id: "glass-fold", label: "Silk", src: "/covers/glass-fold.jpg" },
  { id: "market-glow", label: "Markets", src: "/covers/market-glow.jpg" },
  { id: "light-streaks", label: "Light", src: "/covers/light-streaks.jpg" },
  { id: "facade-grid", label: "Facade", src: "/covers/facade-grid.jpg" },
  { id: "ridges", label: "Ridges", src: "/covers/ridges.jpg" },
  { id: "harbor", label: "Harbour", src: "/covers/harbor.jpg" },
  // sample artwork supplied by the owner
  { id: "brazil-housing", label: "Brazil housing", src: "/covers/brazil-housing.jpg", position: "78% 55%" },
  { id: "night-skyline", label: "Night skyline", src: "/covers/night-skyline.jpg", position: "28% 72%" },
  { id: "strlex", label: "Strlex", src: "/covers/strlex.jpg", position: "center" },
];

/** Where a cover should be anchored when cropped (keeps the subject, not baked-in text, in view). */
export const coverPosition = (src: string) => COVERS.find((c) => c.src === src)?.position ?? "center";

const ROOM: Record<string, string> = {
  "rm-cascade": "skyline-dusk",
  "rm-stx": "brazil-housing",
  "rm-odd": "night-skyline",
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
