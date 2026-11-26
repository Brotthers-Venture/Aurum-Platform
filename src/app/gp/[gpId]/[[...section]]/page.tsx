import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, FileText } from "lucide-react";
import { ptaxTable, rateOn, reportingRate } from "@/lib/fx-server";
import { cx } from "@/components/ui";
import { ApproveButton } from "@/components/gp/ApproveButton";
import { Figures, Meter, PageHead, StatusPill, td, th, tr } from "@/components/gp/GpKit";
import { InvestorTable } from "@/components/gp/InvestorTable";
import { GpCloseReview, GpCloseSection } from "@/components/reporting/GpClose";
import { LegendWorkspace, Panel, type WorkspaceAttention, type WorkspaceCall, type WorkspaceEvent } from "@/components/workspace/LegendWorkspace";
import { gps, gpById } from "@/lib/gps";
import { callsForGp, distributionsForGp, documentsForGp, fundsForGp, investorsForGp, onboardingForGp } from "@/lib/gpData";
import { capitalAccounts, fundById, fundTotals, investorById } from "@/lib/data";
import { analyticsData } from "@/lib/analytics";
import { date, money, moneyShort, multiple, pct } from "@/lib/format";

const sections = ["", "funds", "investors", "activity", "reports"];

export function generateStaticParams() {
  return gps.flatMap((g) => [
    ...sections.map((s) => ({ gpId: g.id, section: s ? [s] : [] })),
    ...fundsForGp(g.id).map((f) => ({ gpId: g.id, section: ["funds", f.id] })),
    ...fundsForGp(g.id).map((f) => ({ gpId: g.id, section: ["reports", f.id] })),
  ]);
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string; section?: string[] }> }) {
  const { gpId, section } = await params;
  const gp = gpById(gpId);
  const page = { funds: "Funds", investors: "Investors", activity: "Capital activity", reports: "Reports" }[section?.[0] ?? ""] ?? "Overview";
  return { title: { absolute: gp ? `${gp.shortName} — ${page}` : "Manager portal" } };
}

export default function GpPortalPage({ params }: { params: Promise<{ gpId: string; section?: string[] }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <GpPortal params={params} />
    </Suspense>
  );
}

const Frame = ({ children }: { children: React.ReactNode }) => <div className="mx-auto w-full max-w-[1640px] px-6 pb-10 pt-4 2xl:px-8">{children}</div>;

