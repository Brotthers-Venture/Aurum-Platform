import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Circle, FileText } from "lucide-react";
import { KeyValue, Panel, Progress, Status } from "@/components/ui";
import { fundById, onboarding, type OnboardingSubmission } from "@/lib/data";
import { date, money } from "@/lib/format";
import { KycSectionLabel, KycSectionMark, LiveStatus, PersonScreening, ScreeningAside, ScreeningBanner, SubmissionActions } from "@/components/fund/SubmissionScreening";

export function generateStaticParams() {
  return onboarding.map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: onboarding.find((o) => o.id === id)?.investorName ?? "Subscription" };
}

const KYC = "KYC / AML screening";
type Section = { title: string; state: "complete" | "attention" | "incomplete"; body: React.ReactNode; flush?: boolean };

function sectionsFor(o: OnboardingSubmission): Section[] {
  const done = (threshold: number) => (o.progress >= threshold ? "complete" : "incomplete") as Section["state"];
  const isEntity = !["Individual", "Joint"].includes(o.investorType);
  const people = isEntity
    ? [
        [o.contactName, "Authorized signatory", "Clear"],
        ["Controlling person", "Beneficial owner (≥25%)", o.kyc === "Potential match" ? "Potential match" : o.kyc === "Clear" ? "Clear" : "Pending"],
        ["Second director", "Director", o.kyc === "Clear" ? "Clear" : "Pending"],
      ]
    : o.investorType === "Joint"
      ? [
          ["Ana Monteiro", "Joint holder", "Clear"],
          ["Rafael Monteiro", "Joint holder", "Potential match"],
        ]
      : [[o.contactName, "Investor", o.kyc === "Clear" ? "Clear" : "Pending"]];

  return [
    {
      title: "Investor profile",
      state: done(0.1),
      body: (
        <KeyValue
          items={[
            ["Legal name", o.investorName],
            ["Investor type", o.investorType],
            ["Jurisdiction", o.jurisdiction],
            ["Primary contact", o.contactName],
            ["Email", o.contactEmail],
            ["Mailing address", o.progress >= 0.1 ? "On file" : "—"],
          ]}
        />
      ),
    },
    {
      title: "Eligibility",
      state: done(0.3),
      body: (
        <KeyValue
          items={[
            ["Investor status", o.accreditation],
            ["ERISA plan assets", o.investorType === "Pension plan" ? "Yes — 25% test applies" : "No"],
            ["Bad actor (Rule 506(d))", o.progress >= 0.3 ? "No disqualifying events" : "—"],
            ["FATCA / CRS", o.progress >= 0.3 ? "Self-certification provided" : "—"],
          ]}
        />
      ),
    },
    {
      title: "Tax information",
      state: done(0.5),
      body: (
        <KeyValue
          items={[
            ["Form", o.jurisdiction.includes("US") ? "IRS Form W-9" : isEntity ? "IRS Form W-8BEN-E" : "IRS Form W-8BEN"],
            ["TIN", o.progress >= 0.5 ? "•••••4471 (verified format)" : "—"],
            ["Electronic signature", o.progress >= 0.5 ? `${o.contactName} · ${date(o.lastActivity)}` : "Not signed"],
          ]}
        />
      ),
    },
    {
      title: KYC,
      state: o.kyc === "Potential match" ? "attention" : o.kyc === "Clear" ? "complete" : "incomplete",
      flush: true,
      body: (
        <table className="data-table">
          <thead>
            <tr>
              <th>Individual</th>
              <th>Role</th>
              <th>ID verification</th>
              <th>Sanctions · PEP · adverse media</th>
            </tr>
          </thead>
          <tbody>
            {people.map(([n, r, s]) => (
              <tr key={n + r}>
                <td className="font-semibold">{n}</td>
                <td className="text-stone-600">{r}</td>
                <td>
                  <Status value={s === "Pending" ? "Pending" : "Clear"} />
                </td>
                <td>
                  <PersonScreening id={o.id} value={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      title: "Banking",
      state: done(0.8),
      body: (
        <KeyValue
          items={[
            ["Distribution account", o.progress >= 0.8 ? "Chase ••••2210 · USD" : "—"],
            ["Verification", o.progress >= 0.8 ? "Manual — statement provided (Plaid pending)" : "—"],
            ["Wire origin matches investor", o.progress >= 0.8 ? "Yes" : "—"],
          ]}
        />
      ),
    },
    {
      title: "Signatures & documents",
      state: o.status === "Changes requested" ? "attention" : done(1),
      flush: true,
      body: (
        <ul className="divide-y divide-stone-100">
          {[
            ["Subscription Agreement — Second Close", o.progress >= 1],
            ["Investor Questionnaire", o.progress >= 0.3],
            ["Formation documents / trust deed", isEntity && o.progress >= 0.6],
            ["Proof of address", o.status !== "Changes requested" && o.progress >= 0.6],
            ["Government-issued ID", o.progress >= 0.6],
          ]
            .filter(([n]) => isEntity || n !== "Formation documents / trust deed")
            .map(([n, ok]) => (
              <li key={n as string} className="flex items-center gap-3 px-5 py-3 text-[13px]">
                <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
                <span className="flex-1">{n}</span>
                {ok ? <Status value="Clear" /> : <Status value={o.status === "Changes requested" && n === "Proof of address" ? "Changes requested" : "Pending"} />}
              </li>
            ))}
        </ul>
      ),
    },
  ];
}

const icon = {
  complete: <Check size={13} strokeWidth={2.5} className="text-white" />,
  attention: <AlertTriangle size={12} strokeWidth={2.2} className="text-white" />,
  incomplete: <Circle size={8} strokeWidth={0} className="fill-stone-300" />,
};
const iconBg = { complete: "bg-positive", attention: "bg-caution", incomplete: "bg-stone-100 border border-stone-300" };

export default async function SubmissionReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = onboarding.find((x) => x.id === id);
  if (!o) notFound();
  const f = fundById(o.fundId)!;
  const sections = sectionsFor(o);

  return (
    <div className="space-y-6">
      <Link href="/admin/fund/onboarding" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> Subscriptions
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="eyebrow">
            {f.name} · Submission {o.id.toUpperCase()}
          </div>
          <h1 className="mt-2 flex items-center gap-3 text-[26px] font-semibold tracking-[-0.015em]">
            {o.investorName} <LiveStatus id={o.id} />
          </h1>
          <p className="num mt-1.5 text-[14px] text-stone-600">
            {money(o.commitment)} commitment · {o.investorType} · {o.jurisdiction}
          </p>
        </div>
        <SubmissionActions id={o.id} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <ScreeningBanner id={o.id} />
          {sections.map((s, i) => (
            <Panel
              key={s.title}
              title={
                <span className="flex items-center gap-3">
                  {s.title === KYC ? <KycSectionMark id={o.id} server={s.state} /> : <span className={`flex h-5 w-5 items-center justify-center rounded-full ${iconBg[s.state]}`}>{icon[s.state]}</span>}
                  <span className="num text-stone-400">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </span>
              }
              flush={s.flush}
              actions={s.title === KYC ? <KycSectionLabel id={o.id} server={s.state} /> : <span className="text-stone-500">{s.state === "complete" ? "Complete" : s.state === "attention" ? "Needs attention" : "Awaiting investor"}</span>}
            >
              {s.body}
            </Panel>
          ))}
        </div>

        <aside className="space-y-4">
          <ScreeningAside id={o.id} />
          <Panel title="Progress">
            <div className="flex items-baseline justify-between">
              <span className="num text-[24px] font-medium">{Math.round(o.progress * 100)}%</span>
              <span className="text-[12px] text-stone-500">{sections.filter((s) => s.state === "complete").length} of {sections.length} sections</span>
            </div>
            <Progress value={o.progress} className="mt-3" />
          </Panel>
          <Panel title="Details">
            <dl className="space-y-3 text-[13px]">
              {[
                ["Invited", date(o.invitedOn)],
                ["Last activity", date(o.lastActivity)],
                ["Relationship owner", o.relationshipManager],
                ["Contact", o.contactEmail],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-[0.1em] text-stone-500">{k}</dt>
                  <dd className="mt-0.5 break-all font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="Internal notes">
            <textarea
              rows={4}
              placeholder="Visible to Aurum staff only"
              className="w-full rounded-[3px] border border-stone-200 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none"
            />
            <div className="mt-3 border-t border-stone-100 pt-3 text-[12px] text-stone-600">
              <span className="font-semibold text-ink-900">{o.relationshipManager}</span> · {date(o.lastActivity)}
              <p className="mt-1">Investor confirmed commitment amount by phone; awaiting final signatures.</p>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
