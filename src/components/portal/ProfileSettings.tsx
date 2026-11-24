"use client";

import { useState, type ReactNode } from "react";
import { Clock, FileText, Landmark, Lock, Plus, ShieldCheck, X } from "lucide-react";
import { Button, Panel, Status, cx } from "@/components/ui";

const input =
  "h-10 w-full rounded-[3px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900 disabled:bg-stone-50 disabled:text-stone-500";

const sections = [
  ["entity", "Investor information"],
  ["contacts", "Contacts & access"],
  ["banking", "Banking"],
  ["tax", "Tax documents"],
  ["notifications", "Notifications"],
  ["security", "Security"],
] as const;

type Pending = { field: string; to: string; submitted: string; control: string };

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="grid gap-2 border-b border-stone-100 py-4 sm:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <div className="text-[13px] font-semibold">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] text-stone-500">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx("relative h-5 w-9 rounded-full transition-colors", on ? "bg-ink-900" : "bg-stone-300")}>
      <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

export function ProfileSettings() {
  const [pending, setPending] = useState<Pending[]>([
    { field: "Mailing address", to: "1450 Brickell Avenue, Suite 2100, Miami, FL 33131", submitted: "Nov 20, 2026", control: "Standard review" },
  ]);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("+1 (305) 555-0142");
  const [email, setEmail] = useState("m.calloway@callowaytrust.com");
  const [bankModal, setBankModal] = useState(false);
  const [notify, setNotify] = useState({ calls: true, dist: true, reports: true, tax: true, sms: false });

  const submit = (p: Pending) => setPending((x) => [p, ...x]);

  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">Calloway Family Trust</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">Profile</h1>
      <p className="mt-1.5 max-w-[640px] text-[14px] text-stone-600">
        Keep your information current. Changes are reviewed by the fund administrator before they take effect; bank and signatory changes are
        verified by phone with an authorized signatory.
      </p>

      {pending.length > 0 && (
        <div className="mt-6 rounded-[4px] border border-caution/30 bg-caution-bg px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
            <Clock size={15} strokeWidth={1.8} className="text-caution" />
            {pending.length} change{pending.length > 1 ? "s" : ""} pending administrator review
          </div>
          <ul className="mt-2 space-y-1 text-[13px] text-stone-700">
            {pending.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.field}</span> → {p.to}{" "}
                <span className="text-stone-500">
                  · submitted {p.submitted} · {p.control}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="lg:sticky lg:top-6 lg:self-start">
          <ul className="space-y-px text-[13px]">
            {sections.map(([id, l]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-[3px] px-3 py-2 text-stone-600 hover:bg-white hover:text-ink-900">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <section id="entity">
            <Panel
              title="Investor information"
              actions={
                editing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                        submit({ field: "Contact details", to: `${email} · ${phone}`, submitted: "Nov 24, 2026", control: "Standard review" });
                      }}
                    >
                      Submit for review
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )
              }
            >
              <Row label="Legal name" hint="Changes require amended formation documents">
                <input className={input} disabled value="Calloway Family Trust u/a/d March 4, 2009" />
              </Row>
              <Row label="Investor type">
                <input className={input} disabled value="Trust — revocable grantor trust" />
              </Row>
              <Row label="Taxpayer ID" hint="Update by submitting a new W-9">
                <input className={`${input} font-mono`} disabled value="EIN ••-•••4471" />
              </Row>
              <Row label="Mailing address">
                <div className="text-[13px]">
                  1200 Brickell Bay Drive, Miami, FL 33131
                  <span className="ml-2">
                    <Status value="Pending review" />
                  </span>
                </div>
              </Row>
              <Row label="Email for notices">
                <input className={input} disabled={!editing} value={email} onChange={(e) => setEmail(e.target.value)} />
              </Row>
              <Row label="Phone">
                <input className={input} disabled={!editing} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Row>
            </Panel>
          </section>

          <section id="contacts">
            <Panel
              title="Contacts & access"
              flush
              actions={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => submit({ field: "Authorized contact added", to: "New contact invitation", submitted: "Nov 24, 2026", control: "Signatory confirmation" })}
                >
                  <Plus size={13} strokeWidth={2} /> Invite contact
                </Button>
              }
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Notices</th>
                    <th>Portal access</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Margaret Calloway", "Trustee · authorized signatory", "All", "Full · can sign"],
                    ["Robert Calloway", "Co-trustee · authorized signatory", "All", "Full · can sign"],
                    ["Daniel Moreau, CPA", "Accountant", "Tax, reports", "View only"],
                    ["Whitmore Advisory LLC", "Investment advisor", "Reports", "View only"],
                  ].map(([n, r, no, a]) => (
                    <tr key={n}>
                      <td className="font-semibold">{n}</td>
                      <td className="text-stone-600">{r}</td>
                      <td className="text-stone-600">{no}</td>
                      <td className="text-stone-600">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </section>

          <section id="banking">
            <Panel title="Banking">
              <div className="flex items-center gap-4 rounded-[3px] border border-stone-200 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-stone-100">
                  <Landmark size={18} strokeWidth={1.6} />
                </span>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold">J.P. Morgan Chase · Checking ••2210</div>
                  <div className="text-[12px] text-stone-500">Calloway Family Trust · distributions and capital call refunds · verified Nov 30, 2024</div>
                </div>
                <Status value="Clear" />
              </div>
              <div className="mt-4 flex items-start justify-between gap-6">
                <p className="max-w-[520px] text-[12px] leading-relaxed text-stone-500">
                  For your protection, new bank details are verified by a call to an authorized signatory and held for five business
                  days before any payment. Your administrator will never ask you to change bank details by email.
                </p>
                <Button size="sm" variant="secondary" onClick={() => setBankModal(true)}>
                  Change account
                </Button>
              </div>
            </Panel>
          </section>

          <section id="tax">
            <Panel title="Tax documents" flush>
              <ul className="divide-y divide-stone-100">
                {[
                  ["IRS Form W-9", "Signed by Margaret Calloway · Nov 30, 2024", "Clear"],
                  ["FATCA / CRS self-certification", "Signed Nov 30, 2024", "Clear"],
                  ["Schedule K-1 delivery", "Electronic consent on file", "Clear"],
                ].map(([t, d, s]) => (
                  <li key={t} className="flex items-center gap-4 px-5 py-3.5">
                    <FileText size={16} strokeWidth={1.5} className="text-stone-400" />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{t}</div>
                      <div className="text-[12px] text-stone-500">{d}</div>
                    </div>
                    <Status value={s} />
                    <Button size="sm" variant="ghost">
                      Update
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section id="notifications">
            <Panel title="Notifications">
              {(
                [
                  ["calls", "Capital call notices", "Email when a notice is published"],
                  ["dist", "Distribution notices", "Email when a distribution is scheduled and paid"],
                  ["reports", "Quarterly reports and statements", "Email when published"],
                  ["tax", "Tax documents", "Email when K-1s are available"],
                  ["sms", "Text message alerts", "Payment deadlines and security alerts"],
                ] as const
              ).map(([k, t, d]) => (
                <div key={k} className="flex items-center justify-between border-b border-stone-100 py-3 last:border-0">
                  <div>
                    <div className="text-[13px] font-semibold">{t}</div>
                    <div className="text-[12px] text-stone-500">{d}</div>
                  </div>
                  <Toggle label={t} on={notify[k]} onChange={(v) => setNotify({ ...notify, [k]: v })} />
                </div>
              ))}
            </Panel>
          </section>

          <section id="security">
            <Panel title="Security">
              <Row label="Two-factor authentication">
                <div className="flex items-center gap-2 text-[13px]">
                  <ShieldCheck size={15} strokeWidth={1.8} className="text-positive" /> Authenticator app · enabled
                </div>
              </Row>
              <Row label="Active sessions">
                <div className="text-[13px] text-stone-600">Chrome on macOS · Miami, FL · current session</div>
              </Row>
              <Row label="Password">
                <Button size="sm" variant="secondary">
                  <Lock size={13} strokeWidth={1.8} /> Change password
                </Button>
              </Row>
            </Panel>
          </section>
        </div>
      </div>

      {bankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 p-6" onClick={() => setBankModal(false)}>
          <div className="w-full max-w-[520px] rounded-[4px] bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h2 className="text-[16px] font-semibold">Change distribution account</h2>
              <button onClick={() => setBankModal(false)} className="text-stone-400 hover:text-ink-900" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <button
                type="button"
                className="w-full rounded-[3px] border border-stone-300 p-4 text-left hover:border-ink-900"
                onClick={() => {
                  setBankModal(false);
                  submit({ field: "Distribution bank account", to: "New account via Plaid (ownership verified)", submitted: "Nov 24, 2026", control: "Callback to signatory + 5-day hold" });
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold">Connect with Plaid</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">Recommended</span>
                </div>
                <p className="mt-1 text-[12px] text-stone-500">Verifies that the account is held in the trust’s name instantly. U.S. banks.</p>
              </button>
              <button
                type="button"
                className="w-full rounded-[3px] border border-stone-300 p-4 text-left hover:border-ink-900"
                onClick={() => {
                  setBankModal(false);
                  submit({ field: "Distribution bank account", to: "New wire instructions (statement uploaded)", submitted: "Nov 24, 2026", control: "Callback to signatory + 5-day hold" });
                }}
              >
                <div className="text-[14px] font-semibold">Enter wire details and upload a statement</div>
                <p className="mt-1 text-[12px] text-stone-500">For non-U.S. banks or accounts Plaid cannot reach.</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
