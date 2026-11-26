"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { candidates, jurisdictionName, treatmentFor, TREATMENT, type Candidate, type Holder, type Kyc } from "@/lib/blockchain/data";
import { chain, useChain } from "@/lib/blockchain/store";
import { btnPrimary, btnSecondary, field, lbl } from "@/components/offering/Forms";
import { Empty, SimBanner, TreatmentPill, n } from "./ui";

const STEPS = ["Company", "What the token is", "Holders", "Rules", "Review"] as const;
type Row = { name: string; kind: Holder["kind"]; country: string; units: string; kyc: Kyc };

const defaultApproval = (c: Candidate) =>
  c.form === "corp"
    ? "Board approval"
    : c.form === "llc"
      ? "Manager’s written consent"
      : c.form === "ltda"
        ? "Consent of the other quota holders (Civil Code art. 1.057)"
        : "Directors’ approval";

/** Tokenize a company the Corporate Solution or the family office already administers. Nothing is issued here. */
export function TokenizeFlow() {
  const d = useChain();
  const router = useRouter();
  const who = usePreviewRole().member.name;
  const list = candidates(d.tokens.map((t) => t.company));
  const [step, setStep] = useState(0);
  const [c, setC] = useState<Candidate | null>(null);
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000");
  const [rows, setRows] = useState<Row[]>([]);
  const [approval, setApproval] = useState("");
  const [rofr, setRofr] = useState(true);
  const [lockup, setLockup] = useState("");
  const [maxHolders, setMaxHolders] = useState("");

  const pick = (x: Candidate) => {
    setC(x);
    setSymbol(
      x.company
        .replace(/[^A-Za-z ]/g, "")
        .split(" ")
        .filter((w) => w.length > 2 && !/^(LLC|Ltd|Ltda|Inc|Corp)$/i.test(w))
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 5) || "TKN",
    );
    setRows(x.holders.map((h) => ({ name: h.name, kind: h.kind, country: h.country, units: String(Math.round((Number(supply) * h.pct) / 100)), kyc: x.kyc })));
    setApproval(defaultApproval(x));
    setStep(1);
  };
  const tr = c ? treatmentFor(c.jurisdiction, c.form) : null;
  const unitWord = c?.form === "ltda" ? "quotas" : c?.form === "llc" ? "units" : "shares";
  const total = rows.reduce((a, r) => a + (Number(r.units) || 0), 0);
  const supplyN = Number(supply) || 0;
  const rowsOk = rows.length > 0 && rows.every((r) => r.name.trim() && Number(r.units) > 0) && total === supplyN;
  const create = () => {
    if (!c) return;
    const id = chain.tokenize(
      {
        symbol: symbol.trim().toUpperCase(),
        company: c.company,
        source: c.key.includes("/") ? { kind: "family", familyId: c.key.split("/")[0], entityId: c.key.split("/")[1] } : { kind: "formation", ref: c.key },
        clientOrg: c.clientOrg,
        jurisdiction: c.jurisdiction,
        jurisdictionName: jurisdictionName(c.jurisdiction),
        form: c.form,
        unitWord,
        supply: supplyN,
        holders: rows.map((r, i) => ({
          id: `h${i}-${r.name
            .toLowerCase()
            .replace(/[^a-z]/g, "")
            .slice(0, 12)}`,
          name: r.name.trim(),
          kind: r.kind,
          country: r.country.trim(),
          kyc: r.kyc,
          wallet: null,
          custody: "Not connected",
          units: Number(r.units),
          frozen: 0,
        })),
        rules: {
          approval: approval.trim(),
          rofr,
          lockupUntil: lockup || undefined,
          blockedCountries: ["Sanctioned jurisdictions"],
          maxHolders: Number(maxHolders) || undefined,
          identityRequired: true,
        },
        incorporated: c.incorporated,
      },
      who,
    );
    router.push(`/admin/blockchain/${id}`);
  };

  return (
    <div className="max-w-[900px]">
      <Link href="/admin/blockchain" className="mt-2 inline-flex items-center gap-1 px-2 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> Tokenized companies
      </Link>
      <PageHead
        eyebrow="Blockchain Solution"
        title="Tokenize a company"
        meta="The owners’ shares, units or quotas become tokens in their own wallets. This prepares the token; issuing comes after the documents are signed and each owner’s identity and wallet are in place."
      />
      <ol className="mb-6 flex flex-wrap gap-x-5 gap-y-2 px-2 text-[12.5px]">
        {STEPS.map((s, i) => (
          <li key={s} className={cx("inline-flex items-center gap-2", i === step ? "font-semibold text-d-text" : i < step ? "text-d-text-2" : "text-d-text-3")}>
            <span
              className={cx(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                i < step ? "border-up-line text-up-ink" : i === step ? "border-d-text" : "border-d-line",
              )}
            >
              {i < step ? <Check size={11} /> : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      {step === 0 &&
        (list.length ? (
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {list.map((x) => {
              const t = treatmentFor(x.jurisdiction, x.form);
              return (
                <li key={x.key}>
                  <button onClick={() => pick(x)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-d-raise">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium text-d-text">{x.company}</span>
                      <span className="block text-[12px] text-d-text-3">
                        {x.client} · {jurisdictionName(x.jurisdiction)} · {x.stage}
                      </span>
                    </span>
                    <TreatmentPill t={t.t} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Every company we administer is already tokenized or being prepared.</Empty>
        ))}

      {step === 1 && c && tr && (
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <div className="text-[12px] text-d-text-3">{c.company}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[16px] font-medium text-d-text">
            {TREATMENT[tr.t].label} <TreatmentPill t={tr.t} />
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-d-text-2">{tr.basis}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-d-text-2">{tr.transferNote}</p>
          {!c.incorporated && (
            <p className="mt-2 text-[12.5px] text-gold-700">The company isn’t incorporated yet ({c.stage}); the token waits for incorporation before it can be issued.</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={lbl}>
              Token symbol
              <input
                value={symbol}
                onChange={(e) =>
                  setSymbol(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6),
                  )
                }
                className={field}
              />
            </label>
            <label className={lbl}>
              {unitWord.charAt(0).toUpperCase() + unitWord.slice(1)} in issue
              <input value={supply} onChange={(e) => setSupply(e.target.value.replace(/[^0-9]/g, ""))} className={field} inputMode="numeric" />
            </label>
          </div>
          <p className="mt-2 text-[11.5px] text-d-text-3">One token for each {unitWord.replace(/s$/, "")} the company has issued, as in its register.</p>
          <Nav back={() => setStep(0)} next={() => setStep(2)} ok={!!symbol && supplyN > 0} />
        </section>
      )}

      {step === 2 && c && (
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <h2 className="text-[13px] font-semibold text-d-text">Holders, as in the company’s register</h2>
          <p className="mt-0.5 text-[12px] text-d-text-3">Identity comes from Compliance; each holder connects their own wallet before issue.</p>
          <div className="mt-3 space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1.6fr)_130px_minmax(0,1fr)_130px_32px] sm:items-end">
                <label className={lbl}>
                  Name
                  <input value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={field} />
                </label>
                <label className={lbl}>
                  Type
                  <select value={r.kind} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, kind: e.target.value as Holder["kind"] } : x)))} className={field}>
                    {(["Individual", "Trust", "Company"] as const).map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className={lbl}>
                  Country
                  <input value={r.country} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, country: e.target.value } : x)))} className={field} />
                </label>
                <label className={lbl}>
                  {unitWord.charAt(0).toUpperCase() + unitWord.slice(1)}
                  <input
                    value={r.units}
                    onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, units: e.target.value.replace(/[^0-9]/g, "") } : x)))}
                    className={field}
                    inputMode="numeric"
                  />
                </label>
                <button
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  aria-label={`Remove ${r.name || "holder"}`}
                  className="mb-1 flex h-8 w-8 items-center justify-center rounded-[7px] text-d-text-3 hover:bg-d-raise hover:text-negative"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRows([...rows, { name: "", kind: "Individual", country: "", units: "", kyc: "Pending" }])}
            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-d-text-2 hover:text-d-text"
          >
            <Plus size={13} /> Add a holder
          </button>
          <p className={cx("tnum mt-3 text-[12.5px]", total === supplyN ? "text-up-ink" : "text-gold-700")}>
            {n(total)} of {n(supplyN)} {unitWord} allocated{total !== supplyN && " — the holders must add up to the units in issue"}
          </p>
          <p className="mt-1 text-[11.5px] text-d-text-3">New holders start with identity pending until Compliance verifies them.</p>
          <Nav back={() => setStep(1)} next={() => setStep(3)} ok={rowsOk} />
        </section>
      )}

      {step === 3 && c && (
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <h2 className="text-[13px] font-semibold text-d-text">Transfer rules from the company’s documents</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={cx(lbl, "sm:col-span-2")}>
              Who approves a transfer
              <input value={approval} onChange={(e) => setApproval(e.target.value)} className={field} />
            </label>
            <label className={lbl}>
              Lock-up until
              <input type="date" value={lockup} onChange={(e) => setLockup(e.target.value)} className={field} />
            </label>
            <label className={lbl}>
              Maximum holders
              <input value={maxHolders} onChange={(e) => setMaxHolders(e.target.value.replace(/[^0-9]/g, ""))} className={field} placeholder="No limit" inputMode="numeric" />
            </label>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-[13px] text-d-text-2">
            <input type="checkbox" checked={rofr} onChange={(e) => setRofr(e.target.checked)} /> Other holders have a right of first refusal
          </label>
          <p className="mt-3 text-[12px] leading-relaxed text-d-text-3">
            Always on: only verified identities can hold the token, no transfers to sanctioned jurisdictions or people, and every transfer goes through a request.
          </p>
          <Nav back={() => setStep(2)} next={() => setStep(4)} ok={!!approval.trim()} />
        </section>
      )}

      {step === 4 && c && tr && (
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <h2 className="text-[13px] font-semibold text-d-text">Review</h2>
          <dl className="mt-2 divide-y divide-d-line-soft text-[13px]">
            {[
              ["Company", `${c.company} · ${jurisdictionName(c.jurisdiction)}`],
              ["The token is", TREATMENT[tr.t].label],
              ["Token", `${symbol} · ${n(supplyN)} ${unitWord}`],
              ["Holders", rows.map((r) => `${r.name} (${n(Number(r.units))})`).join(", ")],
              ["Approval", `${approval}${rofr ? ", after the right of first refusal" : ""}`],
              ["Lock-up", lockup || "None"],
              ["Maximum holders", maxHolders || "No limit"],
              ["Agent", "Aurum Asset Management, as corporate secretary"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 py-2">
                <dt className="w-[34%] shrink-0 text-d-text-3">{k}</dt>
                <dd className="text-d-text">{v}</dd>
              </div>
            ))}
          </dl>
          <SimBanner className="mt-4" />
          <div className="mt-4 flex justify-between gap-2">
            <button onClick={() => setStep(3)} className={btnSecondary}>
              Back
            </button>
            <button onClick={create} className={btnPrimary}>
              Prepare the token
            </button>
          </div>
          <p className="mt-2 text-right text-[11.5px] text-d-text-3">Next: sign the documents, verify identities, connect wallets, then issue.</p>
        </section>
      )}
    </div>
  );
}

function Nav({ back, next, ok }: { back: () => void; next: () => void; ok: boolean }) {
  return (
    <div className="mt-5 flex justify-between gap-2">
      <button onClick={back} className={btnSecondary}>
        Back
      </button>
      <button onClick={next} disabled={!ok} className={btnPrimary}>
        Continue
      </button>
    </div>
  );
}
