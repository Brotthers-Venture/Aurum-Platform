"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Ellipsis, FileSpreadsheet, Folder, FolderOpen, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { cx } from "@/components/ui";
import { solutions } from "@/lib/solutions";
import { blankPlan, descendants, folderPath, summary, type Plan, type PlanFolder } from "@/lib/plans";

/* Project plans organised like a file cabinet: one workspace per solution, folders and subfolders
   to any depth, plans as the leaves. Create, rename and delete from the row menus. */

type Data = { plans: Plan[]; folders: PlanFolder[] };
type Menu = { id: string; kind: "solution" | "folder" | "plan"; confirm?: boolean } | null;
const fid = () => `f-${Date.now().toString(36)}${Math.floor(Math.random() * 99)}`;

export function PlanTree({
  data,
  selected,
  onSelect,
  onChange,
  color,
}: {
  data: Data;
  selected: string | null;
  onSelect: (id: string) => void;
  onChange: (d: Data) => void;
  color: string;
}) {
  const sel = data.plans.find((p) => p.id === selected);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    for (const p of data.plans) o[`s:${p.solution}`] = true;
    return o;
  });
  // The selected plan's solution and folders stay unfolded, wherever it was opened from, unless the user folds them.
  const reveal = new Set(sel ? [`s:${sel.solution}`, ...folderPath(data.folders, sel.folder).map((f) => f.id)] : []);
  const isOpenId = (id: string) => open[id] ?? reveal.has(id);
  const flip = (id: string) => setOpen((o) => ({ ...o, [id]: !(o[id] ?? reveal.has(id)) }));
  const [menu, setMenu] = useState<Menu>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

  const addFolder = (solution: string, parent: string | null) => {
    const f: PlanFolder = { id: fid(), name: "New folder", solution, parent };
    onChange({ ...data, folders: [...data.folders, f] });
    setOpen((o) => ({ ...o, [`s:${solution}`]: true, ...(parent ? { [parent]: true } : {}) }));
    setRenaming(f.id);
    setMenu(null);
  };
  const addPlan = (solution: string, folder: string | null) => {
    const p = blankPlan(solution, folder);
    onChange({ ...data, plans: [...data.plans, p] });
    setOpen((o) => ({ ...o, [`s:${solution}`]: true, ...(folder ? { [folder]: true } : {}) }));
    onSelect(p.id);
    setRenaming(p.id);
    setMenu(null);
  };
  const rename = (id: string, name: string) => {
    const n = name.trim();
    setRenaming(null);
    if (!n) return;
    onChange({ plans: data.plans.map((p) => (p.id === id ? { ...p, name: n } : p)), folders: data.folders.map((f) => (f.id === id ? { ...f, name: n } : f)) });
  };
  // Deleting a folder removes it and its subfolders; any plans inside move up to the folder's parent.
  const removeFolder = (id: string) => {
    const f = data.folders.find((x) => x.id === id)!;
    const gone = new Set([id, ...descendants(data.folders, id)]);
    onChange({ folders: data.folders.filter((x) => !gone.has(x.id)), plans: data.plans.map((p) => (p.folder && gone.has(p.folder) ? { ...p, folder: f.parent } : p)) });
    setMenu(null);
  };
  const removePlan = (id: string) => {
    onChange({ ...data, plans: data.plans.filter((p) => p.id !== id) });
    setMenu(null);
  };

  const nameOf = (id: string, name: string, className?: string) =>
    renaming === id ? (
      <input
        autoFocus
        defaultValue={name}
        onFocus={(e) => e.target.select()}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => rename(id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setRenaming(null);
        }}
        className="h-6 min-w-0 flex-1 rounded-[4px] border bg-white px-1 text-[12.5px] text-ink-900 focus:outline-none"
        style={{ borderColor: color }}
      />
    ) : (
      <span className={cx("min-w-0 flex-1 truncate", className)}>{name}</span>
    );

  const menuBox = (children: ReactNode) => (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
      <div className="absolute right-1 top-7 z-40 w-[176px] rounded-[10px] border border-stone-200 bg-white p-1 text-[12.5px] shadow-lift">{children}</div>
    </>
  );
  const item = (icon: ReactNode, label: string, onClick: () => void, danger?: boolean) => (
    <button
      key={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cx("flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left hover:bg-stone-100", danger ? "text-[#9A4422]" : "text-ink-900")}
    >
      {icon} {label}
    </button>
  );
  const actions = (id: string, kind: "solution" | "folder" | "plan") => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setMenu((m) => (m?.id === id ? null : { id, kind }));
      }}
      className={cx(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-stone-400 hover:bg-stone-200 hover:text-ink-900",
        menu?.id === id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      )}
      aria-label="Actions"
    >
      {kind === "plan" ? <Ellipsis size={13} /> : <Plus size={13} />}
    </button>
  );

  const renderLevel = (solution: string, parent: string | null, depth: number): ReactNode => {
    const folders = data.folders.filter((f) => f.solution === solution && f.parent === parent).sort((a, b) => a.name.localeCompare(b.name));
    const plans = data.plans.filter((p) => p.solution === solution && p.folder === parent).sort((a, b) => a.name.localeCompare(b.name));
    const pad = { paddingLeft: 8 + depth * 14 };
    return (
      <>
        {folders.map((f) => {
          const isOpen = isOpenId(f.id);
          const count = data.plans.filter((p) => p.folder === f.id || (p.folder && descendants(data.folders, f.id).includes(p.folder))).length;
          return (
            <div key={f.id}>
              <div
                className="group relative flex h-7 cursor-pointer items-center gap-1.5 rounded-[6px] pr-1 text-[12.5px] text-stone-700 hover:bg-white"
                style={pad}
                onClick={() => flip(f.id)}
                onDoubleClick={() => setRenaming(f.id)}
              >
                {isOpen ? <ChevronDown size={12} className="shrink-0 text-stone-400" /> : <ChevronRight size={12} className="shrink-0 text-stone-400" />}
                {isOpen ? <FolderOpen size={13} className="shrink-0 text-stone-500" /> : <Folder size={13} className="shrink-0 text-stone-500" />}
                {nameOf(f.id, f.name)}
                {count > 0 && renaming !== f.id && <span className="num text-[10.5px] text-stone-400 group-hover:hidden">{count}</span>}
                {actions(f.id, "folder")}
                {menu?.id === f.id &&
                  menuBox(
                    <>
                      {item(<FolderPlus size={13} />, "New subfolder", () => addFolder(solution, f.id))}
                      {item(<FileSpreadsheet size={13} />, "New plan here", () => addPlan(solution, f.id))}
                      <div className="my-1 h-px bg-stone-100" />
                      {item(<Pencil size={13} />, "Rename", () => (setRenaming(f.id), setMenu(null)))}
                      {menu.confirm
                        ? item(<Trash2 size={13} />, "Confirm — plans move up", () => removeFolder(f.id), true)
                        : item(<Trash2 size={13} />, "Delete folder", () => setMenu({ ...menu, confirm: true }), true)}
                    </>,
                  )}
              </div>
              {isOpen && renderLevel(solution, f.id, depth + 1)}
            </div>
          );
        })}
        {plans.map((p) => {
          const s = summary(p.rows);
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              onDoubleClick={() => setRenaming(p.id)}
              title={p.name}
              className={cx(
                "group relative flex cursor-pointer items-start gap-1.5 rounded-[6px] py-1 pr-1 text-[12.5px]",
                p.id === selected ? "bg-champagne font-semibold text-ink-900" : "text-stone-600 hover:bg-white",
              )}
              style={{ paddingLeft: 8 + depth * 14 + 13 }}
            >
              <FileSpreadsheet size={13} className="mt-0.5 shrink-0" style={{ color: p.id === selected ? color : undefined }} />
              <span className="min-w-0 flex-1">
                {nameOf(p.id, p.name, "block")}
                <span className="block truncate text-[10.5px] font-normal text-stone-400">
                  {Math.round(s.pct * 100)}% complete{s.overdue ? ` · ${s.overdue} overdue` : ""}
                </span>
              </span>
              {actions(p.id, "plan")}
              {menu?.id === p.id &&
                menuBox(
                  <>
                    {item(<Pencil size={13} />, "Rename", () => (setRenaming(p.id), setMenu(null)))}
                    {menu.confirm
                      ? item(<Trash2 size={13} />, "Confirm delete", () => removePlan(p.id), true)
                      : item(<Trash2 size={13} />, "Delete plan", () => setMenu({ ...menu, confirm: true }), true)}
                  </>,
                )}
            </div>
          );
        })}
        {depth > 0 && !folders.length && !plans.length && (
          <div className="py-1 text-[11px] italic text-stone-400" style={{ paddingLeft: 8 + depth * 14 + 13 }}>
            Empty
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      {solutions.map((sol) => {
        const key = `s:${sol.id}`;
        const isOpen = isOpenId(key);
        const n = data.plans.filter((p) => p.solution === sol.id).length;
        return (
          <div key={sol.id}>
            <div className="group relative flex h-8 cursor-pointer items-center gap-2 rounded-[8px] px-2 text-[13px] hover:bg-white" onClick={() => flip(key)}>
              {isOpen ? <ChevronDown size={13} className="shrink-0 text-stone-400" /> : <ChevronRight size={13} className="shrink-0 text-stone-400" />}
              <span className={cx("min-w-0 flex-1 truncate", n ? "font-semibold text-ink-900" : "text-stone-500")}>{sol.name.replace(" Solution", "")}</span>
              {n > 0 && <span className="num text-[11px] text-stone-400 group-hover:hidden">{n}</span>}
              {actions(key, "solution")}
              {menu?.id === key &&
                menuBox(
                  <>
                    {item(<FolderPlus size={13} />, "New folder", () => addFolder(sol.id, null))}
                    {item(<FileSpreadsheet size={13} />, "New plan", () => addPlan(sol.id, null))}
                  </>,
                )}
            </div>
            {isOpen && <div className="pb-1">{renderLevel(sol.id, null, 1)}</div>}
          </div>
        );
      })}
    </div>
  );
}
