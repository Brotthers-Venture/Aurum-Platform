import type { Metadata } from "next";
import { CommsWorkspace } from "@/components/comms/CommsWorkspace";

export const metadata: Metadata = { title: "Communication" };

export default function CommunicationPage() {
  return <CommsWorkspace mode="aurum" />;
}
