import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { FundsTable } from "@/components/fund/FundsTable";

export const metadata: Metadata = { title: "Funds" };

export default function FundsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Funds"
        description="Private funds, offshore vehicles and SPVs under Aurum administration."
        actions={
          <Button>
            <Plus size={14} strokeWidth={2} /> New vehicle
          </Button>
        }
      />
      <Panel flush>
        <FundsTable />
      </Panel>
    </div>
  );
}
