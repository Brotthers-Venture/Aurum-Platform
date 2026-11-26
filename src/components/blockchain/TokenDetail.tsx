"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, ShieldCheck, Snowflake, Wallet, X } from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { checkTransfer, rulesText, treatmentFor, TREATMENT, type Holder, type Kyc, type Token } from "@/lib/blockchain/data";
import { chain, reconcile, useChain } from "@/lib/blockchain/store";
import { field, lbl } from "@/components/offering/Forms";
import { Address, CompanyMark, Drawer, Empty, Illus, KV, Section, SimBanner, StatusPill, TreatmentPill, day, n, usd0, usd2 } from "./ui";

type Tab = "holders" | "rules" | "documents" | "activity";

export function TokenDetail({ id }: { id: string }) {
  const d = useChain();
  const who = usePreviewRole().member.name;
  const [tab, setTab] = useState<Tab>("holders");
  const [agent, setAgent] = useState<Holder | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const t = d.token(id);
  if (!t)
    return (
      <div className="py-16">
        <Empty>
          No such token.{" "}
          <Link href="/admin/blockchain" className="underline">
            Back
          </Link>
        </Empty>
      </div>
    );
  const tr = treatmentFor(t.jurisdiction, t.form);
  const rec = reconcile(t);
  const diffs = rec.filter((r) => r.diff !== 0);
  const events = d.events.filter((e) => e.tokenId === t.id);
  const transfers = d.transfers.filter((x) => x.tokenId === t.id);
  const block = chain.issueBlock(t);
  const value = t.valuation ? t.valuation.perUnit * t.supply : null;
  const tabs: [Tab, string, number?][] = [
    ["holders", "Holders and register", t.holders.length],
    ["rules", "Rules"],
    ["documents", "Documents", t.documents.length],
    ["activity", "Activity", events.length],
  ];

  return (
    <div>
      <Link href="/admin/blockchain" className="mt-2 inline-flex items-center gap-1 px-2 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> Tokenized companies
      </Link>
      <header className="flex flex-wrap items-start gap-4 px-2 pb-4 pt-3">
        <CompanyMark t={t} size={44} />
        <div className="min-w-0 flex-1 basis-[260px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-d-text">{t.company}</h1>
            <StatusPill s={t.status} />
            <TreatmentPill t={tr.t} />
          </div>
          <div className="mt-1 text-[13px] text-d-text-2">
            {t.symbol} · {n(t.supply)} {t.unitWord} · {t.jurisdictionName} · Agent: {t.agent}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {t.clientOrg && (
            <Link
              href={`/admin/blockchain/${t.id}/owner`}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-d-line px-3.5 text-[13px] font-semibold text-d-text hover:bg-d-raise"
            >
              <Wallet size={14} /> Owner’s view
            </Link>
          )}
          {t.status !== "Live" && (
            <button
              onClick={() => setMsg(chain.issue(t, who))}
              disabled={!!block}
              title={block ?? "Issue the tokens to the holders’ wallets (simulated)"}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-brand px-3.5 text-[13px] font-semibold text-brand-ink hover:opacity-90 disabled:opacity-40"
            >
              Issue tokens
            </button>
          )}
        </div>
      </header>
      {t.status !== "Live" && block && <p className="mx-2 mb-4 rounded-[10px] border border-attn-line px-3.5 py-2.5 text-[12.5px] text-gold-700">Before issuing: {block}</p>}
      {msg && <p className="mx-2 mb-4 text-[12.5px] text-negative">{msg}</p>}

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <div className="text-[12px] text-d-text-3">What the token is</div>
          <div className="mt-1 text-[15px] font-medium text-d-text">{TREATMENT[tr.t].label}</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-d-text-2">{tr.basis}</p>
          <p className="mt-1 text-[12px] text-d-text-3">To be confirmed by counsel for this company.</p>
        </section>
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <div className="flex items-baseline gap-6">
            <div>
              <div className="text-[12px] text-d-text-3">Value per {t.unitWord.replace(/s$/, "")}</div>
              <div className="tnum mt-1 text-[22px] leading-none text-d-text">{t.valuation ? usd2(t.valuation.perUnit) : "n/a"}</div>
            </div>
            <div>
              <div className="text-[12px] text-d-text-3">Company value</div>
              <div className="tnum mt-1 text-[22px] leading-none text-d-text">{value !== null ? usd0(value) : "n/a"}</div>
            </div>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-d-text-3">
            {t.valuation ? `${t.valuation.source}, as of ${day(t.valuation.asOf)}. A record value, not a price anyone has offered.` : "No valuation is recorded for this company."}
          </p>
        </section>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-d-line px-1" role="tablist">
        {tabs.map(([k, l, c]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx("relative h-10 shrink-0 px-3 text-[13px] font-medium", tab === k ? "text-d-text" : "text-d-text-3 hover:text-d-text")}
          >
            {l}
            {c !== undefined && <span className="tnum ml-1.5 text-[11.5px] text-d-text-3">{c}</span>}
            {tab === k && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-d-text" />}
          </button>
        ))}
      </div>

      {tab === "holders" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
            <table className="w-full min-w-[900px] text-[13px]">
              <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
                <tr>
                  {["Holder", "Identity", "Wallet", "Balance", "Frozen", "Available", "Share", ""].map((h, i) => (
                    <th key={h + i} className={cx("px-3 py-2.5 text-left font-medium first:pl-4 last:pr-4", i >= 3 && i <= 6 && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.holders.map((h) => (
                  <tr key={h.id} className="border-b border-d-line-soft last:border-0">
                    <td className="px-3 py-2.5 pl-4">
                      <div className="font-medium text-d-text">{h.name}</div>
                      <div className="text-[12px] text-d-text-3">
                        {h.kind} · {h.country}
                        {h.signer ? ` · signs: ${h.signer}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <KycPill k={h.kyc} />
                    </td>
                    <td className="px-3 py-2.5">
                      {h.wallet ? (
                        <Address a={h.wallet} />
                      ) : (
                        <button
                          onClick={() => chain.connectWallet(t, h.id, who)}
                          disabled={h.kyc !== "Clear"}
                          title={h.kyc !== "Clear" ? "Identity must be verified first" : "Simulates the holder connecting their own wallet"}
                          className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-d-line px-2 text-[12px] text-d-text-2 hover:text-d-text disabled:opacity-40"
                        >
                          <Wallet size={12} /> Connect wallet
                        </button>
                      )}
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-d-text">{n(h.units)}</td>
                    <td className="tnum px-3 py-2.5 text-right text-d-text-2">{h.frozen ? n(h.frozen) : "—"}</td>
                    <td className="tnum px-3 py-2.5 text-right text-d-text">{n(h.units - h.frozen)}</td>
                    <td className="tnum px-3 py-2.5 text-right text-d-text-2">{((h.units / t.supply) * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2.5 pr-4 text-right">
                      {t.status === "Live" && (
                        <button onClick={() => setAgent(h)} className="text-[12px] font-semibold text-d-text-2 hover:text-d-text">
                          Agent actions
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <h2 className="flex-1 text-[13px] font-semibold text-d-text">Token holdings against the official register</h2>
              {t.status === "Live" &&
                (diffs.length ? (
                  <span className="text-[12px] text-gold-700">
                    {diffs.length} difference{diffs.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] text-up-ink">
                    <Check size={12} /> Agrees
                  </span>
                ))}
            </div>
            <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
              <table className="w-full min-w-[620px] text-[13px]">
                <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
                  <tr>
                    <th className="px-3 py-2.5 pl-4 text-left font-medium">Name</th>
                    <th className="px-3 py-2.5 text-right font-medium">{tr.t === "mirror" ? "Official register" : "Register of record"}</th>
                    <th className="px-3 py-2.5 text-right font-medium">On the token</th>
                    <th className="px-3 py-2.5 pr-4 text-left font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.map((r) => {
                    const pending = transfers.find((x) => x.status === "In progress" && (x.to.name === r.name || t.holders.find((h) => h.id === x.fromId)?.name === r.name));
                    return (
                      <tr key={r.name} className="border-b border-d-line-soft last:border-0">
                        <td className="px-3 py-2.5 pl-4 text-d-text">{r.name}</td>
                        <td className="tnum px-3 py-2.5 text-right">{n(r.register)}</td>
                        <td className={cx("tnum px-3 py-2.5 text-right", r.diff ? "text-gold-700" : "text-d-text")}>{n(r.chain)}</td>
                        <td className="px-3 py-2.5 pr-4 text-[12px] text-d-text-3">
                          {r.diff === 0 ? "—" : pending ? "Transfer in progress: the register changed first, the token follows" : "Investigate: no transfer explains it"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-d-text-3">
              {tr.t === "mirror"
                ? "The official register is the legal record; the token must match it."
                : "The token ledger is the record; the register shown is its readable copy."}
              {t.illustrative.includes("holders") && " Holders shown are illustrative until the cap table is confirmed."}
            </p>
          </section>
        </div>
      )}

      {tab === "rules" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
            <h2 className="text-[13px] font-semibold text-d-text">The rules, as the holders read them</h2>
            <ul className="mt-3 space-y-2.5">
              {rulesText(t).map((r) => (
                <li key={r} className="flex gap-2.5 text-[13px] leading-relaxed text-d-text-2">
                  <ShieldCheck size={14} className="mt-[3px] shrink-0 text-d-text-3" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11.5px] text-d-text-3">Taken from the company’s articles, bylaws, operating agreement or contrato social; enforced on every transfer.</p>
          </section>
          <TransferTester t={t} />
        </div>
      )}

      {tab === "documents" && (
        <ul className="max-w-[760px] divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
          {t.documents.map((doc) => (
            <li key={doc.name} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 text-[13px] text-d-text">{doc.name}</span>
              <span className={cx("text-[12px]", doc.status === "Signed" || doc.status === "Filed" ? "text-up-ink" : "text-d-text-3")}>{doc.status}</span>
              {doc.status !== "Signed" && doc.status !== "Filed" && t.status !== "Live" && (
                <button
                  onClick={() => chain.signDocument(t, doc.name, who)}
                  className="text-[12px] font-semibold text-d-text-2 hover:text-d-text"
                  title="Records the signed document as evidence (simulated)"
                >
                  Record as signed
                </button>
              )}
            </li>
          ))}
          {t.illustrative.includes("documents") && <li className="px-4 py-2 text-[11.5px] text-d-text-3">Document statuses are illustrative.</li>}
        </ul>
      )}

      {tab === "activity" && (
        <div className="max-w-[920px]">
          <SimBanner className="mb-3" />
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {events.map((e) => (
              <li key={e.id} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-2.5 text-[13px]">
                <span className="tnum text-[12px] text-d-text-3">{day(e.at)}</span>
                <span className="min-w-0">
                  <span className="text-d-text">
                    {e.kind}
                    {e.units ? ` ${n(e.units)} ${t.unitWord}` : ""}
                    {e.from ? ` from ${e.from}` : ""}
                    {e.to ? ` to ${e.to}` : ""}
                  </span>
                  <span className="block text-[11.5px] text-d-text-3">
                    By {e.by} · block {n(e.block)} (simulated)
                  </span>
                </span>
                <span className="font-mono text-[11px] text-d-text-3" title={`${e.hash} (simulated)`}>
                  {e.hash.slice(0, 10)}…
                </span>
              </li>
            ))}
            {!events.length && <li className="px-4 py-6 text-center text-[12.5px] text-d-text-3">Nothing issued yet.</li>}
          </ul>
        </div>
      )}

      {agent && <AgentDrawer t={t} h={t.holders.find((x) => x.id === agent.id) ?? agent} onClose={() => setAgent(null)} />}
    </div>
  );
}

export function KycPill({ k }: { k: Kyc }) {
  return (
    <span
      className={cx(
        "inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]",
        k === "Clear" ? "border-up-line text-up-ink" : "border-attn-line text-gold-700",
      )}
    >
      {k === "Clear" ? "Verified" : `KYC ${k.toLowerCase()}`}
    </span>
  );
}

/** "Would this transfer go through?" — every rule answers, in words. */
function TransferTester({ t }: { t: Token }) {
  const [from, setFrom] = useState(t.holders[0]?.id ?? "");
  const [to, setTo] = useState("");
  const [country, setCountry] = useState("United States");
  const [kyc, setKyc] = useState<Kyc>("Clear");
  const [wallet, setWallet] = useState(true);
  const [approved, setApproved] = useState(false);
  const [units, setUnits] = useState("1000");
  const existing = t.holders.find((h) => h.name === to);
  const checks = checkTransfer(t, from, { name: to || "The recipient", country, kyc, existingId: existing?.id, walletConnected: wallet }, Number(units) || 0, approved);
  const ok = checks.every((c) => c.pass);
  return (
    <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
      <h2 className="text-[13px] font-semibold text-d-text">Test a transfer</h2>
      <p className="mt-0.5 text-[12px] text-d-text-3">Nothing moves: this only shows what the rules would say.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          From
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={field}>
            {t.holders.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          {t.unitWord.charAt(0).toUpperCase() + t.unitWord.slice(1)}
          <input value={units} onChange={(e) => setUnits(e.target.value.replace(/[^0-9]/g, ""))} className={field} inputMode="numeric" />
        </label>
        <label className={lbl}>
          To
          <input value={to} onChange={(e) => setTo(e.target.value)} className={field} placeholder="Recipient’s name" />
        </label>
        <label className={lbl}>
          Recipient’s country
          <input value={country} onChange={(e) => setCountry(e.target.value)} className={field} />
        </label>
        <label className={lbl}>
          Recipient’s identity
          <select value={kyc} onChange={(e) => setKyc(e.target.value as Kyc)} className={field}>
            <option value="Clear">Verified</option>
            <option value="Pending">KYC pending</option>
            <option value="Needs info">KYC needs information</option>
          </select>
        </label>
        <div className="flex flex-col justify-end gap-1.5 pb-1 text-[12.5px] text-d-text-2">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={wallet} onChange={(e) => setWallet(e.target.checked)} /> Wallet connected
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /> Company approval on file
          </label>
        </div>
      </div>
      <div className={cx("mt-4 rounded-[10px] border px-3.5 py-2.5 text-[13px] font-medium", ok ? "border-up-line text-up-ink" : "border-attn-line text-gold-700")}>
        {ok ? "This transfer would go through." : "This transfer would be refused."}
      </div>
      <ul className="mt-2 divide-y divide-d-line-soft">
        {checks.map((c) => (
          <li key={c.rule} className="flex gap-2.5 py-2 text-[12.5px]">
            <span className={cx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", c.pass ? "text-up-ink" : "text-gold-700")}>
              {c.pass ? <Check size={13} /> : <X size={13} />}
            </span>
            <span>
              <span className="font-medium text-d-text">{c.rule}.</span> <span className="text-d-text-2">{c.reason}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Freeze, unfreeze and recovery: each needs a reason and is written to the audit log. */
function AgentDrawer({ t, h, onClose }: { t: Token; h: Holder; onClose: () => void }) {
  const who = usePreviewRole().member.name;
  const [units, setUnits] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const u = Number(units) || 0;
  const act = (f: () => void, text: string) => {
    f();
    setDone(text);
    setUnits("");
    setReason("");
  };
  return (
    <Drawer onClose={onClose} kicker={`Agent actions · ${t.symbol}`} title={h.name}>
      <Section>
        <KV
          rows={[
            ["Wallet", <Address key="a" a={h.wallet} />],
            ["Balance", `${n(h.units)} ${t.unitWord}`],
            ["Frozen", h.frozen ? n(h.frozen) : "None"],
            ["Identity", <KycPill key="k" k={h.kyc} />],
            ["Agent", t.agent],
          ]}
        />
      </Section>
      <Section title="Freeze or unfreeze">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={lbl}>
            {t.unitWord.charAt(0).toUpperCase() + t.unitWord.slice(1)}
            <input value={units} onChange={(e) => setUnits(e.target.value.replace(/[^0-9]/g, ""))} className={field} inputMode="numeric" />
          </label>
          <label className={lbl}>
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} className={field} placeholder="Required, kept in the audit log" />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            disabled={!u || !reason.trim() || u > h.units - h.frozen}
            onClick={() => act(() => chain.freeze(t, h.id, u, reason.trim(), who), `Froze ${n(u)} ${t.unitWord}.`)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise disabled:opacity-40"
          >
            <Snowflake size={13} /> Freeze
          </button>
          <button
            disabled={!u || !reason.trim() || u > h.frozen}
            onClick={() => act(() => chain.freeze(t, h.id, -u, reason.trim(), who), `Unfroze ${n(u)} ${t.unitWord}.`)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise disabled:opacity-40"
          >
            Unfreeze
          </button>
        </div>
      </Section>
      <Section title="Lost wallet">
        <p className="text-[12.5px] leading-relaxed text-d-text-2">
          Moves the whole balance to a new wallet bound to the same verified identity. Use only after Compliance has re-verified the holder and the company has approved.
        </p>
        <button
          disabled={!reason.trim() || h.kyc !== "Clear"}
          onClick={() => act(() => chain.recover(t, h.id, reason.trim(), who), "Recovered to a new wallet (simulated).")}
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise disabled:opacity-40"
        >
          <Lock size={13} /> Recover to a new wallet
        </button>
        <p className="mt-1.5 text-[11.5px] text-d-text-3">Needs a reason above.</p>
      </Section>
      {done && <p className="rounded-[8px] border border-up-line px-3 py-2 text-[12.5px] text-up-ink">{done} Recorded in the activity and the audit log.</p>}
      <p className="mt-4 text-[11.5px] leading-relaxed text-d-text-3">
        In production these actions are signed by the agent’s key held with a custody provider, never in the application, and need a second approver. <Illus short />
      </p>
      <Link href="/admin/blockchain/transfers" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-d-text-2 hover:text-d-text">
        Transfers desk <ArrowRight size={12} />
      </Link>
    </Drawer>
  );
}
