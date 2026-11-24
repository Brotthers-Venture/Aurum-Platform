"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, CircleCheck, Copy, ExternalLink, Link2, Loader2, Search, X } from "lucide-react";
import { Button, ButtonLink, cx } from "@/components/ui";
import { DataRoom, LpaUpload } from "@/components/fund/DataRoom";
import { currentFiles, type RoomFile } from "@/lib/corporateDocs";
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

/** Short words that are ordinary words, not acronyms, when title-casing GLEIF's upper-case names. */
const SMALL_WORDS = new Set(["of", "and", "the", "for", "inc", "ltd", "co", "de", "da", "do", "dos", "das", "del", "e", "em", "no", "na", "com", "y", "la", "le", "on", "at", "in", "to"]);
/** GLEIF stores names in capitals; show them in title case but keep acronyms (STX, LP, LLC, II) intact. */
const titleCase = (s: string) =>
  s === s.toUpperCase()
    ? s
        .toLowerCase()
        .replace(/[a-z0-9]+/g, (w, i: number) => {
          if (/^[ivx]+$/.test(w) && w.length <= 4) return w.toUpperCase(); // roman numerals
          if (w.length <= 3 && !SMALL_WORDS.has(w)) return w.toUpperCase(); // STX, LP, LLC, SPV, FIP
          if (SMALL_WORDS.has(w) && i > 0 && !["inc", "ltd", "co"].includes(w)) return w;
          return w[0].toUpperCase() + w.slice(1);
        })
    : s

