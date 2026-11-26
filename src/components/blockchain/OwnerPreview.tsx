"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useChain } from "@/lib/blockchain/store";
import { Empty } from "./ui";
import { OwnerWallet } from "./OwnerWallet";

/** The owner's view of a token, as they see it in the client portal. */
export function OwnerPreview({ id }: { id: string }) {
  const d = useChain();
  const t = d.token(id);
  if (!t?.clientOrg) return <Empty>No owner portal for this company.</Empty>;
  // the person who acts for the largest holding: a signer for a trust or company, or the individual holder
  const top = [...t.holders].sort((a, b) => b.units - a.units)[0];
  const person = top.signer ? top.signer.split(",")[0] : top.name;
  return (
    <div className="max-w-[1180px]">
      <Link href={`/admin/blockchain/${t.id}`} className="mt-2 inline-flex items-center gap-1 px-2 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> {t.company}
      </Link>
      <div className="px-2 pb-4 pt-3">
        <div className="text-[12.5px] text-d-text-3">Owner’s view · as {person} sees it in the client portal</div>
        <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-d-text">Shares</h1>
      </div>
      <OwnerWallet org={t.clientOrg} person={person} />
    </div>
  );
}
