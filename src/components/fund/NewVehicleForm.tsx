"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, CircleCheck, Copy, ExternalLink, FileUp, Link2, Loader2, Search, X } from "lucide-react";
import { Button, ButtonLink, cx } from "@/components/ui";
import { formatAddress, type GleifDetail, type GleifEntity } from "@/lib/gleif";
import { funds } from "@/lib/data";
import { gps } from "@/lib/gps";
import { date } from "@/lib/format";

const input =
  "h-10 w-full rounded-[3px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,]/g, "")
    .replace(/\b(lp|l p|llc|ltd|limited|inc|fund|the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (s: string) =>
  s === s.toUpperCase()
    ? s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bLp\b/g, "LP").replace(/\bLlc\b/g, "LLC").replace(/\bSpv\b/g, "SPV").replace(/\bI{1,3}\b/gi, (m) => m.toUpperCase())
    : s;

function Section({ n, title, desc, aside, children }: { n: number; title: string; desc: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[4px] border border-stone-200 bg-white">
      <header className="flex items-start gap-4 border-b border-stone-200 px-6 py-4">
        <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-900 text-[11px] font-semibold">{n}</span>
        <div className="flex-1">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          <p className="text-[12px] text-stone-500">{desc}</p>
        </div>
        {aside}
      </header>
      <div className="space-y-5 p-6">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold">
        {label}
        {required && <span className="ml-0.5 text-negative">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-[12px] text-stone-500">{hint}</span> : null}
    </label>
  );
}

function Pill({ tone, children }: { tone: "ok" | "warn" | "muted" | "gold"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center rounded-[2px] px-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        tone === "ok" && "bg-positive/10 text-positive",
        tone === "warn" && "bg-caution-bg text-caution",
        tone === "muted" && "bg-stone-100 text-stone-600",
        tone === "gold" && "bg-gold-100 text-gold-700",
      )}
    >
      {children}
    </span>
  );
}

function Notice({ tone, children }: { tone: "warn" | "ok" | "info"; children: ReactNode }) {
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return (
    <div
      className={cx(
        "flex gap-2.5 rounded-[3px] border px-3.5 py-2.5 text-[12.5px]",
        tone === "warn" && "border-caution/30 bg-caution-bg/60 text-ink-800",
        tone === "ok" && "border-positive/30 bg-positive/5 text-ink-800",
        tone === "info" && "border-stone-200 bg-stone-50 text-stone-600",
      )}
    >
      <Icon size={15} className={cx("mt-px shrink-0", tone === "warn" ? "text-caution" : tone === "ok" ? "text-positive" : "text-stone-400")} />
      <div>{children}</div>
    </div>
  );
}

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 border-b border-stone-100 py-2.5 text-[13px] last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className={cx("text-ink-900", mono && "font-mono text-[12.5px]")}>{children}</dd>
    </div>
  );
}

