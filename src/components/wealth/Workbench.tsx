"use client";

import { useEffect, useState } from "react";
import { Check, FileText, Plus, Trash2 } from "lucide-react";
import { cx } from "@/components/ui";
import { Empty, Panel, Seg, btn, btnPrimary, input, useWealth } from "./ui";
import { emit } from "@/lib/spine";
import { CHECKLIST_EVENT, loadChecklists } from "@/lib/checklist";
import { DELEGATE_LABEL, entityName, loadDelegates, loadTodos, saveDelegates, saveTodos, shortDate, type Delegate, type DelegateLevel, type Todo } from "@/lib/wealth";

/* ───────────── documents: every file attached to a holding, an entity or the onboarding ───────────── */
export function Documents() {
  const { f, t, open } = useWealth();
  const [by, setBy] = useState<"entity" | "holding">("entity");
  const [uploads, setUploads] = useState<{ name: string; at: string; item: string; checklist: string }[]>([]);
  useEffect(() => {
    const read = () =>
      setUploads(
        loadChecklists()
          .filter((c) => c.org === f.id)
          .flatMap((c) =>
            c.items.filter((i) => i.status === "accepted").flatMap((i) => i.uploads.slice(-1).map((u) => ({ name: u.name, at: u.at, item: i.label, checklist: c.title }))),
          ),
      );
    read();
    window.addEventListener(CHECKLIST_EVENT, read);
    return () => window.removeEventListener(CHECKLIST_EVENT, read);
  }, [f.id]);
  const docs = t.assets.flatMap((a) => (a.docs ?? []).map((d) => ({ d, a })));
  const groups =
    by === "entity"
      ? f.entities.map((e) => ({ key: e.name, rows: docs.filter((x) => x.a.owner === e.id) })).filter((g) => g.rows.length)
      : t.assets.filter((a) => a.docs?.length).map((a) => ({ key: a.name, rows: docs.filter((x) => x.a.id === a.id) }));
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Panel
        title="Documents"
        note={`${docs.length} on holdings`}
        action={
          <Seg
            size="sm"
            value={by}
            onChange={setBy}
            options={[
              { id: "entity", label: "By entity" },
              { id: "holding", label: "By holding" },
            ]}
          />
        }
        pad={false}
      >
        {groups.map((g) => (
          <div key={g.key}>
            <div className="bg-d-surface-2 px-4 py-1.5 text-[11.5px] font-semibold text-d-text-2">{g.key}</div>
            {g.rows.map(({ d, a }) => (
              <button
                key={a.id + d}
                onClick={() => open(a.id)}
                className="flex w-full items-center gap-3 border-b border-d-line-soft px-4 py-2.5 text-left text-[12.5px] last:border-0 hover:bg-d-raise"
              >
                <FileText size={14} className="text-d-text-3" />
                <span className="flex-1 text-d-text">{d}</span>
                <span className="text-d-text-3">{by === "entity" ? a.name : entityName(f, a.owner)}</span>
              </button>
            ))}
          </div>
        ))}
      </Panel>
      <Panel title="From onboarding" note="accepted by the office" pad={false}>
        {uploads.length ? (
          uploads.map((u) => (
            <div key={u.item + u.name} className="flex items-center gap-3 border-b border-d-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
              <FileText size={14} className="text-d-text-3" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-d-text">{u.item}</span>
                <span className="text-[11px] text-d-text-3">
                  {u.name} · {u.checklist}
                </span>
              </span>
              <span className="tabular-nums text-d-text-3">{shortDate(u.at)}</span>
            </div>
          ))
        ) : (
          <Empty>Nothing yet.</Empty>
        )}
      </Panel>
    </div>
  );
}

/* ───────────── to-dos shared between the family and the office ───────────── */
export function Todos() {
  const { f, t, actor, open } = useWealth();
  const [all, setAll] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [show, setShow] = useState<"open" | "done">("open");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read this browser's saved list after hydration
    setAll(loadTodos());
  }, []);
  const mine = all.filter((x) => x.family === f.id && !!x.done === (show === "done"));
  const commit = (next: Todo[]) => {
    setAll(next);
    saveTodos(next);
  };
  const add = () => {
    if (!text.trim()) return;
    commit([{ id: `t-${Date.now().toString(36)}`, family: f.id, text: text.trim(), owner: actor, due: due || undefined }, ...all]);
    emit({ actor, type: "wealth.todo", ref: { kind: "family", id: f.id }, text: `${actor} added a to-do: ${text.trim()}`, visibility: "client" });
    setText("");
    setDue("");
  };
  const toggle = (id: string) => commit(all.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  return (
    <Panel
      title="To-dos"
      note="shared between the family and the office"
      action={
        <Seg
          size="sm"
          value={show}
          onChange={setShow}
          options={[
            { id: "open", label: "Open" },
            { id: "done", label: "Done" },
          ]}
        />
      }
      pad={false}
    >
      <div className="flex flex-wrap gap-2 border-b border-d-line-soft px-4 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a to-do"
          className={cx(input, "min-w-[240px] flex-1")}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={input} aria-label="Due date" />
        <button onClick={add} className={btn}>
          <Plus size={14} /> Add
        </button>
      </div>
      {mine.length === 0 ? (
        <Empty>{show === "open" ? "Nothing open." : "Nothing completed yet."}</Empty>
      ) : (
        mine.map((x) => {
          const a = t.assets.find((y) => y.id === x.asset);
          return (
            <div key={x.id} className="flex items-start gap-3 border-b border-d-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
              <button
                onClick={() => toggle(x.id)}
                aria-label={x.done ? "Reopen" : "Mark done"}
                className={cx(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                  x.done ? "border-transparent bg-d-text text-d-bg" : "border-d-line-strong",
                )}
              >
                {x.done && <Check size={11} strokeWidth={3} />}
              </button>
              <span className="min-w-0 flex-1">
                <span className={cx("block", x.done ? "text-d-text-3 line-through" : "text-d-text")}>{x.text}</span>
                <span className="text-[11px] text-d-text-3">
                  {x.owner}
                  {a && (
                    <>
                      {" · "}
                      <button onClick={() => open(a.id)} className="underline-offset-2 hover:underline">
                        {a.name}
                      </button>
                    </>
                  )}
                </span>
              </span>
              {x.due && <span className="whitespace-nowrap tabular-nums text-d-text-2">due {shortDate(x.due)}</span>}
            </div>
          );
        })
      )}
    </Panel>
  );
}

