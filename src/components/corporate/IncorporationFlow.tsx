"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, CircleAlert, CircleCheck, FileUp, Lock, Mail, Pencil, Plus, Printer, Trash2, User } from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo } from "@/components/brand/Logo";
import {
  STAGES,
  STEPS,
  beneficialOwners,
  blankDraft,
  checkedPeople,
  jurisdictionOf,
  jurisdictions,
  loadDraft,
  nameCheck,
  quote,
  saveFormation,
  servicesFor,
  storeDraft,
  typeOf,
  usd,
  type Draft,
  type Person,
} from "@/lib/formation";

/* Client onboarding for company formation: seven short steps with a running quote beside them.
   Progress is kept on this device until the client submits. */

const GOLD = "#B8975A";
const input =
  "h-11 w-full rounded-[6px] border border-[#D9D2C3] bg-white px-3.5 text-[14px] text-ink-900 placeholder:text-stone-400 transition-shadow focus:border-[#B8975A] focus:outline-none focus:ring-4 focus:ring-[#B8975A]/15";
const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500";
const COUNTRIES = ["United States", "Brazil", "United Kingdom", "Canada", "Cayman Islands", "Portugal", "Spain", "Switzerland", "Mexico", "Other"];
const PURPOSES = ["Holding company", "Operating business", "Fund vehicle", "Special purpose vehicle", "Real estate", "Other"];
const FUNDS = ["Business income", "Investment returns", "Sale of a business or property", "Savings from employment", "Capital from investors", "Other"];

function roleWords(units?: string, type?: string) {
  const director = type === "llc" ? "Manager" : type === "lp" || type === "elp" ? "General partner" : type === "ltda" ? "Administrator" : "Director";
  const owner = units === "units" ? "Member" : units === "interests" ? "Partner" : units === "quotas" ? "Quota holder" : "Shareholder";
  return { director, owner };
}

