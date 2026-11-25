"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { DiscussButton } from "@/components/spine/Spine";
import { Card, Kpi, ModuleHeader, Pill } from "@/components/firm/kit";
import { MEMBERS, TENANTS, clientFormations, isOnboardedClient } from "@/lib/parties";
import { clients as commsClients } from "@/lib/comms";
import { familyOf, money, totals } from "@/lib/wealth";
import { progress } from "@/lib/checklist";
import { useChecklists } from "@/components/onboarding/Checklist";

/**
 * Multi-Family Office: the families and holding clients a firm serves, each with its own client portal.
 * A tenant sees only its own clients; Aurum's staff see Aurum's direct clients and every tenant's.
 */
export function MultiFamilyWorkspace() {
  const router = useRouter();
  const { member, setPerson } = usePreviewRole();
  const lists = useChecklists() ?? [];
  const orgs = [...new Set(MEMBERS.filter((m) => m.party === "client").map((m) => m.org))]
    .map((org) => {
      const people = MEMBERS.filter((m) => m.org === org);
      return {
        org,
        name: people[0].orgName,
        tenantId: people[0].tenantId,
        people,
        onboarded: isOnboardedClient(org),
        forms: clientFormations(org),
        color: commsClients.find((c) => c.id === org)?.color ?? "#555",
      };
    })
    .filter((c) => (member.party === "tenant" ? c.tenantId === member.org : true));
  const live = orgs.filter((o) => o.onboarded);
  const forming = orgs.filter((o) => !o.onboarded);
  const servedBy = (t?: string) => (t ? TENANTS.find((x) => x.id === t)?.name : "Direct client");

  const open = (org: string) => {
    const who = MEMBERS.find((m) => m.org === org && m.orgAdmin) ?? MEMBERS.find((m) => m.org === org);
    if (!who) return;
    setPerson(who.id);
    router.push("/client");
  };

  return (
    <>
      <ModuleHeader
        color="var(--tenant-accent)"
        title="Multi-Family Office"
        action={
          <Link
            href="/admin/multi-family/onboarding"
            className="inline-flex h-9 items-center rounded-[10px] border border-stone-200 px-3.5 text-[13px] font-semibold text-ink-900 hover:bg-stone-50"
          >
            Client onboarding
          </Link>
        }
      />
      <p className="mt-1 text-[13px] text-stone-500">
        {member.party === "tenant" ? `${member.orgName}'s clients and their portals.` : "Every client with a portal — Aurum's own and those served by tenants."}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-4">
        <Kpi label="Client portals live" value={live.length} />
        <Kpi label="Forming a company" value={forming.length} note="portal opens at incorporation" />
        <Kpi label="Served by tenants" value={orgs.filter((o) => o.tenantId).length} />
      </div>
      <div className="mt-6 space-y-3">
        {[...live, ...forming].map((c) => (
          <Card key={c.org} className="flex flex-wrap items-center gap-4 p-5">
            <span className="h-9 w-9 shrink-0 rounded-[8px]" style={{ background: c.color }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14.5px] font-semibold text-ink-900">{c.name}</span>
                <Pill tone={c.onboarded ? "good" : "gold"}>{c.onboarded ? "Portal live" : `Forming · ${c.forms[0]?.stage ?? "application"}`}</Pill>
              </div>
              <div className="text-[12px] text-stone-500">
                {servedBy(c.tenantId)} · {c.people.map((p) => p.name).join(", ")}
                {c.forms.length ? ` · ${c.forms.length} compan${c.forms.length === 1 ? "y" : "ies"} through Corporate Solution` : ""}
              </div>
            </div>
            {(() => {
              const f = familyOf(c.org);
              const open = lists.filter((l) => l.org === c.org && !progress(l).done);
              return (
                <>
                  {open.map((l) => (
                    <Link key={l.id} href={`/admin/multi-family/onboarding#${l.id}`} className="text-right text-[11.5px] leading-tight text-stone-500 hover:text-ink-900">
                      {l.title}
                      <br />
                      <b className="font-semibold text-ink-900">
                        {progress(l).accepted}/{progress(l).n} accepted{progress(l).review ? ` · ${progress(l).review} to review` : ""}
                      </b>
                    </Link>
                  ))}
                  {f && (
                    <Link href={`/admin/multi-family/${f.id}`} className="rounded-[8px] border border-stone-200 px-3 py-1.5 text-right leading-tight hover:border-stone-300">
                      <span className="block text-[10.5px] text-stone-500">Net worth · demo</span>
                      <span className="text-[14px] font-semibold tabular-nums text-ink-900">{money(totals(f).net)}</span>
                    </Link>
                  )}
                </>
              );
            })()}
            <DiscussButton refTo={{ kind: "deal", id: `client-${c.org}` }} label={c.name} title={`${c.name} — client`} />
            <button onClick={() => open(c.org)} className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2.5 text-[12.5px] font-semibold text-ink-900 hover:bg-stone-100">
              {c.onboarded ? "Preview their portal" : "Preview their application"} <ArrowUpRight size={13} />
            </button>
          </Card>
        ))}
        {!orgs.length && <Card className="px-5 py-10 text-center text-[13px] text-stone-500">No clients yet. Invite your first client from Access & permissions.</Card>}
      </div>
    </>
  );
}