function Section({ n, title, desc, aside, children }: { n: number; title: string; desc?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[4px] border border-stone-200 bg-white">
      <header className="flex items-center gap-4 border-b border-stone-200 px-6 py-3.5">
        <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-900 text-[11px] font-semibold">{n}</span>
        <div className="flex-1">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          {desc && <p className="text-[12px] text-stone-500">{desc}</p>}
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

function Fact({ label, children, mono, wide }: { label: string; children: ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div className={cx("min-w-0", wide && "col-span-2")}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-500">{label}</dt>
      <dd className={cx("mt-1 text-[13px] text-ink-900", mono && "font-mono text-[12.5px]")}>{children}</dd>
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
          <Pill tone={r.fundLike ? "gold" : "muted"}>{r.fundLike ? "Fund" : "Entity"}</Pill>
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
  const [docs, setDocs] = useState<RoomFile[]>([]);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
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
        const res = await fetch(`/api/gleif/search?q=${encodeURIComponent(term)}`);
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
  }, [q]);

  const pick = async (lei: string) => {
    setLoadingLei(lei);
    setError(null);
    try {
      const known = gps.map((g) => g.lei).filter(Boolean).join(",");
      const res = await fetch(`/api/gleif/record?lei=${lei}${known ? `&match=${known}` : ""}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json as GleifDetail;
      setDetail(d);
      setCapturedAt(new Date().toISOString());
      setManual(null);
      if (d.fundLike) {
        // Match the GP: GLEIF fund-manager LEI, then a GP sharing the principal office, then manager name / mail routing.
        const byLei = (d.fundManager && gps.find((g) => g.lei && g.lei === d.fundManager!.lei)) || (d.addressMatch && gps.find((g) => g.lei === d.addressMatch));
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
    setDocs([]);
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

  const isManager = detail && !detail.fundLike;
  const vehicle = detail && !isManager ? detail : null;
  const legalName = vehicle ? titleCase(vehicle.legalName) : (manual?.legalName ?? "");
  const selectedGpLei = gps.find((g) => g.id === gpId)?.lei;
  const gpMatchedByLei = Boolean(vehicle?.fundManager && selectedGpLei === vehicle.fundManager.lei);
  const gpMatchedByOffice = Boolean(!vehicle?.fundManager && vehicle?.addressMatch && selectedGpLei === vehicle.addressMatch);

  const duplicate = useMemo(() => {
    const n = norm(legalName);
    return funds.find((f) => (vehicle && f.lei === vehicle.lei) || (n && norm(f.name) === n));
  }, [legalName, vehicle]);

  const manualOk = manual && manual.legalName && manual.domicile && (!manual.viaRapidLei || (manual.formationDate && manual.registeredAs && manual.address));
  const ready = (vehicle || manualOk) && gpId && shortName && !duplicate;
  const gp = gps.find((g) => g.id === gpId);
  const roomFiles = currentFiles(docs);
  const lpaFile = roomFiles.find((d) => d.type === "lpa");

  if (created) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="rounded-[4px] border border-stone-200 bg-white p-8">
          <CircleCheck className="text-positive" size={28} />
          <h1 className="mt-4 text-[22px] font-semibold">{legalName} is set up</h1>
          <p className="mt-1 text-[13px] text-stone-600">{gp?.name} · economics pending LPA review</p>
          <dl className="mt-6 border-t border-stone-200 pt-2">
            <Row label="LEI" mono={Boolean(vehicle)}>{vehicle ? vehicle.lei : manual?.viaRapidLei ? "Requested via RapidLEI" : "—"}</Row>
            <Row label="Domicile">{vehicle?.jurisdictionLabel ?? manual?.domicile}</Row>
            <Row label="Currency">{currency}</Row>
            <Row label="Data room">{roomFiles.length} file{roomFiles.length === 1 ? "" : "s"}</Row>
            <Row label="LPA review">{lpaFile ? `${lpaFile.title} · queued` : "Awaiting LPA"}</Row>
          </dl>
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
    <div className="space-y-5">
      <div>
        <Link href="/admin/fund/funds" className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-ink-900">
          <ArrowLeft size={13} /> Funds
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight">New vehicle</h1>
      </div>

      {/* 1 — Find */}
      <Section
        n={1}
        title="Find in GLEIF"
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
                  placeholder="Legal name, manager or LEI"
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

            </div>

            {error && <Notice tone="warn">{error}</Notice>}

            {results && !error && (
              <div className="rounded-[3px] border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-stone-500">
                  <span>
                    {total} result{total === 1 ? "" : "s"}
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
                  <p className="px-4 py-6 text-center text-[13px] text-stone-500">No match</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-1 text-[12px]">
              <span className="mr-1 text-stone-500">No LEI?</span>
              <Button variant="ghost" size="sm" onClick={() => setManual(blankManual(false))}>
                Enter manually
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setManual({ ...blankManual(true), legalName: q.trim().length >= 3 && !/^[A-Z0-9]{18}[0-9]{2}$/i.test(q.trim()) ? q.trim() : "" })}>
                Create LEI with RapidLEI
              </Button>
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
            {detail!.managedFunds.length > 0 && <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-stone-500">Funds it manages</p>}
            {detail!.managedFunds.length ? (
              <ul className="divide-y divide-stone-100 rounded-[3px] border border-stone-200">
                {detail!.managedFunds.map((r) => (
                  <ResultRow key={r.lei} r={r} onPick={() => pick(r.lei)} />
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-stone-500">
                Not a fund in GLEIF.{" "}
                <button type="button" className="font-semibold text-ink-900 underline underline-offset-2" onClick={() => setDetail({ ...detail!, fundLike: true })}>
                  Use as vehicle
                </button>
              </p>
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
                <div className="mt-0.5 text-[12px] text-stone-500">{manual?.viaRapidLei ? "LEI via RapidLEI" : "No LEI"}</div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* 2 — Legal identity */}
      {(vehicle || manual) && (
        <Section n={2} title="Legal identity">
          {vehicle ? (
            <>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4">
                <Fact label="Legal name" wide>{legalName}</Fact>
                <Fact label="Legal form">{vehicle.legalFormName ?? "—"}</Fact>
                <Fact label="Domicile">{vehicle.jurisdictionLabel}</Fact>
                <Fact label="Registry no." mono>{vehicle.registeredAs ?? "—"}</Fact>
                <Fact label="Formed">{vehicle.creationDate ? date(vehicle.creationDate) : "—"}</Fact>
                <Fact label="LEI status">
                  <span className="inline-flex items-center gap-2">
                    <Pill tone={vehicle.registrationStatus === "ISSUED" ? "ok" : "warn"}>{vehicle.registrationStatus}</Pill>
                    {vehicle.nextRenewal && <span className="text-[12px] text-stone-500">to {date(vehicle.nextRenewal)}</span>}
                  </span>
                </Fact>
                <Fact label="Fund manager">{vehicle.fundManager ? titleCase(vehicle.fundManager.legalName) : <span className="text-stone-400">Not reported</span>}</Fact>
                <Fact label="Registered office" wide>{formatAddress(vehicle.legalAddress)}</Fact>
                <Fact label="Principal office" wide>{formatAddress(vehicle.hqAddress)}</Fact>
              </dl>
              {vehicle.registrationStatus !== "ISSUED" && (
                <Notice tone="warn">
                  LEI {vehicle.registrationStatus?.toLowerCase()}.{" "}
                  <a href={RAPIDLEI_URL} target="_blank" rel="noreferrer" className="font-semibold underline">
                    Renew in RapidLEI
                  </a>
                </Notice>
              )}
              {vehicle.entityStatus !== "ACTIVE" && <Notice tone="warn">Entity {vehicle.entityStatus?.toLowerCase()} in GLEIF.</Notice>}
              {(vehicle.category !== "FUND" || !vehicle.fundManager) && (
                <Notice tone="info">
                  GLEIF: {[vehicle.category !== "FUND" && "registered as entity, not fund", !vehicle.fundManager && "no fund manager"].filter(Boolean).join(" · ")}.{" "}
                  <a href={RAPIDLEI_URL} target="_blank" rel="noreferrer" className="font-semibold text-ink-900 underline">
                    Update in RapidLEI
                  </a>
                </Notice>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
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
              <Field label="Registry number" required={manual!.viaRapidLei}>
                <input className={input} value={manual!.registeredAs} onChange={(e) => setManual({ ...manual!, registeredAs: e.target.value })} />
              </Field>
              <Field label="Registered office" required={manual!.viaRapidLei}>
                <input className={input} placeholder="Registered agent address" value={manual!.address} onChange={(e) => setManual({ ...manual!, address: e.target.value })} />
              </Field>
            </div>
          )}
          {duplicate && (
            <Notice tone="warn">
              Already administered: <strong>{duplicate.name}</strong>.{" "}
              <Link className="font-semibold underline" href={`/admin/fund/funds/${duplicate.id}?tab=records`}>
                Open data room
              </Link>
            </Notice>
          )}
        </Section>
      )}

      {/* 3 — Administration */}
      {(vehicle || manual) && !duplicate && (
        <Section n={3} title="Administration">
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-5">
            <Field
              label="GP client"
              required
              hint={
                gpId ? (
                  gpMatchedByLei ? (
                    <span className="inline-flex items-center gap-1 text-positive">
                      <Link2 size={12} /> Matched via GLEIF
                    </span>
                  ) : gpMatchedByOffice ? (
                    "Matched by office · confirm"
                  ) : vehicle ? (
                    "Matched by name · confirm"
                  ) : undefined
                ) : (
                  <>
                    <Link href="/admin/fund/gps/new" className="underline">
                      New GP client
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
            <Field label="Display name" required>
              <input aria-label="Display name" className={input} value={shortName} onChange={(e) => setShortName(e.target.value)} />
            </Field>
            <Field label="Currency" required>
              <select className={input} value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "BRL")}>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </Field>
            <Field label="Strategy">
              <input className={input} placeholder="e.g. Venture capital" value={strategy} onChange={(e) => setStrategy(e.target.value)} />
            </Field>
            <Field label="Vintage">
              <input inputMode="numeric" className={input} placeholder="Year of first close" value={vintage} onChange={(e) => setVintage(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </Field>
          </div>
        </Section>
      )}

      {/* RapidLEI application (no LEI yet) */}
      {manual?.viaRapidLei && !duplicate && (
        <Section n={4} title="Apply for LEI · RapidLEI">
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
          {gp && !gp.lei && <Notice tone="warn">{gp.name} has no LEI on file.</Notice>}
          <div className="flex flex-wrap items-end gap-3 border-t border-stone-100 pt-5">
            <a href={RAPIDLEI_URL} target="_blank" rel="noreferrer" className="mb-[22px] inline-flex h-10 items-center gap-2 rounded-[3px] bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800">
              Open RapidLEI <ExternalLink size={13} />
            </a>
            <div className="ml-auto flex items-end gap-2">
              <Field label="Issued LEI" hint={leiCheck.state === "pending" ? "Not in GLEIF yet (can take a day)" : leiCheck.state === "invalid" ? "Invalid LEI" : " "}>
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
        <Section n={manual?.viaRapidLei ? 5 : 4} title="Economics">
          <LpaUpload files={docs} onChange={setDocs} />
        </Section>
      )}

      {/* Data room */}
      {(vehicle || manual) && !duplicate && (
        <Section n={manual?.viaRapidLei ? 6 : 5} title="Data room">
          <DataRoom files={docs} onChange={setDocs} gleif={vehicle && capturedAt ? { lei: vehicle.lei, capturedAt } : null} />
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
