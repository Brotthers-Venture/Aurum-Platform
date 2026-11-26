"use client";

import { useState } from "react";
import { ArrowLeftRight, BadgeCheck, FileText, Store, Wallet } from "lucide-react";
import { cx } from "@/components/ui";
import { treatmentFor, TREATMENT, type Holder, type Kyc, type Token, type Transfer } from "@/lib/blockchain/data";
import { chain, useChain } from "@/lib/blockchain/store";
import { Dialog, btnPrimary, btnSecondary, field, lbl } from "@/components/offering/Forms";
import { Address, CompanyMark, Illus, Seg, day, n, usd0, usd2 } from "./ui";
import { TransferDrawer } from "./Transfers";

type Position = { t: Token; h: Holder; role: "Owner" | "Signs for" };

/**
 * The owner's own view: the company shares, units or quotas they hold in their wallet, what they're worth on record,
 * what can move, and the requests in progress. Shown in the client portal, in the firm's or tenant's brand.
 */
export function OwnerWallet({ org, person }: { org: string; person: string }) {
  const d = useChain();
  const [tab, setTab] = useState<"holdings" | "requests" | "history">("holdings");
  const [transfer, setTransfer] = useState<{ p: Position; kind: Transfer["kind"] } | null>(null);
  const [selling, setSelling] = useState<Position | null>(null);
  const [statement, setStatement] = useState<Position | null>(null);
  const [openTr, setOpenTr] = useState<string | null>(null);
  const positions: Position[] = d.tokens
    .filter((t) => t.clientOrg === org && t.status === "Live")
    .flatMap((t) =>
      t.holders.filter((h) => h.name === person || h.signer?.startsWith(person)).map((h) => ({ t, h, role: h.name === person ? ("Owner" as const) : ("Signs for" as const) })),
    );
  const total = positions.reduce((a, p) => a + (p.t.valuation ? p.t.valuation.perUnit * p.h.units : 0), 0);
  const valued = positions.some((p) => p.t.valuation);
  const wallet = positions.find((p) => p.role === "Owner")?.h.wallet ?? positions[0]?.h.wallet ?? null;
  const tokenIds = new Set(positions.map((p) => p.t.id));
  const holderIds = new Set(positions.map((p) => p.h.id));
  const requests = d.transfers.filter((x) => tokenIds.has(x.tokenId) && (holderIds.has(x.fromId) || x.to.name === person));
  const history = d.events.filter(
    (e) => tokenIds.has(e.tokenId) && positions.some((p) => p.h.name === e.to || p.h.name === e.from || e.from?.startsWith(p.h.name) || e.to?.startsWith(p.h.name)),
  );
  const openReq = requests.filter((r) => r.status === "In progress").length;

  if (!positions.length)
    return (
      <div className="rounded-[14px] border border-dashed border-d-line px-6 py-14 text-center text-[13px] text-d-text-3">
        No tokenized holdings yet. When one of your companies is tokenized, its shares appear here, in your own wallet.
      </div>
    );

  return (
    <div className="space-y-6">
      {/* summary */}
      <section className="overflow-hidden rounded-[16px] border border-d-line bg-d-surface">
        <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:px-8">
          <div>
            <div className="text-[12.5px] text-d-text-3">Your company holdings</div>
            <div className="font-display tnum mt-2 text-[44px] font-light leading-none tracking-[-0.025em] text-d-text">{valued ? usd0(total) : `${positions.length}`}</div>
            <div className="mt-2 text-[13px] text-d-text-2">
              {valued ? `Value on record across ${positions.length} holding${positions.length > 1 ? "s" : ""}` : `holding${positions.length > 1 ? "s" : ""} in your wallet`} · not a
              price anyone has offered
            </div>
          </div>
          <div className="rounded-[12px] border border-d-line px-4 py-3.5">
            <div className="flex items-center gap-2 text-[12.5px] text-d-text-3">
              <Wallet size={14} /> Your wallet
            </div>
            <div className="mt-2">
              <Address a={wallet} />
            </div>
            <dl className="mt-3 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-d-text-3">Custody</dt>
                <dd className="text-d-text">You hold the keys</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-d-text-3">Identity</dt>
                <dd className="inline-flex items-center gap-1 text-up-ink">
                  <BadgeCheck size={13} /> Verified
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-d-text-3">If you lose access</dt>
                <dd className="text-right text-d-text">Recoverable after re-verification</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="border-t border-d-line-soft px-6 py-2.5 text-[11.5px] text-d-text-3 md:px-8">Simulation: no blockchain is connected and no real wallet is used.</div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Seg
          label="View"
          value={tab}
          onChange={setTab}
          options={[
            ["holdings", "Holdings"],
            ["requests", openReq ? `Transfer requests · ${openReq}` : "Transfer requests"],
            ["history", "History"],
          ]}
        />
      </div>

      {tab === "holdings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {positions.map((p) => {
            const { t, h } = p;
            const tr = treatmentFor(t.jurisdiction, t.form);
            const avail = h.units - h.frozen;
            return (
              <article key={`${t.id}:${h.id}`} className="flex flex-col rounded-[16px] border border-d-line bg-d-surface">
                <header className="flex items-start gap-3 px-5 pt-5">
                  <CompanyMark t={t} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold leading-snug text-d-text">{t.company}</div>
                    <div className="mt-0.5 text-[12px] text-d-text-3">
                      {t.symbol} · {t.jurisdictionName}
                      {p.role === "Signs for" ? ` · held by ${h.name}` : ""}
                    </div>
                    {p.role === "Signs for" && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-d-text-3">
                        Wallet <Address a={h.wallet} />
                      </div>
                    )}
                  </div>
                  <span title={tr.basis} className="rounded-[6px] border border-d-line px-1.5 py-px text-[11px] text-d-text-2">
                    {TREATMENT[tr.t].short}
                  </span>
                </header>
                <div className="grid grid-cols-2 gap-4 px-5 pt-5">
                  <div>
                    <div className="text-[12px] text-d-text-3">Balance</div>
                    <div className="tnum mt-1 text-[24px] leading-none text-d-text">{n(h.units)}</div>
                    <div className="mt-1 text-[12px] text-d-text-3">
                      {t.unitWord} · {((h.units / t.supply) * 100).toFixed(1)}% of the company
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-d-text-3">Value on record</div>
                    <div className="tnum mt-1 text-[24px] leading-none text-d-text">{t.valuation ? usd0(t.valuation.perUnit * h.units) : "n/a"}</div>
                    <div className="mt-1 text-[12px] text-d-text-3">
                      {t.valuation ? `${usd2(t.valuation.perUnit)} per ${t.unitWord.replace(/s$/, "")}` : "No valuation recorded"}
                    </div>
                  </div>
                </div>
                <div className="px-5 pt-4">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-d-line-soft">
                    <span className="h-full" style={{ width: `${(avail / h.units) * 100}%`, background: "var(--color-up)" }} />
                  </div>
                  <div className="tnum mt-1.5 flex justify-between text-[12px]">
                    <span className="text-d-text-2">{n(avail)} available</span>
                    <span className="text-d-text-3">{h.frozen ? `${n(h.frozen)} held for a transfer` : "None frozen"}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-d-line-soft px-5 py-3.5">
                  <button onClick={() => setTransfer({ p, kind: "Gift" })} disabled={!avail} className={cx(btnSecondary, "h-8 px-3 text-[12.5px]")}>
                    <ArrowLeftRight size={13} /> Transfer
                  </button>
                  <button onClick={() => setSelling(p)} disabled={!avail} className={cx(btnSecondary, "h-8 px-3 text-[12.5px]")}>
                    <Store size={13} /> Sell
                  </button>
                  <button onClick={() => setStatement(p)} className={cx(btnSecondary, "ml-auto h-8 px-3 text-[12.5px]")}>
                    <FileText size={13} /> Holding statement
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "requests" && (
        <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[14px] border border-d-line bg-d-surface">
          {requests.map((r) => {
            const t = d.token(r.tokenId)!;
            const next = r.steps.find((s) => s.state !== "done" && s.state !== "skipped");
            return (
              <li key={r.id}>
                <button onClick={() => setOpenTr(r.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left hover:bg-d-raise">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[13.5px] font-medium text-d-text">
                      {r.kind}: {n(r.units)} {t.unitWord} to {r.to.name} {r.illustrative && <Illus short />}
                    </span>
                    <span className="block text-[12px] text-d-text-3">
                      {t.company} · requested {day(r.requested)}
                    </span>
                  </span>
                  <span className={cx("text-[12.5px]", r.status === "Completed" ? "text-up-ink" : r.status === "Rejected" ? "text-d-text-3" : "text-d-text-2")}>
                    {r.status === "In progress" ? `Waiting: ${next?.label.toLowerCase()}` : r.status}
                  </span>
                </button>
              </li>
            );
          })}
          {!requests.length && <li className="px-5 py-8 text-center text-[12.5px] text-d-text-3">No transfer requests.</li>}
        </ul>
      )}

      {tab === "history" && (
        <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[14px] border border-d-line bg-d-surface">
          {history.map((e) => (
            <li key={e.id} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-[13px]">
              <span className="tnum text-[12px] text-d-text-3">{day(e.at)}</span>
              <span className="text-d-text">
                {e.kind} {e.units ? n(e.units) : ""} {d.token(e.tokenId)?.symbol}
                {e.from ? ` from ${e.from}` : ""}
                {e.to ? ` to ${e.to}` : ""}
              </span>
              <span className="font-mono text-[11px] text-d-text-3" title={`${e.hash} (simulated)`}>
                {e.hash.slice(0, 10)}…
              </span>
            </li>
          ))}
        </ul>
      )}

      {transfer && (
        <TransferDialog
          p={transfer.p}
          kind={transfer.kind}
          person={person}
          onClose={() => setTransfer(null)}
          onDone={(id) => (setTransfer(null), setTab("requests"), setOpenTr(id))}
        />
      )}
      {selling && (
        <SellDialog
          p={selling}
          onClose={() => setSelling(null)}
          onPrivate={() => {
            setTransfer({ p: selling, kind: "Private sale" });
            setSelling(null);
          }}
        />
      )}
      {statement && <Statement p={statement} person={person} onClose={() => setStatement(null)} />}
      {openTr && d.transfers.find((x) => x.id === openTr) && <TransferDrawer tr={d.transfers.find((x) => x.id === openTr)!} onClose={() => setOpenTr(null)} />}
    </div>
  );
}

function TransferDialog({ p, kind: initial, person, onClose, onDone }: { p: Position; kind: Transfer["kind"]; person: string; onClose: () => void; onDone: (id: string) => void }) {
  const { t, h } = p;
  const [kind, setKind] = useState<Transfer["kind"]>(initial);
  const co = t.holders.filter((x) => x.id !== h.id);
  const [toMode, setToMode] = useState<string>(co[0]?.id ?? "new");
  const [name, setName] = useState("");
  const [country, setCountry] = useState(h.country);
  const [units, setUnits] = useState("");
  const u = Number(units) || 0;
  const avail = h.units - h.frozen;
  const existing = co.find((x) => x.id === toMode);
  const to = existing
    ? { name: existing.name, kind: existing.kind, country: existing.country, kyc: existing.kyc, existingId: existing.id }
    : { name: name.trim(), kind: "Individual" as const, country: country.trim(), kyc: "Pending" as Kyc };
  const ok = !!to.name && u > 0 && u <= avail;
  return (
    <Dialog
      title={kind === "Private sale" ? "Sell to a buyer you’ve found" : "Transfer"}
      sub={`${t.company} · ${n(avail)} ${t.unitWord} available. The request goes to ${t.agent.split(",")[0]} and the company for the checks the rules require.`}
      onClose={onClose}
    >
      <div className="space-y-3">
        <label className={lbl}>
          Purpose
          <select value={kind} onChange={(e) => setKind(e.target.value as Transfer["kind"])} className={field}>
            <option>Gift</option>
            <option>Estate planning</option>
            <option>Private sale</option>
          </select>
        </label>
        <label className={lbl}>
          To
          <select value={toMode} onChange={(e) => setToMode(e.target.value)} className={field}>
            {co.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} (already a holder)
              </option>
            ))}
            <option value="new">Someone new</option>
          </select>
        </label>
        {!existing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>
              Their full name
              <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </label>
            <label className={lbl}>
              Country
              <input value={country} onChange={(e) => setCountry(e.target.value)} className={field} />
            </label>
          </div>
        )}
        <label className={lbl}>
          {t.unitWord.charAt(0).toUpperCase() + t.unitWord.slice(1)}
          <input value={units} onChange={(e) => setUnits(e.target.value.replace(/[^0-9]/g, ""))} className={field} inputMode="numeric" placeholder={`Up to ${n(avail)}`} />
        </label>
        <ul className="space-y-1 rounded-[10px] border border-d-line px-3 py-2.5 text-[12.5px] text-d-text-2">
          <li>· {existing ? `${existing.name} is already verified.` : "They’ll be asked to verify their identity with Compliance and connect a wallet."}</li>
          <li>
            · {t.rules.approval}
            {t.rules.rofr ? ", after the other holders’ right of first refusal" : ""}.
          </li>
          <li>· These {t.unitWord} are held on your wallet until the transfer completes or is declined.</li>
          {kind === "Private sale" && <li>· You agree the price and payment with the buyer; Aurum doesn’t handle the money.</li>}
        </ul>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
        <button disabled={!ok} onClick={() => onDone(chain.requestTransfer(t, { kind, fromId: h.id, to, units: u }, person))} className={btnPrimary}>
          Send the request
        </button>
      </div>
    </Dialog>
  );
}

