"use client";

import { createContext, useContext } from "react";
import type { ChatState } from "@/lib/chat-store";
import type { ChatAttachment, Filters, Matter, MatterStatus, Priority, ReactionKey } from "@/lib/chat";

export type Nav = { kind: "inbox" } | { kind: "assigned" } | { kind: "mentions" } | { kind: "drafts" } | { kind: "view"; id: string } | { kind: "conv"; id: string };
export type PropMenu = null | "status" | "owner" | "priority" | "due";

export type ChatApi = {
  s: ChatState;
  now: number;
  nav: Nav;
  setNav: (n: Nav) => void;
  selected: string | null;
  select: (id: string | null) => void;
  q: string;
  setQ: (q: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  group: "status" | "linked";
  setGroup: (g: "status" | "linked") => void;
  sort: "updated" | "due" | "priority";
  setSort: (s: "updated" | "due" | "priority") => void;
  rail: boolean;
  setRail: (v: boolean) => void;
  thread: string | null;
  setThread: (id: string | null) => void;
  propMenu: PropMenu;
  setPropMenu: (p: PropMenu) => void;
  openCmd: () => void;
  openNew: (prefill?: { title?: string; from?: string }) => void;
  focusComposer: () => void;
  flash: (t: string) => void;
  mobilePane: "list" | "detail";
  setMobilePane: (p: "list" | "detail") => void;
  // actions
  send: (where: string, body: string, attachments: ChatAttachment[], replyTo?: string) => void;
  setStatus: (id: string, st: MatterStatus) => void;
  setOwner: (id: string, owner: string) => void;
  setPriority: (id: string, p: Priority) => void;
  setDue: (id: string, d: string) => void;
  decide: (id: string, decision: "approved" | "rejected", note?: string) => void;
  canDecide: (m: Matter) => { ok: boolean; why?: string };
  editMessage: (id: string, body: string) => void;
  react: (id: string, key: ReactionKey) => void;
  setDraft: (where: string, text: string) => void;
  inboxAct: (id: string, act: "read" | "unread" | "done" | "snooze-1h" | "snooze-tomorrow" | "snooze-week") => void;
  markConvRead: (where: string) => void;
  saveView: (name: string) => void;
  createMatter: (m: { title: string; linkedFrom?: string; status?: MatterStatus; priority?: Priority }) => string;
  convert: (msgId: string, to: "matter" | "task" | "qa") => void;
};

export const ChatCtx = createContext<ChatApi | null>(null);
export function useChat() {
  const c = useContext(ChatCtx);
  if (!c) throw new Error("useChat outside CorporateChat");
  return c;
}
