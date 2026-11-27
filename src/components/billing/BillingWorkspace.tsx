"use client";

import { ModuleName } from "@/components/brand/ModuleName";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Check, Plus, Printer, Send, Trash2, X } from "lucide-react";
import { cx } from "@/components/ui";
import { AurumLogo } from "@/components/brand/Logo";
import { money } from "@/lib/format";
import {
  BILLING,
  BILL_TODAY,
  balance,
  billingClient,
  daysPast,
  feeSchedules,
  invoiceTotal,
  invoices as seedInvoices,
  isOpen,
  isOverdue,
  lineTotal,
  mrr,
  nextNumber,
  paidOn,
  payments as seedPayments,
  planById,
  plans,
  quarterlyAdminLines,
  solutionName,
  subscriptionLine,
  subscriptions,
  type FeeSchedule,
  type Invoice,
  type InvoiceLine,
  type Payment,
} from "@/lib/billing";

export type BillingTab = "overview" | "invoices" | "new" | "payments" | "subscriptions" | "fees";
const TABS: { id: BillingTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "fees", label: "Administration fees" },
];

const ME_NAME = "Managing Partner";
const usd = (n: number) => money(n, "USD", { decimals: 2 });
const usd0 = (n: number) => money(n, "USD");
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const addDays = (iso: string, d: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);

type Shown = Invoice["status"] | "Overdue";
const shownStatus = (i: Invoice): Shown => (isOverdue(i) ? "Overdue" : i.status);
const statusStyle: Record<Shown, string> = {
  Draft: "bg-stone-100 text-stone-600",
  "Awaiting approval": "bg-gold-50 text-gold-700",
  Sent: "bg-[#EEF1F6] text-ink-700",
  "Partially paid": "bg-[#FBF1E4] text-[#8A5A1E]",
  Paid: "bg-[#E7F2EB] text-[#245F3C]",
  Overdue: "bg-[#F8E9E2] text-[#9A4422]",
  Void: "bg-stone-100 text-stone-400 line-through",
};

function StatusPill({ s }: { s: Shown }) {
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[s])}>{s}</span>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-[16px] border border-stone-200/80 bg-white shadow-card", className)}>{children}</div>;
}

function basisLabel(f: FeeSchedule) {
  if (f.basis === "nav") return `${f.bps} bps p.a. on NAV`;
  if (f.basis === "commitments") return `${f.bps} bps p.a. on commitments`;
  if (f.basis === "per_entity") return `${usd0(f.amount ?? 0)} per entity`;
  if (f.basis === "milestone") return `${usd0(f.amount ?? 0)} per milestone`;
  return `${usd0(f.amount ?? 0)} / ${f.frequency === "Monthly" ? "month" : "period"}`;
}

/* ───────────────────────── invoice document ───────────────────────── */

