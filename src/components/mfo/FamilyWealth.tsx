"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { DiscussButton } from "@/components/spine/Spine";
import { ModuleHeader } from "@/components/firm/kit";
import { WealthPlatform } from "@/components/wealth/WealthPlatform";
import { ChecklistReview } from "@/components/onboarding/Checklist";
import { FAMILIES, familyOf } from "@/lib/wealth";
import { MEMBERS, TENANTS } from "@/lib/parties";

/** The office's view of one family: the same wealth pages the family sees, plus access and to-dos. */
export function FamilyWealth({ id }: { id: string }) {
  const { member } = usePreviewRole();
  const f = familyOf(id);
  if (!f) return null;
  const allowed = member.party === "employee" || (member.party === "tenant" && f.tenantId === member.org);
  const servedBy = f.tenantId ? TENANTS.find((t) => t.id === f.tenantId)?.name : "Aurum · direct";
  return (
    <>
      <Link href="/admin/multi-family" className="mb-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-d-text-2 hover:text-d-text">
        <ArrowLeft size={13} /> Families
      </Link>
      <ModuleHeader color="var(--tenant-accent)" title={f.name} action={<DiscussButton refTo={{ kind: "family", id: f.id }} label={f.name} title={`${f.name} — family`} />} />
      <p className="mb-5 mt-1 text-[13px] text-d-text-3">
        {servedBy} · relationship manager {f.rm.name}
      </p>
      {allowed ? (
        <WealthPlatform family={f} mode="staff" actor={member.name} />
      ) : (
        <p className="py-16 text-center text-[13px] text-d-text-3">This family is served by another firm.</p>
      )}
    </>
  );
}

/** Client onboarding desk: checklists sent to clients and the review of what they send back. */
export function OnboardingDesk() {
  const { member } = usePreviewRole();
  const orgs = member.party === "tenant" ? [...new Set(MEMBERS.filter((m) => m.party === "client" && m.tenantId === member.org).map((m) => m.org))] : undefined;
  return (
    <>
      <ModuleHeader color="var(--tenant-accent)" title="Client onboarding" />
      <p className="mb-5 mt-1 text-[13px] text-d-text-3">
        Checklists sent to clients. Each item is accepted, or returned with a note the client sees. {FAMILIES.length} families live.
      </p>
      <ChecklistReview actor={member.name} orgs={orgs} />
    </>
  );
}
