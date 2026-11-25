"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, Check, FileText, ListChecks, LogOut, MessagesSquare, Users } from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo } from "@/components/brand/Logo";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { ScopedMessages } from "@/components/comms/ScopedMessages";
import { AURUM, PRESETS, brandVars, type Brand } from "@/lib/brand";
import { STAGES, jurisdictions, type Formation } from "@/lib/formation";
import { TENANTS, clientFormations, isOnboardedClient } from "@/lib/parties";
import { people as commsPeople } from "@/lib/comms";
import { familyOf } from "@/lib/wealth";
import { progress } from "@/lib/checklist";
import { WealthPlatform } from "@/components/wealth/WealthPlatform";
import { ClientChecklist, useChecklists } from "@/components/onboarding/Checklist";

const when = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const jName = (id: string) => jurisdictions.find((j) => j.id === id)?.name ?? id;

/** Family holding structures already administered (sample); companies formed through Corporate Solution join them. */
const FAMILY_ENTITIES: Record<string, { name: string; kind: string; where: string; role: string }[]> = {
  halvorsen: [
    { name: "Halvorsen Family Trust", kind: "Trust", where: "Delaware", role: "Top holding" },
    { name: "Halvorsen Holdings LLC", kind: "LLC", where: "Delaware", role: "Operating holding" },
    { name: "Halvorsen Real Estate LP", kind: "Limited partnership", where: "Florida", role: "Property portfolio" },
  ],
  valenca: [
    { name: "Valença Participações Ltda.", kind: "Sociedade limitada", where: "São Paulo", role: "Top holding" },
    { name: "Valença Offshore Ltd.", kind: "Company", where: "British Virgin Islands", role: "International assets" },
  ],
};
const DOCS = [
  "Certificate of formation",
  "Operating agreement",
  "EIN confirmation",
  "Registered agent appointment",
  "Beneficial ownership report",
  "Annual consolidated statement",
];

/**
 * The client's own portal. Before a company is formed it shows the Corporate Solution application in progress;
 * once formed, the client portal — the Multi-Family Office platform from the client's side. A tenant's clients
 * see the tenant's brand (B2B2C); Aurum's direct clients see Aurum's.
 */
