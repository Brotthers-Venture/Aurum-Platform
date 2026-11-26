"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { funds } from "@/lib/data";
import { STAGES, type Offering, type OfferingType, type Opportunity, type Party, type StageId } from "@/lib/offering/data";
import { offering, useOffering, type OfferingData } from "@/lib/offering/store";
import { dayShort } from "./ui";

export const TEAM = ["Luiza Andrade", "Rafael Mendes", "Juliana Teixeira", "Olivia Brandt"];
export const TODAY = "2026-11-24";
const TYPES: OfferingType[] = [
  "Private equity",
  "Venture capital",
  "Private credit",
  "Real estate",
  "Infrastructure",
  "Special purpose vehicle",
  "Co-investment",
  "Direct placement",
];
const INVESTOR_TYPES = [
  "Individual",
  "High-net-worth individual",
  "Family office",
  "Investment adviser",
  "Asset manager",
  "Fund of funds",
  "Pension plan",
  "Endowment",
  "Foundation",
  "Insurance company",
  "Corporation",
  "Sovereign wealth fund",
  "Other institutional investor",
];
/** Stages a person may record by hand; subscriptions come from Fund Solution and gated stages need evidence. */
export const HAND_STAGES: StageId[] = ["identified", "contacted", "interested", "nda_sent", "due_diligence", "ioi", "soft"];

export const field =
  "mt-1 h-9 w-full rounded-[8px] border border-d-line bg-transparent px-2.5 text-[13px] text-d-text placeholder:text-d-text-3 focus:border-d-text-3 focus:outline-none";
export const lbl = "block text-[12px] font-medium text-d-text-2";
export const btnPrimary =
  "inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-brand px-3.5 text-[13px] font-semibold text-brand-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
export const btnSecondary = "inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-d-line px-3.5 text-[13px] font-semibold text-d-text hover:bg-d-raise";
const money = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return v.trim() && Number.isFinite(n) ? n : undefined;
};