function SellDialog({ p, onClose, onPrivate }: { p: Position; onClose: () => void; onPrivate: () => void }) {
  return (
    <Dialog title={`Sell ${p.t.symbol}`} sub="Two ways to sell, depending on whether you already have a buyer." onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={onPrivate} className="rounded-[12px] border border-d-line p-4 text-left hover:border-d-text-3 hover:bg-d-raise">
          <div className="text-[14px] font-semibold text-d-text">I have a buyer</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-d-text-2">
            You agree the terms with them. We verify the buyer, collect the company’s approval and record the transfer. Available now.
          </p>
        </button>
        <div className="rounded-[12px] border border-dashed border-d-line p-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-d-text-2">
            Find a buyer <span className="rounded-[5px] border border-d-line px-1.5 text-[10.5px] font-normal text-d-text-3">Not connected</span>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-d-text-3">
            Listing for buyers to find requires a licensed venue: a broker-dealer operating an alternative trading system in the US, or a CVM-authorized market in Brazil. It will
            appear here once a partner is connected.
          </p>
        </div>
      </div>
    </Dialog>
  );
}

function Statement({ p, person, onClose }: { p: Position; person: string; onClose: () => void }) {
  const { t, h } = p;
  const tr = treatmentFor(t.jurisdiction, t.form);
  return (
    <Dialog title="Holding statement" sub={`As of ${day("2026-11-24")}`} onClose={onClose} width={600}>
      <div className="rounded-[12px] border border-d-line px-5 py-4">
        <div className="flex items-center gap-3">
          <CompanyMark t={t} size={40} />
          <div>
            <div className="text-[15px] font-semibold text-d-text">{t.company}</div>
            <div className="text-[12px] text-d-text-3">{t.jurisdictionName}</div>
          </div>
        </div>
        <dl className="mt-4 divide-y divide-d-line-soft text-[13px]">
          {[
            ["Holder", h.name],
            ...(p.role === "Signs for" ? [["Signed for by", person]] : []),
            ["Holding", `${n(h.units)} ${t.unitWord} (${((h.units / t.supply) * 100).toFixed(2)}%)`],
            ["Of which frozen", h.frozen ? `${n(h.frozen)}, held for a transfer` : "None"],
            ["Token", `${t.symbol}, held in wallet ${h.wallet ?? "—"}`],
            ["What the token is", TREATMENT[tr.t].label],
            ["Basis", tr.basis],
            ["Register kept by", t.agent],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 py-2">
              <dt className="w-[34%] shrink-0 text-d-text-3">{k}</dt>
              <dd className="min-w-0 break-words text-d-text">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-d-text-3">
        Simulation: the wallet address is simulated.{" "}
        {tr.t === "mirror" ? "The company’s official register is the legal record of your holding." : "Counsel confirms that the token ledger is the record for this company."}
      </p>
    </Dialog>
  );
}