export function IncorporationFlow() {
  const [d, setD] = useState<Draft>(blankDraft);
  const [resume, setResume] = useState<Draft | null>(null);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const saved = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && saved.step > 0 && !saved.ref) setResume(saved);
  }, []);
  useEffect(() => {
    if (d.step > 0 && !done) storeDraft(d);
  }, [d, done]);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const go = (step: number) => {
    set({ step });
    top.current?.scrollIntoView({ behavior: "smooth" });
  };
  const j = jurisdictionOf(d);
  const t = typeOf(d);
  const words = roleWords(t?.units, t?.id);
  const owned = d.people.filter((p) => p.owner).reduce((a, p) => a + p.pct, 0);
  const ok: boolean[] = [
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email) && d.consent,
    !!j && !!t,
    nameCheck(d.name).state === "ok" && !!d.suffix && !!d.activity.trim() && (d.addressMode === "agent" || !!d.address.trim()),
    d.people.length > 0 && Math.abs(owned - 100) < 0.01 && d.people.some((p) => p.director) && d.people.every((p) => p.name.trim() && /@/.test(p.email)),
    checkedPeople(d).every((p) => p.idDoc && (p.kind === "company" || p.addressDoc) && p.pep) && !!d.funds,
    true,
    true,
  ];

  const submit = () => {
    const ref = `AF-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${String(100 + Math.floor(Math.random() * 900))}`;
    const at = new Date().toISOString();
    const q = quote(d);
    saveFormation({
      ref,
      company: `${d.name.trim()} ${d.suffix}`,
      jurisdiction: d.jurisdiction!,
      type: d.entityType!,
      client: d.people.find((p) => p.owner)?.name ?? d.email,
      contact: d.people[0]?.name ?? d.email,
      email: d.email,
      submitted: at.slice(0, 10),
      stage: "Received",
      owners: beneficialOwners(d).length,
      kyc: "Pending",
      total: q.today,
      services: d.services,
      local: true,
    });
    const final = { ...d, ref, submittedAt: at };
    setD(final);
    storeDraft(null);
    setDone(true);
    top.current?.scrollIntoView();
  };

  if (d.step === 0 && !done)
    return (
      <div ref={top}>
        <Landing d={d} set={set} resume={resume} onResume={() => (setD(resume!), setResume(null))} onBegin={() => go(1)} ready={ok[0]} />
      </div>
    );

  const flow = STEPS.slice(1);
  return (
    <div ref={top} className="min-h-screen bg-[#F6F2EA]">
      <header className="sticky top-0 z-20 border-b border-[#E6E0D4] bg-[#FBF9F5]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-5 px-6">
          <AurumLogo height={28} />
          <span className="h-6 w-px bg-[#E0D9CB]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">Corporate Services</span>
          <span className="ml-auto hidden items-center gap-5 text-[12px] text-stone-500 md:flex">
            {!done && (
              <span className="flex items-center gap-1.5">
                <CircleCheck size={13} style={{ color: GOLD }} /> Saved as you go
              </span>
            )}
            <a href="mailto:formation@aurumasset.us" className="flex items-center gap-1.5 hover:text-ink-900">
              <Mail size={13} /> formation@aurumasset.us
            </a>
          </span>
        </div>
        {!done && (
          <div className="mx-auto max-w-[1180px] px-6">
            <ol className="grid" style={{ gridTemplateColumns: `repeat(${flow.length}, minmax(0,1fr))` }}>
              {flow.map((s, k) => {
                const i = k + 1;
                const reachable = i <= d.step || ok.slice(0, i).every(Boolean);
                const state = i < d.step ? "done" : i === d.step ? "now" : "next";
                return (
                  <li key={s}>
                    <button disabled={!reachable} onClick={() => go(i)} className="group block w-full pb-0 pt-1 text-left disabled:cursor-default">
                      <span
                        className={cx(
                          "flex items-baseline gap-2 pb-2.5 text-[12px]",
                          state === "now" ? "font-semibold text-ink-900" : state === "done" ? "text-stone-600 group-hover:text-ink-900" : "text-stone-400",
                        )}
                      >
                        <span className="num font-serif text-[13px]" style={state !== "next" ? { color: GOLD } : undefined}>
                          {String(i).padStart(2, "0")}
                        </span>
                        <span className="hidden truncate md:inline">{s}</span>
                      </span>
                      <span className="block h-[2px]" style={{ background: state === "next" ? "#E6E0D4" : GOLD, opacity: state === "done" ? 0.55 : 1 }} />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </header>

      {done ? (
        <Confirmation d={d} />
      ) : (
        <div className="mx-auto grid max-w-[1180px] gap-12 px-6 pb-20 pt-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="min-w-0 max-w-[720px]">
            {d.step === 1 && <Where d={d} set={set} />}
            {d.step === 2 && <Company d={d} set={set} />}
            {d.step === 3 && <People d={d} set={set} words={words} owned={owned} />}
            {d.step === 4 && <Identity d={d} set={set} />}
            {d.step === 5 && <Services d={d} set={set} />}
            {d.step === 6 && <Review d={d} set={set} go={go} words={words} />}

            <div className="mt-10 flex items-center gap-4 border-t border-[#E6E0D4] pt-6">
              <button onClick={() => go(d.step - 1)} className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 hover:text-ink-900">
                <ArrowLeft size={14} /> Back
              </button>
              <span className="ml-auto text-right text-[12px] text-[#9A6A2E]">{!ok[d.step] ? hint(d.step, d, owned) : ""}</span>
              {d.step < STEPS.length - 1 ? (
                <button
                  disabled={!ok[d.step]}
                  onClick={() => go(d.step + 1)}
                  className="flex h-12 shrink-0 items-center gap-2.5 rounded-[6px] bg-ink-900 px-6 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#1B3358] disabled:bg-[#C9C3B6]"
                >
                  Continue to {STEPS[d.step + 1].toLowerCase()} <ArrowRight size={15} />
                </button>
              ) : (
                <SubmitButton onSubmit={submit} pay={d.pay} />
              )}
            </div>
          </main>
          <aside>
            <Quote d={d} />
          </aside>
        </div>
      )}
    </div>
  );
}

function hint(step: number, d: Draft, owned: number) {
  if (step === 1) return "Choose a jurisdiction and an entity type.";
  if (step === 2) return nameCheck(d.name).state !== "ok" ? "Choose an available name." : !d.activity.trim() ? "Describe what the company will do." : "Complete the address.";
  if (step === 3)
    return !d.people.some((p) => p.director)
      ? "Add at least one person who manages the company."
      : Math.abs(owned - 100) >= 0.01
        ? `Ownership adds up to ${owned}% — it must total 100%.`
        : "Complete each person’s name and email.";
  if (step === 4) return "Upload documents and answer the questions for each person.";
  return "";
}

function H({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-[38px] leading-[1.1] tracking-[-0.015em] text-ink-900">{title}</h1>
      {sub && <p className="mt-3 max-w-[580px] text-[14.5px] leading-[1.65] text-stone-600">{sub}</p>}
    </div>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-[10px] border border-[#E6E0D4] bg-white p-6 shadow-[0_1px_2px_rgba(15,35,64,0.04)]", className)}>{children}</div>;
}

function Tick({ on, onClick, children, required }: { on: boolean; onClick: () => void; children: ReactNode; required?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex items-start gap-2.5 text-left text-[13px] text-stone-700">
      <span
        className={cx(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border",
          on ? "border-ink-900 bg-ink-900 text-white" : "border-stone-400 bg-white",
        )}
      >
        {on && <Check size={12} strokeWidth={3} />}
      </span>
      <span>
        {children}
        {required && <span className="whitespace-nowrap text-[#9A4422]">&nbsp;*</span>}
      </span>
    </button>
  );
}

/* ───────────────────────── landing ───────────────────────── */

function HexField() {
  // Large hairline hexagons — an echo of the Aurum mark, drawn at architectural scale.
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {[
        [620, 180, 260],
        [620, 180, 200],
        [700, 760, 330],
        [90, 980, 240],
      ].map(([x, y, r], i) => (
        <polygon key={i} points={hex(x, y, r)} fill="none" stroke="#B8975A" strokeOpacity={i === 1 ? 0.1 : 0.16} strokeWidth={1} />
      ))}
    </svg>
  );
}

function Landing({
  d,
  set,
  resume,
  onResume,
  onBegin,
  ready,
}: {
  d: Draft;
  set: (p: Partial<Draft>) => void;
  resume: Draft | null;
  onResume: () => void;
  onBegin: () => void;
  ready: boolean;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      {/* left: the firm */}
      <section className="relative flex flex-col overflow-hidden bg-[#0F2340] px-10 py-10 text-white lg:px-16 lg:py-12">
        <HexField />
        <div className="relative">
          <AurumLogo variant="white" height={30} />
        </div>
        <div className="relative mt-16 max-w-[560px] lg:mt-auto">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Corporate Services
          </div>
          <h1 className="mt-5 font-serif text-[44px] leading-[1.06] tracking-[-0.015em] lg:text-[54px]">Companies formed with institutional care.</h1>
          <p className="mt-6 max-w-[480px] text-[15px] leading-[1.7] text-white/70">
            One application covers the filing, the identity checks and the paperwork that follows. A named Aurum officer reviews every submission before anything reaches a
            registry.
          </p>
        </div>
        <div className="relative mt-12 max-w-[560px]">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">Where we form</div>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {jurisdictions.map((j) => (
              <li key={j.id} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 py-2.5 text-[13.5px]">
                <span className="font-serif text-[15px]" style={{ color: GOLD }}>
                  {j.code.replace("US-", "")}
                </span>
                <span>
                  {j.name} <span className="text-white/45">· {j.types.map((t) => t.short).join(", ")}</span>
                </span>
                <span className="num text-[12.5px] text-white/60">from {usd(Math.min(...j.types.map((t) => t.govFee)) + j.serviceFee)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-10 flex flex-wrap gap-x-6 gap-y-1 text-[11.5px] text-white/45">
          <span>Aurum Asset Management · Orlando, Florida</span>
          <a href="mailto:formation@aurumasset.us" className="hover:text-white">
            formation@aurumasset.us
          </a>
        </div>
      </section>

      {/* right: begin */}
      <section className="flex items-center bg-[#F6F2EA] px-8 py-16 lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          {resume && (
            <div className="mb-10 border-l-2 bg-white px-5 py-4" style={{ borderColor: GOLD }}>
              <div className="text-[13px] text-ink-900">Welcome back. Your application{resume.name ? ` for ${resume.name}` : ""} is saved.</div>
              <button
                onClick={onResume}
                className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 underline decoration-[#B8975A] decoration-2 underline-offset-[5px]"
              >
                Continue where you left off <ArrowRight size={13} />
              </button>
            </div>
          )}
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Begin an application</div>
          <h2 className="mt-3 font-serif text-[34px] leading-[1.12] text-ink-900">Start with your email.</h2>
          <p className="mt-3 text-[14px] leading-[1.65] text-stone-600">
            We use it for your reference number, status updates and the finished company documents. Most clients finish in about fifteen minutes.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) onBegin();
            }}
          >
            <div>
              <label className={label} htmlFor="em">
                Email address
              </label>
              <input
                id="em"
                type="email"
                value={d.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="name@company.com"
                className={cx(input, "h-12")}
                autoComplete="email"
              />
            </div>
            <div className="space-y-3">
              <Tick on={d.consent} onClick={() => set({ consent: !d.consent })} required>
                I accept Aurum’s engagement terms and have read the privacy notice.
              </Tick>
              <Tick on={d.updates} onClick={() => set({ updates: !d.updates })}>
                Keep me informed about Aurum services.
              </Tick>
            </div>
            <button
              disabled={!ready}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[6px] bg-ink-900 text-[14px] font-semibold text-white transition-colors hover:bg-[#1B3358] disabled:bg-[#C9C3B6]"
            >
              Begin application <ArrowRight size={15} />
            </button>
          </form>
          <div className="mt-10 border-t border-[#E0D9CB] pt-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Have these to hand</div>
            <ul className="mt-3 space-y-2 text-[13px] text-stone-700">
              {[
                "A passport or national ID for each owner and director",
                "Proof of address dated within three months",
                "How ownership is split between the owners",
                "Two or three name ideas, in order of preference",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-[9px] h-px w-3 shrink-0" style={{ background: GOLD }} />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 text-[11px] leading-relaxed text-stone-400">
            Aurum prepares and files formation documents and keeps statutory records. We do not provide legal or tax advice; we are glad to work alongside your advisers.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────── 2 jurisdiction ───────────────────────── */

function Where({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  const [region, setRegion] = useState("All");
  const regions = ["All", ...new Set(jurisdictions.map((j) => j.region))];
  const j = jurisdictionOf(d);
  return (
    <>
      <H
        title="Where should the company be formed?"
        sub="Pick the jurisdiction first, then the entity type. Prices include our work; the government fee is passed through at cost."
      />
      <div className="mb-5 flex gap-6 border-b border-[#E6E0D4]">
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cx("-mb-px border-b-2 pb-2.5 text-[13px] font-semibold", region === r ? "text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900")}
            style={region === r ? { borderColor: GOLD } : undefined}
          >
            {r === "All" ? "All jurisdictions" : r}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {jurisdictions
          .filter((x) => region === "All" || x.region === region)
          .map((x) => {
            const sel = d.jurisdiction === x.id;
            const from = Math.min(...x.types.map((t) => t.govFee)) + x.serviceFee;
            return (
              <button
                key={x.id}
                onClick={() => set({ jurisdiction: x.id, entityType: x.types.length === 1 ? x.types[0].id : undefined, suffix: "" })}
                className={cx(
                  "group relative flex gap-4 rounded-[10px] border bg-white p-5 text-left transition-all",
                  sel ? "border-[#B8975A] shadow-[0_0_0_3px_rgba(184,151,90,0.15)]" : "border-[#E6E0D4] hover:border-[#CFC6B3] hover:shadow-[0_4px_14px_rgba(15,35,64,0.06)]",
                )}
              >
                <span
                  className={cx(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] font-serif text-[17px] transition-colors",
                    sel ? "bg-ink-900 text-[#E2C98F]" : "bg-[#F3EEE4] text-ink-900",
                  )}
                >
                  {x.code.replace("US-", "")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[19px] leading-tight text-ink-900">{x.name}</span>
                    {sel && <Check size={16} strokeWidth={2.5} style={{ color: GOLD }} />}
                  </span>
                  <span className="mt-0.5 block text-[11px] uppercase tracking-[0.14em] text-stone-400">{x.region}</span>
                  <span className="mt-2.5 block text-[13px] leading-relaxed text-stone-600">{x.about}</span>
                  <span className="mt-3 block text-[12px] text-stone-500">
                    From <span className="num font-semibold text-ink-900">{usd(from)}</span> · {x.types.map((t) => t.short).join(", ")}
                  </span>
                </span>
              </button>
            );
          })}
      </div>
      {j && (
        <div className="mt-8">
          <div className="mb-4 font-serif text-[22px] text-ink-900">Entity type in {j.name}</div>
          <div className="divide-y divide-[#EFEAE0] overflow-hidden rounded-[10px] border border-[#E6E0D4] bg-white">
            {j.types.map((t) => (
              <label key={t.id} className={cx("flex cursor-pointer items-start gap-3 px-5 py-4", d.entityType === t.id && "bg-[#FBF7EE] shadow-[inset_3px_0_0_#B8975A]")}>
                <input type="radio" checked={d.entityType === t.id} onChange={() => set({ entityType: t.id, suffix: "" })} className="mt-1 h-4 w-4 accent-[#0F2340]" />
                <span className="flex-1">
                  <span className="block text-[14px] font-semibold text-ink-900">
                    {t.name} <span className="font-normal text-stone-500">({t.short})</span>
                  </span>
                  <span className="block text-[12.5px] text-stone-600">{t.about}</span>
                </span>
                <span className="text-right text-[12px] text-stone-500">
                  <span className="num block font-semibold text-ink-900">{usd(t.govFee + j.serviceFee)}</span>
                  {t.days}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-stone-500">
            Not sure? US investors usually expect Delaware; offshore funds usually sit in the Cayman Islands; Brazilian projects need a local Ltda. or S.A. We can talk it through
            before you continue.
          </p>
        </div>
      )}
    </>
  );
}

/* ───────────────────────── 3 company ───────────────────────── */

function NameBadge({ name }: { name: string }) {
  const c = nameCheck(name);
  if (c.state === "empty") return null;
  const good = c.state === "ok";
  return (
    <p className={cx("mt-1.5 flex items-center gap-1.5 text-[12px]", good ? "text-[#1F6F44]" : "text-[#9A4422]")}>
      {good ? <CircleCheck size={13} /> : <CircleAlert size={13} />} {c.note}
    </p>
  );
}

function Company({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  const t = typeOf(d)!;
  const j = jurisdictionOf(d)!;
  return (
    <>
      <H title="About the company" sub="Give us a first-choice name and two back-ups in case the registry rejects the first." />
      <Panel className="space-y-5">
        <div>
          <label className={label}>Company name</label>
          <div className="flex gap-2">
            <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Orlando Lakeside Holdings" className={input} />
            <select value={d.suffix} onChange={(e) => set({ suffix: e.target.value })} className={cx(input, "w-[150px]")} aria-label="Ending">
              <option value="">Ending</option>
              {t.suffixes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <NameBadge name={d.name} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Second choice</label>
            <input value={d.alt1} onChange={(e) => set({ alt1: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label}>Third choice</label>
            <input value={d.alt2} onChange={(e) => set({ alt2: e.target.value })} className={input} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <div>
            <label className={label}>Main purpose</label>
            <select value={d.purpose} onChange={(e) => set({ purpose: e.target.value })} className={input}>
              {PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>What will it do?</label>
            <input value={d.activity} onChange={(e) => set({ activity: e.target.value })} placeholder="e.g. Hold interests in residential projects in Brazil" className={input} />
          </div>
        </div>
      </Panel>
      <Panel className="mt-4 space-y-3">
        <div className="text-[13px] font-semibold text-ink-900">Company address</div>
        {(
          [
            ["agent", `Use Aurum’s registered office in ${j.name}`, "Included with the registered agent service."],
            ["own", "Use our own business address", "The registered office stays with Aurum; this is where the company operates."],
          ] as const
        ).map(([v, a, b]) => (
          <label key={v} className="flex cursor-pointer items-start gap-3">
            <input type="radio" checked={d.addressMode === v} onChange={() => set({ addressMode: v })} className="mt-1 h-4 w-4 accent-[#0F2340]" />
            <span>
              <span className="block text-[13px] font-medium text-ink-900">{a}</span>
              <span className="block text-[12px] text-stone-500">{b}</span>
            </span>
          </label>
        ))}
        {d.addressMode === "own" && <input value={d.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street, city, postcode, country" className={input} />}
      </Panel>
      {t.units !== "interests" && (
        <Panel className="mt-4">
          <div className="text-[13px] font-semibold text-ink-900">Capital</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Authorised {t.units}</label>
              <input type="number" min={1} value={d.units} onChange={(e) => set({ units: Math.max(1, Number(e.target.value) || 1) })} className={cx(input, "num")} />
            </div>
            {t.units === "shares" && (
              <div>
                <label className={label}>Par value per share</label>
                <input value={d.par} onChange={(e) => set({ par: e.target.value })} className={cx(input, "num")} />
              </div>
            )}
          </div>
          <p className="mt-2 text-[11.5px] text-stone-500">
            {j.id === "de" && t.id === "corp" ? "Many shares at a low par value keeps Delaware franchise tax low." : "You can change this later by resolution."}
          </p>
        </Panel>
      )}
    </>
  );
}

/* ───────────────────────── 4 people ───────────────────────── */

const blankPerson = (): Person => ({
  id: `p${Date.now().toString(36)}`,
  kind: "individual",
  name: "",
  email: "",
  country: "United States",
  director: false,
  officer: false,
  owner: true,
  pct: 0,
  title: "",
});

function People({ d, set, words, owned }: { d: Draft; set: (p: Partial<Draft>) => void; words: { director: string; owner: string }; owned: number }) {
  const upd = (id: string, p: Partial<Person>) => set({ people: d.people.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const add = () => set({ people: [...d.people, { ...blankPerson(), pct: Math.max(0, 100 - owned), director: d.people.length === 0 }] });
  const over = owned > 100.001;
  return (
    <>
      <H
        title="Who owns and runs it?"
        sub={`Add every ${words.owner.toLowerCase()} and every ${words.director.toLowerCase()}. Anyone holding 25% or more is a beneficial owner and goes through identity checks.`}
      />
      <div className="mb-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-ink-900">Ownership</span>
          <span className={cx("num font-semibold", Math.abs(owned - 100) < 0.01 ? "text-[#1F6F44]" : over ? "text-[#9A4422]" : "text-stone-600")}>{owned}% of 100%</span>
        </div>
        <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-stone-200">
          {d.people
            .filter((p) => p.owner && p.pct > 0)
            .map((p, i) => (
              <span
                key={p.id}
                title={`${p.name || "Unnamed"} ${p.pct}%`}
                style={{ width: `${Math.min(100, p.pct)}%`, background: ["#0F2340", GOLD, "#5B7592", "#8C6D3F", "#2B4366"][i % 5] }}
                className="border-r border-white last:border-0"
              />
            ))}
        </div>
      </div>
      <div className="space-y-3">
        {d.people.map((p) => (
          <Panel key={p.id}>
            <div className="flex items-center gap-3">
              <div className="flex rounded-[8px] border border-stone-200 p-0.5">
                {(
                  [
                    ["individual", "Person", User],
                    ["company", "Company", Building2],
                  ] as const
                ).map(([k, l, Icon]) => (
                  <button
                    key={k}
                    onClick={() => upd(p.id, { kind: k, officer: k === "company" ? false : p.officer })}
                    className={cx("flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-semibold", p.kind === k ? "bg-ink-900 text-white" : "text-stone-500")}
                  >
                    <Icon size={12} /> {l}
                  </button>
                ))}
              </div>
              {p.owner && p.pct >= 25 && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#FBF1DE", color: "#8C6D3F" }}>
                  Beneficial owner
                </span>
              )}
              <button
                onClick={() => set({ people: d.people.filter((x) => x.id !== p.id) })}
                className="ml-auto rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-[#9A4422]"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>{p.kind === "company" ? "Company name" : "Full legal name"}</label>
                <input value={p.name} onChange={(e) => upd(p.id, { name: e.target.value })} className={input} />
              </div>
              <div>
                <label className={label}>Email</label>
                <input type="email" value={p.email} onChange={(e) => upd(p.id, { email: e.target.value })} className={input} />
              </div>
              <div>
                <label className={label}>{p.kind === "company" ? "Country of formation" : "Country of residence"}</label>
                <select value={p.country} onChange={(e) => upd(p.id, { country: e.target.value })} className={input}>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Tick on={p.owner} onClick={() => upd(p.id, { owner: !p.owner, pct: p.owner ? 0 : p.pct })}>
                {words.owner}
              </Tick>
              {p.owner && (
                <span className="flex items-center gap-1.5 text-[13px]">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={p.pct}
                    onChange={(e) => upd(p.id, { pct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                    className={cx(input, "num h-8 w-[90px]")}
                    aria-label="Ownership percent"
                  />
                  %
                </span>
              )}
              <Tick on={p.director} onClick={() => upd(p.id, { director: !p.director })}>
                {words.director}
              </Tick>
              {p.kind === "individual" && (
                <Tick on={p.officer} onClick={() => upd(p.id, { officer: !p.officer })}>
                  Officer
                </Tick>
              )}
              {p.officer && (
                <input value={p.title} onChange={(e) => upd(p.id, { title: e.target.value })} placeholder="Title, e.g. President" className={cx(input, "h-8 w-[200px]")} />
              )}
            </div>
          </Panel>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-stone-300 text-[13px] font-semibold text-stone-600 hover:border-ink-900 hover:text-ink-900"
      >
        <Plus size={15} /> Add {d.people.length ? "another person or company" : "the first person or company"}
      </button>
    </>
  );
}

/* ───────────────────────── 5 identity ───────────────────────── */

function Upload({ value, onFile, labelText }: { value?: string; onFile: (n: string) => void; labelText: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)} />
      <button
        onClick={() => ref.current?.click()}
        className={cx(
          "flex h-14 w-full items-center gap-3 rounded-[10px] border px-3 text-left",
          value ? "border-[#BFD8C8] bg-[#F1F8F3]" : "border-dashed border-stone-300 bg-white hover:border-ink-900",
        )}
      >
        {value ? <CircleCheck size={18} className="shrink-0 text-[#1F6F44]" /> : <FileUp size={18} className="shrink-0 text-stone-400" />}
        <span className="min-w-0">
          <span className="block text-[12.5px] font-semibold text-ink-900">{labelText}</span>
          <span className="block truncate text-[11.5px] text-stone-500">{value ?? "PDF, JPG or PNG"}</span>
        </span>
      </button>
    </div>
  );
}

function Identity({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  const upd = (id: string, p: Partial<Person>) => set({ people: d.people.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const list = checkedPeople(d);
  return (
    <>
      <H
        title="Identity checks"
        sub="Registries and banks require us to verify the people behind every company. Documents go straight to Aurum’s compliance team and are screened against sanctions and politically exposed person lists."
      />
      <div className="space-y-3">
        {list.map((p) => (
          <Panel key={p.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold text-ink-900">{p.name}</div>
                <div className="text-[11.5px] text-stone-500">
                  {[p.owner && p.pct >= 25 && `${p.pct}% owner`, p.director && "manages the company", p.officer && (p.title || "officer")].filter(Boolean).join(" · ")}
                </div>
              </div>
              {p.idDoc && (p.kind === "company" || p.addressDoc) && p.pep ? (
                <CircleCheck size={18} className="text-[#1F6F44]" />
              ) : (
                <span className="text-[11.5px] font-semibold text-[#8C6D3F]">To do</span>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Upload value={p.idDoc} onFile={(n) => upd(p.id, { idDoc: n })} labelText={p.kind === "company" ? "Certificate of incorporation" : "Passport or national ID"} />
              {p.kind === "individual" ? (
                <Upload value={p.addressDoc} onFile={(n) => upd(p.id, { addressDoc: n })} labelText="Proof of address, under 3 months old" />
              ) : (
                <Upload value={p.addressDoc} onFile={(n) => upd(p.id, { addressDoc: n })} labelText="Register of owners (optional)" />
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
              <span className="text-stone-700">
                {p.kind === "company" ? "Is any owner or director a politically exposed person?" : "Does this person hold, or recently held, a prominent public role?"}
              </span>
              {(["no", "yes"] as const).map((v) => (
                <label key={v} className="flex cursor-pointer items-center gap-1.5 capitalize">
                  <input type="radio" checked={p.pep === v} onChange={() => upd(p.id, { pep: v })} className="h-4 w-4 accent-[#0F2340]" /> {v}
                </label>
              ))}
            </div>
            {p.pep === "yes" && <p className="mt-2 text-[12px] text-[#8C6D3F]">That’s fine — our compliance team will ask a few extra questions by email.</p>}
          </Panel>
        ))}
      </div>
      <Panel className="mt-4">
        <div className="text-[13px] font-semibold text-ink-900">Source of the company’s funds</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[260px_1fr]">
          <select value={d.funds} onChange={(e) => set({ funds: e.target.value })} className={input} aria-label="Source of funds">
            <option value="">Choose one</option>
            {FUNDS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <input value={d.fundsNote} onChange={(e) => set({ fundsNote: e.target.value })} placeholder="Anything we should know (optional)" className={input} />
        </div>
      </Panel>
      <p className="mt-4 flex items-center gap-2 text-[11.5px] text-stone-500">
        <Lock size={12} /> Documents are encrypted and seen only by the Aurum compliance team. In this preview, only file names are kept.
      </p>
    </>
  );
}

/* ───────────────────────── 6 services ───────────────────────── */

function Services({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  const list = servicesFor(jurisdictionOf(d));
  return (
    <>
      <H title="Add services" sub="Formation comes with a registered agent and office. Add what you want us to handle after the company exists." />
      <div className="divide-y divide-[#EFEAE0] overflow-hidden rounded-[10px] border border-[#E6E0D4] bg-white">
        {list.map((s) => {
          const on = d.services.includes(s.id);
          return (
            <label key={s.id} className={cx("flex items-center gap-4 px-5 py-4", s.required ? "cursor-default" : "cursor-pointer hover:bg-stone-50")}>
              <span
                onClick={() => !s.required && set({ services: on ? d.services.filter((x) => x !== s.id) : [...d.services, s.id] })}
                className={cx(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border",
                  on ? "border-ink-900 bg-ink-900 text-white" : "border-stone-400",
                  s.required && "opacity-60",
                )}
              >
                {on && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-ink-900">
                  {s.name}
                  {s.required && <span className="ml-2 text-[11px] font-medium text-stone-500">Required</span>}
                </span>
                <span className="block text-[12px] text-stone-500">{s.about}</span>
              </span>
              <span className="num shrink-0 text-right text-[13px] font-semibold text-ink-900">
                {s.price ? usd(s.price) : "Included"}
                <span className="block text-[11px] font-normal text-stone-500">{s.per === "year" ? "per year" : "one time"}</span>
              </span>
            </label>
          );
        })}
      </div>
    </>
  );
}

/* ───────────────────────── 7 review ───────────────────────── */

function Review({ d, set, go, words }: { d: Draft; set: (p: Partial<Draft>) => void; go: (s: number) => void; words: { director: string; owner: string } }) {
  const j = jurisdictionOf(d)!;
  const t = typeOf(d)!;
  const section = ({ title, step, children }: { title: string; step: number; children: ReactNode }) => (
    <div className="border-b border-stone-100 py-4 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{title}</span>
        <button onClick={() => go(step)} className="flex items-center gap-1 text-[12px] font-semibold text-stone-500 hover:text-ink-900">
          <Pencil size={11} /> Edit
        </button>
      </div>
      <div className="mt-2 text-[13.5px] text-ink-900">{children}</div>
    </div>
  );
  return (
    <>
      <H title="Check and submit" sub="Nothing is filed until our team has reviewed your application and the identity checks are clear." />
      <Panel className="py-1">
        {section({
          title: "Company",
          step: 2,
          children: (
            <>
              <div className="text-[17px] font-semibold">
                {d.name} {d.suffix}
              </div>
              <div className="text-stone-600">
                {t.name}, {j.name} · {d.purpose}
              </div>
              <div className="text-[12.5px] text-stone-500">
                {[d.alt1, d.alt2].filter(Boolean).length ? `Back-up names: ${[d.alt1, d.alt2].filter(Boolean).join(", ")}` : "No back-up names given"}
              </div>
            </>
          ),
        })}
        {section({
          title: "People",
          step: 3,
          children: (
            <ul className="space-y-1">
              {d.people.map((p) => (
                <li key={p.id} className="flex justify-between gap-4">
                  <span>{p.name}</span>
                  <span className="text-stone-500">
                    {[p.owner && `${words.owner} ${p.pct}%`, p.director && words.director, p.officer && (p.title || "Officer")].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          ),
        })}
        {section({
          title: "Identity",
          step: 4,
          children: (
            <>
              {checkedPeople(d).length} {checkedPeople(d).length === 1 ? "person" : "people"} ready for checks · Funds from {d.funds.toLowerCase()}
            </>
          ),
        })}
      </Panel>
      <Panel className="mt-4 space-y-3">
        <div className="text-[13px] font-semibold text-ink-900">How would you like to pay?</div>
        {(
          [
            ["wire", "Bank transfer", "We email transfer details with your reference. Filing starts when funds arrive."],
            ["card", "Card", "A secure card form opens after you submit. Card payments are not connected in this preview."],
          ] as const
        ).map(([v, a, b]) => (
          <label key={v} className="flex cursor-pointer items-start gap-3">
            <input type="radio" checked={d.pay === v} onChange={() => set({ pay: v })} className="mt-1 h-4 w-4 accent-[#0F2340]" />
            <span>
              <span className="block text-[13px] font-medium text-ink-900">{a}</span>
              <span className="block text-[12px] text-stone-500">{b}</span>
            </span>
          </label>
        ))}
      </Panel>
    </>
  );
}

function SubmitButton({ onSubmit, pay }: { onSubmit: () => void; pay: Draft["pay"] }) {
  const [sure, setSure] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <Tick on={sure} onClick={() => setSure(!sure)}>
        The information is accurate
      </Tick>
      <button
        disabled={!sure}
        onClick={onSubmit}
        className="flex h-11 items-center gap-2 rounded-[8px] px-6 text-[13.5px] font-semibold text-ink-900 disabled:opacity-35"
        style={{ background: "#F8C618" }}
      >
        Submit application{pay === "card" ? " and pay" : ""} <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ───────────────────────── quote ───────────────────────── */

function Quote({ d }: { d: Draft }) {
  const j = jurisdictionOf(d);
  const t = typeOf(d);
  const q = quote(d);
  const title = d.name ? `${d.name} ${d.suffix}`.trim() : t ? `Your new ${t.short}` : "Your new company";
  return (
    <div className="sticky top-[150px]">
      <div className="overflow-hidden rounded-[10px] border border-[#E6E0D4] bg-white shadow-[0_10px_30px_rgba(15,35,64,0.06)]">
        <div className="h-[3px]" style={{ background: GOLD }} />
        <div className="px-6 pb-5 pt-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-stone-500">Quote</div>
          <div className="mt-2 font-serif text-[22px] leading-tight text-ink-900">{title}</div>
          <div className="mt-1 text-[12.5px] text-stone-500">{j ? `${t ? t.name : "Choose an entity type"} · ${j.name}` : "Choose a jurisdiction to begin"}</div>
        </div>
        <div className="border-t border-dashed border-[#E0D9CB] px-6 py-5">
          {q.lines.length ? (
            <ul className="space-y-2.5 text-[13px]">
              {q.lines.map((l) => (
                <li key={l.label} className="flex items-baseline gap-2">
                  <span className="text-stone-700">{l.label}</span>
                  {l.note && <span className="text-[11px] text-stone-400">{l.note}</span>}
                  <span className="mb-[3px] min-w-[12px] flex-1 border-b border-dotted border-stone-300" />
                  <span className="num text-ink-900">{usd(l.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-stone-500">
              Your quote builds here as you choose where to form the company and which services to add. Every fee is shown before you submit.
            </p>
          )}
        </div>
        {q.lines.length > 0 && (
          <div className="border-t border-[#E6E0D4] bg-[#FBF9F5] px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Due at submission</span>
              <span className="num font-serif text-[30px] leading-none text-ink-900">{usd(q.today)}</span>
            </div>
            <div className="mt-2 text-right text-[12px] text-stone-500">
              Then about <span className="num">{usd(q.yearly)}</span> a year from year two
            </div>
          </div>
        )}
      </div>
      {t && (
        <div className="mt-4 flex gap-3 px-1 text-[12.5px] leading-relaxed text-stone-600">
          <span className="mt-[9px] h-px w-4 shrink-0" style={{ background: GOLD }} />
          <span>
            Typically incorporated in <b className="font-semibold text-ink-900">{t.days}</b> once identity checks clear.
          </span>
        </div>
      )}
      <div className="mt-3 flex gap-3 px-1 text-[12.5px] leading-relaxed text-stone-600">
        <span className="mt-[9px] h-px w-4 shrink-0" style={{ background: GOLD }} />
        <span>Nothing is charged until you submit, and nothing is filed until an Aurum officer has reviewed it.</span>
      </div>
    </div>
  );
}

/* ───────────────────────── confirmation ───────────────────────── */

function Confirmation({ d }: { d: Draft }) {
  const j = jurisdictionOf(d)!;
  const t = typeOf(d)!;
  const q = quote(d);
  return (
    <div className="mx-auto max-w-[760px] px-6 py-14">
      <div className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: GOLD }}>
        <Check size={22} strokeWidth={3} />
      </div>
      <h1 className="mt-5 font-serif text-[34px] leading-tight text-ink-900">Application received</h1>
      <p className="mt-2 text-[14px] text-stone-600">
        Reference <b className="num text-ink-900">{d.ref}</b> for {d.name} {d.suffix}, a {t.short} ({t.name}) in {j.name}. We’ve sent a copy to {d.email}.
      </p>
      <Panel className="mt-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">What happens next</div>
        <ol className="mt-4 space-y-0">
          {STAGES.map((s, i) => (
            <li key={s} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cx("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", i === 0 ? "text-white" : "border border-stone-300 text-stone-400")}
                  style={i === 0 ? { background: GOLD } : undefined}
                >
                  {i === 0 ? <Check size={12} strokeWidth={3} /> : i + 1}
                </span>
                {i < STAGES.length - 1 && <span className="w-px flex-1 bg-stone-200" />}
              </div>
              <div className="pb-5">
                <div className={cx("text-[13.5px] font-semibold", i === 0 ? "text-ink-900" : "text-stone-600")}>{s}</div>
                <div className="text-[12px] text-stone-500">
                  {
                    [
                      "Your application is with the formation team.",
                      "Compliance verifies identities and screens every person. We email if anything is missing.",
                      "We reserve the first available name with the registry.",
                      "The formation documents are signed and filed.",
                      `The registry confirms the company. Usually ${t.days}.`,
                      "Tax registration, registers and any services you chose.",
                    ][i]
                  }
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      {d.pay === "wire" && (
        <Panel className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Payment</div>
          <p className="mt-2 text-[13px] text-stone-700">
            Transfer <b className="num text-ink-900">{usd(q.today)}</b> quoting <b className="num text-ink-900">{d.ref}</b>. Our bank details arrive by email from
            formation@aurumasset.us — always confirm them by phone before sending.
          </p>
        </Panel>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex h-10 items-center gap-2 rounded-[8px] border border-stone-300 bg-white px-4 text-[13px] font-semibold text-ink-900 hover:border-ink-900"
        >
          <Printer size={14} /> Print summary
        </button>
        <a href="/incorporate" onClick={() => storeDraft(null)} className="flex h-10 items-center rounded-[8px] px-4 text-[13px] font-semibold text-stone-600 hover:text-ink-900">
          Form another company
        </a>
      </div>
    </div>
  );
}
