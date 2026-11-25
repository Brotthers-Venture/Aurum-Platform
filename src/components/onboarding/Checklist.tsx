"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CircleAlert, FileSignature, FileText, IdCard, ListChecks, Plus, RotateCcw, Upload } from "lucide-react";
import { cx } from "@/components/ui";
import { DiscussButton, ActivityFeed } from "@/components/spine/Spine";
import { clients as commsClients } from "@/lib/comms";
import {
  CHECKLIST_EVENT,
  KIND_LABEL,
  STATUS_LABEL,
  TEMPLATES,
  accept,
  expiringIds,
  loadChecklists,
  progress,
  reject,
  remind,
  startChecklist,
  submit,
  type Checklist,
  type Item,
  type ItemKind,
  type ItemStatus,
} from "@/lib/checklist";

const when = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const KIND_ICON: Record<ItemKind, typeof FileText> = { document: FileText, identity: IdCard, form: ListChecks, signature: FileSignature };
const TONE: Record<ItemStatus, string> = { requested: "var(--d-text-3)", submitted: "var(--d-info)", accepted: "var(--d-pos)", rejected: "var(--d-warn)" };

export function useChecklists() {
  const [all, setAll] = useState<Checklist[] | null>(null);
  useEffect(() => {
    const read = () => setAll(loadChecklists());
    read();
    window.addEventListener(CHECKLIST_EVENT, read);
    return () => window.removeEventListener(CHECKLIST_EVENT, read);
  }, []);
  return all;
}

export function StatusMark({ s }: { s: ItemStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-semibold" style={{ color: TONE[s] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE[s] }} />
      {STATUS_LABEL[s]}
    </span>
  );
}

export function Progress({ c, wide }: { c: Checklist; wide?: boolean }) {
  const p = progress(c);
  return (
    <div className={wide ? "space-y-2" : "space-y-1"}>
      <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-d-raise">
        {c.items.map((i) => (
          <span key={i.key} className="flex-1" style={{ background: i.status === "requested" ? "transparent" : TONE[i.status] }} />
        ))}
      </div>
      <div className="text-[11.5px] text-d-text-3">
        {p.accepted} of {p.n} accepted
        {p.review ? ` · ${p.review} in review` : ""}
        {p.returned ? ` · ${p.returned} returned` : ""}
      </div>
    </div>
  );
}

/* ───────────────────────── the client's side ───────────────────────── */