export function InvoiceDoc({ inv, paid }: { inv: Invoice; paid: number }) {
  const client = billingClient(inv.clientId);
  const total = invoiceTotal(inv);
  return (
    <div className="bg-white px-10 py-9 text-ink-900">
      <div className="flex items-start justify-between">
        <AurumLogo variant="dark" height={38} />
        <div className="text-right">
          <div className="text-[22px] font-light tracking-[0.2em] text-stone-500">INVOICE</div>
          <div className="mt-1 font-mono text-[13px] font-semibold">{inv.number}</div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-6 text-[12px]">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">From</div>
          <div className="font-semibold">Aurum Asset Management</div>
          <div className="text-stone-600">Orlando, Florida</div>
          <div className="text-stone-600">billing@aurumasset.us</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Bill to</div>
          <div className="font-semibold">{client?.name}</div>
          <div className="text-stone-600">{solutionName(inv.solution)}</div>
        </div>
        <dl className="space-y-1">
          {[
            ["Issued", fmtDate(inv.issued)],
            ["Due", fmtDate(inv.due)],
            ["Period", inv.period],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-stone-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <table className="mt-8 w-full text-[12px]">
        <thead>
          <tr className="border-b-2 border-ink-900 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.id} className="border-b border-stone-100 align-top">
              <td className="py-2.5 pr-4">
                <div className="font-medium">{l.description || "—"}</div>
                {l.detail && <div className="mt-0.5 text-[11px] text-stone-500">{l.detail}</div>}
              </td>
              <td className="num py-2.5 text-right">{l.qty}</td>
              <td className="num py-2.5 text-right">{usd(l.unit)}</td>
              <td className="num py-2.5 text-right font-medium">{usd(lineTotal(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 ml-auto w-[260px] space-y-1.5 text-[12px]">
        <div className="flex justify-between">
          <span className="text-stone-500">Subtotal</span>
          <span className="num">{usd(total)}</span>
        </div>
        {paid > 0 && (
          <div className="flex justify-between">
            <span className="text-stone-500">Paid</span>
            <span className="num">({usd(paid)})</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-ink-900 pt-2 text-[14px] font-semibold">
          <span>Amount due</span>
          <span className="num">{usd(Math.max(0, total - paid))}</span>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-6 border-t border-stone-200 pt-5 text-[11px] text-stone-500">
        <div>
          <div className="mb-1 font-semibold text-ink-900">Payment</div>
          Wire or ACH in USD to Aurum Asset Management. Banking details are provided separately and never change by email. Quote {inv.number} as the reference.
        </div>
        <div>
          <div className="mb-1 font-semibold text-ink-900">Prepared and approved</div>
          Prepared by {inv.preparedBy}
          {inv.approvedBy ? ` · approved by ${inv.approvedBy}` : " · approval pending"}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── workspace ───────────────────────── */

export function BillingWorkspace({ tab: initialTab, filter: initialFilter, brlPerUsd }: { tab: BillingTab; filter?: string; brlPerUsd: number }) {
  const path = usePathname();
  const [tab, setTabState] = useState<BillingTab>(initialTab);
  const [invs, setInvs] = useState<Invoice[]>(seedInvoices);
  const [pays, setPays] = useState<Payment[]>(seedPayments);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(initialFilter ?? "all");
  const [paying, setPaying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const setTab = (t: BillingTab) => {
    setTabState(t);
    window.history.replaceState(null, "", `${path}?tab=${t}`); // no navigation: keeps unsaved state
  };
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  };

  const open = invs.find((i) => i.id === openId) ?? null;
  const update = (id: string, patch: Partial<Invoice>) => setInvs((all) => all.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const recordPayment = (p: Payment) => {
    setPays((all) => [p, ...all]);
    const inv = invs.find((i) => i.id === p.invoiceId)!;
    const paid = paidOn(inv, pays) + p.amount;
    update(inv.id, { status: paid >= invoiceTotal(inv) - 0.005 ? "Paid" : "Partially paid" });
    setPaying(null);
    flash(`Payment of ${usd(p.amount)} recorded against ${inv.number}`);
  };

  const k = useMemo(() => {
    const issued = invs.filter((i) => i.status !== "Draft" && i.status !== "Awaiting approval" && i.status !== "Void");
    const billed = issued.reduce((s, i) => s + invoiceTotal(i), 0);
    const collected = pays.reduce((s, p) => s + p.amount, 0);
    const openInvs = invs.filter(isOpen);
    const outstanding = openInvs.reduce((s, i) => s + balance(i, pays), 0);
    const overdueInvs = openInvs.filter((i) => isOverdue(i));
    const overdue = overdueInvs.reduce((s, i) => s + balance(i, pays), 0);
    return { billed, collected, outstanding, overdue, overdueCount: overdueInvs.length, openCount: openInvs.length };
  }, [invs, pays]);

  return (
    <div className="mx-auto max-w-[1320px] px-8 pb-16 pt-4">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink-900">
            <ModuleName id="billing" />
          </h1>
        </div>
        <button
          onClick={() => setTab("new")}
          className="flex h-9 items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-semibold text-white shadow-card hover:opacity-95"
          style={{ background: BILLING }}
        >
          <Plus size={15} /> New invoice
        </button>
      </div>
      <div className="mt-5 flex gap-6 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx("-mb-px border-b-2 pb-2.5 text-[13px] font-semibold", tab === t.id ? "text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900")}
            style={tab === t.id ? { borderColor: BILLING } : undefined}
          >
            {t.label}
          </button>
        ))}
        {tab === "new" && (
          <span className="-mb-px border-b-2 pb-2.5 text-[13px] font-semibold text-ink-900" style={{ borderColor: BILLING }}>
            New invoice
          </span>
        )}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview invs={invs} pays={pays} k={k} onOpen={setOpenId} onTab={setTab} />}
        {tab === "invoices" && <InvoiceList invs={invs} pays={pays} filter={filter} setFilter={setFilter} onOpen={setOpenId} />}
        {tab === "new" && (
          <InvoiceBuilder
            brlPerUsd={brlPerUsd}
            nextNo={nextNumber(invs)}
            onSave={(inv) => {
              setInvs((all) => [inv, ...all]);
              setTab("invoices");
              setFilter("all");
              setOpenId(inv.id);
              flash(inv.status === "Draft" ? `${inv.number} saved as draft` : `${inv.number} submitted for approval`);
            }}
          />
        )}
        {tab === "payments" && <Payments pays={pays} invs={invs} onRecord={() => setPaying("")} />}
        {tab === "subscriptions" && <Subscriptions />}
        {tab === "fees" && <Fees />}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/25 backdrop-blur-[1px]" onClick={() => setOpenId(null)}>
          <aside className="flex h-full w-[760px] max-w-full flex-col bg-stone-50 shadow-lift" onClick={(e) => e.stopPropagation()} aria-label={`Invoice ${open.number}`}>
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[14px] font-semibold text-ink-900">{open.number}</span>
                <StatusPill s={shownStatus(open)} />
              </div>
              <div className="flex items-center gap-2">
                {open.status === "Draft" && (
                  <button
                    onClick={() => (update(open.id, { status: "Awaiting approval" }), flash("Submitted for approval"))}
                    className="h-8 rounded-[9px] border border-stone-300 bg-white px-3 text-[12px] font-semibold text-ink-900 hover:border-ink-900"
                  >
                    Submit for approval
                  </button>
                )}
                {open.status === "Awaiting approval" &&
                  (open.preparedBy === ME_NAME ? (
                    <span className="text-[12px] text-stone-500">A second person must approve</span>
                  ) : (
                    <button
                      onClick={() => (
                        update(open.id, { status: "Sent", approvedBy: ME_NAME, issued: BILL_TODAY, due: addDays(BILL_TODAY, 30) }),
                        flash(`${open.number} approved and sent`)
                      )}
                      className="flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold text-white"
                      style={{ background: BILLING }}
                    >
                      <Send size={13} /> Approve & send
                    </button>
                  ))}
                {isOpen(open) && (
                  <>
                    <button
                      onClick={() => flash(`Reminder sent for ${open.number}`)}
                      className="h-8 rounded-[9px] border border-stone-300 bg-white px-3 text-[12px] font-semibold text-ink-900 hover:border-ink-900"
                    >
                      Send reminder
                    </button>
                    <button onClick={() => setPaying(open.id)} className="h-8 rounded-[9px] px-3 text-[12px] font-semibold text-white" style={{ background: BILLING }}>
                      Record payment
                    </button>
                  </>
                )}
                <button
                  onClick={() => window.print()}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] text-stone-500 hover:bg-stone-100 hover:text-ink-900"
                  aria-label="Print"
                >
                  <Printer size={15} />
                </button>
                <button
                  onClick={() => setOpenId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] text-stone-500 hover:bg-stone-100 hover:text-ink-900"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-hidden rounded-[6px] shadow-card">
                <InvoiceDoc inv={open} paid={paidOn(open, pays)} />
              </div>
              {pays.some((p) => p.invoiceId === open.id) && (
                <Card className="mt-4 p-5">
                  <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Payments received</div>
                  {pays
                    .filter((p) => p.invoiceId === open.id)
                    .map((p) => (
                      <div key={p.id} className="flex justify-between py-1 text-[12px]">
                        <span className="text-stone-600">
                          {fmtDate(p.date)} · {p.method} · <span className="font-mono">{p.reference}</span>
                        </span>
                        <span className="num font-semibold">{usd(p.amount)}</span>
                      </div>
                    ))}
                </Card>
              )}
            </div>
          </aside>
        </div>
      )}

      {paying !== null && <PaymentDialog invs={invs} pays={pays} invoiceId={paying} onClose={() => setPaying(null)} onSave={recordPayment} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[12px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">
          <Check size={15} className="text-[#8FD3A8]" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── tabs ───────────────────────── */

function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "warn" }) {
  return (
    <Card className="px-5 py-4">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</div>
      <div className={cx("num mt-1.5 text-[24px] font-semibold tracking-[-0.01em]", tone === "warn" ? "text-[#9A4422]" : "text-ink-900")}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-stone-500">{note}</div>}
    </Card>
  );
}

function Overview({
  invs,
  pays,
  k,
  onOpen,
  onTab,
}: {
  invs: Invoice[];
  pays: Payment[];
  k: { billed: number; collected: number; outstanding: number; overdue: number; overdueCount: number; openCount: number };
  onOpen: (id: string) => void;
  onTab: (t: BillingTab) => void;
}) {
  const buckets = ["Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"] as const;
  const bucketOf = (i: Invoice) => {
    const d = daysPast(i);
    return d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4;
  };
  const open = invs.filter(isOpen);
  const byClient = [...new Set(open.map((i) => i.clientId))].map((c) => {
    const row = [0, 0, 0, 0, 0];
    open.filter((i) => i.clientId === c).forEach((i) => (row[bucketOf(i)] += balance(i, pays)));
    return { c, row, total: row.reduce((a, b) => a + b, 0) };
  });
  const colTotals = buckets.map((_, j) => byClient.reduce((s, r) => s + r.row[j], 0));
  const pending = invs.filter((i) => i.status === "Draft" || i.status === "Awaiting approval");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        <Kpi label="Billed 2026" value={usd0(k.billed)} note="Issued invoices" />
        <Kpi label="Collected" value={usd0(k.collected)} note={`${pays.length} payments`} />
        <Kpi label="Outstanding" value={usd0(k.outstanding)} note={`${k.openCount} open invoices`} />
        <Kpi label="Overdue" value={usd0(k.overdue)} note={`${k.overdueCount} past due`} tone={k.overdue ? "warn" : undefined} />
        <Kpi label="Recurring" value={`${usd0(mrr())}`} note="per month · subscriptions and retainers" />
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-5">
        <Card>
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 className="text-[14px] font-semibold text-ink-900">Receivables aging</h2>
            <button onClick={() => onTab("invoices")} className="text-[12px] font-semibold text-stone-500 hover:text-ink-900">
              All invoices
            </button>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-y border-stone-100 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                <th className="px-5 py-2 text-left">Client</th>
                {buckets.map((b) => (
                  <th key={b} className="px-3 py-2 text-right">
                    {b}
                  </th>
                ))}
                <th className="px-5 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {byClient.map((r) => (
                <tr key={r.c} className="border-b border-stone-100">
                  <td className="px-5 py-2.5 font-medium text-ink-900">{billingClient(r.c)?.short}</td>
                  {r.row.map((v, j) => (
                    <td key={j} className={cx("num px-3 py-2.5 text-right", v ? (j > 0 ? "font-semibold text-[#9A4422]" : "text-ink-900") : "text-stone-300")}>
                      {v ? usd0(v) : "—"}
                    </td>
                  ))}
                  <td className="num px-5 py-2.5 text-right font-semibold text-ink-900">{usd0(r.total)}</td>
                </tr>
              ))}
              <tr className="text-[12px] font-semibold">
                <td className="px-5 py-2.5 text-stone-500">Total</td>
                {colTotals.map((v, j) => (
                  <td key={j} className="num px-3 py-2.5 text-right text-ink-900">
                    {v ? usd0(v) : "—"}
                  </td>
                ))}
                <td className="num px-5 py-2.5 text-right text-ink-900">{usd0(colTotals.reduce((a, b) => a + b, 0))}</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-[14px] font-semibold text-ink-900">Waiting on Aurum</h2>
            {pending.length ? (
              <ul className="space-y-1">
                {pending.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => onOpen(i.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-[10px] px-2 py-2 text-left text-[12.5px] hover:bg-stone-50"
                    >
                      <span>
                        <span className="block font-medium text-ink-900">{billingClient(i.clientId)?.short}</span>
                        <span className="block text-[11px] text-stone-500">
                          {i.number} · prepared by {i.preparedBy}
                        </span>
                      </span>
                      <StatusPill s={i.status} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-stone-400">Nothing waiting.</p>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-[14px] font-semibold text-ink-900">Latest payments</h2>
            <ul className="space-y-2">
              {[...pays]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 4)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-[12.5px]">
                    <span>
                      <span className="block font-medium text-ink-900">{billingClient(p.clientId)?.short}</span>
                      <span className="block text-[11px] text-stone-500">
                        {fmtDate(p.date)} · {p.method}
                      </span>
                    </span>
                    <span className="num font-semibold" style={{ color: BILLING }}>
                      +{usd0(p.amount)}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InvoiceList({
  invs,
  pays,
  filter,
  setFilter,
  onOpen,
}: {
  invs: Invoice[];
  pays: Payment[];
  filter: string;
  setFilter: (f: string) => void;
  onOpen: (id: string) => void;
}) {
  const filters: [string, string, (i: Invoice) => boolean][] = [
    ["all", "All", () => true],
    ["draft", "Drafts", (i) => i.status === "Draft" || i.status === "Awaiting approval"],
    ["open", "Open", isOpen],
    ["overdue", "Overdue", (i) => isOverdue(i)],
    ["paid", "Paid", (i) => i.status === "Paid"],
  ];
  const fn = filters.find((f) => f[0] === filter)?.[2] ?? (() => true);
  const rows = invs.filter(fn).sort((a, b) => b.number.localeCompare(a.number));
  return (
    <Card>
      <div className="flex gap-1.5 px-5 py-3">
        {filters.map(([id, label, f]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cx("h-7 rounded-full px-3 text-[12px] font-semibold", filter === id ? "bg-champagne text-ink-900" : "text-stone-500 hover:bg-stone-100 hover:text-ink-900")}
          >
            {label} <span className="ml-0.5 text-stone-400">{invs.filter(f).length}</span>
          </button>
        ))}
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-y border-stone-100 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
            <th className="px-5 py-2 text-left">Invoice</th>
            <th className="px-3 py-2 text-left">Client</th>
            <th className="px-3 py-2 text-left">Service</th>
            <th className="px-3 py-2 text-left">Period</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">Balance</th>
            <th className="px-5 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id} onClick={() => onOpen(i.id)} className="cursor-pointer border-b border-stone-100 hover:bg-stone-50">
              <td className="px-5 py-3 font-mono font-semibold text-ink-900">{i.number}</td>
              <td className="px-3 py-3 font-medium text-ink-900">{billingClient(i.clientId)?.short}</td>
              <td className="px-3 py-3 text-stone-600">{solutionName(i.solution)}</td>
              <td className="px-3 py-3 text-stone-600">{i.period}</td>
              <td className="px-3 py-3 text-stone-600">
                {fmtDate(i.due)}
                {isOverdue(i) && <span className="ml-1.5 text-[11px] font-semibold text-[#9A4422]">{daysPast(i)}d late</span>}
              </td>
              <td className="num px-3 py-3 text-right text-ink-900">{usd0(invoiceTotal(i))}</td>
              <td className="num px-3 py-3 text-right font-semibold text-ink-900">{isOpen(i) ? usd0(balance(i, pays)) : "—"}</td>
              <td className="px-5 py-3">
                <StatusPill s={shownStatus(i)} />
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-stone-400">
                No invoices here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function Payments({ pays, invs, onRecord }: { pays: Payment[]; invs: Invoice[]; onRecord: () => void }) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-3">
        <h2 className="text-[14px] font-semibold text-ink-900">Payments received</h2>
        <button onClick={onRecord} className="flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-semibold text-white" style={{ background: BILLING }}>
          <Plus size={13} /> Record payment
        </button>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-y border-stone-100 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
            <th className="px-5 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Client</th>
            <th className="px-3 py-2 text-left">Invoice</th>
            <th className="px-3 py-2 text-left">Method</th>
            <th className="px-3 py-2 text-left">Reference</th>
            <th className="px-5 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {[...pays]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((p) => (
              <tr key={p.id} className="border-b border-stone-100">
                <td className="px-5 py-3 text-stone-600">{fmtDate(p.date)}</td>
                <td className="px-3 py-3 font-medium text-ink-900">{billingClient(p.clientId)?.short}</td>
                <td className="px-3 py-3 font-mono text-stone-600">{invs.find((i) => i.id === p.invoiceId)?.number}</td>
                <td className="px-3 py-3 text-stone-600">{p.method}</td>
                <td className="px-3 py-3 font-mono text-[11.5px] text-stone-500">{p.reference}</td>
                <td className="num px-5 py-3 text-right font-semibold text-ink-900">{usd(p.amount)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Card>
  );
}

function Subscriptions() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {plans.map((p) => {
          const n = subscriptions.filter((s) => s.planId === p.id).length;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold text-ink-900">{p.name}</h3>
                <span className="text-[11px] font-semibold text-stone-500">{n} clients</span>
              </div>
              <div className="num mt-2 text-[22px] font-semibold text-ink-900">
                {usd0(p.monthly)}
                <span className="text-[12px] font-normal text-stone-500"> / month</span>
              </div>
              <p className="mt-1 text-[12px] text-stone-500">{p.includes}</p>
            </Card>
          );
        })}
      </div>
      <Card>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
              <th className="px-5 py-2.5 text-left">Client</th>
              <th className="px-3 py-2.5 text-left">Plan</th>
              <th className="px-3 py-2.5 text-right">Seats</th>
              <th className="px-3 py-2.5 text-right">Monthly</th>
              <th className="px-3 py-2.5 text-left">Since</th>
              <th className="px-3 py-2.5 text-left">Renews</th>
              <th className="px-5 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id} className="border-b border-stone-100">
                <td className="px-5 py-3 font-medium text-ink-900">{billingClient(s.clientId)?.short}</td>
                <td className="px-3 py-3 text-stone-600">{planById(s.planId).name}</td>
                <td className="num px-3 py-3 text-right text-stone-600">{s.seats}</td>
                <td className="num px-3 py-3 text-right font-semibold text-ink-900">{usd0(planById(s.planId).monthly)}</td>
                <td className="px-3 py-3 text-stone-600">{fmtDate(s.start)}</td>
                <td className="px-3 py-3 text-stone-600">{fmtDate(s.renews)}</td>
                <td className="px-5 py-3">
                  <span
                    className={cx(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      s.status === "Active" ? "bg-[#E7F2EB] text-[#245F3C]" : "bg-gold-50 text-gold-700",
                    )}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Fees() {
  return (
    <Card>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
            <th className="px-5 py-2.5 text-left">Client</th>
            <th className="px-3 py-2.5 text-left">Solution</th>
            <th className="px-3 py-2.5 text-left">Service</th>
            <th className="px-3 py-2.5 text-left">Fee</th>
            <th className="px-3 py-2.5 text-right">Annual minimum</th>
            <th className="px-3 py-2.5 text-left">Billing</th>
            <th className="px-5 py-2.5 text-left">Effective</th>
          </tr>
        </thead>
        <tbody>
          {feeSchedules.map((f) => (
            <tr key={f.id} className="border-b border-stone-100">
              <td className="px-5 py-3 font-medium text-ink-900">{billingClient(f.clientId)?.short}</td>
              <td className="px-3 py-3 text-stone-600">{solutionName(f.solution)}</td>
              <td className="px-3 py-3 text-stone-600">{f.service}</td>
              <td className="px-3 py-3 font-medium text-ink-900">{basisLabel(f)}</td>
              <td className="num px-3 py-3 text-right text-stone-600">{f.annualMinimum ? usd0(f.annualMinimum) : "—"}</td>
              <td className="px-3 py-3 text-stone-600">{f.frequency}</td>
              <td className="px-5 py-3 text-stone-600">{fmtDate(f.effective)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ───────────────────────── builder ───────────────────────── */

const PERIODS = {
  quarter: ["Q4 2026", "Q3 2026", "Q1 2027"],
  month: ["November 2026", "December 2026", "October 2026"],
};

let seq = 0;
const lid = () => `l${Date.now().toString(36)}${++seq}`;

function linesFor(f: FeeSchedule, period: string, brlPerUsd: number, entities: number): InvoiceLine[] {
  if (f.solution === "fund") {
    const sub = subscriptionLine(f.clientId, 3, period);
    return [...quarterlyAdminLines(f.clientId, brlPerUsd, period), ...(sub ? [sub] : [])].map((l) => ({ ...l, id: lid() }));
  }
  if (f.frequency === "Monthly") {
    const sub = subscriptionLine(f.clientId, 1, period);
    return [{ id: lid(), description: `${f.service} — monthly`, detail: period, qty: 1, unit: f.amount ?? 0 }, ...(sub ? [{ ...sub, id: lid() }] : [])];
  }
  if (f.basis === "per_entity") return [{ id: lid(), description: f.service, detail: `${entities} entities · ${period}`, qty: entities, unit: f.amount ?? 0 }];
  return [{ id: lid(), description: f.service, detail: period, qty: 1, unit: f.amount ?? 0 }];
}

function InvoiceBuilder({ brlPerUsd, nextNo, onSave }: { brlPerUsd: number; nextNo: string; onSave: (inv: Invoice) => void }) {
  const first = feeSchedules[0];
  const periodsOf = (f: FeeSchedule) => (f.frequency === "Quarterly in arrears" ? PERIODS.quarter : f.frequency === "Monthly" ? PERIODS.month : null);
  const defaultPeriod = (f: FeeSchedule) => periodsOf(f)?.[0] ?? (f.frequency === "Annually" ? "2027" : "Milestone 1");

  const [scheduleId, setScheduleId] = useState(first.id);
  const sched = feeSchedules.find((f) => f.id === scheduleId)!;
  const [period, setPeriod] = useState(defaultPeriod(first));
  const [entities, setEntities] = useState(1);
  const [issued, setIssued] = useState(BILL_TODAY);
  const [terms, setTerms] = useState(30);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>(() => linesFor(first, defaultPeriod(first), brlPerUsd, 1));

  const regenerate = (f: FeeSchedule, p: string, e: number) => setLines(linesFor(f, p, brlPerUsd, e));
  const pickSchedule = (id: string) => {
    const f = feeSchedules.find((x) => x.id === id)!;
    const p = defaultPeriod(f);
    setScheduleId(id);
    setPeriod(p);
    regenerate(f, p, entities);
  };
  const setLine = (id: string, patch: Partial<InvoiceLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const draft: Invoice = {
    id: `inv-${nextNo}`,
    number: nextNo,
    clientId: sched.clientId,
    solution: sched.solution,
    period,
    issued,
    due: addDays(issued, terms),
    status: "Draft",
    lines,
    preparedBy: ME_NAME,
    notes: notes || undefined,
  };
  const total = invoiceTotal(draft);
  const valid = lines.length > 0 && lines.every((l) => l.description.trim() && l.qty > 0) && total > 0;
  const field = "h-9 w-full rounded-[9px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none";
  const label = "mb-1 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500";
  const periods = periodsOf(sched);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-6">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2">
              <span className={label}>Client and service</span>
              <select value={scheduleId} onChange={(e) => pickSchedule(e.target.value)} className={field}>
                {feeSchedules.map((f) => (
                  <option key={f.id} value={f.id}>
                    {billingClient(f.clientId)?.short} — {f.service}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-[11.5px] text-stone-500">
                {basisLabel(sched)}
                {sched.annualMinimum ? ` · minimum ${usd0(sched.annualMinimum)} a year` : ""} · {sched.frequency.toLowerCase()}
              </span>
            </label>
            <label>
              <span className={label}>Period</span>
              {periods ? (
                <select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value);
                    regenerate(sched, e.target.value, entities);
                  }}
                  className={field}
                >
                  {periods.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <input value={period} onChange={(e) => setPeriod(e.target.value)} className={field} />
              )}
            </label>
            {sched.basis === "per_entity" ? (
              <label>
                <span className={label}>Entities</span>
                <input
                  type="number"
                  min={1}
                  value={entities}
                  onChange={(e) => {
                    const n = Math.max(1, Number(e.target.value) || 1);
                    setEntities(n);
                    regenerate(sched, period, n);
                  }}
                  className={field}
                />
              </label>
            ) : (
              <div />
            )}
            <label>
              <span className={label}>Issue date</span>
              <input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} className={field} />
            </label>
            <label>
              <span className={label}>Terms</span>
              <select value={terms} onChange={(e) => setTerms(Number(e.target.value))} className={field}>
                {[15, 30, 45].map((d) => (
                  <option key={d} value={d}>
                    Net {d} · due {fmtDate(addDays(issued, d))}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[14px] font-semibold text-ink-900">Lines</h2>
            <button onClick={() => regenerate(sched, period, entities)} className="text-[12px] font-semibold text-stone-500 hover:text-ink-900">
              Recalculate from fee schedule
            </button>
          </div>
          <div className="space-y-2 p-4">
            {lines.map((l) => (
              <div key={l.id} className="rounded-[12px] border border-stone-200 p-3">
                <div className="flex gap-2">
                  <input
                    value={l.description}
                    onChange={(e) => setLine(l.id, { description: e.target.value })}
                    placeholder="Description"
                    aria-label="Description"
                    className={cx(field, "flex-1 font-medium")}
                  />
                  <button
                    onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-stone-400 hover:bg-stone-100 hover:text-[#9A4422]"
                    aria-label="Remove line"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_70px_120px_110px] items-center gap-2">
                  <input
                    value={l.detail ?? ""}
                    onChange={(e) => setLine(l.id, { detail: e.target.value })}
                    placeholder="Detail (optional)"
                    aria-label="Detail"
                    className={cx(field, "text-[12px] text-stone-600")}
                  />
                  <input
                    type="number"
                    min={0}
                    value={l.qty}
                    onChange={(e) => setLine(l.id, { qty: Number(e.target.value) })}
                    aria-label="Quantity"
                    className={cx(field, "num text-right")}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={l.unit}
                    onChange={(e) => setLine(l.id, { unit: Number(e.target.value) })}
                    aria-label="Unit price"
                    className={cx(field, "num text-right")}
                  />
                  <span className="num text-right text-[13px] font-semibold text-ink-900">{usd(lineTotal(l))}</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => setLines((ls) => [...ls, { id: lid(), description: "", qty: 1, unit: 0 }])}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-stone-300 text-[12px] font-semibold text-stone-500 hover:border-stone-400 hover:text-ink-900"
            >
              <Plus size={13} /> Add line
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
            <span className="text-[12px] text-stone-500">Total</span>
            <span className="num text-[18px] font-semibold text-ink-900">{usd(total)}</span>
          </div>
        </Card>

        <Card className="p-5">
          <label>
            <span className={label}>Internal note</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-[9px] border border-stone-300 px-3 py-2 text-[13px] focus:border-ink-900 focus:outline-none"
            />
          </label>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11.5px] text-stone-500">Invoices go out only after a second person approves.</span>
            <div className="flex gap-2">
              <button
                disabled={!valid}
                onClick={() => onSave(draft)}
                className="h-9 rounded-[10px] border border-stone-300 bg-white px-4 text-[13px] font-semibold text-ink-900 hover:border-ink-900 disabled:opacity-40"
              >
                Save draft
              </button>
              <button
                disabled={!valid}
                onClick={() => onSave({ ...draft, status: "Awaiting approval" })}
                className="h-9 rounded-[10px] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
                style={{ background: BILLING }}
              >
                Submit for approval
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="sticky top-4">
        <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Preview</div>
        <div className="overflow-hidden rounded-[6px] shadow-lift">
          <InvoiceDoc inv={draft} paid={0} />
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({ invs, pays, invoiceId, onClose, onSave }: { invs: Invoice[]; pays: Payment[]; invoiceId: string; onClose: () => void; onSave: (p: Payment) => void }) {
  const openInvs = invs.filter(isOpen);
  const [id, setId] = useState(invoiceId || openInvs[0]?.id || "");
  const inv = invs.find((i) => i.id === id);
  const [amount, setAmount] = useState(inv ? balance(inv, pays) : 0);
  const [date, setDate] = useState(BILL_TODAY);
  const [method, setMethod] = useState<Payment["method"]>("Wire");
  const [ref, setRef] = useState("");
  const field = "h-9 w-full rounded-[9px] border border-stone-300 bg-white px-3 text-[13px] focus:border-ink-900 focus:outline-none";
  const max = inv ? balance(inv, pays) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6" role="dialog" aria-modal aria-label="Record payment">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!inv || amount <= 0 || amount > max + 0.005) return;
          onSave({ id: `p${Date.now()}`, invoiceId: inv.id, clientId: inv.clientId, date, amount, method, reference: ref || "—" });
        }}
        className="w-full max-w-[440px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[17px] font-semibold text-ink-900">Record payment</h2>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            const i = invs.find((x) => x.id === e.target.value);
            if (i) setAmount(balance(i, pays));
          }}
          className={field}
          aria-label="Invoice"
        >
          {openInvs.map((i) => (
            <option key={i.id} value={i.id}>
              {i.number} — {billingClient(i.clientId)?.short} — {usd(balance(i, pays))} due
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="0.01"
            min={0.01}
            max={max}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={cx(field, "num")}
            aria-label="Amount"
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} aria-label="Date received" />
          <select value={method} onChange={(e) => setMethod(e.target.value as Payment["method"])} className={field} aria-label="Method">
            {["Wire", "ACH", "Check"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Bank reference" className={field} />
        </div>
        {amount > max + 0.005 && <p className="text-[12px] text-[#9A4422]">More than the {usd(max)} still due.</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-[9px] px-4 text-[13px] font-semibold text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button className="h-9 rounded-[9px] px-4 text-[13px] font-semibold text-white" style={{ background: BILLING }}>
            Record
          </button>
        </div>
      </form>
    </div>
  );
}
