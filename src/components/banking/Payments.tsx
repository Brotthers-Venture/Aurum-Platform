"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Circle, PhoneCall, Plus } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { PEOPLE, TODAY, accountById, entityById, personById, policyFor, railFor, tierFor, type Payment, type Tier } from "@/lib/banking/data";
import { approvalStatus, bank, entityRows, useBanking, type BankData } from "@/lib/banking/store";
import { money } from "@/lib/format";
import { Amt, BankBanner, Dialog, Drawer, EntityMark, Illus, KV, PayPill, RailTag, Section, btnPrimary, btnSecondary, card, day, field, lbl, td, th, tr, useFlash } from "./ui";

const VIEWS = [
  ["approve", "To approve"],
  ["release", "To release"],
  ["hold", "On hold"],
  ["scheduled", "Scheduled"],
  ["done", "Sent and settled"],
  ["draft", "Drafts"],
  ["all", "All"],
] as const;
type View = (typeof VIEWS)[number][0];
const inView = (v: View, p: Payment) =>
  v === "all" ||
  (v === "approve" && p.state === "Pending approval") ||
  (v === "release" && p.state === "Pending release") ||
  (v === "hold" && p.state === "On hold") ||
  (v === "scheduled" && p.state === "Scheduled") ||
  (v === "done" && (p.state === "Sent" || p.state === "Settled")) ||
  (v === "draft" && p.state === "Draft");

/** Every payment by stage: prepare, approve under the entity's policy, release, send. */
export function PaymentsDesk() {
  const d = useBanking();
  const params = useSearchParams();
  const router = useRouter();
  const view = (VIEWS.find(([k]) => k === params.get("view"))?.[0] ?? "approve") as View;
  const open = params.get("id");
  const [creating, setCreating] = useState(false);
  const rows = d.payments.filter((p) => inView(view, p));
  const setParam = (k: string, v: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (v) q.set(k, v);
    else q.delete(k);
    router.replace(`/admin/banking/payments?${q.toString()}`, { scroll: false });
  };
  const runs = [...new Set(rows.filter((p) => p.runId).map((p) => p.runId!))];

  return (
    <div>
      <PageHead
        eyebrow="Banking Solution"
        title="Payments"
        meta="The person who prepares a payment cannot approve or release it. Approvals follow each entity’s policy; a separate release sends the payment to the bank."
        action={
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus size={15} /> New payment
          </button>
        }
      />
      <BankBanner className="mb-4" />
      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-d-line" role="tablist" aria-label="Payment stage">
        {VIEWS.map(([k, label]) => {
          const n = d.payments.filter((p) => inView(k, p)).length;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={view === k}
              onClick={() => setParam("view", k)}
              className={cx(
                "-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px]",
                view === k ? "border-[var(--d-accent)] font-semibold text-d-text" : "border-transparent text-d-text-3 hover:text-d-text",
              )}
            >
              {label}
              {k !== "all" && n > 0 && <span className="tnum rounded-full bg-d-raise px-1.5 text-[11px] font-semibold text-d-text-2">{n}</span>}
            </button>
          );
        })}
      </div>

      {runs.map((runId) => (
        <RunBar key={runId} runId={runId} d={d} />
      ))}

      <section className={card}>
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-d-text-3">Nothing here. {view === "approve" ? "No payment is waiting for an approval." : ""}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-[13px]">
              <thead className="border-b border-d-line">
                <tr>
                  <th className={th}>Payment</th>
                  <th className={th}>From</th>
                  <th className={th}>Payee</th>
                  <th className={th}>Rail</th>
                  <th className={th}>Value date</th>
                  <th className={cx(th, "text-right")}>Amount</th>
                  <th className={th}>Status</th>
                  <th className={th}>Waiting for</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const a = accountById(p.fromAccountId)!;
                  const st = approvalStatus(p);
                  const waiting =
                    p.state === "Pending approval"
                      ? st.waitingFor
                      : p.state === "Pending release"
                        ? `Release by ${(st.policy?.releasers ?? []).map((id) => personById(id)!.name).join(" or ")}`
                        : p.state === "On hold"
                          ? "Payee callback"
                          : p.state === "Draft"
                            ? "Submission"
                            : "—";
                  return (
                    <tr key={p.id} className={cx(tr, "cursor-pointer")} onClick={() => setParam("id", p.id)}>
                      <td className={td}>
                        <span className="block font-medium text-d-text">{p.ref}</span>
                        <span className="block max-w-[260px] truncate text-[12px] text-d-text-3">{p.purpose?.label ?? p.memo}</span>
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-2.5">
                          <EntityMark id={a.entityId} size={26} />
                          <span className="min-w-0">
                            <span className="block truncate text-d-text">{entityById(a.entityId)!.short}</span>
                            <span className="block text-[12px] text-d-text-3">
                              {a.name} ··{a.mask}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className={cx(td, "text-d-text")}>
                        <span className="flex items-center gap-2">
                          {d.payee(p.payeeId)?.name}
                          {d.payee(p.payeeId)?.state !== "Verified" && <AlertTriangle size={13} className="text-negative" aria-label="Payee not confirmed" />}
                        </span>
                      </td>
                      <td className={td}>
                        <RailTag r={p.rail} />
                      </td>
                      <td className={cx(td, "tnum whitespace-nowrap text-d-text-2")}>{p.date === TODAY ? "Today" : day(p.date)}</td>
                      <td className={cx(td, "text-right font-medium text-d-text")}>
                        <Amt v={p.amount} ccy={p.currency} />
                      </td>
                      <td className={td}>
                        <PayPill s={p.state} />
                      </td>
                      <td className={cx(td, "max-w-[220px] text-[12px] text-d-text-2")}>{waiting}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {open && d.payment(open) && <PaymentDrawer p={d.payment(open)!} d={d} onClose={() => setParam("id", null)} />}
      {creating && <NewPayment onClose={() => setCreating(false)} onCreated={(id) => setParam("id", id)} />}
    </div>
  );
}

