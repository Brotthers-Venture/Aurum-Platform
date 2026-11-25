"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cx } from "@/components/ui";
import { WorkstationTopBar } from "@/components/shell/WorkstationTopBar";
import { useBrand } from "@/components/brand/BrandProvider";
import { recordAudit } from "@/lib/audit-local";
import { addPlanRow, loadChat, saveChat, type ChatState } from "@/lib/chat-store";
import { draftLocalAnswer } from "@/lib/dataroom-local";
import { questions as roomQuestions } from "@/lib/dataroom";
import { plans } from "@/lib/plans";
import {
  MATTER_STATUSES,
  PREFIX,
  PRIORITIES,
  VIEWER,
  chatPeople,
  parseMentions,
  parseRefs,
  personName,
  type ChatAttachment,
  type ChatMessage,
  type Filters,
  type Matter,
  type MatterStatus,
  type Priority,
  type ReactionKey,
} from "@/lib/chat";
import { ChatCtx, type ChatApi, type Nav, type PropMenu } from "./context";
import { Sidebar } from "./Sidebar";
import { ListPane } from "./ListPane";
import { Detail } from "./Detail";
import { CommandMenu } from "./CommandMenu";
import { NewMatterDialog, ShortcutSheet } from "./Dialogs";

const uid = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const iso = () => new Date().toISOString();

function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1" aria-busy="true" aria-label="Loading Corporate Chat">
      <div className="hidden w-[232px] shrink-0 space-y-2 border-r border-d-line bg-d-chrome p-4 lg:block">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-5 animate-pulse rounded-[3px] bg-d-raise" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
        ))}
      </div>
      <div className="w-full max-w-[380px] shrink-0 space-y-3 border-r border-d-line p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-4/5 animate-pulse rounded-[3px] bg-d-raise" />
            <div className="h-3 w-1/2 animate-pulse rounded-[3px] bg-d-raise/70" />
          </div>
        ))}
      </div>
      <div className="hidden flex-1 p-8 md:block">
        <div className="h-5 w-2/5 animate-pulse rounded-[3px] bg-d-raise" />
      </div>
    </div>
  );
}

/**
 * Corporate Chat — matters, channels and direct conversations in one keyboard-first workstation.
 * State lives in this browser (lib/chat-store) until the database is connected.
 */