/* ───────────── access: delegates the family invites, on a need-to-know basis ───────────── */
export function Access() {
  const { f, actor } = useWealth();
  const [all, setAll] = useState<Delegate[]>([]);
  const [form, setForm] = useState<{ name: string; email: string; relation: string; level: DelegateLevel; entities: string[] }>({
    name: "",
    email: "",
    relation: "",
    level: "read",
    entities: [],
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read this browser's saved list after hydration
    setAll(loadDelegates());
  }, []);
  const mine = all.filter((d) => d.family === f.id);
  const commit = (next: Delegate[]) => {
    setAll(next);
    saveDelegates(next);
  };
  const add = () => {
    if (!form.name.trim() || !/.+@.+\..+/.test(form.email)) return;
    commit([
      ...all,
      {
        id: `d-${Date.now().toString(36)}`,
        family: f.id,
        name: form.name.trim(),
        email: form.email.trim(),
        relation: form.relation.trim() || "Adviser",
        level: form.level,
        entities: form.level === "partial" ? form.entities : undefined,
        since: new Date().toISOString().slice(0, 10),
      },
    ]);
    emit({
      actor,
      type: "wealth.delegate_added",
      ref: { kind: "family", id: f.id },
      text: `${actor} gave ${form.name.trim()} ${DELEGATE_LABEL[form.level].toLowerCase()} to the ${f.name} wealth view.`,
      visibility: "client",
    });
    setForm({ name: "", email: "", relation: "", level: "read", entities: [] });
  };
  const remove = (d: Delegate) => {
    commit(all.filter((x) => x.id !== d.id));
    emit({
      actor,
      type: "wealth.delegate_removed",
      ref: { kind: "family", id: f.id },
      text: `${actor} removed ${d.name}'s access to the ${f.name} wealth view.`,
      visibility: "client",
    });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Who can see this wealth" note="family members, advisers and counsel, each on a need-to-know basis" pad={false}>
        {mine.map((d) => (
          <div key={d.id} className="flex items-center gap-3 border-b border-d-line-soft px-4 py-3 text-[12.5px] last:border-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-d-line-strong bg-d-raise text-[11px] font-semibold text-d-text">
              {d.name
                .split(" ")
                .filter((w) => /^[A-Za-zÀ-ÿ]/.test(w))
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-d-text">{d.name}</span>
              <span className="text-[11px] text-d-text-3">
                {d.relation} · {d.email} · since {shortDate(d.since)}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-medium text-d-text">{DELEGATE_LABEL[d.level]}</span>
              {d.level === "partial" && <span className="text-[11px] text-d-text-3">{(d.entities ?? []).map((e) => entityName(f, e)).join(", ")}</span>}
            </span>
            <button onClick={() => remove(d)} aria-label={`Remove ${d.name}`} className="rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-neg">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!mine.length && <Empty>Only you and the office can see this wealth.</Empty>}
      </Panel>
      <Panel title="Invite someone">
        <div className="space-y-2.5 text-[12.5px]">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={cx(input, "w-full")} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={cx(input, "w-full")} />
          <input
            value={form.relation}
            onChange={(e) => setForm({ ...form, relation: e.target.value })}
            placeholder="Relationship, e.g. tax adviser"
            className={cx(input, "w-full")}
          />
          <div className="space-y-1.5 pt-1">
            {(["read", "partial", "full"] as DelegateLevel[]).map((l) => (
              <label key={l} className="flex items-start gap-2">
                <input type="radio" checked={form.level === l} onChange={() => setForm({ ...form, level: l })} className="mt-0.5" />
                <span>
                  <span className="font-medium text-d-text">{DELEGATE_LABEL[l]}</span>
                  <span className="block text-[11px] text-d-text-3">
                    {l === "read"
                      ? "Sees everything, changes nothing."
                      : l === "partial"
                        ? "Sees only the entities you choose, and what they hold."
                        : "Sees and edits, can invite others."}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {form.level === "partial" && (
            <div className="rounded-[8px] border border-d-line p-2.5">
              {f.entities
                .filter((e) => !e.separate)
                .map((e) => (
                  <label key={e.id} className="flex items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={form.entities.includes(e.id)}
                      onChange={(ev) => setForm({ ...form, entities: ev.target.checked ? [...form.entities, e.id] : form.entities.filter((x) => x !== e.id) })}
                    />
                    <span className="text-d-text">{e.name}</span>
                  </label>
                ))}
            </div>
          )}
          <button
            onClick={add}
            disabled={!form.name.trim() || !/.+@.+\..+/.test(form.email) || (form.level === "partial" && !form.entities.length)}
            className={cx(btnPrimary, "mt-1 w-full justify-center")}
            style={{ background: "var(--tenant-ink)", color: "#fff" }}
          >
            Send invitation
          </button>
          <p className="text-[11px] text-d-text-3">They sign in with two-factor authentication. You can remove access at any time; every change is recorded.</p>
        </div>
      </Panel>
    </div>
  );
}
