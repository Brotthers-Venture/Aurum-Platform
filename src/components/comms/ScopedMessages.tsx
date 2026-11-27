"use client";

import { PortalChat } from "@/components/chat/PortalChat";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { clientById, people } from "@/lib/comms";
import { memberById } from "@/lib/parties";

/**
 * Corporate Chat for people outside the firm (general partners, tenants, clients, limited partners):
 * the same conversations the firm works in, limited to their organisation's, never the firm's internal
 * channels or notes. Accent props are kept for callers; the chat takes its colours from the theme.
 */
export function ScopedMessages({ className, asIfStaff }: { accent?: string; accentInk?: string; className?: string; asIfStaff?: string }) {
  const { member: viewer } = usePreviewRole();
  // staff previewing a portal see it as that portal's sample person
  const member = viewer.party === "employee" && asIfStaff ? (memberById(asIfStaff) ?? viewer) : viewer;
  const client = clientById(member.org);
  const person = people.find((p) => p.id === member.id);
  if (!client || !person)
    return (
      <div className="rounded-[14px] border border-dashed border-stone-300 bg-white px-8 py-16 text-center">
        <h1 className="text-[17px] font-semibold text-ink-900">Your conversations are being set up</h1>
        <p className="mx-auto mt-2 max-w-[440px] text-[13px] text-stone-600">They will appear here as soon as your team is onboarded.</p>
      </div>
    );
  return <PortalChat key={person.id} personId={person.id} className={className ?? "h-[calc(100vh-150px)] min-h-[560px]"} />;
}
