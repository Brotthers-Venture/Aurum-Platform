"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, CircleCheck, FileUp, Info, Landmark, Lock, Plus, X } from "lucide-react";
import { GpLogo, AdministeredByAurum } from "@/components/brand/GpLogo";
import { brandStyle, type GpClient } from "@/lib/gps";
import { Button, ButtonLink, cx } from "@/components/ui";

const steps = [
  "Commitment & investor type",
  "Investor details",
  "Ownership & control",
  "Tax information",
  "Eligibility",
  "Banking",
  "Supporting documents",
  "Review & sign",
] as const;

const input =
  "h-10 w-full rounded-[3px] border border-stone-300 bg-white px-3 text-[14px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900";

function Field({ label, children, hint, span = 1 }: { label: string; children: ReactNode; hint?: string; span?: 1 | 2 }) {
  return (
    <label className={cx("block", span === 2 && "sm:col-span-2")}>
      <span className="text-[12px] font-semibold text-ink-900">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[12px] text-stone-500">{hint}</span>}
    </label>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{children}</div>;
}

function Prefilled() {
  return (
    <div className="mb-7 flex items-start gap-3 border-l-2 border-brand bg-brand-soft px-4 py-3 text-[13px] text-ink-800">
      <Info size={15} strokeWidth={1.8} className="mt-px shrink-0 text-brand" />
      <span>
        Prefilled from your investor profile, last confirmed for <span className="font-semibold">Meridian Corporate Venture Fund</span> on
        Nov 30, 2024. Review and update anything that has changed.
      </span>
    </div>
  );
}

function Choice({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full items-start gap-3 rounded-[3px] border p-4 text-left transition-colors",
        selected ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-300 hover:border-stone-500",
      )}
    >
      <span
        className={cx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-ink-900 bg-ink-900" : "border-stone-400",
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-[13px] text-stone-500">{desc}</span>
      </span>
    </button>
  );
}

function Check2({ label, defaultChecked }: { label: ReactNode; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-[3px] border border-stone-200 p-3.5 text-[13px] leading-relaxed text-ink-800 hover:border-stone-400">
      <input type="checkbox" defaultChecked={defaultChecked} className="mt-[3px] h-4 w-4 shrink-0 accent-ink-900" />
      <span>{label}</span>
    </label>
  );
}

