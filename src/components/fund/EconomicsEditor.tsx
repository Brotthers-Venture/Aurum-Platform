"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Pencil, Scale, X } from "lucide-react";
import { Button, ButtonLink, Panel, cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { approve, confirm, propose, reject, showTerm, TERM_FIELDS, useEconomics, type Change, type TermKey, type Terms, type Version } from "@/lib/economics";
import { date, dateTime } from "@/lib/format";
import type { Fund } from "@/lib/data";

const input = "h-9 w-full rounded-[8px] border border-stone-200 bg-white px-2.5 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none";
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Edit a fund's economics: propose a change with a reason and a source for every term changed; an approver at the
 * firm who did not prepare it decides first, then the GP principal confirms, and only then does it apply.
 */
export function EconomicsEditor({ fund: f }: { fund: Fund }) {
  const { user, can, role } = usePreviewRole();
  const { versions, current, open } = useEconomics(f.id);
  const [editing, setEditing] = useState(false);

  const isGp = role === "gp_principal";
  const canPropose = can("economics.prepare") && !isGp;

  return (
    <div className="space-y-6">
      <Link href={`/admin/fund/funds/${f.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> {f.name}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="text-[12px] text-stone-500">Fund economics · version {current.version} in force</div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.015em] text-ink-900">Economics</h1>
          <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-stone-600">
            A change needs a reason and the clause or amendment behind every term it changes. It applies once an approver at the firm and then the GP have both confirmed it.
          </p>
        </div>
        <ButtonLink href={`/admin/fund/funds/${f.id}/economics`} variant="secondary">
          <Scale size={14} strokeWidth={1.8} /> LPA review
        </ButtonLink>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {open ? (
            <Decision fund={f} v={open} current={current.terms} />
          ) : editing ? (
            <ProposeForm fund={f} current={current.terms} by={user.name} onDone={() => setEditing(false)} />
          ) : (
            <Panel
              title={`In force · version ${current.version}`}
              actions={
                <Button size="sm" variant="secondary" disabled={!canPropose} onClick={() => setEditing(true)}>
                  <Pencil size={13} strokeWidth={1.8} /> Propose a change
                </Button>
              }
            >
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {TERM_FIELDS.map((t) => (
                  <div key={t.key} className="border-b border-stone-100 py-2.5">
                    <dt className="text-[12px] text-stone-500">{t.label}</dt>
                    <dd className="mt-0.5 text-[13.5px] text-ink-900">{showTerm(t.key, current.terms[t.key])}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[12px] text-stone-500">
                Effective {date(current.effective)}. {current.reason}.
                {!canPropose && (isGp ? " The firm prepares changes; you confirm them." : " Your role can view the economics but cannot prepare a change.")}
              </p>
            </Panel>
          )}
        </div>

        <Panel title="History">
          <ol className="space-y-4">
            {[...versions].reverse().map((v) => (
              <li key={v.version} className="text-[12.5px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink-900">Version {v.version}</span>
                  <span className={cx("text-[11.5px]", v.status === "rejected" ? "text-[#b4232c]" : v.status === "applied" ? "text-stone-500" : "text-gold-700")}>
                    {v.version === current.version
                      ? "In force"
                      : { proposed: "Waiting for the firm", approved: "Waiting for the GP", applied: "Superseded", rejected: "Rejected" }[v.status]}
                  </span>
                </div>
                <div className="mt-0.5 text-stone-600">{v.reason}</div>
                {v.changes.length > 0 && <div className="mt-1 text-stone-500">{v.changes.map((c) => TERM_FIELDS.find((t) => t.key === c.key)!.label).join(", ")}</div>}
                <div className="mt-1 text-[11.5px] text-stone-500">
                  {v.version === 1
                    ? `Effective ${date(v.effective)}`
                    : [
                        `Prepared by ${v.preparedBy}`,
                        v.approvedBy && `approved by ${v.approvedBy}`,
                        v.confirmedBy && `confirmed by ${v.confirmedBy}`,
                        v.rejectedBy && `rejected by ${v.rejectedBy}`,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

function ProposeForm({ fund: f, current, by, onDone }: { fund: Fund; current: Terms; by: string; onDone: () => void }) {
  // Rates are edited as percentages and stored as fractions.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(TERM_FIELDS.map((t) => [t.key, t.kind === "rate" ? String(+((current[t.key] as number) * 100).toFixed(4)) : String(current[t.key])])),
  );
  const [sources, setSources] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [effective, setEffective] = useState(today);

  const parsed = (k: (typeof TERM_FIELDS)[number]) => (k.kind === "rate" ? Number(values[k.key]) / 100 : values[k.key].trim());
  const changed = TERM_FIELDS.filter((t) => parsed(t) !== current[t.key]);
  const badRate = TERM_FIELDS.some(
    (t) => t.kind === "rate" && (values[t.key].trim() === "" || !Number.isFinite(Number(values[t.key])) || Number(values[t.key]) < 0 || Number(values[t.key]) > 100),
  );
  const missingSource = changed.some((t) => !sources[t.key]?.trim());
  const problem = !changed.length
    ? "Change at least one term."
    : badRate
      ? "Waterfall rates must be between 0 and 100."
      : missingSource
        ? "Give the source for every term you changed."
        : !reason.trim()
          ? "Say why the economics are changing."
          : null;

  const send = () => {
    const terms = Object.fromEntries(TERM_FIELDS.map((t) => [t.key, parsed(t)])) as Terms;
    const changes: Change[] = changed.map((t) => ({ key: t.key, from: current[t.key], to: terms[t.key], source: sources[t.key].trim() }));
    propose(f.id, { terms, changes, reason: reason.trim(), effective, preparedBy: by });
    onDone();
  };

  return (
    <Panel title="Propose a change">
      <div className="space-y-4">
        {TERM_FIELDS.map((t) => {
          const isChanged = changed.includes(t);
          return (
            <div key={t.key} className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[200px_minmax(0,1fr)]">
              <label htmlFor={`econ-${t.key}`} className="pt-2 text-[12.5px] font-semibold text-ink-900">
                {t.label}
                <span className="mt-0.5 block text-[11.5px] font-normal text-stone-500">Now {showTerm(t.key, current[t.key])}</span>
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    id={`econ-${t.key}`}
                    value={values[t.key]}
                    onChange={(e) => setValues({ ...values, [t.key]: e.target.value })}
                    inputMode={t.kind === "rate" ? "decimal" : undefined}
                    className={cx(input, t.kind === "rate" && "max-w-[120px] text-right tabular-nums")}
                  />
                  {t.kind === "rate" && <span className="text-[13px] text-stone-500">%</span>}
                </div>
                {isChanged && (
                  <input
                    aria-label={`Source for ${t.label}`}
                    value={sources[t.key] ?? ""}
                    onChange={(e) => setSources({ ...sources, [t.key]: e.target.value })}
                    placeholder="Source, e.g. Amendment No. 2, §8.1, p. 4"
                    className={input}
                  />
                )}
                {!isChanged && <p className="text-[11.5px] text-stone-500">{t.hint}</p>}
              </div>
            </div>
          );
        })}

        <div className="grid gap-x-4 gap-y-1.5 border-t border-stone-100 pt-4 sm:grid-cols-[200px_minmax(0,1fr)]">
          <label htmlFor="econ-reason" className="pt-2 text-[12.5px] font-semibold text-ink-900">
            Reason
          </label>
          <textarea
            id="econ-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Fee step-down after the end of the commitment period"
            className={cx(input, "h-auto py-2")}
          />
          <label htmlFor="econ-effective" className="pt-2 text-[12.5px] font-semibold text-ink-900">
            Effective from
          </label>
          <input id="econ-effective" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className={cx(input, "max-w-[180px]")} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-100 pt-4">
          {problem && <span className="mr-auto text-[12px] text-stone-500">{problem}</span>}
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button disabled={!!problem} onClick={send}>
            Send for approval
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function Decision({ fund: f, v, current }: { fund: Fund; v: Version; current: Terms }) {
  const { user, can, role, member } = usePreviewRole();
  const [note, setNote] = useState("");
  const isGp = role === "gp_principal";
  // only the principal of this vehicle's own GP confirms
  const ownGp = isGp && member.org === f.gpId;
  const firmTurn = v.status === "proposed";
  const canDecide = firmTurn ? can("economics.approve") && !isGp && user.name !== v.preparedBy : ownGp && can("economics.approve");
  const why = firmTurn
    ? isGp
      ? "The firm decides first; you confirm afterwards."
      : user.name === v.preparedBy
        ? "You prepared this change. Under the four-eyes rule another approver decides."
        : !can("economics.approve")
          ? "Your role cannot approve fund economics."
          : null
    : !ownGp
      ? `Approved by ${v.approvedBy}. Waiting for ${f.gp} to confirm.`
      : null;

  return (
    <Panel title={`Proposed change · version ${v.version}`}>
      <ol className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
        {[
          ["Prepared", `${v.preparedBy} · ${dateTime(v.preparedAt)}`, true],
          ["Firm approval", v.approvedBy ? `${v.approvedBy} · ${dateTime(v.approvedAt!)}` : "Waiting", !!v.approvedBy],
          ["GP confirmation", "Waiting", false],
        ].map(([step, who, done]) => (
          <li key={step as string} className="flex items-center gap-2">
            <span
              className={cx("flex h-5 w-5 items-center justify-center rounded-full border", done ? "border-ink-900 bg-ink-900 text-white" : "border-stone-300 text-transparent")}
            >
              <Check size={11} strokeWidth={2.5} />
            </span>
            <span>
              <span className="font-semibold text-ink-900">{step}</span> <span className="text-stone-500">{who}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[11.5px] text-stone-500">
              <th className="py-2 pr-3 font-semibold">Term</th>
              <th className="px-3 py-2 font-semibold">In force</th>
              <th className="px-3 py-2 font-semibold">Proposed</th>
              <th className="py-2 pl-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {v.changes.map((c) => (
              <tr key={c.key} className="border-b border-stone-100 align-top">
                <td className="py-2.5 pr-3 font-semibold text-ink-900">{TERM_FIELDS.find((t) => t.key === c.key)!.label}</td>
                <td className="px-3 py-2.5 text-stone-500 line-through decoration-stone-300">{showTerm(c.key, current[c.key])}</td>
                <td className="px-3 py-2.5 text-ink-900">{showTerm(c.key, c.to)}</td>
                <td className="py-2.5 pl-3 text-stone-600">{c.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12.5px] text-stone-600">
        <span className="font-semibold text-ink-900">Reason:</span> {v.reason}. Effective from {date(v.effective)}.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
        {why ? (
          <span className="text-[12px] text-stone-500">{why}</span>
        ) : (
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note if you reject (optional)" className={cx(input, "max-w-[320px]")} />
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" disabled={!canDecide} onClick={() => reject(f.id, v.version, user.name, note.trim())}>
            <X size={13} strokeWidth={2} /> Reject
          </Button>
          <Button disabled={!canDecide} onClick={() => (firmTurn ? approve(f.id, v.version, user.name) : confirm(f.id, v.version, user.name))}>
            <Check size={13} strokeWidth={2} /> {firmTurn ? "Approve and send to GP" : "Confirm and apply"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/** One term as currently in force, for pages rendered on the server that list a fund's terms. */
export function CurrentTerm({ fundId, term }: { fundId: string; term: Exclude<TermKey, "hurdleRate" | "carryRate"> }) {
  const { current } = useEconomics(fundId);
  return <>{current.terms[term]}</>;
}