function RunBar({ runId, d }: { runId: string; d: BankData }) {
  const items = d.payments.filter((p) => p.runId === runId);
  const { flash, node } = useFlash();
  const first = items[0];
  const total = items.reduce((a, p) => a + p.amount, 0);
  const drafts = items.filter((p) => p.state === "Draft");
  const toRelease = items.filter((p) => p.state === "Pending release");
  const preparer = first.trail.find((t) => t.kind === "Prepared")?.who ?? "";
  const releaser = (policyFor(accountById(first.fromAccountId)!.entityId)?.releasers ?? []).map((id) => personById(id)!.name).find((n) => n !== preparer);
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[12px] border border-d-line bg-d-surface px-4 py-3 text-[13px]">
      <span className="min-w-0">
        <span className="block font-semibold text-d-text">{first.purpose?.label ?? "Payment run"}</span>
        <span className="block text-[12px] text-d-text-3">
          {items.length} payments from {entityById(accountById(first.fromAccountId)!.entityId)!.short} · value date {day(first.date)}
        </span>
      </span>
      <span className="tnum font-medium text-d-text">
        <Amt v={total} ccy={first.currency} />
      </span>
      <span className="ml-auto flex gap-2">
        {drafts.length > 0 && (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              drafts.forEach((p) => bank.submit(p.id, preparer));
              flash({ ok: true, message: `${drafts.length} payments sent for approval as one run.` });
            }}
          >
            Submit the run for approval
          </button>
        )}
        {toRelease.length > 0 && releaser && (
          <button type="button" className={btnPrimary} onClick={() => flash(bank.releaseRun(runId, releaser))}>
            Release {toRelease.length} as {releaser}
          </button>
        )}
      </span>
      {node}
    </div>
  );
}

function tierText(t: Tier, ccy: Payment["currency"], tiers: Tier[] = [t]) {
  const i = tiers.findIndex((x) => x.upTo === t.upTo && x.approvals === t.approvals && x.clientRequired === t.clientRequired);
  const prev = i > 0 ? tiers[i - 1].upTo : null;
  const lim = t.upTo !== null ? `Up to ${money(t.upTo, ccy)}` : prev !== null ? `Over ${money(prev, ccy)}` : "Any amount";
  return `${lim}: ${t.approvals === 1 ? "one approval" : `${t.approvals} approvals`}${t.clientRequired ? ", including a client signatory" : ""}`;
}