export function CorporateChat() {
  const params = useSearchParams();
  const { brand } = useBrand();
  const [s, setS] = useState<ChatState | null>(null);
  const [now, setNow] = useState(0);
  const [nav, setNavState] = useState<Nav>({ kind: "view", id: "v-open" });
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>({ status: "open" });
  const [group, setGroup] = useState<"status" | "linked">("status");
  const [sort, setSort] = useState<"updated" | "due" | "priority">("updated");
  const [rail, setRail] = useState(true);
  const [thread, setThread] = useState<string | null>(null);
  const [propMenu, setPropMenu] = useState<PropMenu>(null);
  const [cmd, setCmd] = useState(false);
  const [help, setHelp] = useState(false);
  const [newM, setNewM] = useState<null | { title?: string; from?: string }>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "detail">("list");
  const [side, setSide] = useState(false);
  const gPending = useRef(false);

  // Load after mount (storage is browser-only), then keep a clock for relative times.
  useEffect(() => {
    const loaded = loadChat();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(loaded);
    setNow(Date.now());
    setRail(window.innerWidth >= 1280);
    const m = params.get("m");
    if (m && loaded.matters.some((x) => x.id === m)) {
      setSelected(m);
      setMobilePane("detail");
    } else {
      const first = [...loaded.matters].filter((x) => x.status !== "Resolved").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      setSelected(first?.id ?? null);
    }
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [params]);

  const commit = useCallback((fn: (st: ChatState) => ChatState) => {
    setS((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveChat(next);
      return next;
    });
  }, []);

  const flash = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? null : x)), 3200);
  }, []);

  const event = (where: string, body: string): ChatMessage => ({ id: uid(), where, author: VIEWER, at: iso(), body, kind: "event" });
  const touch = (st: ChatState, id: string, patch: Partial<Matter>, ev?: string): ChatState => ({
    ...st,
    matters: st.matters.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: iso() } : m)),
    messages: ev ? [...st.messages, event(id, ev)] : st.messages,
  });
  const matterById = (id: string) => s?.matters.find((m) => m.id === id);

  const audit = (action: string, m: Matter | undefined, detail: string) => recordAudit({ user: personName(VIEWER), action, object: `Corporate Chat · ${m?.ref ?? ""} ${m?.title ?? ""} · ${detail}` });

  const setStatus = (id: string, st: MatterStatus) => {
    const m = matterById(id);
    if (!m || m.status === st) return;
    commit((x) => touch(x, id, { status: st }, `changed status from ${m.status} to ${st}`));
    audit("Changed status", m, `${m.status} → ${st}`);
  };
  const setOwner = (id: string, owner: string) => {
    const m = matterById(id);
    if (!m || m.owner === owner) return;
    commit((x) => touch(x, id, { owner, participants: m.participants.includes(owner) ? m.participants : [...m.participants, owner] }, `set the owner to ${personName(owner)}`));
    audit("Changed owner", m, `${personName(m.owner)} → ${personName(owner)}`);
  };
  const setPriority = (id: string, p: Priority) => {
    const m = matterById(id);
    if (!m || m.priority === p) return;
    commit((x) => touch(x, id, { priority: p }, `set priority to ${p}`));
    audit("Changed priority", m, `${m.priority} → ${p}`);
  };
  const setDue = (id: string, d: string) => {
    const m = matterById(id);
    if (!m) return;
    commit((x) => touch(x, id, { dueDate: d || undefined }, d ? `set the due date to ${new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "cleared the due date"));
    audit("Changed due date", m, d || "none");
  };

  /** Four-eyes: the person who asked for an approval can never give it. */
  const canDecide = (m: Matter) => {
    if (m.status !== "Awaiting approval") return { ok: false, why: "This matter is not awaiting approval." };
    if (m.requestedBy === VIEWER) return { ok: false, why: "You requested this approval. A second person must decide (four-eyes)." };
    return { ok: true };
  };
  const decide = (id: string, decision: "approved" | "rejected", note?: string) => {
    const m = matterById(id);
    if (!m) return;
    const c = canDecide(m);
    if (!c.ok) return flash(c.why!);
    const nextStatus: MatterStatus = m.linked.kind === "access" && decision === "approved" ? "Resolved" : "Open";
    commit((x) => {
      let y = touch(x, id, { status: nextStatus, approvals: [...(m.approvals ?? []), { by: VIEWER, at: iso(), decision, note }] }, `${decision === "approved" ? "approved" : "rejected"}${note ? ` — ${note}` : ""}`);
      // An approved channel request opens the channel for the client.
      if (m.linked.kind === "access" && decision === "approved") {
        const name = m.title.replace(/^Channel request — #/, "");
        if (!y.channels.some((c2) => c2.name === name)) y = { ...y, channels: [...y.channels, { id: "ch-" + name, name, topic: "Opened from an approved request", external: true, members: m.participants }] };
      }
      return y;
    });
    audit(decision === "approved" ? "Approved" : "Rejected", m, note ?? "");
    flash(decision === "approved" ? `${m.ref} approved` : `${m.ref} rejected`);
  };

  const createMatter = ({ title, linkedFrom, status = "Open", priority = "Normal" }: { title: string; linkedFrom?: string; status?: MatterStatus; priority?: Priority }) => {
    const from = linkedFrom ? matterById(linkedFrom) : undefined;
    const prefix = from ? PREFIX[from.linked.kind] : "MAT";
    const used = (s?.matters ?? []).filter((m) => m.ref.startsWith(prefix + "-")).map((m) => Number(m.ref.split("-")[1]) || 0);
    const ref = `${prefix}-${Math.max(0, ...used) + 1}`;
    const id = "mt-" + uid();
    const m: Matter = {
      id,
      ref,
      title,
      status,
      priority,
      owner: VIEWER,
      participants: [VIEWER, ...(from?.participants.filter((p) => p !== VIEWER) ?? [])],
      linked: from?.linked ?? { kind: "vehicle", id: "", label: "Not linked" },
      labels: from?.labels ?? [],
      createdAt: iso(),
      updatedAt: iso(),
    };
    commit((x) => ({ ...x, matters: [m, ...x.matters], messages: [...x.messages, event(id, from ? `opened this matter from ${from.ref}` : "opened this matter")] }));
    audit("Opened matter", m, from ? `from ${from.ref}` : "");
    setSelected(id);
    setNavState({ kind: "view", id: "v-open" });
    setFilters({ status: "open" });
    setMobilePane("detail");
    return id;
  };

  const runCommand = (where: string, body: string): boolean => {
    const m = matterById(where);
    const [head, ...restArr] = body.trim().split(/\s+/);
    const rest = restArr.join(" ");
    const need = () => (m ? true : (flash("Slash commands work inside a matter."), false));
    switch (head.toLowerCase()) {
      case "/status": {
        if (!need()) return true;
        const st = MATTER_STATUSES.find((x) => x.toLowerCase().startsWith(rest.toLowerCase()) || x.toLowerCase().endsWith(rest.toLowerCase()));
        if (!st || !rest) flash(`Status must be one of: ${MATTER_STATUSES.join(", ")}`);
        else setStatus(m!.id, st);
        return true;
      }
      case "/assign": {
        if (!need()) return true;
        const who = parseMentions(rest)[0] ?? chatPeople.find((p) => p.name.toLowerCase().startsWith(rest.replace("@", "").toLowerCase()))?.id;
        if (!who) flash("Name someone to assign, e.g. /assign @rafael");
        else setOwner(m!.id, who);
        return true;
      }
      case "/priority": {
        if (!need()) return true;
        const p = PRIORITIES.find((x) => x.toLowerCase() === rest.toLowerCase());
        if (!p) flash(`Priority must be one of: ${PRIORITIES.join(", ")}`);
        else setPriority(m!.id, p);
        return true;
      }
      case "/approve":
      case "/reject":
        if (need()) decide(m!.id, head === "/approve" ? "approved" : "rejected", rest || undefined);
        return true;
      case "/task":
      case "/request": {
        if (!need()) return true;
        if (m!.linked.kind !== "plan") {
          flash(`${m!.ref} isn't linked to a project plan, so there's nowhere to add a ${head.slice(1)}.`);
          return true;
        }
        if (!rest) return flash(`Describe the ${head.slice(1)}, e.g. ${head} Signed LPA`), true;
        const p = plans.find((x) => x.id === m!.linked.id);
        const party = head === "/request" ? p?.parties.find((x) => x.id !== "aurum") : undefined;
        const res = addPlanRow(m!.linked.id, rest, { party: party?.id, owner: party ? party.contact : personName(VIEWER), deliverable: head === "/request" ? rest : undefined });
        if (res) {
          commit((x) => touch(x, m!.id, {}, head === "/request" ? `requested “${rest}” from ${party?.name} — plan item ${res.row.id}` : `added task ${res.row.id} “${rest}” to ${res.plan.name}`));
          audit(head === "/request" ? "Created party request" : "Created plan task", m, `${res.plan.name} · ${res.row.id}`);
          flash(head === "/request" ? `Request added to ${res.plan.name}` : `Task ${res.row.id} added to ${res.plan.name}`);
        }
        return true;
      }
      default:
        if (head.startsWith("/")) {
          flash(`Unknown command ${head}. Try /status, /assign, /priority, /approve, /reject, /task or /request.`);
          return true;
        }
        return false;
    }
  };

  const send = (where: string, body: string, attachments: ChatAttachment[], replyTo?: string) => {
    if (!body.trim() && !attachments.length) return;
    if (!replyTo && body.trim().startsWith("/") && runCommand(where, body)) {
      commit((x) => ({ ...x, drafts: { ...x.drafts, [where]: "" } }));
      return;
    }
    const msg: ChatMessage = { id: uid(), where, author: VIEWER, at: iso(), body: body.trim(), kind: "message", mentions: parseMentions(body), refs: parseRefs(body), attachments: attachments.length ? attachments : undefined, replyTo };
    commit((x) => ({
      ...x,
      messages: [...x.messages, msg],
      matters: x.matters.map((m) => (m.id === where ? { ...m, updatedAt: msg.at } : m)),
      drafts: replyTo ? x.drafts : { ...x.drafts, [where]: "" },
      read: { ...x.read, [where]: msg.at },
    }));
  };

  const editMessage = (id: string, body: string) =>
    commit((x) => ({
      ...x,
      messages: x.messages.map((m) => (m.id === id ? { ...m, edits: [...(m.edits ?? []), { at: m.editedAt ?? m.at, body: m.body }], body, editedAt: iso(), mentions: parseMentions(body), refs: parseRefs(body) } : m)),
    }));
  const react = (id: string, key: ReactionKey) =>
    commit((x) => ({
      ...x,
      messages: x.messages.map((m) => {
        if (m.id !== id) return m;
        const r = m.reactions ?? [];
        const cur = r.find((y) => y.key === key);
        const next = cur
          ? r.map((y) => (y.key === key ? { ...y, by: y.by.includes(VIEWER) ? y.by.filter((b) => b !== VIEWER) : [...y.by, VIEWER] } : y)).filter((y) => y.by.length)
          : [...r, { key, by: [VIEWER] }];
        return { ...m, reactions: next };
      }),
    }));
  const setDraft = (where: string, text: string) => commit((x) => ({ ...x, drafts: { ...x.drafts, [where]: text } }));
  const markConvRead = (where: string) => commit((x) => (x.read[where] && x.read[where] >= iso().slice(0, 16) ? x : { ...x, read: { ...x.read, [where]: iso() } }));
  const inboxAct: ChatApi["inboxAct"] = (id, act) => {
    const d = new Date();
    const until = act === "snooze-1h" ? new Date(d.getTime() + 3600_000) : act === "snooze-tomorrow" ? new Date(d.setHours(24 + 8, 0, 0, 0)) : act === "snooze-week" ? new Date(Date.now() + 7 * 86400_000) : null;
    commit((x) => ({
      ...x,
      inbox: {
        ...x.inbox,
        [id]: { ...x.inbox[id], ...(act === "read" ? { read: true } : act === "unread" ? { read: false } : act === "done" ? { done: true, read: true } : { snoozedUntil: until!.toISOString(), read: true }) },
      },
    }));
    if (act === "done") flash("Marked done");
    else if (act.startsWith("snooze")) flash(`Snoozed until ${until!.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`);
  };
  const saveView = (name: string) => {
    const id = "v-" + uid();
    commit((x) => ({ ...x, views: [...x.views, { id, name, filters, group, sort }] }));
    setNavState({ kind: "view", id });
    flash(`Saved view “${name}”`);
  };

  const convert: ChatApi["convert"] = (msgId, to) => {
    const msg = s?.messages.find((m) => m.id === msgId);
    if (!msg) return;
    const m = matterById(msg.where);
    if (to === "matter") {
      setNewM({ title: msg.body.split("\n")[0].slice(0, 90), from: msg.where });
      return;
    }
    if (to === "task") {
      if (m?.linked.kind !== "plan") return flash("Only matters linked to a project plan can create PMO tasks.");
      const res = addPlanRow(m.linked.id, msg.body.split("\n")[0].slice(0, 120), { owner: personName(VIEWER) });
      if (res) {
        commit((x) => touch(x, m.id, {}, `turned a message into task ${res.row.id} in ${res.plan.name}`));
        audit("Created plan task", m, `${res.plan.name} · ${res.row.id}`);
        flash(`Task ${res.row.id} added to ${res.plan.name}`);
      }
      return;
    }
    // Q&A: a draft answer for the room's open question; the Q&A owner still reviews and releases it.
    if (m?.linked.kind !== "room") return flash("Only matters linked to a data room can answer a Q&A question.");
    const open = roomQuestions.find((x) => x.roomId === m.linked.id && x.status !== "Answered");
    if (!open) return flash("This data room has no open question to answer.");
    draftLocalAnswer(open.id, msg.body, personName(VIEWER));
    commit((x) => touch(x, m.id, {}, `drafted an answer to the Q&A question from ${open.from} — awaiting release in Data rooms`));
    audit("Drafted Q&A answer", m, `question ${open.id}`);
    flash("Draft answer sent to the data room's Q&A for review");
  };

  /* ───────── lists for keyboard navigation ───────── */
  const listRef = useRef<string[]>([]);
  const setList = useCallback((ids: string[]) => {
    listRef.current = ids;
  }, []);
  const select = (id: string | null) => {
    setSelected(id);
    setThread(null);
    setPropMenu(null);
    if (id) setMobilePane("detail");
  };
  const setNav = (n: Nav) => {
    setNavState(n);
    setSide(false);
    setThread(null);
    if (n.kind === "view") {
      const v = s?.views.find((x) => x.id === n.id);
      if (v) {
        setFilters(v.filters);
        setGroup(v.group);
        setSort(v.sort);
      }
    }
    if (n.kind === "assigned") setFilters({ owner: VIEWER, status: "open" });
    if (n.kind === "conv") setMobilePane("detail");
    else setMobilePane("list");
  };
  const focusComposer = () => document.getElementById("chat-composer")?.focus();

  /* ───────── keyboard ───────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((c) => !c);
        return;
      }
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (e.key === "Escape") {
        if (cmd || help || newM) return;
        if (propMenu) return setPropMenu(null);
        if (thread) return setThread(null);
        if (typing) return t.blur();
        if (mobilePane === "detail") return setMobilePane("list");
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey || cmd || help || newM) return;
      const k = e.key;
      if (gPending.current) {
        gPending.current = false;
        if (k === "i") setNav({ kind: "inbox" });
        if (k === "m") setNav({ kind: "view", id: "v-open" });
        return;
      }
      const ids = listRef.current;
      const i = selected ? ids.indexOf(selected) : -1;
      const sel = selected ? s?.matters.find((m) => m.id === selected) : undefined;
      switch (k) {
        case "g":
          gPending.current = true;
          window.setTimeout(() => (gPending.current = false), 900);
          break;
        case "j":
          if (ids.length) select(ids[Math.min(ids.length - 1, i + 1)]);
          break;
        case "k":
          if (ids.length) select(ids[Math.max(0, i - 1)]);
          break;
        case "Enter":
          if (selected) setMobilePane("detail");
          break;
        case "c":
          e.preventDefault();
          setNewM({});
          break;
        case "e":
          if (nav.kind === "inbox") document.querySelector<HTMLButtonElement>("[data-inbox-selected] [data-act=done]")?.click();
          else if (sel && sel.status !== "Resolved") setStatus(sel.id, "Resolved");
          break;
        case "s":
          if (sel) setPropMenu("status");
          break;
        case "a":
          if (sel) setPropMenu("owner");
          break;
        case "p":
          if (sel) setPropMenu("priority");
          break;
        case "r":
          e.preventDefault();
          focusComposer();
          break;
        case "/":
          e.preventDefault();
          document.getElementById("chat-search")?.focus();
          break;
        case "?":
          setHelp(true);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const api: ChatApi | null = useMemo(
    () =>
      s
        ? {
            s,
            now,
            nav,
            setNav,
            selected,
            select,
            q,
            setQ,
            filters,
            setFilters,
            group,
            setGroup,
            sort,
            setSort,
            rail,
            setRail,
            thread,
            setThread,
            propMenu,
            setPropMenu,
            openCmd: () => setCmd(true),
            openNew: (p) => setNewM(p ?? {}),
            focusComposer,
            flash,
            mobilePane,
            setMobilePane,
            send,
            setStatus,
            setOwner,
            setPriority,
            setDue,
            decide,
            canDecide,
            editMessage,
            react,
            setDraft,
            inboxAct,
            markConvRead,
            saveView,
            createMatter,
            convert,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s, now, nav, selected, q, filters, group, sort, rail, thread, propMenu, mobilePane],
  );

  return (
    <div className="ws flex h-dvh flex-col overflow-hidden">
      <WorkstationTopBar app="communication" onSearch={() => setCmd(true)} />
      {!api ? (
        <Skeleton />
      ) : (
        <ChatCtx.Provider value={api}>
          <div className="relative flex min-h-0 flex-1">
            {/* Sidebar: inline from 1024, a drawer below */}
            <div className={cx("absolute inset-y-0 left-0 z-30 w-[260px] -translate-x-full transition-transform duration-150 ease-out lg:static lg:w-[232px] lg:translate-x-0", side && "translate-x-0")}>
              <Sidebar brandName={brand.name} onClose={() => setSide(false)} />
            </div>
            {side && <button aria-label="Close navigation" onClick={() => setSide(false)} className="absolute inset-0 z-20 bg-black/40 lg:hidden" />}
            {nav.kind !== "conv" && (
              <div className={cx("min-w-0 flex-1 border-r border-d-line md:max-w-[380px] md:flex-none md:basis-[340px] xl:basis-[380px]", mobilePane === "detail" && "hidden md:block")}>
                <ListPane onMenu={() => setSide(true)} setList={setList} />
              </div>
            )}
            <div className={cx("min-w-0 flex-1", nav.kind !== "conv" && mobilePane === "list" && "hidden md:flex", "flex")}>
              <Detail onMenu={() => setSide(true)} />
            </div>
          </div>
          {cmd && <CommandMenu onClose={() => setCmd(false)} onHelp={() => setHelp(true)} />}
          {help && <ShortcutSheet onClose={() => setHelp(false)} />}
          {newM && (
            <NewMatterDialog
              prefill={newM}
              onClose={() => setNewM(null)}
              onCreate={(title, from) => {
                createMatter({ title, linkedFrom: from });
                setNewM(null);
              }}
            />
          )}
        </ChatCtx.Provider>
      )}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
        {toast && <div className="pointer-events-auto max-w-[520px] rounded-[6px] bg-d-raise px-4 py-2.5 text-[12.5px] text-d-text shadow-[var(--d-pop)]">{toast}</div>}
      </div>
    </div>
  );
}