/** What the client sees: one list of what is still needed, why something came back, and what is done. */
export function ClientChecklist({ c, actor, accent = "var(--tenant-ink)" }: { c: Checklist; actor: string; accent?: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const p = progress(c);
  const sections = [...new Set(c.items.map((i) => i.section))];
  const order: ItemStatus[] = ["rejected", "requested", "submitted", "accepted"];
  return (
    <div className="space-y-5">
      <div className="rounded-[12px] border border-d-line bg-d-surface p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-d-text-3">Onboarding · due {when(c.due)}</div>
            <h2 className="mt-1 font-serif text-[24px] leading-tight text-d-text">{c.title}</h2>
            <p className="mt-1 text-[13px] text-d-text-2">
              {p.done
                ? "Everything is accepted. Thank you."
                : `${p.open} item${p.open === 1 ? "" : "s"} still needed${p.returned ? `, including ${p.returned} we returned with a note` : ""}. You can stop and come back at any time; nothing you have sent is lost.`}
            </p>
          </div>
          <div className="text-right text-[12px] text-d-text-3">
            Reviewed by
            <div className="text-[13px] font-semibold text-d-text">{c.reviewer}</div>
          </div>
        </div>
        <div className="mt-4">
          <Progress c={c} wide />
        </div>
      </div>
      {sections.map((s) => (
        <section key={s}>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-d-text-3">{s}</h3>
          <div className="overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {c.items
              .filter((i) => i.section === s)
              .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
              .map((i) => (
                <ClientItem key={i.key} c={c} i={i} actor={actor} accent={accent} open={openKey === i.key} onOpen={() => setOpenKey(openKey === i.key ? null : i.key)} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ClientItem({ c, i, actor, accent, open, onOpen }: { c: Checklist; i: Item; actor: string; accent: string; open: boolean; onOpen: () => void }) {
  const Icon = KIND_ICON[i.kind];
  const file = useRef<HTMLInputElement>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(i.answers ?? {});
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const canAct = i.status === "requested" || i.status === "rejected";
  const last = i.uploads[i.uploads.length - 1];
  return (
    <div className={cx("border-b border-d-line-soft last:border-0", i.status === "rejected" && "bg-[color-mix(in_oklab,var(--d-warn)_6%,transparent)]")}>
      <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span
          className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", i.status === "accepted" ? "border-transparent" : "border-d-line")}
          style={i.status === "accepted" ? { background: "var(--d-pos)", color: "#fff" } : undefined}
        >
          {i.status === "accepted" ? <Check size={14} strokeWidth={3} /> : <Icon size={15} className="text-d-text-2" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-d-text">{i.label}</span>
          <span className="text-[11.5px] text-d-text-3">
            {KIND_LABEL[i.kind]}
            {last ? ` · last sent ${when(last.at)}${i.uploads.length > 1 ? ` · version ${last.v}` : ""}` : ""}
          </span>
        </span>
        <StatusMark s={i.status} />
      </button>
      {(open || i.status === "rejected") && (
        <div className="space-y-3 px-4 pb-4 pl-[60px] text-[12.5px]">
          {i.status === "rejected" && i.reason && (
            <div className="flex gap-2 rounded-[8px] border border-[color-mix(in_oklab,var(--d-warn)_35%,transparent)] px-3 py-2 text-d-text">
              <CircleAlert size={14} className="mt-0.5 shrink-0 text-d-warn" />
              <span>
                <b className="font-semibold">{i.reviewedBy} returned this:</b> {i.reason}
              </span>
            </div>
          )}
          {i.help && <p className="text-d-text-2">{i.help}</p>}
          {i.status === "submitted" && <p className="text-d-text-2">With {c.reviewer} for review. You will be told here and by email when it is accepted.</p>}
          {i.status === "accepted" && (
            <p className="text-d-text-2">
              Accepted by {i.reviewedBy} on {when(i.reviewedAt ?? "")}.
              {i.docExpires ? ` Document valid until ${when(i.docExpires)}; we will ask for a new one before it expires.` : ""}
            </p>
          )}
          {canAct && (i.kind === "document" || i.kind === "identity") && (
            <div>
              <input
                ref={file}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) submit(c.id, i.key, actor, { file: f.name });
                }}
              />
              <button
                onClick={() => file.current?.click()}
                className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-semibold text-white"
                style={{ background: accent }}
              >
                <Upload size={14} /> {i.status === "rejected" ? "Send a new version" : "Upload"}
              </button>
              <span className="ml-3 text-[11.5px] text-d-text-3">PDF, JPG or PNG · from your phone or computer</span>
            </div>
          )}
          {canAct && i.kind === "form" && (
            <div className="space-y-2.5">
              {(i.fields ?? []).map((q) => (
                <label key={q} className="block">
                  <span className="mb-1 block font-medium text-d-text">{q}</span>
                  <textarea
                    value={answers[q] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                    rows={2}
                    className="w-full rounded-[7px] border border-d-line bg-d-surface px-2.5 py-1.5 text-[12.5px] text-d-text focus:border-d-line-strong focus:outline-none"
                  />
                </label>
              ))}
              <button
                disabled={(i.fields ?? []).some((q) => !answers[q]?.trim())}
                onClick={() => submit(c.id, i.key, actor, { answers })}
                className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
                style={{ background: accent }}
              >
                Send answers
              </button>
            </div>
          )}
          {canAct && i.kind === "signature" && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 rounded-[8px] border border-d-line px-3 py-2">
                <FileText size={14} className="text-d-text-3" />
                <span className="flex-1 text-d-text">{i.label}</span>
                <span className="text-[11px] text-d-text-3">Read before signing</span>
              </div>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
                <span className="text-d-text-2">I have read the agreement and sign it electronically.</span>
              </label>
              <input
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                placeholder="Type your full name"
                className="h-9 w-full max-w-[320px] rounded-[7px] border border-d-line bg-d-surface px-2.5 font-serif text-[16px] italic text-d-text focus:outline-none"
              />
              <div>
                <button
                  disabled={!agree || signName.trim().toLowerCase() !== actor.toLowerCase()}
                  onClick={() => submit(c.id, i.key, actor, { sign: true })}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
                  style={{ background: accent }}
                >
                  <FileSignature size={14} /> Sign
                </button>
                <span className="ml-3 text-[11.5px] text-d-text-3">Type “{actor}” to sign. Date, time and your sign-in are recorded.</span>
              </div>
            </div>
          )}
          {i.uploads.length > 0 && (
            <div className="text-[11.5px] text-d-text-3">
              {i.uploads
                .slice()
                .reverse()
                .map((u) => (
                  <div key={u.v}>
                    v{u.v} · {u.name} · {u.by} · {when(u.at)}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── the office's side ───────────────────────── */

/** The office's review desk: every checklist, what is waiting for review, and the decision on each item. */
export function ChecklistReview({ actor, orgs }: { actor: string; orgs?: string[] }) {
  const all = useChecklists();
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<"review" | "open" | "all">("review");
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const h = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from the activity feed
    if (h) setSel(h);
  }, []);
  if (!all) return null;
  const scoped = all.filter((c) => !orgs || orgs.includes(c.org));
  const shown = scoped.filter((c) => (filter === "review" ? progress(c).review > 0 : filter === "open" ? !progress(c).done : true));
  const c = scoped.find((x) => x.id === sel) ?? shown[0] ?? scoped[0];
  const waiting = scoped.reduce((s, x) => s + progress(x).review, 0);
  const expiring = expiringIds(scoped, "2026-11-24", 180);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-[7px] border border-d-line">
            {(
              [
                ["review", `To review ${waiting}`],
                ["open", "Open"],
                ["all", "All"],
              ] as const
            ).map(([id, l]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={cx("border-r border-d-line px-2.5 py-1.5 text-[12px] last:border-0", filter === id ? "bg-d-raise font-semibold text-d-text" : "text-d-text-2")}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreating(true)}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-d-line-strong px-2.5 text-[12.5px] font-semibold text-d-text hover:bg-d-raise"
          >
            <Plus size={14} /> New checklist
          </button>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-d-line bg-d-surface">
          {shown.map((x) => (
            <button
              key={x.id}
              onClick={() => setSel(x.id)}
              className={cx("block w-full border-b border-d-line-soft px-4 py-3 text-left last:border-0 hover:bg-d-raise", c?.id === x.id && "bg-d-raise")}
            >
              <div className="flex items-baseline gap-2">
                <span className="truncate text-[13px] font-semibold text-d-text">{x.client}</span>
                <span className="ml-auto whitespace-nowrap text-[11px] text-d-text-3">due {when(x.due)}</span>
              </div>
              <div className="mb-2 truncate text-[12px] text-d-text-2">{x.title}</div>
              <Progress c={x} />
            </button>
          ))}
          {!shown.length && <div className="px-4 py-8 text-center text-[12.5px] text-d-text-3">Nothing waiting for review.</div>}
        </div>
        {expiring.length > 0 && (
          <div className="rounded-[10px] border border-d-line bg-d-surface p-4">
            <div className="mb-2 text-[12.5px] font-semibold text-d-text">Identity documents expiring in 6 months</div>
            {expiring.map(({ c: x, i }) => (
              <div key={x.id + i.key} className="flex justify-between gap-3 py-1 text-[12px]">
                <span className="truncate text-d-text-2">
                  {i.label} · {x.client}
                </span>
                <span className="whitespace-nowrap tabular-nums text-d-warn">{when(i.docExpires!)}</span>
              </div>
            ))}
            <p className="mt-2 text-[11px] text-d-text-3">A new copy is requested automatically 30 days before expiry.</p>
          </div>
        )}
      </div>
      {creating ? <NewChecklist actor={actor} onDone={(id) => (setCreating(false), id && setSel(id))} /> : c ? <ReviewPanel c={c} actor={actor} /> : null}
    </div>
  );
}

function ReviewPanel({ c, actor }: { c: Checklist; actor: string }) {
  const [returning, setReturning] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const p = progress(c);
  const order: ItemStatus[] = ["submitted", "rejected", "requested", "accepted"];
  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-d-line bg-d-surface p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] text-d-text-3">
              {c.client} · reviewer {c.reviewer} · sent {when(c.created)} · due {when(c.due)}
            </div>
            <h2 className="mt-1 text-[19px] font-semibold text-d-text">{c.title}</h2>
          </div>
          <DiscussButton refTo={{ kind: "checklist", id: c.id }} label={c.client} title={`${c.client} — ${c.title}`} />
          <button
            disabled={p.done}
            onClick={() => remind(c.id, actor)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-d-line-strong px-2.5 text-[12.5px] font-semibold text-d-text hover:bg-d-raise disabled:opacity-40"
          >
            <Bell size={14} /> Send reminder
          </button>
        </div>
        <div className="mt-3">
          <Progress c={c} wide />
        </div>
        {c.reminders.length > 0 && <div className="mt-1 text-[11.5px] text-d-text-3">Reminders sent {c.reminders.map(when).join(", ")}</div>}
      </div>
      <div className="overflow-hidden rounded-[10px] border border-d-line bg-d-surface">
        {[...c.items]
          .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
          .map((i) => {
            const Icon = KIND_ICON[i.kind];
            const last = i.uploads[i.uploads.length - 1];
            return (
              <div key={i.key} className="border-b border-d-line-soft px-4 py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Icon size={15} className="shrink-0 text-d-text-3" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-d-text">{i.label}</span>
                    <span className="text-[11.5px] text-d-text-3">
                      {i.section} · {KIND_LABEL[i.kind]}
                      {last ? ` · ${last.name} · v${last.v} · ${last.by}, ${when(last.at)}` : " · not provided yet"}
                    </span>
                  </span>
                  <StatusMark s={i.status} />
                </div>
                {i.answers && i.status !== "requested" && (
                  <dl className="ml-7 mt-2 space-y-1 rounded-[8px] bg-d-surface-2 p-3 text-[12px]">
                    {Object.entries(i.answers).map(([q, a]) => (
                      <div key={q}>
                        <dt className="text-d-text-3">{q}</dt>
                        <dd className="text-d-text">{a}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {i.status === "rejected" && i.reason && <div className="ml-7 mt-1.5 text-[12px] text-d-warn">Returned: {i.reason}</div>}
                {i.status === "submitted" && (
                  <div className="ml-7 mt-2.5">
                    {returning === i.key ? (
                      <div className="space-y-2">
                        <textarea
                          autoFocus
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          placeholder="Tell the client what to change — they see this note"
                          className="w-full rounded-[7px] border border-d-line bg-d-surface px-2.5 py-1.5 text-[12.5px] text-d-text focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={!reason.trim()}
                            onClick={() => {
                              reject(c.id, i.key, actor, reason.trim());
                              setReturning(null);
                              setReason("");
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-[7px] bg-d-text px-3 text-[12.5px] font-semibold text-d-bg disabled:opacity-40"
                          >
                            <RotateCcw size={13} /> Return to client
                          </button>
                          <button onClick={() => setReturning(null)} className="h-8 px-2 text-[12.5px] text-d-text-2">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => accept(c.id, i.key, actor)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-semibold text-white"
                          style={{ background: "var(--d-pos)" }}
                        >
                          <Check size={14} strokeWidth={2.5} /> Accept
                        </button>
                        <button
                          onClick={() => setReturning(i.key)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-d-line-strong px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise"
                        >
                          <RotateCcw size={13} /> Return with a note
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <div className="rounded-[10px] border border-d-line bg-d-surface p-4">
        <div className="mb-2 text-[12.5px] font-semibold text-d-text">Activity</div>
        <ActivityFeed refTo={{ kind: "checklist", id: c.id }} limit={8} />
      </div>
    </div>
  );
}

function NewChecklist({ actor, onDone }: { actor: string; onDone: (id?: string) => void }) {
  const CLIENTS = ["halvorsen", "valenca", "cascade", "altamira", "mazal", "portoreal", "ledgerline"].map(
    (id) => [id, commsClients.find((x) => x.id === id)?.short ?? id] as const,
  );
  const [org, setOrg] = useState<string>(CLIENTS[0][0]);
  const [tpl, setTpl] = useState(TEMPLATES[0].id);
  const [due, setDue] = useState("2026-12-31");
  const t = TEMPLATES.find((x) => x.id === tpl)!;
  return (
    <div className="space-y-4 rounded-[10px] border border-d-line bg-d-surface p-5">
      <h2 className="text-[17px] font-semibold text-d-text">Send a checklist</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-[12px] text-d-text-2">
          Client
          <select value={org} onChange={(e) => setOrg(e.target.value)} className="mt-1 h-8 w-full rounded-[7px] border border-d-line bg-d-surface px-2 text-[12.5px] text-d-text">
            {CLIENTS.map(([id, n]) => (
              <option key={id} value={id}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] text-d-text-2">
          Template
          <select value={tpl} onChange={(e) => setTpl(e.target.value)} className="mt-1 h-8 w-full rounded-[7px] border border-d-line bg-d-surface px-2 text-[12.5px] text-d-text">
            {TEMPLATES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] text-d-text-2">
          Due
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1 h-8 w-full rounded-[7px] border border-d-line bg-d-surface px-2 text-[12.5px] text-d-text"
          />
        </label>
      </div>
      <p className="text-[12.5px] text-d-text-2">{t.about}</p>
      <ol className="space-y-1 text-[12.5px]">
        {t.items.map((i, n) => (
          <li key={i.key} className="flex gap-2">
            <span className="w-5 text-right tabular-nums text-d-text-3">{n + 1}.</span>
            <span className="text-d-text">{i.label}</span>
            <span className="text-d-text-3">· {KIND_LABEL[i.kind]}</span>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const c = startChecklist(org, CLIENTS.find((x) => x[0] === org)![1], tpl, actor, due);
            onDone(c.id);
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] bg-d-text px-3 text-[12.5px] font-semibold text-d-bg"
        >
          Send to client
        </button>
        <button onClick={() => onDone()} className="h-8 px-2 text-[12.5px] text-d-text-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
