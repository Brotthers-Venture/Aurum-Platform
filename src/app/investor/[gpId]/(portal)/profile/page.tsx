import type { Metadata } from "next";
import { ProfileSettings } from "@/components/portal/ProfileSettings";
import { gps } from "@/lib/gps";

export const metadata: Metadata = { title: "Profile" };

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export default function ProfilePage() {
  return <ProfileSettings />;
}
