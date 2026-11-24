import type { Metadata } from "next";
import { ProfileSettings } from "@/components/portal/ProfileSettings";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <ProfileSettings />;
}