export function PaymentDrawer({ p, d, onClose }: { p: Payment; d: BankData; onClose: () => void }) {
  const a = d.account(p.fromAccountId)!;
  const e = entityById(a.entityId)!;
  const payee = d.payee(p.payeeId)!;
  const st = approvalStatus(p);
  const rail = railFor(a, payee, p.amount);
  const { flash, node } = useFlash();
  const [who, setWho] = useState(st.eligible[0] ?? "");
  const releasers = (st.policy?.releasers ?? []).map((id) => personById(id)!.name).filter((n) => n !== st.maker);
  const [rel, setRel] = useState(releasers[0] ?? "");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const row = entityRows(d).find((r) => r.e.id === e.id);
  const short = p.amount > a.balance;
  const covered = row && a.balance + row.expected >= p.amount;
  const pick = who && st.eligible.includes(who) ? who : (st.eligible[0] ?? "");

  return (
    <Drawer
      title={payee.name}
      kicker={
        <span className="flex items-center gap-2">
          {p.ref} <PayPill s={p.state} />
        </span>
      }
      onClose={onClose}
      width={500}
    >
      <div className="fig text-[30px] leading-none text-d-text">
        <Amt v={p.amount} ccy={p.currency} />
      </div>
      <p className="mt-1.5 text-[12.5px] text-d-text-2">{p.memo}</p>
      {p.illustrative && (
        <div className="mt-2">
          <Illus />
        </div>
      )}

      <Section title="Payment" className="mt-5">
        <KV
          rows={[
            ["From", `${e.name} · ${a.name} ··${a.mask}`],
            ["To", `${payee.name} · ${payee.bank} ··${payee.mask}`],
            [
              "Rail",
              <span key="r" className="flex flex-wrap items-center gap-2">
                <RailTag r={p.rail} /> <span className="text-d-text-3">{rail.speed}</span>
              </span>,
            ],
            ["Why this rail", rail.why],
            ...(rail.cutoff ? ([["Cutoff", rail.cutoff]] as [string, string][]) : []),
            ["Value date", p.date === TODAY ? "Today" : day(p.date)],
            ...(p.purpose ? ([["Pays", p.purpose.label]] as [string, string][]) : []),
          ]}
        />
      </Section>

      {["Draft", "Pending approval", "Pending release", "On hold"].includes(p.state) && short && (
        <div className={cx("mb-5 rounded-[10px] border px-3.5 py-2.5 text-[12.5px] leading-relaxed", covered ? "border-attn-line text-d-text-2" : "border-neg-line text-negative")}>
          <b className="font-semibold">Balance today {money(a.balance, a.currency)}.</b>{" "}
          {covered && row?.expected
            ? `Covered once the ${money(row.expected, a.currency)} still owed on the capital call arrives${row.expectedBy ? ` (due ${day(row.expectedBy)})` : ""}. Release on or after the value date.`
            : "Not enough to send this payment; fund the account first."}
        </div>
      )}

      <Section title="Approval">
        {st.tier && (
          <p className="mb-2.5 text-[12px] text-d-text-3">
            {tierText(st.tier, p.currency, st.policy?.tiers)} · policy of {e.short}
          </p>
        )}
        <ol className="space-y-2">
          <Stepline done label={`Prepared by ${st.maker}`} at={p.trail.find((t) => t.kind === "Prepared")?.at} />
          {Array.from({ length: Math.max(st.needed, st.approvedBy.length) }).map((_, i) => {
            const name = st.approvedBy[i];
            const at = p.trail.filter((t) => t.kind === "Approved")[i]?.at;
            return (
              <Stepline
                key={i}
                done={!!name}
                label={name ? `Approved by ${name}` : i === st.needed - 1 && !st.clientOk ? "Approval from a client signatory" : "Approval"}
                at={at}
              />
            );
          })}
          <Stepline
            done={["Scheduled", "Sent", "Settled"].includes(p.state)}
            label={
              p.trail.find((t) => t.kind === "Released") ? `Released by ${p.trail.find((t) => t.kind === "Released")!.who}` : `Release by ${releasers.join(" or ") || "a releaser"}`
            }
            at={p.trail.find((t) => t.kind === "Released")?.at}
          />
        </ol>
      </Section>

      {p.state === "Draft" && (
        <div className="mb-5 flex gap-2">
          <button type="button" className={btnPrimary} onClick={() => flash(bank.submit(p.id, st.maker))}>
            Submit for approval
          </button>
          <button type="button" className={btnSecondary} onClick={() => flash(bank.cancel(p.id, st.maker))}>
            Cancel
          </button>
        </div>
      )}

      {p.state === "Pending approval" && (
        <Section title="Approve">
          {st.eligible.length ? (
            <>
              <label className={lbl} htmlFor="approve-as">
                Approve as <span className="font-normal text-d-text-3">(simulated sign-in)</span>
              </label>
              <div className="mt-1 flex gap-2">
                <select id="approve-as" className={cx(field, "mt-0")} value={pick} onChange={(ev) => setWho(ev.target.value)}>
                  {st.eligible.map((n) => (
                    <option key={n} value={n}>
                      {n} · {PEOPLE.find((x) => x.name === n)?.side === "Client" ? "client signatory" : "firm"}
                    </option>
                  ))}
                </select>
                <button type="button" className={cx(btnPrimary, "shrink-0")} onClick={() => flash(bank.approve(p.id, pick))}>
                  Approve
                </button>
              </div>
              <p className="mt-1.5 text-[11.5px] text-d-text-3">{st.maker} prepared this payment and is not listed: one person can’t both prepare and approve.</p>
            </>
          ) : (
            <p className="text-[12.5px] text-d-text-3">No one else on the policy can approve this payment.</p>
          )}
        </Section>
      )}

      {p.state === "Pending release" && (
        <Section title="Release to the bank">
          <div className="flex gap-2">
            <select aria-label="Release as" className={cx(field, "mt-0")} value={rel} onChange={(ev) => setRel(ev.target.value)}>
              {releasers.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button type="button" className={cx(btnPrimary, "shrink-0")} disabled={!rel} onClick={() => flash(bank.release(p.id, rel))}>
              {p.date > TODAY ? "Release for value date" : "Release now"}
            </button>
          </div>
          <p className="mt-1.5 text-[11.5px] text-d-text-3">Release is a separate step from approval, done by banking operations, with a check that the account can cover it.</p>
        </Section>
      )}

      {p.state === "On hold" && (
        <div className="mb-5 rounded-[10px] border border-neg-line px-3.5 py-3 text-[12.5px] leading-relaxed text-d-text-2">
          <b className="font-semibold text-negative">Held: the payee’s bank details changed.</b> {payee.change?.via}. Nothing is paid to the new account until someone calls{" "}
          {payee.name} on the number already on record and confirms it.
          <Link href={`/admin/banking/payees?id=${payee.id}`} className="mt-2 flex items-center gap-1.5 font-semibold text-d-text hover:underline">
            <PhoneCall size={13} /> Record the callback
          </Link>
        </div>
      )}

      {["Pending approval", "Pending release", "On hold"].includes(p.state) && (
        <div className="mb-5">
          {rejecting ? (
            <div>
              <label className={lbl} htmlFor="rej">
                Reason for rejecting
              </label>
              <textarea id="rej" className={cx(field, "h-20 py-2")} value={note} onChange={(ev) => setNote(ev.target.value)} />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    const r = bank.reject(p.id, pick || releasers[0] || "Noah Whitaker", note);
                    flash(r);
                    if (r.ok) setRejecting(false);
                  }}
                >
                  Reject payment
                </button>
                <button type="button" className="text-[12.5px] text-d-text-3 hover:text-d-text" onClick={() => setRejecting(false)}>
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="text-[12.5px] font-medium text-d-text-3 hover:text-negative" onClick={() => setRejecting(true)}>
              Reject…
            </button>
          )}
        </div>
      )}

      {p.state === "Scheduled" && (
        <div className="mb-5">
          <button type="button" className={btnSecondary} onClick={() => flash(bank.cancel(p.id, "Noah Whitaker"))}>
            Cancel before it is sent
          </button>
        </div>
      )}

      <Section title="History">
        <ol className="space-y-2.5 border-l border-d-line pl-3.5">
          {p.trail.map((t, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute -left-[18px] top-1.5 h-1.5 w-1.5 rounded-full bg-d-line-strong" />
              <span className="block text-d-text">
                {t.kind} · {t.who}
              </span>
              <span className="tnum block text-[11.5px] text-d-text-3">{t.at.replace("T", " ")}</span>
              {t.note && <span className="mt-0.5 block text-[12px] text-d-text-2">{t.note}</span>}
            </li>
          ))}
        </ol>
      </Section>
      {node}
    </Drawer>
  );
}

