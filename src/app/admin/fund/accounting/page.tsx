import type { Metadata } from "next";
import { AccountingWorkspace } from "@/components/fund/AccountingWorkspace";

export const metadata: Metadata = { title: "General ledger" };

export default function AccountingPage() {
  return <AccountingWorkspace />;
}
