import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RoomViewer } from "@/components/dataroom/RoomViewer";
import { docs, roomBrand, rooms, shareLinks, type ShareLink } from "@/lib/dataroom";

export const metadata: Metadata = { title: { absolute: "Secure data room" }, robots: { index: false, follow: false } };

type Params = Promise<{ linkId: string }>;
type Search = Promise<{ preview?: string; cfg?: string }>;

export default function RoomPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <Viewer params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Admin previews pass the link's current (possibly unsaved) settings; real visitors get the stored link. */
function decode(cfg: string): ShareLink | null {
  try {
    return JSON.parse(Buffer.from(cfg, "base64url").toString("utf8")) as ShareLink;
  } catch {
    return null;
  }
}

async function Viewer({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ linkId }, { preview, cfg }, h] = await Promise.all([params, searchParams, headers()]);
  const fromAdmin = preview === "1" && cfg ? decode(cfg) : null;
  const link = fromAdmin ?? shareLinks.find((l) => l.id === linkId);
  const room = link && rooms.find((r) => r.id === link.roomId);
  if (!link || !room) notFound();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "IP hidden";
  return (
    <RoomViewer
      room={room}
      link={link}
      docs={docs.filter((d) => d.roomId === room.id)}
      brand={roomBrand[room.id] ?? { primary: "#0F2340", secondary: "#B8975A", wordmark: room.client, tagline: "" }}
      ip={ip}
      preview={preview === "1"}
    />
  );
}