function Stepline({ done, label, at }: { done: boolean; label: string; at?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
          done ? "bg-[var(--color-up)] text-white" : "border border-d-line-strong text-transparent",
        )}
      >
        {done ? <Check size={11} strokeWidth={3} /> : <Circle size={6} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block", done ? "text-d-text" : "text-d-text-3")}>{label}</span>
        {at && <span className="tnum block text-[11.5px] text-d-text-3">{at.replace("T", " ")}</span>}
      </span>
    </li>
  );
}

/** Prepare a payment from a platform account to a confirmed payee. */
export function NewPayment({ onClose, onCreated, entityId }: { onClose: () => void; onCreated?: (id: string) => void; entityId?: string }) {
  const d = useBanking();
  const platform = d.accounts.filter((a) => a.connection === "Platform" && (!entityId || a.entityId === entityId));
  const [from, setFrom] = useState(platform[0]?.id ?? "");
  const acct = d.account(from);
  const payees = d.payees.filter((p) => acct && p.entityIds.includes(acct.entityId) && p.currency === acct.currency);
  const [payeeId, setPayeeId] = useState("");
  const payee = d.payee(payeeId) ?? payees[0];
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(TODAY);
  const [memo, setMemo] = useState("");
  const preparers = PEOPLE.filter((p) => p.side === "Firm").map((p) => p.name);
  const [preparer, setPreparer] = useState(preparers[0]);
  const { flash, node } = useFlash();
  const n = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const policy = acct ? policyFor(acct.entityId) : undefined;
  const tier = policy && n ? tierFor(policy, n) : undefined;
  const rail = acct && payee ? railFor(acct, payee, n) : undefined;
  const connected = d.accounts.filter((a) => a.connection !== "Platform" && (!entityId || a.entityId === entityId));

  const go = (submit: boolean) => {
    if (!acct || !payee || !rail) return;
    const r = bank.create(
      { fromAccountId: acct.id, payeeId: payee.id, amount: n, currency: acct.currency, rail: rail.rail, date, memo: memo.trim() || "Payment", purpose: undefined },
      preparer,
      submit,
    );
    flash(r);
    if (r.ok && r.id) {
      onCreated?.(r.id);
      onClose();
    }
  };

  const selected = payee;
  return (
    <Dialog
      title="New payment"
      sub="Payments go from platform accounts to confirmed payees. New payees and changed bank details are confirmed by a callback first."
      onClose={onClose}
      width={600}
    >
      <div className="grid gap-3">
        <div>
          <label className={lbl} htmlFor="np-from">
            From
          </label>
          <select
            id="np-from"
            className={field}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPayeeId("");
            }}
          >
            {platform.map((a) => (
              <option key={a.id} value={a.id}>
                {entityById(a.entityId)!.short} · {a.name} ··{a.mask} · {money(a.balance, a.currency)}
              </option>
            ))}
          </select>
          {connected.length > 0 && (
            <p className="mt-1 text-[11.5px] text-d-text-3">
              {connected.map((a) => `${entityById(a.entityId)!.short} at ${a.bank}`).join(", ")}: connected read-only, so payments are made at that bank.
            </p>
          )}
        </div>
        <div>
          <label className={lbl} htmlFor="np-payee">
            Payee
          </label>
          <select id="np-payee" className={field} value={payee?.id ?? ""} onChange={(e) => setPayeeId(e.target.value)}>
            {payees.length === 0 && <option value="">No payees set up for this account</option>}
            {payees.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.bank} ··{p.mask}
                {p.state !== "Verified" ? " · callback required" : ""}
              </option>
            ))}
          </select>
          {selected && selected.state !== "Verified" && (
            <p className="mt-1 text-[11.5px] text-negative">This payee’s bank details changed and aren’t confirmed. A payment to it is held until the callback is recorded.</p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={lbl} htmlFor="np-amt">
              Amount ({acct?.currency})
            </label>
            <input id="np-amt" inputMode="decimal" className={cx(field, "tnum")} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={lbl} htmlFor="np-date">
              Value date
            </label>
            <input id="np-date" type="date" min={TODAY} className={field} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={lbl} htmlFor="np-memo">
            Reference for the payee
          </label>
          <input id="np-memo" className={field} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Invoice number or what it pays" />
        </div>
        <div>
          <label className={lbl} htmlFor="np-prep">
            Prepared by <span className="font-normal text-d-text-3">(simulated sign-in)</span>
          </label>
          <select id="np-prep" className={field} value={preparer} onChange={(e) => setPreparer(e.target.value)}>
            {preparers.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {rail && n > 0 && (
          <div className="rounded-[10px] border border-d-line px-3.5 py-3 text-[12.5px] leading-relaxed text-d-text-2">
            <div className="flex flex-wrap items-center gap-2">
              <RailTag r={rail.rail} /> <span className="text-d-text">{rail.speed}</span>
              {rail.cutoff && <span className="text-d-text-3">· cutoff {rail.cutoff}</span>}
            </div>
            <p className="mt-1 text-d-text-3">{rail.why}</p>
            {tier && (
              <p className="mt-2">
                <b className="font-semibold text-d-text">Needs:</b> {tierText(tier, acct!.currency).replace(/^.*?: /, "")}, then release by banking operations.
              </p>
            )}
            {acct && n > acct.balance && <p className="mt-2 text-negative">More than today’s balance of {money(acct.balance, acct.currency)}.</p>}
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={btnSecondary} disabled={!n || !payee} onClick={() => go(false)}>
          Save as draft
        </button>
        <button type="button" className={btnPrimary} disabled={!n || !payee} onClick={() => go(true)}>
          Submit for approval
        </button>
      </div>
      {node}
    </Dialog>
  );
}
