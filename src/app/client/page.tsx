import type { Metadata } from "next";
import { ClientPortal } from "@/components/client/ClientPortal";

export const metadata: Metadata = { title: "Client portal" };

export default function ClientPortalPage() {
  return <ClientPortal />;
}
