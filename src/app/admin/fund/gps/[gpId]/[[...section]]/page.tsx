import Link from "next/link";
import { reportingRate } from "@/lib/fx-server";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, FileText, Lock } from "lucide-react";
import { ButtonLink, Panel, Stat, StatRow, Status, cx } from "@/components/ui";
import { GpLogo, GpMark, AdministeredByAurum } from "@/components/brand/GpLogo";
import { FundsTable } from "@/components/fund/FundsTable";
import { gps, gpById } from "@/lib/gps";
import { callsForGp, distributionsForGp, documentsForGp, fundsForGp, gpTotals, investorsForGp, onboardingForGp } from "@/lib/gpData";
import { fundById } from "@/lib/data";
import { users, roleById } from "@/lib/access";
import { date, money, moneyShort } from "@/lib/format";

const sections = [
  ["", "Overview"],
  ["funds", "Funds"],
  ["investors", "Investors"],
  ["onboarding", "Onboarding"],
  ["capital", "Capital activity"],
  ["reports", "Reports"],
  ["portal", "Portal & brand"],
] as const;

export function generateStaticParams() {
  return gps.flatMap((g) => sections.map(([s]) => ({ gpId: g.id, section: s ? [s] : [] })));
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  return { title: gpById(gpId)?.shortName ?? "GP" };
}

