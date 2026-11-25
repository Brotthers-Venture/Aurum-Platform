import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { ScopedMessages } from "@/components/comms/ScopedMessages";

export const metadata: Metadata = { title: "Corporate Chat" };

/** Corporate Chat for general partners and tenants inside the console — their own conversations only. */
export default function MessagesPage() {
  return (
    <AppShell context="Corporate Chat">
      <div className="px-6 py-5">
        <ScopedMessages className="h-[calc(100vh-110px)] min-h-[560px]" />
      </div>
    </AppShell>
  );
}
