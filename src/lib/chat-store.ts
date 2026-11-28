/**
 * Corporate Chat persistence for the preview: one versioned key in this browser, safely parsed, reseeded when
 * the shape changes. Also the bridges to other modules (PMO plans, data-room Q&A) and the inbox selectors.
 */
import {
  VIEWER,
  clientWaiting,
  defaultViews,
  isExternal,
  orgOf,
  parseMentions,
  personName,
  seedChannels,
  seedDirects,
  seedInboxState,
  seedMatters,
  seedMessages,
  type Channel,
  type ChatMessage,
  type Direct,
  type InboxState,
  type Matter,
  type SavedView,
} from "./chat";
import { loadPlans, planFolders, plans as seedPlans, savePlans, type PlanRow } from "./plans";

export const CHAT_KEY = "aurum-chat-v1";
const VERSION = 5;

export type ChatState = {
  v: number;
  matters: Matter[];
  messages: ChatMessage[];
  channels: Channel[];
  directs: Direct[];
  inbox: Record<string, InboxState>;
  views: SavedView[];
  drafts: Record<string, string>;
  read: Record<string, string>; // conversation id → last read timestamp
};

export function seedState(): ChatState {
  // A matter left "Awaiting client" after the client has answered goes back to the team.
  const matters = seedMatters.map((m) => (m.status === "Awaiting client" && clientWaiting(m.id, seedMessages) ? { ...m, status: "Open" as const } : m));
  return {
    v: VERSION,
    matters,
    messages: seedMessages,
    channels: seedChannels,
    directs: seedDirects,
    inbox: seedInboxState,
    views: defaultViews,
    drafts: { "mt-cc3": "Lucas — happy to walk through it. Rafael will " },
    read: { "ch-fund-ops": "2026-11-24T00:00:00Z", "ch-corporate": "2026-11-25T00:00:00Z", "ch-compliance": "2026-11-25T00:00:00Z", "dm-rafael": "2026-11-25T00:00:00Z" },
  };
}

export function loadChat(): ChatState {
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    if (!raw) return seedState();
    const s = JSON.parse(raw) as ChatState;
    if (s.v !== VERSION || !Array.isArray(s.matters) || !Array.isArray(s.messages)) return seedState();
    // Channels added to the seed after this browser saved its copy (e.g. #pmo) join without losing anything,
    // and seeded channels pick up the room they belong to.
    const known = new Set(s.channels.map((c) => c.id));
    s.channels = [...s.channels.map((c) => ({ ...c, home: c.home ?? seedChannels.find((x) => x.id === c.id)?.home })), ...seedChannels.filter((c) => !known.has(c.id))];
    return s;
  } catch {
    return seedState();
  }
}

export function saveChat(s: ChatState) {
  try {
    window.localStorage.setItem(CHAT_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("aurum-chat"));
  } catch {
    /* storage unavailable: changes last for this visit */
  }
}

/** Post into a conversation from another module (e.g. PMO "Send to Corporate Chat"). */
export function postToChat(where: string, body: string, author = VIEWER) {
  const s = loadChat();
  s.messages = [...s.messages, { id: `m${Date.now().toString(36)}`, where, author, at: new Date().toISOString(), body, kind: "message" }];
  s.matters = s.matters.map((m) => (m.id === where ? { ...m, updatedAt: new Date().toISOString() } : m));
  saveChat(s);
}

/* ───────────────────────── inbox ───────────────────────── */

export type InboxItem = {
  id: string;
  where: string;
  at: string;
  reason: "Mention" | "Assigned" | "Approval requested" | "Status change" | "Client reply";
  text: string;
  author: string;
};