export function SubscriptionFlow({ fundName, gp, client }: { fundName: string; gp: string; client: GpClient }) {
  const home = `/investor/${client.id}`;
  const [step, setStep] = useState(4); // investor resumes at Eligibility
  const [maxReached, setMaxReached] = useState(4);
  const [type, setType] = useState("trust");
  const [usPerson, setUsPerson] = useState(true);
  const [bankMode, setBankMode] = useState<"plaid" | "manual">("manual");
  const [signature, setSignature] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const go = (n: number) => {
    setStep(n);
    setMaxReached((m) => Math.max(m, n));
    window.scrollTo({ top: 0 });
  };

  const content: ReactNode[] = [
    // 0 — Commitment & type
    <div key="0" className="space-y-8">
      <Grid>
        <Field label="Commitment amount (USD)" hint="Minimum commitment $1,000,000. Subject to General Partner acceptance.">
          <input className={`${input} num`} defaultValue="7,500,000" />
        </Field>
        <Field label="Closing">
          <select className={input} defaultValue="second">
            <option value="second">Second close — December 18, 2026</option>
          </select>
        </Field>
      </Grid>
      <div>
        <div className="mb-3 text-[12px] font-semibold">Subscribing as</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["individual", "Individual", "A natural person investing in their own name"],
            ["joint", "Joint account", "Spouses or joint tenants investing together"],
            ["trust", "Trust", "Revocable or irrevocable trust, acting through its trustees"],
            ["entity", "Entity", "Corporation, LLC, partnership or other legal entity"],
            ["plan", "Retirement plan or IRA", "ERISA plan, IRA or other benefit plan investor"],
            ["fund", "Fund or fund of funds", "Pooled investment vehicle investing for its own investors"],
          ].map(([v, t, d]) => (
            <Choice key={v} selected={type === v} onClick={() => setType(v)} title={t} desc={d} />
          ))}
        </div>
      </div>
    </div>,

    // 1 — Details
    <div key="1">
      <Prefilled />
      <Grid>
        <Field label="Legal name of trust" span={2}>
          <input className={input} defaultValue="Calloway Family Trust u/a/d March 4, 2009" />
        </Field>
        <Field label="Trust type">
          <select className={input} defaultValue="rev">
            <option value="rev">Revocable grantor trust</option>
            <option>Irrevocable trust</option>
          </select>
        </Field>
        <Field label="Governing law">
          <input className={input} defaultValue="Florida" />
        </Field>
        <Field label="Principal address" span={2}>
          <input className={input} defaultValue="1450 Brickell Avenue, Suite 2100" />
        </Field>
        <Field label="City">
          <input className={input} defaultValue="Miami" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="State">
            <input className={input} defaultValue="FL" />
          </Field>
          <Field label="ZIP">
            <input className={`${input} num`} defaultValue="33131" />
          </Field>
        </div>
        <Field label="Primary contact">
          <input className={input} defaultValue="Margaret Calloway, Trustee" />
        </Field>
        <Field label="Email for notices">
          <input className={input} defaultValue="m.calloway@callowaytrust.com" />
        </Field>
      </Grid>
    </div>,

    // 2 — Ownership & control
    <div key="2" className="space-y-6">
      <Prefilled />
      <p className="text-[13px] leading-relaxed text-stone-600">
        List each trustee, each grantor, and any beneficiary holding 25% or more. Each person receives a short identity
        verification request.
      </p>
      <div className="overflow-hidden rounded-[3px] border border-stone-200">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Ownership</th>
              <th>Identity</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Margaret Calloway", "Trustee · Grantor", "—", "Verified"],
              ["Robert Calloway", "Co-trustee", "—", "Verified"],
              ["Elise Calloway", "Beneficiary", "50%", "Verified"],
              ["Thomas Calloway", "Beneficiary", "50%", "Verified"],
            ].map(([n, r, o, v]) => (
              <tr key={n}>
                <td className="font-semibold">{n}</td>
                <td className="text-stone-600">{r}</td>
                <td className="num text-stone-600">{o}</td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-positive">
                    <CircleCheck size={14} strokeWidth={2} /> {v}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" type="button">
        <Plus size={14} strokeWidth={2} /> Add person
      </Button>
    </div>,

    // 3 — Tax
    <div key="3" className="space-y-7">
      <div>
        <div className="mb-3 text-[12px] font-semibold">Is the investor a U.S. person for federal tax purposes?</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice selected={usPerson} onClick={() => setUsPerson(true)} title="Yes — U.S. person" desc="Complete IRS Form W-9" />
          <Choice selected={!usPerson} onClick={() => setUsPerson(false)} title="No — non-U.S. person" desc="Complete IRS Form W-8BEN or W-8BEN-E" />
        </div>
      </div>
      <div className="rounded-[3px] border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-25 px-4 py-2.5 text-[12px]">
          <span className="font-semibold">{usPerson ? "Form W-9 · Request for Taxpayer Identification Number" : "Form W-8BEN-E · Certificate of Status"}</span>
          <span className="text-stone-500">Rev. March 2024</span>
        </div>
        <div className="p-5">
          <Grid>
            <Field label="Name as shown on tax return" span={2}>
              <input className={input} defaultValue="Calloway Family Trust" />
            </Field>
            <Field label="Federal tax classification">
              <select className={input}>
                <option>Trust / estate</option>
              </select>
            </Field>
            <Field label="Taxpayer identification number (EIN)">
              <input className={`${input} font-mono`} defaultValue="••-•••4471" />
            </Field>
          </Grid>
          <div className="mt-5">
            <Check2 defaultChecked label="Under penalties of perjury, I certify that the information on this form is true, correct and complete." />
          </div>
        </div>
      </div>
    </div>,

    // 4 — Eligibility
    <div key="4" className="space-y-7">
      <section>
        <h3 className="text-[14px] font-semibold">Accredited investor status</h3>
        <p className="mt-1 text-[13px] text-stone-500">Rule 501(a), Regulation D. Select every statement that applies to the trust.</p>
        <div className="mt-4 space-y-2">
          <Check2 defaultChecked label="The trust has total assets in excess of $5,000,000, was not formed to acquire these interests, and its investment is directed by a sophisticated person." />
          <Check2 label="The trust is revocable, and each grantor is individually an accredited investor." />
          <Check2 label="Each equity owner of the trust is an accredited investor." />
        </div>
      </section>
      <section>
        <h3 className="text-[14px] font-semibold">Qualified purchaser status</h3>
        <p className="mt-1 text-[13px] text-stone-500">Section 2(a)(51) of the Investment Company Act of 1940.</p>
        <div className="mt-4 space-y-2">
          <Check2 defaultChecked label="The trust owns not less than $5,000,000 in investments and is owned by two or more close family members." />
          <Check2 label="The trust was not formed for the specific purpose of acquiring the interests, and each settlor and trustee is a qualified purchaser." />
          <Check2 label="None of the above apply." />
        </div>
      </section>
      <section>
        <h3 className="text-[14px] font-semibold">Additional representations</h3>
        <div className="mt-4 space-y-2">
          <Check2 defaultChecked label="The investor is not a benefit plan investor subject to Title I of ERISA or Section 4975 of the Code." />
          <Check2 defaultChecked label="No “bad actor” disqualifying event under Rule 506(d) applies to the investor or its covered persons." />
        </div>
      </section>
    </div>,

    // 5 — Banking
    <div key="5" className="space-y-7">
      <p className="text-[13px] leading-relaxed text-stone-600">
        Distributions are paid only to an account held in the investor’s name. Capital contributions must originate from
        the same institution.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setBankMode("plaid")}
          className={cx(
            "rounded-[3px] border p-4 text-left",
            bankMode === "plaid" ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-300 hover:border-stone-500",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <Landmark size={16} strokeWidth={1.6} /> Connect securely with Plaid
            </span>
            <span className="rounded-[2px] bg-stone-100 px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">Soon</span>
          </div>
          <p className="mt-1.5 text-[13px] text-stone-500">Instant account ownership verification. No statements required.</p>
        </button>
        <button
          type="button"
          onClick={() => setBankMode("manual")}
          className={cx(
            "rounded-[3px] border p-4 text-left",
            bankMode === "manual" ? "border-ink-900 ring-1 ring-ink-900" : "border-stone-300 hover:border-stone-500",
          )}
        >
          <span className="text-[14px] font-semibold">Enter wire details</span>
          <p className="mt-1.5 text-[13px] text-stone-500">Provide account details and upload a recent bank statement.</p>
        </button>
      </div>
      {bankMode === "plaid" ? (
        <div className="rounded-[3px] border border-dashed border-stone-300 p-6 text-center text-[13px] text-stone-500">
          Plaid verification will be available shortly. Please enter wire details for now.
        </div>
      ) : (
        <Grid>
          <Field label="Bank name">
            <input className={input} placeholder="e.g. J.P. Morgan Chase" />
          </Field>
          <Field label="Account holder name">
            <input className={input} defaultValue="Calloway Family Trust" />
          </Field>
          <Field label="ABA routing number">
            <input className={`${input} font-mono`} placeholder="9 digits" />
          </Field>
          <Field label="Account number">
            <input className={`${input} font-mono`} placeholder="Account number" />
          </Field>
          <Field label="SWIFT / BIC (international wires)" span={2}>
            <input className={`${input} font-mono`} placeholder="Optional" />
          </Field>
        </Grid>
      )}
    </div>,

    // 6 — Documents
    <div key="6" className="space-y-3">
      {[
        ["Trust agreement or certificate of trust", "Pages identifying trustees and powers", true],
        ["Government-issued ID — Margaret Calloway", "Passport or driver’s license", true],
        ["Government-issued ID — Robert Calloway", "Passport or driver’s license", true],
        ["Proof of address", "Utility bill or bank statement, dated within 90 days", false],
        ["Bank statement for distribution account", "Showing account holder name", false],
      ].map(([t, d, ok]) => (
        <div key={t as string} className="flex items-center gap-4 rounded-[3px] border border-stone-200 p-4">
          <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]", ok ? "bg-positive-bg text-positive" : "bg-stone-100 text-stone-500")}>
            {ok ? <Check size={16} strokeWidth={2.2} /> : <FileUp size={16} strokeWidth={1.6} />}
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">{t}</div>
            <div className="text-[12px] text-stone-500">{ok ? "On file from your investor profile" : d}</div>
          </div>
          <Button variant="secondary" size="sm" type="button">
            {ok ? "Replace" : "Upload"}
          </Button>
        </div>
      ))}
    </div>,

    // 7 — Review & sign
    <div key="7" className="space-y-7">
      <dl className="grid gap-px overflow-hidden rounded-[3px] border border-stone-200 bg-stone-200 sm:grid-cols-2">
        {[
          ["Investor", "Calloway Family Trust"],
          ["Commitment", "$7,500,000"],
          ["Investor type", "Trust — revocable grantor trust"],
          ["Tax form", "W-9 · EIN ••-•••4471"],
          ["Eligibility", "Accredited investor · Qualified purchaser"],
          ["Distribution account", "Wire — details provided"],
        ].map(([k, v]) => (
          <div key={k} className="bg-white px-4 py-3">
            <dt className="text-[11px] uppercase tracking-[0.1em] text-stone-500">{k}</dt>
            <dd className="num mt-0.5 text-[14px] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-[3px] border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-25 px-4 py-2.5 text-[12px]">
          <span className="font-semibold">Subscription Agreement — {fundName}</span>
          <span className="text-stone-500">24 pages · signature on page 22</span>
        </div>
        <div className="h-[180px] overflow-y-auto px-6 py-5 font-serif text-[13px] leading-relaxed text-stone-700">
          <p className="text-center font-semibold uppercase tracking-[0.08em] text-ink-900">Subscription Agreement</p>
          <p className="mt-4">
            The undersigned (the “Subscriber”) hereby subscribes for a limited partnership interest in {fundName} (the
            “Partnership”) in the amount set forth on the signature page, on the terms and subject to the conditions of
            this Subscription Agreement and the Amended and Restated Limited Partnership Agreement of the Partnership.
          </p>
          <p className="mt-3">
            1. <span className="font-semibold">Subscription.</span> The Subscriber irrevocably subscribes for the Commitment
            and agrees to make capital contributions from time to time upon notice from {gp} (the “General Partner”).
          </p>
          <p className="mt-3">
            2. <span className="font-semibold">Acceptance.</span> This subscription is subject to acceptance by the General
            Partner in its sole discretion, and shall be effective only upon countersignature.
          </p>
        </div>
      </div>
      <div>
        <Check2 label="I have read the Private Placement Memorandum, the Limited Partnership Agreement and this Subscription Agreement, and I am authorized to sign on behalf of the investor." />
      </div>
      <Grid>
        <Field label="Type your full name to sign">
          <input className={input} value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Margaret Calloway" />
        </Field>
        <Field label="Signing as">
          <input className={input} defaultValue="Trustee" />
        </Field>
      </Grid>
      {signature && (
        <div className="border-b border-ink-900 pb-1 font-serif text-[30px] italic text-ink-900">{signature}</div>
      )}
    </div>,
  ];

  if (submitted) {
    return (
      <Shell fundName={fundName} client={client}>
        <div className="mx-auto max-w-[560px] py-24 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-ink">
            <Check size={22} strokeWidth={2.4} />
          </span>
          <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.015em]">Subscription submitted</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-stone-600">
            Aurum will review your documents and complete KYC/AML checks. You will be notified when the General Partner
            countersigns. No further action is needed unless we contact you.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <ButtonLink href={home} variant="primary">
              Return to portal
            </ButtonLink>
            <Button variant="secondary">Download signed copy</Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell fundName={fundName} client={client}>
      <div className="mx-auto grid max-w-[1120px] gap-12 px-8 py-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="eyebrow">Subscription</div>
          <div className="mt-1 text-[15px] font-semibold leading-snug">{fundName}</div>
          <div className="num mt-1 text-[13px] text-stone-500">$7,500,000 · Calloway Family Trust</div>
          <ol className="mt-7 space-y-0.5">
            {steps.map((s, i) => {
              const done = i < maxReached && i !== step;
              const current = i === step;
              const reachable = i <= maxReached;
              return (
                <li key={s}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => go(i)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-[3px] px-2 py-2 text-left text-[13px]",
                      current ? "bg-white font-semibold text-ink-900 shadow-[inset_0_0_0_1px_#E2E2DC]" : reachable ? "text-ink-800 hover:bg-white" : "text-stone-400",
                    )}
                  >
                    <span
                      className={cx(
                        "num flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        done ? "bg-brand text-brand-ink" : current ? "border border-brand text-ink-900" : "border border-stone-300 text-stone-400",
                      )}
                    >
                      {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                    </span>
                    {s}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-7 flex items-start gap-2 border-t border-stone-200 pt-5 text-[12px] leading-relaxed text-stone-500">
            <Lock size={13} strokeWidth={1.8} className="mt-[2px] shrink-0" />
            Encrypted in transit and at rest. Your progress saves automatically.
          </div>
        </aside>

        <section>
          <div className="mb-8">
            <div className="num text-[12px] font-semibold text-stone-500">
              Step {step + 1} of {steps.length}
            </div>
            <div className="mt-2 h-[3px] bg-stone-200">
              <div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.015em]">{steps[step]}</h1>
          </div>
          <div className="rounded-[8px] border border-stone-200/70 bg-white shadow-card p-7">{content[step]}</div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" type="button" disabled={step === 0} onClick={() => go(step - 1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <ButtonLink href={home} variant="secondary">
                Save and exit
              </ButtonLink>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={() => go(step + 1)}>
                  Save and continue
                </Button>
              ) : (
                <Button type="button" variant="brand" disabled={!signature.trim()} onClick={() => setSubmitted(true)}>
                  Sign and submit
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ fundName, client, children }: { fundName: string; client: GpClient; children: ReactNode }) {
  const tall = client.logo && client.logo.width / client.logo.height < 3;
  return (
    <div className="min-h-screen" style={brandStyle(client.brand)}>
      <header className="border-b border-stone-200 bg-white">
        <div className="h-[3px] bg-brand-2" />
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-8">
          <div className="flex items-center gap-5">
            <GpLogo gp={client} height={tall ? 40 : 24} />
            <span className="h-5 w-px bg-stone-200" />
            <span className="text-[13px] text-stone-600">{fundName}</span>
          </div>
          <Link href={`/investor/${client.id}`} className="flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
            <X size={15} strokeWidth={1.8} /> Close
          </Link>
        </div>
      </header>
      {children}
      <footer className="mx-auto flex max-w-[1120px] justify-end px-8 pb-8">
        <AdministeredByAurum />
      </footer>
    </div>
  );
}