const leiUrl = (lei: string) => `https://search.gleif.org/#/record/${lei}`;
/** Aurum's RapidLEI applicant account. API issuance replaces this once Aurum is a RapidLEI partner. */
const RAPIDLEI_URL = "https://lei.rapidlei.com/Applicant/Dashboard";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="grid grid-cols-[180px_1fr_auto] items-center gap-4 border-b border-stone-100 py-2 text-[13px] last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className={cx(value ? "text-ink-900" : "text-stone-400")}>{value || "Not provided"}</dd>
      <button
        type="button"
        disabled={!value}
        aria-label={`Copy ${label}`}
        className="inline-flex h-7 items-center gap-1 rounded-[3px] px-2 text-[11px] text-stone-500 hover:bg-stone-100 hover:text-ink-900 disabled:opacity-30"
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => {});
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }}
      >
        {done ? <Check size={12} /> : <Copy size={12} />} {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function ResultRow({ r, onPick }: { r: GleifEntity; onPick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onPick} className="group flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-brand-soft">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-ink-900">{titleCase(r.legalName)}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-stone-500">
            <span className="font-mono">{r.lei}</span>
            <span>{r.jurisdictionLabel}</span>
            {r.creationDate && <span>Formed {date(r.creationDate)}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {r.category && <Pill tone={r.category === "FUND" ? "gold" : "muted"}>{r.category === "GENERAL" ? "Entity" : r.category}</Pill>}
          <Pill tone={r.registrationStatus === "ISSUED" ? "ok" : "warn"}>{r.registrationStatus ?? "—"}</Pill>
        </div>
      </button>
    </li>
  );
}

type Manual = { legalName: string; domicile: string; legalForm: string; formationDate: string; registeredAs: string; address: string; lei: string; viaRapidLei: boolean };
const blankManual = (viaRapidLei: boolean): Manual => ({ legalName: "", domicile: "", legalForm: "", formationDate: "", registeredAs: "", address: "", lei: "", viaRapidLei });

export function NewVehicleForm() {
  const [q, setQ] = useState("");
  const [fundsOnly, setFundsOnly] = useState(true);
  const [results, setResults] = useState<GleifEntity[] | null>(null);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<GleifDetail | null>(null);
  const [loadingLei, setLoadingLei] = useState<string | null>(null);
  const [manual, setManual] = useState<Manual | null>(null);

  const [gpId, setGpId] = useState("");
  const [shortName, setShortName] = useState("");
  const [currency, setCurrency] = useState<"USD" | "BRL">("USD");
  const [strategy, setStrategy] = useState("");
  const [vintage, setVintage] = useState("");
  const [lpa, setLpa] = useState<{ name: string; kb: number } | null>(null);
  const [created, setCreated] = useState(false);
  const [leiCheck, setLeiCheck] = useState<{ state: "idle" | "checking" | "pending" | "invalid" }>({ state: "idle" });
  const seq = useRef(0);

  // Debounced GLEIF search
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const res = await fetch(`/api/gleif/search?q=${encodeURIComponent(term)}${fundsOnly ? "&funds=1" : ""}`);
        const json = await res.json();
        if (id !== seq.current) return;
        if (!res.ok) throw new Error(json.error);
        setResults(json.results);
        setTotal(json.total);
      } catch (e) {
        if (id === seq.current) setError(e instanceof Error && e.message ? e.message : "GLEIF search failed.");
      } finally {
        if (id === seq.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, fundsOnly]);

  const pick = async (lei: string) => {
    setLoadingLei(lei);
    setError(null);
    try {
      const res = await fetch(`/api/gleif/record?lei=${lei}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json as GleifDetail;
      setDetail(d);
      setManual(null);
      if (d.category === "FUND") {
        // Match the GP: first by the GLEIF fund-manager LEI, then by manager name / mail routing.
        const byLei = d.fundManager && gps.find((g) => g.lei && g.lei === d.fundManager!.lei);
        const hint = [d.fundManager?.legalName, d.hqAddress?.mailRouting, d.legalAddress?.mailRouting].filter(Boolean).map((s) => norm(s!));
        const byName = gps.find((g) => !g.sample && hint.some((h) => h.includes(norm(g.name)) || h.includes(norm(g.shortName))));
        setGpId((byLei || byName)?.id ?? "");
        setShortName(titleCase(d.legalName).replace(/,?\s+(L\.?P\.?|LLC|Ltd\.?)$/i, ""));
        setCurrency(d.jurisdiction?.startsWith("BR") ? "BRL" : "USD");
      }
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Could not load that LEI record.");
    } finally {
      setLoadingLei(null);
    }
  };

  const reset = () => {
    setDetail(null);
    setManual(null);
    setGpId("");
    setShortName("");
    setStrategy("");
    setVintage("");
    setLpa(null);
    setCreated(false);
    setLeiCheck({ state: "idle" });
  };

  /** After RapidLEI issues the LEI: look it up in GLEIF; once published, the record replaces the manual entry. */
  const verifyIssuedLei = async () => {
    const lei = manual!.lei.trim().toUpperCase();
    if (!/^[A-Z0-9]{18}[0-9]{2}$/.test(lei)) return setLeiCheck({ state: "invalid" });
    setLeiCheck({ state: "checking" });
    const res = await fetch(`/api/gleif/record?lei=${lei}`);
    if (res.ok) {
      const keepGp = gpId;
      await pick(lei);
      if (keepGp) setGpId(keepGp);
      setLeiCheck({ state: "idle" });
    } else setLeiCheck({ state: res.status === 404 ? "pending" : "invalid" });
  };

  const isManager = detail && detail.category !== "FUND";
  const vehicle = detail && !isManager ? detail : null;
  const legalName = vehicle ? titleCase(vehicle.legalName) : (manual?.legalName ?? "");
  const gpMatchedByLei = Boolean(vehicle?.fundManager && gps.find((g) => g.id === gpId)?.lei === vehicle.fundManager.lei);

  const duplicate = useMemo(() => {
    const n = norm(legalName);
    return n ? funds.find((f) => norm(f.name) === n) : undefined;
  }, [legalName]);

  const manualOk = manual && manual.legalName && manual.domicile && (!manual.viaRapidLei || (manual.formationDate && manual.registeredAs && manual.address));
  const ready = (vehicle || manualOk) && gpId && shortName && !duplicate;
  const gp = gps.find((g) => g.id === gpId);
  const formationYear = vehicle?.creationDate?.slice(0, 4) ?? manual?.formationDate.slice(0, 4);

  if (created) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[4px] border border-stone-200 bg-white p-8">
          <CircleCheck className="text-positive" size={28} />
          <h1 className="mt-4 text-[22px] font-semibold">{legalName} is set up</h1>
          <p className="mt-1.5 text-[13px] text-stone-600">
            Added under {gp?.name}. Its economics stay <strong>pending LPA review</strong>: no fees, carry or hurdle are applied, and no capital can be called, until the
            LPA review is approved by two people.
          </p>
          <dl className="mt-6 border-t border-stone-200 pt-2">
            <Row label="LEI" mono={Boolean(vehicle)}>{vehicle ? vehicle.lei : manual?.viaRapidLei ? "Requested via RapidLEI · attaches when GLEIF publishes it" : "None"}</Row>
            <Row label="Domicile">{vehicle?.jurisdictionLabel ?? manual?.domicile}</Row>
            <Row label="Currency">{currency}</Row>
            <Row label="LPA">{lpa ? `${lpa.name} · queued for review` : "Not uploaded yet"}</Row>
          </dl>
          <p className="mt-6 text-[12px] text-stone-500">Preview only: this isn&apos;t saved yet. It will be once the platform is connected to its database (Supabase).</p>
          <div className="mt-6 flex gap-2">
            <ButtonLink href="/admin/fund/funds">Back to funds</ButtonLink>
            <Button variant="secondary" onClick={reset}>
              Add another vehicle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/fund/funds" className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-ink-900">
          <ArrowLeft size={13} /> Funds
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight">New vehicle</h1>
        <p className="mt-1 text-[13px] text-stone-600">
          Find the vehicle in GLEIF, the global register of Legal Entity Identifiers. Its legal identity comes from the register; its economics come from the LPA.
        </p>
      </div>

      {/* 1 — Find */}
      <Section
        n={1}
        title="Find the vehicle in GLEIF"
        desc="Search by legal name, manager name or LEI."
        aside={
          (detail || manual) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X size={13} /> Change
            </Button>
          )
        }
      >
        {!detail && !manual ? (
          <>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  autoFocus
                  aria-label="Search GLEIF"
                  className={cx(input, "pl-9")}
                  placeholder="e.g. Strlex, Oyster Venture Fund, or a 20-character LEI"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    if (e.target.value.trim().length < 3) {
                      setResults(null);
                      setError(null);
                    }
                  }}
                />
                {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-stone-400" />}
              </div>
              <label className="flex items-center gap-2 whitespace-nowrap text-[12px] text-stone-600">
                <input type="checkbox" checked={fundsOnly} onChange={(e) => setFundsOnly(e.target.checked)} className="accent-ink-900" />
                Funds only
              </label>
            </div>

            {error && <Notice tone="warn">{error}</Notice>}

            {results && !error && (
              <div className="rounded-[3px] border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-stone-500">
                  <span>
                    {total} record{total === 1 ? "" : "s"} in GLEIF{total > results.length ? ` · showing ${results.length}` : ""}
                  </span>
                  {loadingLei && <span className="normal-case tracking-normal">Loading {loadingLei}…</span>}
                </div>
                {results.length ? (
                  <ul className="divide-y divide-stone-100">
                    {results.map((r) => (
                      <ResultRow key={r.lei} r={r} onPick={() => pick(r.lei)} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-6 text-center text-[13px] text-stone-500">
                    No match{fundsOnly ? " among funds. Try clearing “Funds only” to search the manager" : ""}.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-[3px] bg-stone-50 px-4 py-3">
              <p className="text-[12px] text-stone-600">
                No LEI yet? Most vehicles need one before they trade or file Form PF or CVM reports.
              </p>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="sm" onClick={() => setManual(blankManual(false))}>
                  Enter manually
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setManual({ ...blankManual(true), legalName: results?.length === 0 ? titleCase(q.trim()) : "" })}>
                  Create an LEI with RapidLEI
                </Button>
              </div>
            </div>
          </>
        ) : isManager ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[15px] font-semibold">{titleCase(detail!.legalName)}</div>
                <div className="mt-0.5 font-mono text-[12px] text-stone-500">{detail!.lei}</div>
              </div>
              <Pill tone="muted">Manager / entity</Pill>
            </div>
            <Notice tone="info">This is a management company, not a fund. Pick the vehicle it manages:</Notice>
            {detail!.managedFunds.length ? (
              <ul className="divide-y divide-stone-100 rounded-[3px] border border-stone-200">
                {detail!.managedFunds.map((r) => (
                  <ResultRow key={r.lei} r={r} onPick={() => pick(r.lei)} />
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-stone-500">GLEIF lists no funds managed by this entity.</p>
            )}
          </>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[15px] font-semibold">{legalName || "Manual entry"}</div>
              {vehicle ? (
                <a href={leiUrl(vehicle.lei)} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 font-mono text-[12px] text-stone-500 hover:text-ink-900">
                  {vehicle.lei} <ExternalLink size={11} />
                </a>
              ) : (
                <div className="mt-0.5 text-[12px] text-stone-500">{manual?.viaRapidLei ? "LEI to be issued by RapidLEI" : "Not sourced from GLEIF"}</div>
              )}
            </div>
            {vehicle && <Pill tone="gold">From GLEIF</Pill>}
          </div>
        )}
      </Section>

      {/* 2 — Legal identity */}
      {(vehicle || manual) && (
        <Section n={2} title="Legal identity" desc={vehicle ? `As registered in GLEIF · last updated ${date(vehicle.lastUpdate ?? "")}` : "Enter exactly as it appears in the certificate of formation."}>
          {vehicle ? (
            <>
              <dl>
                <Row label="Legal name">{legalName}</Row>
                <Row label="LEI" mono>{vehicle.lei}</Row>
                <Row label="Legal form">
                  {vehicle.legalFormName ?? "—"}
                  {vehicle.legalFormCode && <span className="ml-2 font-mono text-[11px] text-stone-400">ELF {vehicle.legalFormCode}</span>}
                </Row>
                <Row label="Domicile">{vehicle.jurisdictionLabel}</Row>
                <Row label="Registry number" mono>{vehicle.registeredAs ?? "—"}</Row>
                <Row label="Formation date">{vehicle.creationDate ? date(vehicle.creationDate) : "—"}</Row>
                <Row label="Registered office">{formatAddress(vehicle.legalAddress)}</Row>
                <Row label="Principal office">{formatAddress(vehicle.hqAddress)}</Row>
                <Row label="Fund manager (GLEIF)">
                  {vehicle.fundManager ? (
                    <>
                      {titleCase(vehicle.fundManager.legalName)} <span className="ml-1 font-mono text-[11px] text-stone-400">{vehicle.fundManager.lei}</span>
                    </>
                  ) : (
                    <span className="text-stone-500">Not reported</span>
                  )}
                </Row>
                <Row label="LEI status">
                  <span className="inline-flex items-center gap-2">
                    <Pill tone={vehicle.registrationStatus === "ISSUED" ? "ok" : "warn"}>{vehicle.registrationStatus}</Pill>
                    {vehicle.nextRenewal && <span className="text-stone-500">renews {date(vehicle.nextRenewal)}</span>}
                  </span>
                </Row>
              </dl>
              {vehicle.registrationStatus !== "ISSUED" && (
                <Notice tone="warn">
                  This LEI is {vehicle.registrationStatus?.toLowerCase()}. The vehicle can be onboarded, but the LEI must be renewed before regulatory filings.{" "}
                  <a href={RAPIDLEI_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
                    Renew it in RapidLEI
                  </a>
                </Notice>
              )}
              {vehicle.entityStatus !== "ACTIVE" && <Notice tone="warn">GLEIF reports this entity as {vehicle.entityStatus?.toLowerCase()}.</Notice>}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              <Field label="Legal name" required>
                <input aria-label="Legal name" className={input} value={manual!.legalName} onChange={(e) => setManual({ ...manual!, legalName: e.target.value })} />
              </Field>
              <Field label="Domicile" required>
                <input className={input} placeholder="e.g. Delaware, USA" value={manual!.domicile} onChange={(e) => setManual({ ...manual!, domicile: e.target.value })} />
              </Field>
              <Field label="Legal form">
                <input className={input} placeholder="e.g. Limited Partnership" value={manual!.legalForm} onChange={(e) => setManual({ ...manual!, legalForm: e.target.value })} />
              </Field>
              <Field label="Formation date" required={manual!.viaRapidLei}>
                <input type="date" className={input} value={manual!.formationDate} onChange={(e) => setManual({ ...manual!, formationDate: e.target.value })} />
              </Field>
              <Field label="Registry number" required={manual!.viaRapidLei} hint="e.g. the Delaware file number on the certificate of formation.">
                <input className={input} value={manual!.registeredAs} onChange={(e) => setManual({ ...manual!, registeredAs: e.target.value })} />
              </Field>
              <Field label="Registered office" required={manual!.viaRapidLei}>
                <input className={input} placeholder="Registered agent address" value={manual!.address} onChange={(e) => setManual({ ...manual!, address: e.target.value })} />
              </Field>
            </div>
          )}
          {duplicate && (
            <Notice tone="warn">
              <strong>{duplicate.name}</strong> is already administered by Aurum.{" "}
              <Link className="underline" href={`/admin/fund/funds/${duplicate.id}`}>
                Open it
              </Link>
            </Notice>
          )}
        </Section>
      )}

      {/* 3 — Administration */}
      {(vehicle || manual) && !duplicate && (
        <Section n={3} title="Administration" desc="How Aurum will run this vehicle.">
          <div className="grid grid-cols-2 gap-5">
            <Field
              label="GP client"
              required
              hint={
                gpId ? (
                  gpMatchedByLei ? (
                    <span className="inline-flex items-center gap-1 text-positive">
                      <Link2 size={12} /> Matched through GLEIF&apos;s fund-manager link
                    </span>
                  ) : vehicle ? (
                    "Matched by manager name. Please confirm."
                  ) : undefined
                ) : (
                  <>
                    No matching GP client.{" "}
                    <Link href="/admin/fund/gps/new" className="underline">
                      Create one
                    </Link>
                  </>
                )
              }
            >
              <select aria-label="GP client" className={input} value={gpId} onChange={(e) => setGpId(e.target.value)}>
                <option value="">Select…</option>
                {gps.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Display name" required hint="Shown in portals, reports and notices.">
              <input aria-label="Display name" className={input} value={shortName} onChange={(e) => setShortName(e.target.value)} />
            </Field>
            <Field label="Reporting currency" required>
              <select className={input} value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "BRL")}>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </Field>
            <Field label="Strategy">
              <input className={input} placeholder="e.g. Venture capital" value={strategy} onChange={(e) => setStrategy(e.target.value)} />
            </Field>
            <Field label="Vintage year" hint={formationYear ? `Formed in ${formationYear}. The vintage is usually the year of first close, which can differ.` : undefined}>
              <input inputMode="numeric" className={input} placeholder="Year of first close" value={vintage} onChange={(e) => setVintage(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </Field>
          </div>
        </Section>
      )}

      {/* RapidLEI application (no LEI yet) */}
      {manual?.viaRapidLei && !duplicate && (
        <Section n={4} title="Apply for the LEI" desc="RapidLEI issues the LEI; Aurum applies on the GP's behalf." aside={<Pill tone="gold">RapidLEI</Pill>}>
          <p className="text-[13px] text-stone-600">Copy these into a new fund application in RapidLEI. They match what GLEIF will publish, so keep them exactly as on the certificate of formation.</p>
          <dl className="rounded-[3px] border border-stone-200 px-4">
            <CopyRow label="Legal name" value={manual.legalName} />
            <CopyRow label="Entity type" value="Fund" />
            <CopyRow label="Jurisdiction" value={manual.domicile} />
            <CopyRow label="Legal form" value={manual.legalForm} />
            <CopyRow label="Registry number" value={manual.registeredAs} />
            <CopyRow label="Formation date" value={manual.formationDate} />
            <CopyRow label="Registered office" value={manual.address} />
            <CopyRow label="Fund manager" value={gp?.name ?? ""} />
            <CopyRow label="Fund manager LEI" value={gp?.lei ?? ""} />
          </dl>
          {gp && !gp.lei && <Notice tone="warn">{gp.name} has no LEI on file. RapidLEI asks for the fund manager&apos;s LEI, so get or add the GP&apos;s LEI first.</Notice>}
          <p className="text-[12px] text-stone-500">
            Have ready: the certificate of formation, and the GP&apos;s signed authorization for Aurum to apply and renew on its behalf.
          </p>
          <div className="flex flex-wrap items-end gap-3 border-t border-stone-100 pt-5">
            <a href={RAPIDLEI_URL} target="_blank" rel="noreferrer" className="mb-[22px] inline-flex h-10 items-center gap-2 rounded-[3px] bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800">
              Open RapidLEI <ExternalLink size={13} />
            </a>
            <div className="ml-auto flex items-end gap-2">
              <Field label="Issued LEI" hint={leiCheck.state === "pending" ? "Not in GLEIF yet. New LEIs can take up to a day to publish." : leiCheck.state === "invalid" ? "An LEI is 20 characters, ending in two digits." : "Paste it once RapidLEI issues it."}>
                <input aria-label="Issued LEI" className={cx(input, "w-[260px] font-mono uppercase")} maxLength={20} value={manual.lei} onChange={(e) => setManual({ ...manual, lei: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} />
              </Field>
              <Button variant="secondary" className="mb-[22px] h-10" disabled={!manual.lei || leiCheck.state === "checking"} onClick={verifyIssuedLei}>
                {leiCheck.state === "checking" ? <Loader2 size={13} className="animate-spin" /> : null} Verify in GLEIF
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* Economics */}
      {(vehicle || manual) && !duplicate && (
        <Section n={manual?.viaRapidLei ? 5 : 4} title="Economics" desc="Read from the LPA, not typed in.">
          <Notice tone="info">
            Management fee, carry, hurdle, share classes and waterfall are extracted from the LPA by the review agent, with the clause cited for every term, and only take effect
            after two people approve them. Until then the vehicle shows <em>economics pending LPA review</em>.
          </Notice>
          <label className="flex cursor-pointer items-center gap-4 rounded-[3px] border border-dashed border-stone-300 px-5 py-4 hover:border-ink-900">
            <FileUp size={18} className="text-stone-400" />
            <span className="flex-1 text-[13px]">
              {lpa ? (
                <>
                  <strong>{lpa.name}</strong> <span className="text-stone-500">· {lpa.kb} KB · will be queued for review</span>
                </>
              ) : (
                <>
                  <strong>Upload the executed LPA</strong> <span className="text-stone-500">(PDF). You can also do this later.</span>
                </>
              )}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setLpa({ name: f.name, kb: Math.max(1, Math.round(f.size / 1024)) });
              }}
            />
          </label>
        </Section>
      )}

      {(vehicle || manual) && !duplicate && (
        <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-5">
          <ButtonLink variant="ghost" href="/admin/fund/funds">
            Cancel
          </ButtonLink>
          <Button disabled={!ready} onClick={() => setCreated(true)}>
            Create vehicle
          </Button>
        </div>
      )}
    </div>
  );
}
