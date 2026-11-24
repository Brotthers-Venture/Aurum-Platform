import type { Metadata } from "next";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminHub } from "@/components/admin/AdminHub";

export const metadata: Metadata = { title: "Administration" };

export default function AdminHome() {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminTopBar />
      <AdminHub />
    </div>
  );
}
