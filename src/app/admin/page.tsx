import type { Metadata } from "next";
import { HubTopBar } from "@/components/admin/HubTopBar";
import { AdminHub } from "@/components/admin/AdminHub";

export const metadata: Metadata = { title: "Administration" };

export default function AdminHome() {
  return (
    <div className="flex min-h-screen flex-col">
      <HubTopBar />
      <AdminHub />
    </div>
  );
}