export function inboxItems(s: ChatState): InboxItem[] {
  const mine = new Set(s.matters.filter((m) => m.participants.includes(VIEWER)).map((m) => m.id));
  const items: InboxItem[] = [];
  for (const m of s.messages) {
    if (m.author === VIEWER) continue;
    const text = m.kind === "event" ? `${personName(m.author)} ${m.body}` : m.body;
    if (m.kind === "message" && m.mentions?.includes(VIEWER)) items.push({ id: m.id, where: m.where, at: m.at, reason: "Mention", text, author: m.author });
    else if (mine.has(m.where) && m.kind === "event" && m.body === "requested approval") {
      const mt = s.matters.find((x) => x.id === m.where);
      if (mt?.requestedBy !== VIEWER) items.push({ id: m.id, where: m.where, at: m.at, reason: "Approval requested", text, author: m.author });
    } else if (mine.has(m.where) && m.kind === "event" && /^(changed status|set the owner to Luiza)/.test(m.body))
      items.push({ id: m.id, where: m.where, at: m.at, reason: m.body.startsWith("set the owner") ? "Assigned" : "Status change", text, author: m.author });
    else if (mine.has(m.where) && m.kind === "message" && isExternal(m.author) && !m.replyTo)
      items.push({ id: m.id, where: m.where, at: m.at, reason: "Client reply", text, author: m.author });
  }
  for (const mt of s.matters)
    if (mt.owner === VIEWER && mt.status !== "Resolved")
      items.push({ id: "own-" + mt.id, where: mt.id, at: mt.createdAt, reason: "Assigned", text: `You own ${mt.ref} · ${mt.title}`, author: mt.owner });
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

export function visibleInbox(s: ChatState, now = new Date().toISOString()) {
  return inboxItems(s).filter((i) => {
    const st = s.inbox[i.id];
    return !st?.done && !(st?.snoozedUntil && st.snoozedUntil > now);
  });
}

export function counts(s: ChatState) {
  const inbox = visibleInbox(s);
  return {
    inbox: inbox.filter((i) => !s.inbox[i.id]?.read).length,
    assigned: s.matters.filter((m) => m.owner === VIEWER && m.status !== "Resolved").length,
    mentions: s.messages.filter((m) => m.mentions?.includes(VIEWER) && !s.inbox[m.id]?.done).length,
    drafts: Object.values(s.drafts).filter((d) => d.trim()).length,
  };
}

/** Unread messages in a channel or direct conversation. */
export function unread(s: ChatState, where: string) {
  const since = s.read[where] ?? "2026-11-24T00:00:00Z";
  return s.messages.filter((m) => m.where === where && m.author !== VIEWER && !m.replyTo && m.at > since).length;
}

/* ───────────────────────── PMO bridge ───────────────────────── */

/** Add a task (or a party request) to a project plan, stored where the PMO workspace reads it. */
export function addPlanRow(planId: string, title: string, opts: { party?: string; owner?: string; deliverable?: string; deadline?: string }) {
  const data = loadPlans() ?? { plans: seedPlans, folders: planFolders };
  const plan = data.plans.find((p) => p.id === planId);
  if (!plan) return null;
  const topics = plan.rows.filter((r) => !r.id.includes("."));
  // Requests and chat tasks collect under one topic per plan.
  let topic = topics.find((t) => t.title === "From Concourse");
  const rows = [...plan.rows];
  if (!topic) {
    topic = { id: String(Math.max(...topics.map((t) => Number(t.id))) + 1), title: "From Concourse", party: "aurum", dependsOn: [] };
    rows.push(topic);
  }
  const n = rows.filter((r) => r.id.startsWith(topic!.id + ".") && r.id.split(".").length === 2).length + 1;
  const row: PlanRow = {
    id: `${topic.id}.${n}`,
    title,
    party: opts.party ?? "aurum",
    owner: opts.owner,
    dependsOn: [],
    priority: "Medium",
    status: "Not started",
    start: new Date().toISOString().slice(0, 10),
    deadline: opts.deadline,
    deliverable: opts.deliverable,
  };
  rows.push(row);
  savePlans({ ...data, plans: data.plans.map((p) => (p.id === planId ? { ...p, rows } : p)) });
  return { row, plan };
}

/** PMO "Send to Corporate Chat": post a party request into the plan's matter, opening one if the plan has none. */
export function postPlanRequest(planId: string, planName: string, text: string) {
  const s = loadChat();
  const at = new Date().toISOString();
  let m = s.matters.find((x) => x.linked.kind === "plan" && x.linked.id === planId);
  if (!m) {
    const used = s.matters.filter((x) => x.ref.startsWith("PLN-")).map((x) => Number(x.ref.split("-")[1]) || 0);
    m = {
      id: `mt-${Date.now().toString(36)}`,
      ref: `PLN-${Math.max(0, ...used) + 1}`,
      title: `${planName} — outstanding deliverables`,
      status: "Awaiting client",
      priority: "Normal",
      owner: VIEWER,
      participants: [VIEWER],
      linked: { kind: "plan", id: planId, label: planName },
      labels: ["Project plan"],
      createdAt: at,
      updatedAt: at,
    };
    s.matters = [m, ...s.matters];
  }
  s.messages = [...s.messages, { id: `m${Date.now().toString(36)}`, where: m.id, author: VIEWER, at, body: text, kind: "message" }];
  s.matters = s.matters.map((x) => (x.id === m!.id ? { ...x, status: "Awaiting client", updatedAt: at } : x));
  saveChat(s);
  return m;
}

/* ───────────────────────── the client side ───────────────────────── */

/**
 * What a person outside the firm may see: matters and channels that include someone from their own
 * organisation, and their direct conversations. Internal notes and the firm's system events never leave the firm.
 */
export function conversationsFor(s: ChatState, personId: string) {
  const org = orgOf(personId);
  const ours = (ids: string[]) => ids.includes(personId) || ids.some((id) => isExternal(id) && orgOf(id) === org);
  return {
    matters: s.matters.filter((m) => ours(m.participants)),
    channels: s.channels.filter((c) => c.external && ours(c.members)),
    directs: s.directs.filter((d) => d.members.includes(personId)),
  };
}
export const clientVisible = (m: ChatMessage) => m.kind === "message" && !m.internal;
export const portalReadKey = (personId: string, where: string) => `p:${personId}:${where}`;

/** A message written in a portal. A matter waiting on the client comes back to the firm's team. */
export function postFromPortal(personId: string, where: string, body: string, replyTo?: string) {
  const s = loadChat();
  const at = new Date().toISOString();
  const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const m = s.matters.find((x) => x.id === where);
  const back = m?.status === "Awaiting client";
  s.messages = [
    ...s.messages,
    { id, where, author: personId, at, body: body.trim(), kind: "message", replyTo, mentions: parseMentions(body) },
    ...(back ? [{ id: id + "-e", where, author: "system", at, body: `marked this Open — ${personName(personId)} replied`, kind: "event" as const }] : []),
  ];
  s.matters = s.matters.map((x) => (x.id === where ? { ...x, updatedAt: at, status: back ? "Open" : x.status } : x));
  s.read = { ...s.read, [portalReadKey(personId, where)]: at };
  saveChat(s);
}

export function markPortalRead(personId: string, where: string) {
  const s = loadChat();
  s.read = { ...s.read, [portalReadKey(personId, where)]: new Date().toISOString() };
  saveChat(s);
}
