/**
 * Onboarding checklists: a named list of requests sent to a client (documents, forms, signatures, identity),
 * each reviewed by the office — accepted, or returned with a reason the client sees. One checklist per process;
 * templates make the same process repeatable. Stored in this browser for now (Supabase in P4); every decision is a
 * ledger event, so it appears in the activity feed and in any Corporate Chat matter linked to the checklist.
 */
import { emit } from "./spine";

export type ItemKind = "document" | "identity" | "form" | "signature";
export const KIND_LABEL: Record<ItemKind, string> = { document: "Document", identity: "Identity", form: "Form", signature: "Signature" };
export type ItemStatus = "requested" | "submitted" | "accepted" | "rejected";
export const STATUS_LABEL: Record<ItemStatus, string> = { requested: "To provide", submitted: "In review", accepted: "Accepted", rejected: "Returned" };

export type TemplateItem = { key: string; label: string; kind: ItemKind; section: string; help?: string; person?: string; fields?: string[]; expires?: boolean };
export type Template = { id: string; name: string; about: string; items: TemplateItem[] };

export type Upload = { name: string; at: string; by: string; v: number };
export type Item = TemplateItem & {
  status: ItemStatus;
  uploads: Upload[];
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  answers?: Record<string, string>;
  signedBy?: string;
  /** identity documents: when the document itself expires */
  docExpires?: string;
};
export type Checklist = {
  id: string;
  org: string;
  client: string;
  title: string;
  template: string;
  reviewer: string;
  created: string;
  due: string;
  reminders: string[];
  items: Item[];
};

export const TEMPLATES: Template[] = [
  {
    id: "mfo",
    name: "Multi-Family onboarding",
    about: "Identity of each family member, the structure, source of wealth, the advisory agreement.",
    items: [
      {
        key: "id-principal",
        label: "Passport — family principal",
        kind: "identity",
        section: "People",
        person: "principal",
        expires: true,
        help: "A colour scan of the photo page. Must be valid for at least six months.",
      },
      {
        key: "addr-principal",
        label: "Proof of address — family principal",
        kind: "document",
        section: "People",
        help: "A utility bill or bank statement dated within the last three months.",
      },
      { key: "trust-deed", label: "Trust deed and amendments", kind: "document", section: "Structure" },
      { key: "org-chart", label: "Ownership chart", kind: "document", section: "Structure", help: "Every entity from the family to the assets, with percentages." },
      { key: "entity-docs", label: "Certificates of incorporation of the holding companies", kind: "document", section: "Structure" },
      {
        key: "sow",
        label: "Source of wealth",
        kind: "form",
        section: "Compliance",
        fields: ["How was the family's wealth created?", "Main sources over the last five years", "Expected annual inflows"],
      },
      { key: "statements", label: "Latest statements from each bank and custodian", kind: "document", section: "Wealth" },
      { key: "agreement", label: "Advisory and reporting agreement", kind: "signature", section: "Agreement" },
    ],
  },
  {
    id: "formation",
    name: "Company formation",
    about: "What we need from the owners before filing a new company.",
    items: [
      { key: "id-owner", label: "Passport — each owner", kind: "identity", section: "Owners", expires: true, help: "A colour scan of the photo page." },
      { key: "addr-owner", label: "Proof of address — each owner", kind: "document", section: "Owners", help: "Dated within the last three months." },
      { key: "questionnaire", label: "Formation questionnaire", kind: "form", section: "Company", fields: ["Proposed company name", "Business activity", "Ownership split"] },
      { key: "org-chart", label: "Ownership chart", kind: "document", section: "Company" },
      { key: "engagement", label: "Engagement letter", kind: "signature", section: "Agreement" },
    ],
  },
  {
    id: "kyc-refresh",
    name: "Annual KYC refresh",
    about: "Re-confirms identity, address and source of wealth once a year, or when a document expires.",
    items: [
      { key: "id", label: "Passport", kind: "identity", section: "People", expires: true },
      { key: "addr", label: "Proof of address", kind: "document", section: "People", help: "Dated within the last three months." },
      {
        key: "sow",
        label: "Source of wealth — changes this year",
        kind: "form",
        section: "Compliance",
        fields: ["Any change in the sources of wealth?", "Significant inflows or outflows expected"],
      },
      { key: "trust-cert", label: "Certificate of trust", kind: "document", section: "Structure" },
    ],
  },
];

const it = (t: TemplateItem, s: Partial<Item>): Item => ({ ...t, status: "requested", uploads: [], ...s });
const tpl = (id: string) => TEMPLATES.find((t) => t.id === id)!;
const k = (id: string, key: string) => tpl(id).items.find((i) => i.key === key)!;