export function ClientPortal() {
  const { member } = usePreviewRole();
  const [tab, setTab] = useState<"overview" | "documents" | "messages" | "wealth" | "onboarding">("wealth");
  const lists = useChecklists() ?? [];
  if (member.party !== "client")
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 p-8 text-center">
        <div>
          <h1 className="text-[20px] font-semibold text-ink-900">Client portal</h1>
          <p className="mt-2 max-w-[420px] text-[13px] text-stone-600">
            Clients sign in here. To preview it, choose a client under “Preview as” in the account menu of the console.
          </p>
          <Link href="/admin" className="mt-4 inline-flex text-[13px] font-semibold text-ink-900 underline-offset-2 hover:underline">
            Back to the console
          </Link>
        </div>
      </div>
    );

  const tenant = member.tenantId ? TENANTS.find((t) => t.id === member.tenantId) : undefined;
  const brand: Brand = tenant ? (PRESETS.find((p) => p.id === tenant.brandPreset) ?? AURUM) : AURUM;
  const formed = isOnboardedClient(member.org);
  const forms = clientFormations(member.org);
  const team = commsPeople.filter((p) => p.org === member.org);
  const family = familyOf(member.org);
  const mine = lists.filter((l) => l.org === member.org);
  const openLists = mine.filter((l) => progress(l).open > 0);
  const view = tab === "wealth" && !family ? "overview" : tab;
  const entities = [
    ...(FAMILY_ENTITIES[member.org] ?? []),
    ...forms
      .filter((f) => f.stage === "Incorporated" || f.stage === "Post-formation")
      .map((f) => ({ name: f.company, kind: f.type, where: jName(f.jurisdiction), role: "Formed through Corporate Solution" })),
  ];

  return (
    <div className="ws ws-light ws-bridge ws-portal min-h-dvh bg-d-bg" style={brandVars(brand) as React.CSSProperties}>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-8 max-sm:gap-3 max-sm:px-4">
          {tenant ? (
            <span className="leading-none">
              <span className="block font-serif text-[19px] text-ink-900">{brand.name}</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-500">{brand.tagline}</span>
            </span>
          ) : (
            <AurumLogo variant="dark" height={30} />
          )}
          {formed && (
            <nav className="flex h-full items-stretch gap-1">
              {(
                [
                  ...(family
                    ? ([["wealth", "Wealth", Building2]] as const)
                    : ([
                        ["overview", "Overview", Building2],
                        ["documents", "Documents", FileText],
                      ] as const)),
                  ...(mine.length
                    ? ([["onboarding", openLists.length ? `Onboarding · ${openLists.reduce((n, l) => n + progress(l).open, 0)}` : "Onboarding", ListChecks]] as const)
                    : []),
                  ["messages", "Messages", MessagesSquare],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cx(
                    "relative flex items-center gap-1.5 whitespace-nowrap px-3 text-[13px] font-medium max-sm:px-1.5",
                    view === id ? "text-ink-900" : "text-stone-500 hover:text-ink-900",
                  )}
                >
                  <Icon size={14} strokeWidth={1.8} className="max-sm:hidden" /> {label}
                  {view === id && <span className="absolute inset-x-3 bottom-0 h-0.5" style={{ background: "var(--tenant-ink)" }} />}
                </button>
              ))}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-3 text-right">
            <span className="leading-tight max-sm:hidden">
              <span className="block text-[12.5px] font-semibold text-ink-900">{member.name}</span>
              <span className="block text-[11px] text-stone-500">{member.orgName}</span>
            </span>
            <Link href="/login" aria-label="Sign out" className="rounded-[6px] p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
              <LogOut size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-8 py-10 max-sm:px-4 max-sm:py-6">
        {!formed ? (
          <FormationProgress
            forms={forms}
            name={member.name.split(" ")[0]}
            brandName={brand.name}
            checklists={mine.map((c) => (
              <ClientChecklist key={c.id} c={c} actor={member.name} />
            ))}
          />
        ) : view === "wealth" && family ? (
          <WealthPlatform family={family} mode="client" actor={member.name} actorId={member.id} />
        ) : view === "onboarding" ? (
          <div className="mx-auto max-w-[820px] space-y-10">
            {mine.map((c) => (
              <ClientChecklist key={c.id} c={c} actor={member.name} />
            ))}
          </div>
        ) : view === "overview" ? (
          <div className="space-y-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{tenant ? `${brand.name} · client portal` : "Client portal"}</div>
              <h1 className="mt-2 font-serif text-[32px] leading-tight text-ink-900">{member.orgName}</h1>
              <p className="mt-1 text-[14px] text-stone-600">Your structure, documents and conversations in one place.</p>
            </div>
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                <Building2 size={15} /> Your structure
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entities.map((e) => (
                  <div key={e.name} className="rounded-[10px] border border-stone-200 bg-white p-4">
                    <div className="text-[11px] text-stone-500">{e.role}</div>
                    <div className="mt-1 text-[14px] font-semibold text-ink-900">{e.name}</div>
                    <div className="mt-0.5 text-[12px] text-stone-600">
                      {e.kind} · {e.where}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {forms.length > 0 && (
              <section>
                <h2 className="mb-3 text-[14px] font-semibold text-ink-900">Companies with {tenant ? brand.name : "us"}</h2>
                <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-white">
                  {forms.map((f) => (
                    <div key={f.ref} className="flex items-center gap-4 border-b border-stone-100 px-4 py-3 last:border-0 text-[13px]">
                      <span className="flex-1 font-medium text-ink-900">{f.company}</span>
                      <span className="text-stone-500">{jName(f.jurisdiction)}</span>
                      <span className="text-stone-500">{f.ref}</span>
                      <span className="font-medium text-ink-900">{f.stage}</span>
                    </div>
                  ))}
                </div>
                <Link href="/incorporate" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-900 hover:underline">
                  Form another company <ArrowRight size={13} />
                </Link>
              </section>
            )}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                <Users size={15} /> Your team
              </h2>
              <div className="flex flex-wrap gap-2">
                {team.map((p) => (
                  <span key={p.id} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[12.5px] text-ink-900">
                    {p.name} <span className="text-stone-500">· {p.title}</span>
                  </span>
                ))}
              </div>
            </section>
          </div>
        ) : view === "documents" ? (
          <div className="overflow-hidden rounded-[10px] border border-stone-200 bg-white">
            {entities.flatMap((e, i) =>
              DOCS.slice(0, i === 0 ? 6 : 3).map((d) => (
                <div key={e.name + d} className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 text-[13px] last:border-0">
                  <FileText size={15} className="text-stone-400" />
                  <span className="flex-1 text-ink-900">{d}</span>
                  <span className="text-stone-500">{e.name}</span>
                </div>
              )),
            )}
          </div>
        ) : (
          <ScopedMessages accent="var(--tenant-ink)" className="h-[calc(100vh-200px)] min-h-[520px]" />
        )}
      </main>
    </div>
  );
}

function FormationProgress({ forms, name, brandName, checklists }: { forms: Formation[]; name: string; brandName: string; checklists: React.ReactNode[] }) {
  const f = forms[0];
  return (
    <div className="space-y-10">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Corporate Solution · {brandName}</div>
        <h1 className="mt-2 font-serif text-[30px] leading-tight text-ink-900">Welcome, {name}.</h1>
        <p className="mt-2 max-w-[520px] text-[14px] text-stone-600">
          {f ? `${f.company} is being formed. Your client portal opens as soon as the company is incorporated.` : "Start your company formation to open your client portal."}
        </p>
        {f && (
          <ol className="mt-8 space-y-0">
            {STAGES.map((s, i) => {
              const at = STAGES.indexOf(f.stage);
              const done = i < at || f.stage === "Post-formation";
              const now = i === at;
              return (
                <li key={s} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                        done ? "bg-ink-900 text-white" : now ? "border-2 border-ink-900 text-ink-900" : "border border-stone-300 text-stone-400",
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    {i < STAGES.length - 1 && <span className={cx("w-px flex-1", done ? "bg-ink-900" : "bg-stone-200")} style={{ minHeight: 22 }} />}
                  </div>
                  <div className="pb-5">
                    <div className={cx("text-[14px]", now ? "font-semibold text-ink-900" : done ? "text-ink-900" : "text-stone-500")}>{s}</div>
                    {now && <div className="text-[12px] text-stone-500">In progress · submitted {when(f.submitted)}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <Link href="/incorporate" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-900 hover:underline">
          {f ? "Review your application" : "Start your application"} <ArrowRight size={13} />
        </Link>
      </div>
      {checklists.length > 0 && <div className="space-y-8">{checklists}</div>}
      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink-900">Messages</div>
        <ScopedMessages accent="var(--tenant-ink)" className="h-[560px]" />
      </div>
    </div>
  );
}
