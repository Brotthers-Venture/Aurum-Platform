import type { Metadata } from "next";
import { Suspense } from "react";
import { CorporateChat } from "@/components/chat/CorporateChat";

export const metadata: Metadata = { title: "Corporate Chat" };

/** Corporate Chat (the module key stays "communication" so saved data and links keep working). */
export default function CommunicationPage() {
  return (
    <Suspense fallback={<div className="ws h-dvh" />}>
      <CorporateChat />
    </Suspense>
  );
}