async function GpPortal({ params }: { params: Promise<{ gpId: string; section?: string[] }> }) {
  const { gpId, section } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const current = section?.[0] ?? "";
  if (!sections.includes(current) || (section?.length ?? 0) > (current === "funds" || current === "reports" ? 2 : 1)) notFound();
  const base = `/gp/${gp.id}`;
  const fs = fundsForGp(gp.id);
  const calls = callsForGp(gp.id);

  if (!fs.length)
    return (
      <Frame>
        <PageHead eyebrow={gp.shortName} title="Welcome" />
        <div className="rounded-[12px] border border-dashed border-stone-300 bg-white px-8 py-16 text-center">
          <h2 className="text-[17px] font-semibold text-ink-900">Your portal is being set up</h2>
          <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-relaxed text-stone-600">
            Your administrator is configuring your first fund. Performance, investors and capital activity will appear here once the fund’s documents are reviewed and approved.
          </p>
        </div>
      </Frame>
    );

  /* ───────── Overview before the first close: what is being prepared, not a dashboard of zeros ───────── */
  if (current === "" && fs.every((f) => fundTotals(f.id).commitment === 0)) {
    const steps = [
      { title: "Fund documents", detail: "Your administrator reviews the LPA and sets the fund’s terms." },
      { title: "Investor invitations", detail: "Prospective investors receive an invitation in your name to subscribe online." },
      { title: "Subscriptions", detail: "Investors complete their documents and identity checks; you follow each one here." },
      { title: "First close", detail: "Commitments are accepted and the dashboard, capital activity and reports go live." },
    ];
    return (
      <Frame>
        <PageHead
          eyebrow={gp.shortName}
          title="Your portal is being prepared"
          meta="Performance and capital activity appear here from the first close. Until then, this is where each step stands."
        />
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title={`Funds · ${fs.length}`}>
            <ul>
              {fs.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-stone-100 px-4 py-4 last:border-0">
                  <div className="min-w-0 flex-1">
                    <Link href={`${base}/funds/${f.id}`} className="text-[14px] font-semibold text-ink-900 hover:underline">
                      {f.name}
                    </Link>
                    <div className="mt-0.5 text-[12px] text-stone-500">
                      {f.strategy.split(" — ")[0]} · vintage {f.vintage}
                      {f.economicsPending ? " · terms pending LPA review" : ""}
                    </div>
                  </div>
                  <StatusPill value={f.status} />
                  <Link href={`${base}/funds/${f.id}`} aria-label={`Open ${f.shortName}`} className="text-stone-400 hover:text-ink-900">
                    <ArrowRight size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="From setup to first close" bodyClass="px-4 py-3">
            <ol className="space-y-0">
              {steps.map((st, i) => (
                <li key={st.title} className="relative flex gap-3.5 pb-4 last:pb-1">
                  {i < steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[11px] top-7 w-px bg-stone-200" />}
                  <span className="num flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border border-stone-300 text-[11.5px] text-stone-600">{i + 1}</span>
                  <div className="pt-0.5">
                    <div className="text-[13px] font-semibold text-ink-900">{st.title}</div>
                    <div className="mt-0.5 text-[12.5px] leading-relaxed text-stone-600">{st.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href={`${base}/messages`}
              className="mt-2 inline-flex h-8 items-center gap-2 rounded-[8px] border border-stone-200 px-3 text-[12.5px] font-semibold text-ink-900 hover:bg-stone-100"
            >
              Message your administrator <ArrowRight size={13} />
            </Link>
          </Panel>
        </div>
      </Frame>
    );
  }

  /* ───────── Overview: the operator's workspace, limited to this manager's funds ───────── */
  if (current === "") {
    const table = await ptaxTable();
    const all = analyticsData((d) => rateOn(table, d));
    const data = { ...all, funds: all.funds.filter((f) => f.gpId === gp.id) };
    const drafts = calls.filter((c) => c.status === "Draft");
    const open = calls.filter((c) => c.status === "Partially funded" || c.status === "Issued");
    const subs = onboardingForGp(gp.id).filter((o) => o.status !== "Countersigned");
    const latest = documentsForGp(gp.id)
      .filter((d) => d.visibility !== "Internal")
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const attention: WorkspaceAttention[] = [
      ...drafts.map((c) => {
        const f = fundById(c.fundId)!;
        return {
          tag: "Approval",
          title: `${f.shortName} — Call No. ${c.number}`,
          detail: `${moneyShort(c.amount, f.currency)} · prepared by your administrator`,
          href: `${base}/activity`,
        };
      }),
      ...open.map((c) => {
        const f = fundById(c.fundId)!;
        return {
          tag: "Capital call",
          title: `${f.shortName} — Call No. ${c.number}`,
          detail: `${pct(c.received / c.amount, 0)} received · due ${date(c.dueDate)}`,
          href: `${base}/activity`,
        };
      }),
      ...(subs.length ? [{ tag: "Subscriptions", title: `${subs.length} in progress`, detail: subs.map((s) => s.investorName).join(", "), href: `${base}/investors` }] : []),
      ...(latest ? [{ tag: "Report", title: latest.name, detail: `${fundById(latest.fundId)!.shortName} · published ${date(latest.date)}`, href: `${base}/reports` }] : []),
    ];
    const wsCalls: WorkspaceCall[] = [...calls]
      .sort((x, y) => y.dueDate.localeCompare(x.dueDate))
      .map((c) => {
        const f = fundById(c.fundId)!;
        return {
          id: c.id,
          fund: f.shortName,
          fundId: f.id,
          number: c.number,
          notice: c.noticeDate,
          due: date(c.dueDate),
          amount: c.amount,
          received: c.received,
          status: c.status,
          currency: f.currency,
        };
      });
    const events: WorkspaceEvent[] = [
      ...calls.map((c) => ({
        id: c.id,
        at: c.noticeDate,
        title: `${fundById(c.fundId)!.shortName} · Call ${c.number}`,
        status: c.status,
        side: "Call",
        type: "Capital call",
        href: `${base}/activity`,
      })),
      ...distributionsForGp(gp.id).map((d) => ({
        id: d.id,
        at: d.date,
        title: `${fundById(d.fundId)!.shortName} · ${d.type}`,
        status: d.status,
        side: "Distribution",
        type: d.type,
        href: `${base}/activity`,
      })),
    ]
      .sort((x, y) => y.at.localeCompare(x.at))
      .slice(0, 12)
      .map((e) => ({ id: e.id, title: e.title, status: e.status, side: e.side, type: e.type, href: e.href }));
    return (
      <Frame>
        <LegendWorkspace
          data={data}
          calls={wsCalls}
          events={events}
          attention={attention}
          options={{
            tabs: ["Overview"],
            customise: false,
            allLabel: "All funds",
            scopes: fs.map((f) => ({ id: `fund:${f.id}`, label: f.shortName })),
            fundBase: `${base}/funds`,
            primaryAction: drafts.length ? (
              <Link href={`${base}/activity`} className="rounded-[7px] bg-brand px-2.5 py-1 text-[12px] font-semibold text-brand-ink hover:opacity-90">
                Approve {drafts.length === 1 ? "call" : `${drafts.length} calls`}
              </Link>
            ) : null,
          }}
        />
      </Frame>
    );
  }

  const fx = await reportingRate();

  /* ───────── Funds ───────── */
  if (current === "funds" && !section?.[1]) {
    return (
      <Frame>
        <PageHead eyebrow={gp.shortName} title="Funds" meta={`${fs.length} ${fs.length === 1 ? "vehicle" : "vehicles"} administered for you`} />
        <Panel title="Vehicles">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Fund</th>
                  <th className={th}>Status</th>
                  <th className={th}>Vintage</th>
                  <th className={cx(th, "text-right")}>Target</th>
                  <th className={cx(th, "text-right")}>Commitments</th>
                  <th className={cx(th, "w-[150px]")}>Called</th>
                  <th className={cx(th, "text-right")}>NAV</th>
                  <th className={cx(th, "text-right")}>DPI</th>
                  <th className={cx(th, "text-right")}>TVPI</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {fs.map((f) => {
                  const t = fundTotals(f.id);
                  const called = t.commitment ? t.called / t.commitment : 0;
                  return (
                    <tr key={f.id} className={tr}>
                      <td className={td}>
                        <Link href={`${base}/funds/${f.id}`} className="font-semibold text-ink-900 hover:underline">
                          {f.name}
                        </Link>
                        <div className="text-[11.5px] text-stone-500">
                          {f.strategy.split(" — ")[0]} · {f.domicile}
                          {f.economicsPending ? " · terms pending LPA review" : ""}
                        </div>
                      </td>
                      <td className={td}>
                        <StatusPill value={f.status} />
                      </td>
                      <td className={cx(td, "num text-stone-600")}>{f.vintage}</td>
                      <td className={cx(td, "num text-right text-stone-600")}>{f.targetSize ? moneyShort(f.targetSize, f.currency) : "—"}</td>
                      <td className={cx(td, "num text-right text-ink-900")}>{moneyShort(t.commitment, f.currency)}</td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <Meter value={called} />
                          <span className="num w-9 text-right text-[11.5px] text-stone-500">{pct(called, 0)}</span>
                        </div>
                      </td>
                      <td className={cx(td, "num text-right text-ink-900")}>{moneyShort(t.nav, f.currency)}</td>
                      <td className={cx(td, "num text-right text-stone-600")}>{multiple(t.dpi)}</td>
                      <td className={cx(td, "num text-right text-stone-600")}>{multiple(t.tvpi)}</td>
                      <td className={cx(td, "text-right")}>
                        <Link href={`${base}/funds/${f.id}`} aria-label={`Open ${f.shortName}`} className="text-stone-400 hover:text-ink-900">
                          <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </Frame>
    );
  }

  /* ───────── One fund ───────── */
  if (current === "funds") {
    const f = fs.find((x) => x.id === section![1]);
    if (!f) notFound();
    const t = fundTotals(f.id);
    const lps = capitalAccounts.filter((c) => c.fundId === f.id).sort((a, b) => b.commitment - a.commitment);
    const fCalls = calls.filter((c) => c.fundId === f.id).sort((a, b) => b.number - a.number);
    const terms: [string, string][] = [
      ["Legal form", f.legalForm],
      ["Domicile", f.domicile],
      ["Currency", f.currency],
      ["Target size", f.targetSize ? moneyShort(f.targetSize, f.currency) : "Pending LPA review"],
      ["Management fee", f.economicsPending ? "Pending LPA review" : f.managementFee],
      ["Carried interest", f.economicsPending ? "Pending LPA review" : f.carry],
      ["Hurdle", f.economicsPending ? "Pending LPA review" : f.hurdle],
      ["Term", f.term],
      ["First close", /^\d{4}-/.test(f.firstClose) ? date(f.firstClose) : f.firstClose],
      ["Final close", f.finalClose && /^\d{4}-/.test(f.finalClose) ? date(f.finalClose) : "Open"],
      ["Auditor", f.auditor],
      ["Bank", f.bank],
    ];
    return (
      <Frame>
        <PageHead
          eyebrow={
            <Link href={`${base}/funds`} className="hover:text-d-text">
              Funds
            </Link>
          }
          title={f.name}
          meta={
            <span className="inline-flex flex-wrap items-center gap-2">
              <StatusPill value={f.status} />
              <span>
                {f.strategy.split(" — ")[0]} · vintage {f.vintage}
              </span>
            </span>
          }
        />
        <div className="space-y-2">
          <Figures
            items={[
              { label: "Commitments", value: moneyShort(t.commitment, f.currency), note: `${t.investors} limited partners` },
              { label: "Called", value: moneyShort(t.called, f.currency), note: `${pct(t.commitment ? t.called / t.commitment : 0, 0)} of commitments` },
              { label: "Distributed", value: moneyShort(t.distributed, f.currency) },
              { label: "Net asset value", value: moneyShort(t.nav, f.currency) },
              { label: "TVPI · DPI", value: `${multiple(t.tvpi)} · ${multiple(t.dpi)}` },
            ]}
          />
          <div className="grid items-start gap-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel title={`Limited partners · ${lps.length}`}>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className={th}>Investor</th>
                    <th className={cx(th, "text-right")}>Commitment</th>
                    <th className={cx(th, "w-[130px]")}>Called</th>
                    <th className={cx(th, "text-right")}>Distributed</th>
                    <th className={cx(th, "text-right")}>NAV</th>
                  </tr>
                </thead>
                <tbody>
                  {lps.map((c) => (
                    <tr key={c.investorId} className={tr}>
                      <td className={cx(td, "font-semibold text-ink-900")}>{investorById(c.investorId)?.name ?? c.investorId}</td>
                      <td className={cx(td, "num text-right")}>{money(c.commitment, f.currency)}</td>
                      <td className={td}>
                        <Meter value={c.commitment ? c.called / c.commitment : 0} />
                      </td>
                      <td className={cx(td, "num text-right text-stone-600")}>{money(c.distributed, f.currency)}</td>
                      <td className={cx(td, "num text-right")}>{money(c.nav, f.currency)}</td>
                    </tr>
                  ))}
                  {lps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-stone-500">
                        Limited partners appear here once their subscriptions are accepted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Panel>
            <Panel title="Terms" bodyClass="px-4 py-2">
              <dl className="text-[12.5px]">
                {terms.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-stone-100 py-2 last:border-0">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="text-right text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
          <Panel title="Capital calls">
            {fCalls.length ? <CallsTable calls={fCalls} /> : <p className="px-4 py-8 text-center text-[13px] text-stone-500">No capital calls yet.</p>}
          </Panel>
        </div>
      </Frame>
    );
  }

  /* ───────── Investors ───────── */
  if (current === "investors") {
    const rows = investorsForGp(gp.id, fx.rate);
    const ob = onboardingForGp(gp.id);
    return (
      <Frame>
        <PageHead eyebrow={gp.shortName} title="Investors" meta={`${rows.length} limited partners across ${fs.length} ${fs.length === 1 ? "fund" : "funds"} · USD`} />
        <div className="space-y-2">
          <Panel title="Limited partners">
            <Suspense>
              <InvestorTable
                rows={rows.map((r) => ({
                  id: r.investor.id,
                  name: r.investor.name,
                  type: r.investor.type,
                  jurisdiction: r.investor.jurisdiction,
                  funds: r.funds.join(", "),
                  commitment: money(r.commitment),
                  nav: money(r.nav),
                  commitmentRaw: r.commitment,
                }))}
              />
            </Suspense>
          </Panel>
          {ob.length > 0 && (
            <Panel title={`Subscriptions in progress · ${ob.length}`}>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className={th}>Investor</th>
                    <th className={th}>Fund</th>
                    <th className={cx(th, "text-right")}>Commitment</th>
                    <th className={cx(th, "w-[150px]")}>Progress</th>
                    <th className={th}>Last activity</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ob.map((o) => (
                    <tr key={o.id} className={tr}>
                      <td className={cx(td, "font-semibold text-ink-900")}>{o.investorName}</td>
                      <td className={cx(td, "text-stone-600")}>{fundById(o.fundId)!.shortName}</td>
                      <td className={cx(td, "num text-right")}>{money(o.commitment, fundById(o.fundId)!.currency)}</td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <Meter value={o.progress} />
                          <span className="num w-9 text-right text-[11.5px] text-stone-500">{pct(o.progress, 0)}</span>
                        </div>
                      </td>
                      <td className={cx(td, "num text-stone-600")}>{date(o.lastActivity)}</td>
                      <td className={td}>
                        <StatusPill value={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </Frame>
    );
  }

  /* ───────── Capital activity ───────── */
  if (current === "activity") {
    const dists = distributionsForGp(gp.id);
    const drafts = calls.filter((c) => c.status === "Draft");
    return (
      <Frame>
        <PageHead
          eyebrow={gp.shortName}
          title="Capital activity"
          meta="Calls and distributions prepared by your administrator. Draft calls need your approval before notices go out."
        />
        <div className="space-y-2">
          {drafts.length > 0 && (
            <Panel title={`Waiting for your approval · ${drafts.length}`}>
              <ul>
                {drafts.map((c) => {
                  const f = fundById(c.fundId)!;
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-stone-100 px-4 py-3.5 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-ink-900">
                          {f.name} — Capital Call No. {c.number}
                        </div>
                        <div className="mt-0.5 text-[12px] text-stone-500">
                          {c.purpose} · due {date(c.dueDate)} · {c.allocations.length} limited partners
                        </div>
                      </div>
                      <div className="fig text-[20px] text-ink-900">{money(c.amount, f.currency)}</div>
                      <ApproveButton label="Review & approve" />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
          <Panel title="Capital calls">
            <CallsTable calls={[...calls].sort((a, b) => b.dueDate.localeCompare(a.dueDate))} withFund />
          </Panel>
          <Panel title="Distributions">
            {dists.length ? (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className={th}>Fund</th>
                    <th className={th}>Date</th>
                    <th className={th}>Type</th>
                    <th className={th}>Source</th>
                    <th className={cx(th, "text-right")}>Amount</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dists.map((d) => {
                    const f = fundById(d.fundId)!;
                    return (
                      <tr key={d.id} className={tr}>
                        <td className={cx(td, "font-semibold text-ink-900")}>{f.shortName}</td>
                        <td className={cx(td, "num text-stone-600")}>{date(d.date)}</td>
                        <td className={cx(td, "text-stone-600")}>{d.type}</td>
                        <td className={cx(td, "max-w-[280px] truncate text-stone-600")}>{d.source}</td>
                        <td className={cx(td, "num text-right")}>{money(d.amount, f.currency)}</td>
                        <td className={td}>
                          <StatusPill value={d.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-8 text-center text-[13px] text-stone-500">No distributions yet.</p>
            )}
          </Panel>
        </div>
      </Frame>
    );
  }

  /* ───────── Reports ───────── */
  if (section?.[1]) {
    if (!fs.some((f) => f.id === section[1])) notFound();
    return (
      <Frame>
        <GpCloseReview gpId={gp.id} fundId={section[1]} />
      </Frame>
    );
  }
  const docs = documentsForGp(gp.id)
    .filter((d) => d.visibility !== "Internal")
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Frame>
      <PageHead eyebrow={gp.shortName} title="Reports" meta="Quarterly reporting, notices and statements published by your administrator." />
      <div className="mb-2">
        <GpCloseSection gpId={gp.id} />
      </div>
      <Panel title={`Documents · ${docs.length}`}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Document</th>
              <th className={th}>Fund</th>
              <th className={th}>Category</th>
              <th className={th}>Shared with</th>
              <th className={th}>Date</th>
              <th className={cx(th, "text-right")}>Size</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className={tr}>
                <td className={td}>
                  <span className="flex items-center gap-2.5 font-semibold text-ink-900">
                    <FileText size={14} strokeWidth={1.6} className="shrink-0 text-stone-400" />
                    {d.name}
                  </span>
                </td>
                <td className={cx(td, "text-stone-600")}>{fundById(d.fundId)!.shortName}</td>
                <td className={cx(td, "text-stone-600")}>{d.category}</td>
                <td className={cx(td, "text-stone-600")}>{d.visibility}</td>
                <td className={cx(td, "num whitespace-nowrap text-stone-600")}>{date(d.date)}</td>
                <td className={cx(td, "num text-right text-stone-500")}>{d.size}</td>
                <td className={cx(td, "text-right")}>
                  <button type="button" aria-label={`Download ${d.name}`} className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
                    <Download size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Frame>
  );
}

function CallsTable({ calls, withFund }: { calls: ReturnType<typeof callsForGp>; withFund?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-[12.5px]">
        <thead>
          <tr className="border-b border-stone-100">
            {withFund && <th className={th}>Fund</th>}
            <th className={th}>Call</th>
            <th className={th}>Purpose</th>
            <th className={th}>Due</th>
            <th className={cx(th, "text-right")}>Amount</th>
            <th className={cx(th, "text-right")}>Received</th>
            <th className={cx(th, "w-[120px]")}>Funded</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c) => {
            const f = fundById(c.fundId)!;
            return (
              <tr key={c.id} className={tr}>
                {withFund && <td className={cx(td, "max-w-[220px] truncate font-semibold text-ink-900")}>{f.shortName}</td>}
                <td className={cx(td, "num whitespace-nowrap text-stone-600")}>No. {c.number}</td>
                <td className={cx(td, "max-w-[260px] truncate text-stone-600")}>{c.purpose}</td>
                <td className={cx(td, "num whitespace-nowrap text-stone-600")}>{date(c.dueDate)}</td>
                <td className={cx(td, "num whitespace-nowrap text-right text-ink-900")}>{money(c.amount, f.currency)}</td>
                <td className={cx(td, "num whitespace-nowrap text-right text-stone-600")}>{money(c.received, f.currency)}</td>
                <td className={td}>
                  <Meter value={c.amount ? c.received / c.amount : 0} />
                </td>
                <td className={td}>{c.status === "Draft" ? <ApproveButton /> : <StatusPill value={c.status} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
