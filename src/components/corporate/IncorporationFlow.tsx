"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, CircleAlert, CircleCheck, FileUp, Lock, Mail, Pencil, Plus, Printer, ShieldCheck, Trash2, User } from "lucide-react";
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
const input = "h-10 w-full rounded-[8px] border border-stone-300 bg-white px-3 text-[13.5px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none";
const label = "mb-1.5 block text-[12px] font-semibold text-stone-600";
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

  return (
    <div ref={top} className="min-h-screen bg-[#F7F4EE]">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-5 px-6">
          <AurumLogo />
          <span className="h-6 w-px bg-stone-200" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-500">Company formation</span>
          <span className="ml-auto hidden items-center gap-4 text-[12px] text-stone-500 md:flex">
            {d.step > 0 && !done && (
              <span className="flex items-center gap-1.5">
                <CircleCheck size={13} className="text-[#1F8A4C]" /> Progress saved on this device
              </span>
            )}
            <a href="mailto:formation@aurumasset.us" className="flex items-center gap-1.5 hover:text-ink-900">
              <Mail size={13} /> formation@aurumasset.us
            </a>
          </span>
        </div>
      </header>

      {done ? (
        <Confirmation d={d} />
      ) : (
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-10 lg:grid-cols-[200px_minmax(0,1fr)_320px]">
          {/* step rail */}
          <nav className="hidden lg:block">
            <ol className="sticky top-8 space-y-1">
              {STEPS.map((s, i) => {
                const reachable = i <= d.step || ok.slice(0, i).every(Boolean);
                const complete = i < d.step && ok[i];
                return (
                  <li key={s}>
                    <button
                      disabled={!reachable}
                      onClick={() => go(i)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left text-[13px]",
                        i === d.step ? "bg-white font-semibold text-ink-900 shadow-card" : reachable ? "text-stone-600 hover:text-ink-900" : "text-stone-400",
                      )}
                    >
                      <span
                        className={cx(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          complete ? "text-white" : i === d.step ? "border-2 border-ink-900 text-ink-900" : "border border-stone-300 text-stone-400",
                        )}
                        style={complete ? { background: GOLD } : undefined}
                      >
                        {complete ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </span>
                      {s}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* step body */}
          <main className="min-w-0">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              Step {d.step + 1} of {STEPS.length}
            </div>
            {d.step === 0 && <Start d={d} set={set} resume={resume} onResume={() => (setD(resume!), setResume(null))} />}
            {d.step === 1 && <Where d={d} set={set} />}
            {d.step === 2 && <Company d={d} set={set} />}
            {d.step === 3 && <People d={d} set={set} words={words} owned={owned} />}
            {d.step === 4 && <Identity d={d} set={set} />}
            {d.step === 5 && <Services d={d} set={set} />}
            {d.step === 6 && <Review d={d} set={set} go={go} words={words} />}

            <div className="mt-8 flex items-center gap-3 border-t border-stone-200 pt-6">
              {d.step > 0 && (
                <button onClick={() => go(d.step - 1)} className="flex h-11 items-center gap-1.5 rounded-[8px] px-4 text-[13.5px] font-semibold text-stone-600 hover:text-ink-900">
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <span className="ml-auto text-[12px] text-stone-500">{!ok[d.step] && d.step > 0 ? hint(d.step, d, owned) : ""}</span>
              {d.step < STEPS.length - 1 ? (
                <button
                  disabled={!ok[d.step]}
                  onClick={() => go(d.step + 1)}
                  className="flex h-11 items-center gap-2 rounded-[8px] bg-ink-900 px-6 text-[13.5px] font-semibold text-white hover:bg-ink-700 disabled:opacity-35"
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <SubmitButton onSubmit={submit} pay={d.pay} />
              )}
            </div>
          </main>

          {/* quote */}
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
    <div className="mb-6">
      <h1 className="font-serif text-[32px] leading-[1.15] tracking-[-0.01em] text-ink-900">{title}</h1>
      {sub && <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-stone-600">{sub}</p>}
    </div>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-[12px] border border-stone-200 bg-white p-5", className)}>{children}</div>;
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
        {required && <span className="text-[#9A4422]"> *</span>}
      </span>
    </button>
  );
}

/* ───────────────────────── 1 start ───────────────────────── */

function Start({ d, set, resume, onResume }: { d: Draft; set: (p: Partial<Draft>) => void; resume: Draft | null; onResume: () => void }) {
  return (
    <>
      <H
        title="Form a company with Aurum"
        sub="Tell us where and what you want to set up. We prepare the filings, check identities, file with the registry and hand over a company that is ready to open a bank account."
      />
      {resume && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-[10px] border px-4 py-3 text-[13px]" style={{ borderColor: GOLD, background: "#FBF7EE" }}>
          <span className="text-ink-900">
            You have an application in progress{resume.name ? ` for ${resume.name}` : ""}, saved at step {resume.step + 1}.
          </span>
          <button onClick={onResume} className="shrink-0 font-semibold text-ink-900 underline underline-offset-4">
            Pick up where you left off
          </button>
        </div>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["6 jurisdictions", "United States, Caribbean and Brazil"],
          ["1–5 business days", "In most US and offshore jurisdictions"],
          ["One fixed quote", "Shown before you pay, item by item"],
        ].map(([a, b]) => (
          <div key={a} className="border-l-2 pl-3" style={{ borderColor: GOLD }}>
            <div className="text-[14px] font-semibold text-ink-900">{a}</div>
            <div className="text-[12px] text-stone-500">{b}</div>
          </div>
        ))}
      </div>
      <Panel className="max-w-[520px] space-y-4">
        <div>
          <label className={label} htmlFor="em">
            Your email
          </label>
          <input id="em" type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@company.com" className={input} />
          <p className="mt-1.5 text-[11.5px] text-stone-500">We send status updates and documents here. A company address works best.</p>
        </div>
        <Tick on={d.consent} onClick={() => set({ consent: !d.consent })} required>
          I accept Aurum’s engagement terms and have read the privacy notice.
        </Tick>
        <Tick on={d.updates} onClick={() => set({ updates: !d.updates })}>
          Send me occasional updates about Aurum services.
        </Tick>
      </Panel>
    </>
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
      <div className="mb-4 flex gap-1.5">
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cx(
              "h-8 rounded-full px-3.5 text-[12.5px] font-semibold",
              region === r ? "bg-ink-900 text-white" : "border border-stone-300 bg-white text-stone-600 hover:border-ink-900",
            )}
          >
            {r}
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
                  "rounded-[12px] border bg-white p-4 text-left transition-shadow",
                  sel ? "border-ink-900 shadow-card ring-1 ring-ink-900" : "border-stone-200 hover:border-stone-400",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold text-ink-900">{x.name}</div>
                    <div className="text-[11.5px] text-stone-500">
                      {x.region} · {x.code}
                    </div>
                  </div>
                  <span className={cx("flex h-5 w-5 items-center justify-center rounded-full border", sel ? "border-ink-900 bg-ink-900 text-white" : "border-stone-300")}>
                    {sel && <Check size={11} strokeWidth={3} />}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-stone-600">{x.about}</p>
                <div className="mt-3 text-[12px] text-stone-500">
                  From <b className="num font-semibold text-ink-900">{usd(from)}</b>
                </div>
              </button>
            );
          })}
      </div>
      {j && (
        <div className="mt-8">
          <div className="mb-3 text-[15px] font-semibold text-ink-900">Entity type in {j.name}</div>
          <div className="divide-y divide-stone-100 overflow-hidden rounded-[12px] border border-stone-200 bg-white">
            {j.types.map((t) => (
              <label key={t.id} className={cx("flex cursor-pointer items-start gap-3 px-5 py-4", d.entityType === t.id && "bg-[#FBF7EE]")}>
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
      <div className="divide-y divide-stone-100 overflow-hidden rounded-[12px] border border-stone-200 bg-white">
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
  return (
    <div className="sticky top-8 overflow-hidden rounded-[12px] border border-stone-200 bg-white">
      <div className="bg-ink-900 px-5 py-4 text-white">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/60">Your quote</div>
        <div className="mt-1 text-[15px] font-semibold">{d.name ? `${d.name} ${d.suffix}`.trim() : t ? `New ${t.short}` : "New company"}</div>
        <div className="text-[12px] text-white/70">{j ? `${j.name}${t ? ` · ${t.name}` : ""}` : "Choose a jurisdiction"}</div>
      </div>
      <div className="px-5 py-4">
        {q.lines.length ? (
          <ul className="space-y-2 text-[12.5px]">
            {q.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-3">
                <span className="text-stone-600">
                  {l.label}
                  {l.note && <span className="text-stone-400"> ({l.note})</span>}
                </span>
                <span className="num shrink-0 text-ink-900">{usd(l.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-stone-500">Prices appear as you choose.</p>
        )}
        <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-3">
          <span className="text-[13px] font-semibold text-ink-900">Due today</span>
          <span className="num text-[22px] font-semibold text-ink-900">{usd(q.today)}</span>
        </div>
        {j && (
          <p className="mt-1 text-right text-[11.5px] text-stone-500">
            From year two: about <span className="num">{usd(q.yearly)}</span> a year
          </p>
        )}
        {t && (
          <div className="mt-4 rounded-[8px] bg-[#F7F4EE] px-3 py-2.5 text-[12px] text-stone-600">
            Typical time to incorporate: <b className="text-ink-900">{t.days}</b> after identity checks clear.
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-stone-100 px-5 py-3 text-[11.5px] text-stone-500">
        <ShieldCheck size={13} /> No payment is taken until you submit.
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