export function Dialog({ title, sub, onClose, children, width = 560 }: { title: string; sub?: ReactNode; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-[6vh]" onClick={onClose}>
      <div
        className="picker-in w-full rounded-[14px] border border-d-line bg-d-surface shadow-lift"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <header className="flex items-start gap-3 border-b border-d-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-d-text">{title}</h2>
            {sub && <p className="mt-0.5 text-[12.5px] leading-relaxed text-d-text-3">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
            <X size={16} />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

/* ───────── offering ───────── */

export function OfferingForm({ initial, onClose, onSaved }: { initial?: Offering; onClose: () => void; onSaved?: (id: string) => void }) {
  const d = useOffering();
  const who = usePreviewRole().member.name;
  const linked = new Set(d.offerings.map((o) => o.fundId).filter(Boolean));
  const available = funds.filter((f) => !linked.has(f.id) || f.id === initial?.fundId);
  const [fundId, setFundId] = useState(initial?.fundId ?? "");
  const fromFund = funds.find((f) => f.id === fundId);
  const [v, setV] = useState({
    name: initial?.name ?? "",
    short: initial?.short ?? "",
    sponsor: initial?.sponsor ?? "",
    manager: initial?.manager ?? "",
    type: initial?.type ?? ("Private equity" as OfferingType),
    strategy: initial?.strategy ?? "",
    jurisdiction: initial?.jurisdiction ?? "",
    target: initial?.target ? String(initial.target) : "",
    minimum: initial?.minimum ?? "",
    opened: initial?.opened ?? "",
    closeDate: initial?.nextClose?.date ?? "",
    closeLabel: initial?.nextClose?.label ?? "First close",
    status: initial?.status ?? ("Preparing" as Offering["status"]),
    exemption: initial?.exemption ?? "",
    eligibility: initial?.eligibility ?? "",
    distributor: initial?.distributors[0]?.name ?? "",
    distributorKind: initial?.distributors[0]?.kind ?? ("Fund manager representative" as Offering["distributors"][number]["kind"]),
    lead: initial?.lead ?? who,
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  // a fund on record supplies its own name, sponsor, manager, domicile, strategy and target
  const name = fromFund?.name ?? v.name;
  const ok = name.trim().length > 1 && (fromFund || v.sponsor.trim());
  const save = () => {
    const data = {
      fundId: fundId || undefined,
      gpId: fromFund?.gpId,
      name,
      short: v.short.trim() || fromFund?.shortName || name,
      sponsor: fromFund?.gp ?? v.sponsor.trim(),
      manager: fromFund?.manager ?? (v.manager.trim() || v.sponsor.trim()),
      type: v.type,
      strategy: fromFund?.strategy ?? (v.strategy.trim() || v.type),
      jurisdiction: fromFund?.domicile ?? v.jurisdiction.trim(),
      target: fromFund ? fromFund.targetSize || null : (money(v.target) ?? null),
      minimum: v.minimum.trim() || null,
      opened: v.opened || null,
      nextClose: v.closeDate ? { date: v.closeDate, label: v.closeLabel.trim() || "Closing" } : null,
      status: v.status,
      exemption: v.exemption.trim() || null,
      eligibility: v.eligibility.trim() || null,
      distributors: v.distributor.trim() ? [{ name: v.distributor.trim(), kind: v.distributorKind }] : [],
      lead: v.lead,
    };
    if (initial) {
      offering.editOffering(initial, data, who);
      onSaved?.(initial.id);
    } else onSaved?.(offering.createOffering({ ...data, roomId: undefined }, who));
    onClose();
  };
  return (
    <Dialog
      title={initial ? `Edit ${initial.short}` : "New offering"}
      sub="Terms here describe the offering. A vehicle already in Fund Solution keeps its own name, sponsor, domicile and target; everything else is recorded as you enter it."
      onClose={onClose}
      width={640}
    >
      <div className="space-y-3">
        <label className={lbl}>
          Vehicle in Fund Solution
          <select value={fundId} onChange={(e) => setFundId(e.target.value)} className={field} disabled={!!initial?.fundId}>
            <option value="">Not set up yet</option>
            {available.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        {fromFund ? (
          <p className="rounded-[8px] border border-d-line px-3 py-2 text-[12.5px] text-d-text-2">
            {fromFund.name} · {fromFund.gp} · {fromFund.domicile} · target {fromFund.targetSize ? `$${(fromFund.targetSize / 1e6).toFixed(0)}M` : "pending terms"}, from the fund
            record.
          </p>
        ) : (
          <>
            <Row>
              <label className={lbl}>
                Offering name
                <input value={v.name} onChange={set("name")} className={field} placeholder="e.g. Harbor Credit Opportunities I" />
              </label>
              <label className={lbl}>
                Short name
                <input value={v.short} onChange={set("short")} className={field} placeholder="Shown in lists" />
              </label>
            </Row>
            <Row>
              <label className={lbl}>
                Sponsor
                <input value={v.sponsor} onChange={set("sponsor")} className={field} />
              </label>
              <label className={lbl}>
                Investment manager
                <input value={v.manager} onChange={set("manager")} className={field} placeholder="If different from the sponsor" />
              </label>
            </Row>
            <Row>
              <label className={lbl}>
                Jurisdiction
                <input value={v.jurisdiction} onChange={set("jurisdiction")} className={field} />
              </label>
              <label className={lbl}>
                Target size (USD)
                <input value={v.target} onChange={set("target")} className={field} inputMode="numeric" placeholder="Leave empty if not set" />
              </label>
            </Row>
          </>
        )}
        <Row>
          <label className={lbl}>
            Type
            <select value={v.type} onChange={set("type")} className={field}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Status
            <select value={v.status} onChange={set("status")} className={field}>
              {(["Preparing", "Open", "Subsequent close", "Closed"] as const).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </Row>
        <Row>
          <label className={lbl}>
            Minimum investment
            <input value={v.minimum} onChange={set("minimum")} className={field} placeholder="e.g. $1M" />
          </label>
          <label className={lbl}>
            Opened
            <input type="date" value={v.opened} onChange={set("opened")} className={field} />
          </label>
        </Row>
        <Row>
          <label className={lbl}>
            Next closing
            <input type="date" value={v.closeDate} onChange={set("closeDate")} className={field} />
          </label>
          <label className={lbl}>
            Closing name
            <input value={v.closeLabel} onChange={set("closeLabel")} className={field} />
          </label>
        </Row>
        <label className={lbl}>
          Securities exemption
          <input value={v.exemption} onChange={set("exemption")} className={field} placeholder="As confirmed by counsel" />
        </label>
        <label className={lbl}>
          Investor eligibility
          <input value={v.eligibility} onChange={set("eligibility")} className={field} placeholder="e.g. Qualified purchasers; non-US persons under Regulation S" />
        </label>
        <Row>
          <label className={lbl}>
            Distributed by
            <input value={v.distributor} onChange={set("distributor")} className={field} placeholder="Firm or team" />
          </label>
          <label className={lbl}>
            Their role
            <select value={v.distributorKind} onChange={set("distributorKind")} className={field}>
              {(["Fund manager representative", "Registered broker-dealer", "Placement agent", "Introducer"] as const).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </Row>
        <label className={lbl}>
          Relationship lead
          <select value={v.lead} onChange={set("lead")} className={field}>
            {[...new Set([...TEAM, v.lead])].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
        <button onClick={save} disabled={!ok} className={btnPrimary}>
          {initial ? "Save changes" : "Create offering"}
        </button>
      </div>
    </Dialog>
  );
}

/* ───────── prospect ───────── */

export function PartyForm({ initial, onClose, onSaved }: { initial?: Party; onClose: () => void; onSaved?: (id: string) => void }) {
  const who = usePreviewRole().member.name;
  const onRecord = !!initial?.investor;
  const pref = initial?.preferences;
  const [v, setV] = useState({
    name: initial?.name ?? "",
    type: initial?.type ?? "Family office",
    jurisdiction: initial?.jurisdiction ?? "",
    contact: initial?.contact ?? "",
    email: initial?.email ?? "",
    owner: initial?.owner ?? who,
    source: initial?.source ?? "",
    assetClasses: pref?.assetClasses.join(", ") ?? "",
    regions: pref?.regions.join(", ") ?? "",
    ticket: pref?.ticket ?? "",
    horizon: pref?.horizon ?? "",
    restrictions: pref?.restrictions ?? "",
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const list = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const hasPref = [v.assetClasses, v.regions, v.ticket, v.horizon, v.restrictions].some((x) => x.trim());
  const preferences = hasPref
    ? { assetClasses: list(v.assetClasses), regions: list(v.regions), ticket: v.ticket.trim(), horizon: v.horizon.trim(), restrictions: v.restrictions.trim() }
    : undefined;
  const ok = v.name.trim().length > 1 && v.contact.trim();
  const save = () => {
    if (initial) {
      offering.editParty(initial, onRecord ? { preferences } : { ...v, name: v.name.trim(), preferences }, who);
      onSaved?.(initial.id);
    } else
      onSaved?.(
        offering.createParty(
          {
            name: v.name.trim(),
            type: v.type,
            jurisdiction: v.jurisdiction.trim(),
            contact: v.contact.trim(),
            email: v.email.trim() || undefined,
            owner: v.owner,
            source: v.source.trim() || "Recorded by hand",
            preferences,
          },
          who,
        ),
      );
    onClose();
  };
  return (
    <Dialog
      title={initial ? (onRecord ? `Preferences of ${initial.name}` : `Edit ${initial.name}`) : "Add a prospective investor"}
      sub={
        onRecord
          ? "This investor’s identity comes from Fund Solution and is changed there. Here you record what they’ve told us about their preferences."
          : "A prospect becomes the same record in Fund Solution when it subscribes; nothing is copied."
      }
      onClose={onClose}
      width={640}
    >
      <div className="space-y-3">
        {!onRecord && (
          <>
            <Row>
              <label className={lbl}>
                Legal name
                <input value={v.name} onChange={set("name")} className={field} />
              </label>
              <label className={lbl}>
                Classification
                <select value={v.type} onChange={set("type")} className={field}>
                  {[...new Set([...INVESTOR_TYPES, v.type])].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </Row>
            <Row>
              <label className={lbl}>
                Jurisdiction
                <input value={v.jurisdiction} onChange={set("jurisdiction")} className={field} />
              </label>
              <label className={lbl}>
                Introduced by
                <input value={v.source} onChange={set("source")} className={field} placeholder="Who or how" />
              </label>
            </Row>
            <Row>
              <label className={lbl}>
                Representative
                <input value={v.contact} onChange={set("contact")} className={field} />
              </label>
              <label className={lbl}>
                Email
                <input type="email" value={v.email} onChange={set("email")} className={field} />
              </label>
            </Row>
            <label className={lbl}>
              Relationship owner
              <select value={v.owner} onChange={set("owner")} className={field}>
                {[...new Set([...TEAM, v.owner])].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <div className="pt-1 text-[12px] font-semibold text-d-text-2">Stated preferences</div>
        <Row>
          <label className={lbl}>
            Asset classes
            <input value={v.assetClasses} onChange={set("assetClasses")} className={field} placeholder="Comma separated" />
          </label>
          <label className={lbl}>
            Regions
            <input value={v.regions} onChange={set("regions")} className={field} placeholder="Comma separated" />
          </label>
        </Row>
        <Row>
          <label className={lbl}>
            Typical ticket
            <input value={v.ticket} onChange={set("ticket")} className={field} placeholder="e.g. $5M–$10M" />
          </label>
          <label className={lbl}>
            Horizon
            <input value={v.horizon} onChange={set("horizon")} className={field} />
          </label>
        </Row>
        <label className={lbl}>
          Restrictions
          <input value={v.restrictions} onChange={set("restrictions")} className={field} />
        </label>
        <p className="text-[11.5px] leading-relaxed text-d-text-3">What the investor has said, recorded as stated. It is never an eligibility or suitability decision.</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
        <button onClick={save} disabled={!onRecord && !ok} className={btnPrimary}>
          {initial ? "Save" : "Add prospect"}
        </button>
      </div>
    </Dialog>
  );
}

/* ───────── add to an offering's pipeline ───────── */

export function AddToPipeline({ offeringId, partyId, onClose, onAdded }: { offeringId?: string; partyId?: string; onClose: () => void; onAdded?: (oppId: string) => void }) {
  const d = useOffering();
  const who = usePreviewRole().member.name;
  const open = d.offerings.filter((o) => o.status !== "Closed");
  const [of, setOf] = useState(offeringId ?? open[0]?.id ?? "");
  const [pid, setPid] = useState(partyId ?? "");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<StageId>("identified");
  const [potential, setPotential] = useState("");
  const [owner, setOwner] = useState(who);
  const [action, setAction] = useState("");
  const [due, setDue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const tracked = useMemo(() => new Set(d.opps.filter((o) => o.offeringId === of).map((o) => o.partyId)), [d.opps, of]);
  const choices = d.parties.filter((p) => !tracked.has(p.id) && p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const ok = !!of && !!pid && (!action.trim() || !!due);
  const save = () => {
    const r = offering.addToPipeline(
      d,
      { offeringId: of, partyId: pid, stage, potential: money(potential), owner, next: action.trim() && due ? { action: action.trim(), date: due } : undefined },
      who,
    );
    if (r.existed) return setMsg("This investor is already in the pipeline for this offering.");
    onAdded?.(r.id);
    onClose();
  };
  const picked = d.party(pid);
  return (
    <Dialog
      title="Add an investor to an offering"
      sub="Tracked per offering: the investor’s record is shared, the stage and amounts are specific to this offering."
      onClose={onClose}
    >
      <div className="space-y-3">
        {!offeringId && (
          <label className={lbl}>
            Offering
            <select value={of} onChange={(e) => setOf(e.target.value)} className={field}>
              {open.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {!partyId && (
          <div>
            <div className={lbl}>Investor</div>
            {picked ? (
              <div className="mt-1 flex items-center gap-2 rounded-[8px] border border-d-line px-3 py-2 text-[13px] text-d-text">
                <span className="flex-1">
                  {picked.name} <span className="text-d-text-3">· {picked.investor ? "Investor on record" : "Prospect"}</span>
                </span>
                <button onClick={() => setPid("")} className="text-[12px] text-d-text-3 hover:text-d-text">
                  Change
                </button>
              </div>
            ) : (
              <>
                <input value={q} onChange={(e) => setQ(e.target.value)} className={field} placeholder="Search investors and prospects" aria-label="Search investors" autoFocus />
                <ul className="mt-1 max-h-[220px] overflow-y-auto rounded-[8px] border border-d-line">
                  {choices.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => setPid(p.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-d-raise">
                        <span className="flex-1 text-d-text">{p.name}</span>
                        <span className="text-[11.5px] text-d-text-3">{p.investor ? "On record" : "Prospect"}</span>
                      </button>
                    </li>
                  ))}
                  {!choices.length && <li className="px-3 py-2 text-[12.5px] text-d-text-3">No match not already in this offering’s pipeline. Add the prospect first.</li>}
                </ul>
              </>
            )}
          </div>
        )}
        <Row>
          <label className={lbl}>
            Stage
            <select value={stage} onChange={(e) => setStage(e.target.value as StageId)} className={field}>
              {HAND_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGES.find((x) => x.id === s)!.label}
                </option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Potential investment (USD)
            <input value={potential} onChange={(e) => setPotential(e.target.value)} className={field} inputMode="numeric" placeholder="Optional" />
          </label>
        </Row>
        <label className={lbl}>
          Relationship owner
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={field}>
            {[...new Set([...TEAM, owner])].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <Row>
          <label className={lbl}>
            First follow-up
            <input value={action} onChange={(e) => setAction(e.target.value)} className={field} placeholder="e.g. Introductory call" />
          </label>
          <label className={lbl}>
            Due
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
          </label>
        </Row>
        <p className="text-[11.5px] leading-relaxed text-d-text-3">
          NDA executed, subscriptions, accepted commitments and funding come from the agreements, Fund Solution and the books, so they can’t be entered here.
        </p>
        {msg && <p className="text-[12.5px] text-negative">{msg}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
        <button onClick={save} disabled={!ok} className={btnPrimary}>
          Add to pipeline
        </button>
      </div>
    </Dialog>
  );
}

/* ───────── in the drawer: amounts and follow-ups ───────── */

export function AmountsEditor({ opp, onDone }: { opp: Opportunity; onDone: () => void }) {
  const who = usePreviewRole().member.name;
  const s = (n?: number) => (n === undefined ? "" : String(n));
  const [v, setV] = useState({ potential: s(opp.amounts.potential), indicative: s(opp.amounts.indicative), soft: s(opp.amounts.soft) });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="rounded-[10px] border border-d-line p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {(
          [
            ["potential", "Potential"],
            ["indicative", "Indicated"],
            ["soft", "Soft commitment"],
          ] as const
        ).map(([k, l]) => (
          <label key={k} className={lbl}>
            {l}
            <input value={v[k]} onChange={set(k)} className={field} inputMode="numeric" placeholder="—" />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
        What the investor told us, in USD. Accepted, called and received amounts come from the subscription and the books.
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onDone} className="h-8 rounded-[8px] px-3 text-[12.5px] text-d-text-3 hover:text-d-text">
          Cancel
        </button>
        <button
          onClick={() => {
            offering.setAmounts(opp, { potential: money(v.potential), indicative: money(v.indicative), soft: money(v.soft) }, who);
            onDone();
          }}
          className="h-8 rounded-[8px] bg-brand px-3 text-[12.5px] font-semibold text-brand-ink"
        >
          Save amounts
        </button>
      </div>
    </div>
  );
}

export function FollowUps({ d, opp, partyId, offeringId }: { d: OfferingData; opp?: Opportunity; partyId: string; offeringId?: string }) {
  const who = usePreviewRole().member.name;
  const [adding, setAdding] = useState(false);
  const [action, setAction] = useState("");
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState(opp?.owner ?? who);
  const list = d.followUps.filter((f) => (opp ? f.oppId === opp.id : f.partyId === partyId)).sort((a, b) => Number(!!a.done) - Number(!!b.done) || a.due.localeCompare(b.due));
  return (
    <div>
      <ul className="divide-y divide-d-line-soft">
        {list.map((f) => (
          <FollowUpRow key={f.id} f={f} d={d} showContext={!opp} />
        ))}
        {!list.length && !adding && <li className="py-1 text-[12.5px] text-d-text-3">No follow-ups scheduled.</li>}
      </ul>
      {adding ? (
        <div className="mt-2 rounded-[10px] border border-d-line p-3">
          <label className={lbl}>
            Follow-up
            <input value={action} onChange={(e) => setAction(e.target.value)} className={field} placeholder="e.g. Send the side letter draft" autoFocus />
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className={lbl}>
              Due
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
            </label>
            <label className={lbl}>
              Owner
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className={field}>
                {[...new Set([...TEAM, owner])].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="h-8 rounded-[8px] px-3 text-[12.5px] text-d-text-3 hover:text-d-text">
              Cancel
            </button>
            <button
              disabled={!action.trim() || !due}
              onClick={() => {
                offering.addFollowUp({ oppId: opp?.id, partyId, offeringId: opp?.offeringId ?? offeringId, action: action.trim(), due, owner }, who);
                setAction("");
                setDue("");
                setAdding(false);
              }}
              className="h-8 rounded-[8px] bg-brand px-3 text-[12.5px] font-semibold text-brand-ink disabled:opacity-40"
            >
              Schedule
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-1.5 text-[12.5px] font-semibold text-d-text-2 hover:text-d-text">
          + Add a follow-up
        </button>
      )}
    </div>
  );
}

export function FollowUpRow({ f, d, showContext, onOpen }: { f: OfferingData["followUps"][number]; d: OfferingData; showContext?: boolean; onOpen?: () => void }) {
  const who = usePreviewRole().member.name;
  const days = Math.round((Date.parse(`${f.due}T12:00:00Z`) - Date.parse(`${TODAY}T12:00:00Z`)) / 864e5);
  const party = d.party(f.partyId);
  const of = f.offeringId ? d.offering(f.offeringId) : undefined;
  return (
    <li className="flex items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={!!f.done}
        onChange={() => (f.done ? offering.reopenFollowUp(f.id, who) : offering.completeFollowUp(f.id, who))}
        aria-label={f.done ? `Reopen: ${f.action}` : `Mark done: ${f.action}`}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-up)]"
      />
      <button onClick={onOpen} disabled={!onOpen} className="min-w-0 flex-1 text-left disabled:cursor-default">
        <span className={cx("block text-[13px]", f.done ? "text-d-text-3 line-through" : "text-d-text")}>{f.action}</span>
        <span className="block text-[11.5px] text-d-text-3">
          {showContext && (
            <>
              {party?.name}
              {of ? ` · ${of.short}` : ""} ·{" "}
            </>
          )}
          {f.owner}
          {f.done ? ` · done by ${f.done.by}` : ""}
        </span>
      </button>
      <span className={cx("tnum shrink-0 text-[12px]", f.done ? "text-d-text-3" : days < 0 ? "text-negative" : days <= 1 ? "text-gold-700" : "text-d-text-3")}>
        {f.done ? "" : days < 0 ? `${-days}d overdue` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : dayShort(f.due)}
      </span>
    </li>
  );
}