export default async function GpWorkspace({ params }: { params: Promise<{ gpId: string; section?: string[] }> }) {
  const { gpId, section } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const current = section?.[0] ?? "";
  if (!sections.some(([s]) => s === current)) notFound();
  const fx = await reportingRate();
  const t = gpTotals(gp.id, fx.rate);
  const team = users.filter((u) => u.scope.toLowerCase().includes(gp.shortName.split(" ")[0].toLowerCase()) && roleById(u.role).audience === "Client (GP)");

  const empty = (msg: string) => <div className="rounded-[4px] border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-[13px] text-stone-500">{msg}</div>;

  const body = (() => {
    switch (current) {
      case "funds":
        return t.funds ? (
          <Panel flush>
            <FundsTable gpId={gp.id} />
          </Panel>
        ) : (
          empty("No funds yet. Add a vehicle and upload its LPA to set the economics.")
        );
      case "investors": {
        const rows = investorsForGp(gp.id, fx.rate);
        return rows.length ? (
          <Panel flush>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Type</th>
                  <th>Jurisdiction</th>
                  <th>Funds with this GP</th>
                  <th className="r">Commitments (USD)</th>
                  <th className="r">NAV (USD)</th>
                  <th>KYC</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.investor.id}>
                    <td className="font-semibold">{r.investor.name}</td>
                    <td className="text-stone-600">{r.investor.type}</td>
                    <td className="text-stone-600">{r.investor.jurisdiction}</td>
                    <td className="text-[12px] text-stone-600">{r.funds.join(", ")}</td>
                    <td className="num r">{moneyShort(r.commitment)}</td>
                    <td className="num r">{moneyShort(r.nav)}</td>
                    <td>
                      <Status value={r.investor.kyc} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          empty("No investors yet.")
        );
      }
      case "onboarding": {
        const rows = onboardingForGp(gp.id);
        return rows.length ? (
          <Panel flush>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Fund</th>
                  <th className="r">Commitment</th>
                  <th>Status</th>
                  <th>KYC / AML</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="row-link">
                    <td className="font-semibold">
                      <Link href={`/admin/fund/onboarding/${o.id}`}>{o.investorName}</Link>
                    </td>
                    <td className="text-stone-600">{fundById(o.fundId)!.shortName}</td>
                    <td className="num r">{money(o.commitment)}</td>
                    <td>
                      <Status value={o.status} />
                    </td>
                    <td>
                      <Status value={o.kyc} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          empty("No subscriptions in progress.")
        );
      }
      case "capital": {
        const calls = callsForGp(gp.id);
        const dists = distributionsForGp(gp.id);
        return (
          <div className="space-y-6">
            <Panel title="Capital calls" flush>
              {calls.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fund</th>
                      <th>Call</th>
                      <th>Due</th>
                      <th className="r">Amount</th>
                      <th className="r">Received</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((c) => (
                      <tr key={c.id} className="row-link">
                        <td className="font-semibold">
                          <Link href={`/admin/fund/capital-calls/${c.id}`}>{fundById(c.fundId)!.shortName}</Link>
                        </td>
                        <td className="num">No. {c.number}</td>
                        <td className="num text-stone-600">{date(c.dueDate)}</td>
                        <td className="num r">{money(c.amount, fundById(c.fundId)!.currency)}</td>
                        <td className="num r">{money(c.received, fundById(c.fundId)!.currency)}</td>
                        <td>
                          <Status value={c.status === "Draft" ? "GP consent" : c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-8 text-center text-[13px] text-stone-500">No capital calls.</p>
              )}
            </Panel>
            <Panel title="Distributions" flush>
              {dists.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fund</th>
                      <th>Date</th>
                      <th>Source</th>
                      <th className="r">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dists.map((d) => (
                      <tr key={d.id}>
                        <td className="font-semibold">{fundById(d.fundId)!.shortName}</td>
                        <td className="num text-stone-600">{date(d.date)}</td>
                        <td className="text-stone-600">{d.source}</td>
                        <td className="num r">{money(d.amount, fundById(d.fundId)!.currency)}</td>
                        <td>
                          <Status value={d.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-8 text-center text-[13px] text-stone-500">No distributions.</p>
              )}
            </Panel>
          </div>
        );
      }
      case "reports": {
        const docs = documentsForGp(gp.id);
        return docs.length ? (
          <Panel flush>
            <ul className="divide-y divide-stone-100">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-4 px-5 py-3 text-[13px]">
                  <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className="w-[220px] text-stone-500">{fundById(d.fundId)!.shortName}</span>
                  <span className="w-[140px] text-stone-500">{d.visibility}</span>
                  <span className="num w-[110px] text-stone-500">{date(d.date)}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-stone-100 px-5 py-3 text-[12px] text-stone-500">
              Investor-facing reports and notices are issued on {gp.shortName} letterhead with the “Administered by Aurum” line.
            </p>
          </Panel>
        ) : (
          empty("No documents yet.")
        );
      }
      case "portal":
        return (
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Brand">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex h-[110px] items-center justify-center rounded-[3px] border border-stone-200 bg-[#fbfaf7] p-4">
                  <GpLogo gp={gp} tone="light" height={gp.logo && gp.logo.width / gp.logo.height < 3 ? 60 : 30} />
                </div>
                <div className="flex h-[110px] items-center justify-center rounded-[3px] p-4" style={{ background: gp.brand.soft }}>
                  <GpMark gp={gp} size={56} tone="light" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["Primary", gp.brand.primary],
                  ["On primary", gp.brand.primaryInk],
                  ["Tint", gp.brand.soft],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="h-12 rounded-[3px] border border-stone-200" style={{ background: v }} />
                    <div className="mt-1.5 text-[12px] font-semibold">{k}</div>
                    <div className="font-mono text-[11px] text-stone-500">{v}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[12px] text-stone-500">Logos are stored as transparent files; the primary colour drives buttons, active navigation and report headers.</p>
            </Panel>
            <Panel title="Portal settings">
              <dl className="space-y-3 text-[13px]">
                {[
                  ["Portal address", gp.portalDomain],
                  ["Custom domain", gp.customDomain ?? "Not set — available on request"],
                  ["Email sender", gp.emailFrom],
                  ["GP sign-in domains", gp.emailDomains.join(", ")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-stone-100 pb-3">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="text-right font-mono text-[12px]">{v}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-6">
                  <dt className="text-stone-500">Administrator disclosure</dt>
                  <dd className="flex items-center gap-2 text-[12px]">
                    <Lock size={12} /> <AdministeredByAurum />
                  </dd>
                </div>
              </dl>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <ButtonLink href={`/gp/${gp.id}`} variant="secondary">
                  GP portal <ExternalLink size={13} />
                </ButtonLink>
                <ButtonLink href={`/investor/${gp.id}/login`} variant="secondary">
                  Investor portal <ExternalLink size={13} />
                </ButtonLink>
              </div>
            </Panel>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <StatRow>
              <Stat label="Funds" value={t.funds} />
              <Stat label="Investors" value={t.investors} />
              <Stat label="Commitments" value={t.funds ? moneyShort(t.commitment) : "—"} />
              <Stat label="NAV" value={t.funds ? moneyShort(t.nav) : "—"} />
              <Stat label="Open calls" value={t.openCalls} />
              <Stat label="Onboarding" value={t.onboarding} />
            </StatRow>
            {t.funds ? (
              <Panel title="Funds" flush>
                <FundsTable gpId={gp.id} />
              </Panel>
            ) : (
              <div className="rounded-[8px] border border-stone-200/70 bg-white shadow-card p-6">
                <div className="text-[14px] font-semibold">Client onboarding</div>
                <ol className="mt-4 space-y-3 text-[13px]">
                  {[
                    ["Brand received — logo and colours", true],
                    ["Portal address reserved", true],
                    ["First fund created", false],
                    ["LPA uploaded and economics approved", false],
                    ["GP users invited", false],
                  ].map(([s, d]) => (
                    <li key={s as string} className="flex items-center gap-3">
                      <span className={cx("flex h-5 w-5 items-center justify-center rounded-full", d ? "bg-ink-900 text-white" : "border border-stone-300")}>
                        {d && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className={d ? "" : "text-stone-500"}>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <Panel title="GP users" flush>
              {team.length ? (
                <ul className="divide-y divide-stone-100">
                  {team.map((u) => (
                    <li key={u.email} className="flex items-center justify-between px-5 py-3 text-[13px]">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-stone-500">{roleById(u.role).name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-[13px] text-stone-500">No GP users invited yet.</p>
              )}
            </Panel>
          </div>
        );
    }
  })();

  return (
    <div className="space-y-6">
      <Link href="/admin/fund/gps" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> GPs
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-6">
          <div className="flex h-[72px] min-w-[150px] items-center">
            <GpLogo gp={gp} height={gp.logo && gp.logo.width / gp.logo.height < 3 ? 64 : 32} />
          </div>
          <div className="border-l border-stone-200 pl-6">
            <div className="eyebrow">GP client</div>
            <h1 className="mt-1 flex items-center gap-3 text-[22px] font-semibold tracking-[-0.015em]">
              {gp.name} <Status value={gp.status === "Live" ? "Clear" : "In progress"} />
            </h1>
            <div className="mt-0.5 font-mono text-[11px] text-stone-500">{gp.customDomain ?? gp.portalDomain}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/gp/${gp.id}`} variant="secondary">
            View GP portal
          </ButtonLink>
          <ButtonLink href={`/investor/${gp.id}/login`}>View as investor</ButtonLink>
        </div>
      </div>
      <nav className="flex gap-6 border-b border-stone-200">
        {sections.map(([s, l]) => (
          <Link
            key={s}
            href={`/admin/fund/gps/${gp.id}${s ? `/${s}` : ""}`}
            className={cx(
              "-mb-px border-b-2 pb-3 pt-1 text-[13px]",
              current === s ? "border-gold-500 font-semibold text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900",
            )}
          >
            {l}
          </Link>
        ))}
      </nav>
      {body}
      {fundsForGp(gp.id).some((f) => f.economicsPending) && (
        <p className="text-[12px] text-stone-500">Fund economics for this GP are pending LPA review; capital figures shown are preview data.</p>
      )}
    </div>
  );
}