export const SEED: Checklist[] = [
  {
    id: "cl-halvorsen-2026",
    org: "halvorsen",
    client: "Halvorsen Family",
    title: "Annual KYC refresh 2026",
    template: "kyc-refresh",
    reviewer: "Helena Costa",
    created: "2026-11-02",
    due: "2026-12-15",
    reminders: ["2026-11-16"],
    items: [
      it(
        { ...k("kyc-refresh", "id"), key: "id-victoria", label: "Passport — Victoria Halvorsen" },
        {
          status: "accepted",
          uploads: [{ name: "passport-victoria.pdf", at: "2026-11-05", by: "Victoria Halvorsen", v: 1 }],
          reviewedBy: "Helena Costa",
          reviewedAt: "2026-11-06",
          docExpires: "2031-04-18",
        },
      ),
      it(
        { ...k("kyc-refresh", "id"), key: "id-erik", label: "Passport — Erik Halvorsen", help: "The passport on file expires on 1 Dec 2026; please send the renewed one." },
        { status: "requested" },
      ),
      it(
        { ...k("kyc-refresh", "addr"), label: "Proof of address — Victoria Halvorsen" },
        {
          status: "rejected",
          uploads: [{ name: "fpl-bill-jul.pdf", at: "2026-11-05", by: "Victoria Halvorsen", v: 1 }],
          reason: "The bill is dated July; we need one from the last three months.",
          reviewedBy: "Helena Costa",
          reviewedAt: "2026-11-06",
        },
      ),
      it(k("kyc-refresh", "sow"), {
        status: "submitted",
        answers: {
          "Any change in the sources of wealth?": "Sale of a 10% stake in Halvorsen Marine AS is being discussed; nothing agreed.",
          "Significant inflows or outflows expected": "Capital calls of about $650,000 over the next quarter.",
        },
        uploads: [{ name: "Form answers", at: "2026-11-20", by: "Victoria Halvorsen", v: 1 }],
      }),
      it(k("kyc-refresh", "trust-cert"), {
        status: "accepted",
        uploads: [{ name: "certificate-of-trust-2026.pdf", at: "2026-11-04", by: "Helena Costa", v: 1 }],
        reviewedBy: "Helena Costa",
        reviewedAt: "2026-11-04",
      }),
    ],
  },
  {
    id: "cl-valenca-onb",
    org: "valenca",
    client: "Valença Family",
    title: "Northbridge onboarding",
    template: "mfo",
    reviewer: "Sam Ito",
    created: "2026-05-12",
    due: "2026-06-30",
    reminders: [],
    items: tpl("mfo").items.map((t) =>
      t.key === "statements"
        ? it(t, { status: "submitted", uploads: [{ name: "btg-nov-2026.pdf", at: "2026-11-22", by: "Pedro Valença", v: 3 }] })
        : it(t, {
            status: "accepted",
            uploads: [{ name: `${t.key}.pdf`, at: "2026-05-20", by: "Pedro Valença", v: 1 }],
            reviewedBy: "Sam Ito",
            reviewedAt: "2026-05-22",
            signedBy: t.kind === "signature" ? "Ricardo Valença" : undefined,
          }),
    ),
  },
  {
    id: "cl-cascade-form",
    org: "cascade",
    client: "Cascade Ridge",
    title: "Company formation — Cascade Ridge Holdings LLC",
    template: "formation",
    reviewer: "Luiza Andrade",
    created: "2026-11-10",
    due: "2026-12-05",
    reminders: [],
    items: [
      it(
        { ...k("formation", "id-owner"), label: "Passport — Tom Ashford" },
        {
          status: "accepted",
          uploads: [{ name: "passport-ashford.pdf", at: "2026-11-11", by: "Tom Ashford", v: 1 }],
          reviewedBy: "Luiza Andrade",
          reviewedAt: "2026-11-12",
          docExpires: "2029-08-02",
        },
      ),
      it(
        { ...k("formation", "addr-owner"), label: "Proof of address — Tom Ashford" },
        { status: "submitted", uploads: [{ name: "bank-statement-oct.pdf", at: "2026-11-23", by: "Tom Ashford", v: 1 }] },
      ),
      it(k("formation", "questionnaire"), {
        status: "accepted",
        answers: {
          "Proposed company name": "Cascade Ridge Holdings LLC",
          "Business activity": "Holding of real estate investments",
          "Ownership split": "Tom Ashford 60% · Claire Ashford 40%",
        },
        uploads: [{ name: "Form answers", at: "2026-11-11", by: "Tom Ashford", v: 1 }],
        reviewedBy: "Luiza Andrade",
        reviewedAt: "2026-11-12",
      }),
      it({ ...k("formation", "id-owner"), key: "id-claire", label: "Passport — Claire Ashford" }, { status: "requested" }),
      it(k("formation", "org-chart"), { status: "requested" }),
      it(k("formation", "engagement"), { status: "requested" }),
    ],
  },
  {
    id: "cl-altamira-onb",
    org: "altamira",
    client: "Altamira Holdings",
    title: "Multi-Family onboarding",
    template: "mfo",
    reviewer: "Helena Costa",
    created: "2026-11-24",
    due: "2026-12-20",
    reminders: [],
    items: tpl("mfo").items.map((t) => it(t, {})),
  },
];

