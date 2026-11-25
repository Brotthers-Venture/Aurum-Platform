import type { Metadata } from "next";
import { EcosystemPage } from "@/components/admin/ecosystem/EcosystemPage";

export const metadata: Metadata = { title: "Administration" };

export default function AdminHome() {
  return <EcosystemPage />;
}