const KEY = "aurum-checklists-v1";
export const CHECKLIST_EVENT = "aurum-checklists";

export function loadChecklists(): Checklist[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Checklist[]) : SEED;
  } catch {
    return SEED;
  }
}
function save(all: Checklist[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  window.dispatchEvent(new CustomEvent(CHECKLIST_EVENT));
}

export const progress = (c: Checklist) => {
  const n = c.items.length;
  const accepted = c.items.filter((i) => i.status === "accepted").length;
  const review = c.items.filter((i) => i.status === "submitted").length;
  const returned = c.items.filter((i) => i.status === "rejected").length;
  return { n, accepted, review, returned, open: n - accepted - review, done: accepted === n };
};

const today = () => new Date().toISOString().slice(0, 10);

function update(id: string, key: string, fn: (i: Item) => Item, ev: { actor: string; type: string; text: string; visibility?: "internal" | "client" }) {
  const all = loadChecklists();
  const c = all.find((x) => x.id === id);
  if (!c) return;
  c.items = c.items.map((i) => (i.key === key ? fn(i) : i));
  save(all);
  emit({ actor: ev.actor, type: ev.type, ref: { kind: "checklist", id }, text: ev.text, visibility: ev.visibility ?? "client" });
}

/** The client provides an item: a file, form answers, or a signature. A returned item goes back into review. */
export function submit(id: string, key: string, by: string, payload: { file?: string; answers?: Record<string, string>; sign?: boolean }) {
  update(
    id,
    key,
    (i) => ({
      ...i,
      status: "submitted",
      reason: undefined,
      answers: payload.answers ?? i.answers,
      signedBy: payload.sign ? by : i.signedBy,
      uploads: [...i.uploads, { name: payload.file ?? (payload.sign ? `Signed by ${by}` : "Form answers"), at: today(), by, v: i.uploads.length + 1 }],
    }),
    { actor: by, type: "checklist.submitted", text: `${by} provided “${labelOf(id, key)}”.` },
  );
}
export function accept(id: string, key: string, by: string) {
  update(id, key, (i) => ({ ...i, status: "accepted", reason: undefined, reviewedBy: by, reviewedAt: today() }), {
    actor: by,
    type: "checklist.accepted",
    text: `${by} accepted “${labelOf(id, key)}”.`,
  });
}
export function reject(id: string, key: string, by: string, reason: string) {
  update(id, key, (i) => ({ ...i, status: "rejected", reason, reviewedBy: by, reviewedAt: today() }), {
    actor: by,
    type: "checklist.returned",
    text: `${by} returned “${labelOf(id, key)}”: ${reason}`,
  });
}
export function remind(id: string, by: string) {
  const all = loadChecklists();
  const c = all.find((x) => x.id === id);
  if (!c) return;
  c.reminders = [...c.reminders, today()];
  save(all);
  const p = progress(c);
  emit({
    actor: by,
    type: "checklist.reminded",
    ref: { kind: "checklist", id },
    text: `Reminder sent to ${c.client}: ${p.open} item${p.open === 1 ? "" : "s"} still to provide.`,
    visibility: "client",
  });
}
export function startChecklist(org: string, client: string, templateId: string, reviewer: string, due: string) {
  const t = tpl(templateId);
  const c: Checklist = {
    id: `cl-${org}-${Date.now().toString(36)}`,
    org,
    client,
    title: t.name,
    template: t.id,
    reviewer,
    created: today(),
    due,
    reminders: [],
    items: t.items.map((x) => it(x, {})),
  };
  save([c, ...loadChecklists()]);
  emit({
    actor: reviewer,
    type: "checklist.sent",
    ref: { kind: "checklist", id: c.id },
    text: `${t.name} checklist sent to ${client} (${t.items.length} items, due ${due}).`,
    visibility: "client",
  });
  return c;
}
function labelOf(id: string, key: string) {
  return (
    loadChecklists()
      .find((c) => c.id === id)
      ?.items.find((i) => i.key === key)?.label ?? key
  );
}

/** Identity documents that expire within `days` — re-requested before they lapse. */
export function expiringIds(all: Checklist[], asOf: string, days = 60) {
  const limit = Date.parse(asOf) + days * 864e5;
  return all.flatMap((c) => c.items.filter((i) => i.docExpires && Date.parse(i.docExpires) <= limit).map((i) => ({ c, i })));
}
