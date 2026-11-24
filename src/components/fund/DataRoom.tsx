"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ExternalLink, FileText, Pencil, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { cx } from "@/components/ui";
import {
  DOC_GROUPS,
  DOC_TYPES,
  currentFiles,
  docType,
  fileSize,
  guessType,
  sha256Hex,
  titleFromFile,
  visibilityLabel,
  type DocVisibility,
  type RoomFile,
} from "@/lib/corporateDocs";
import { date } from "@/lib/format";

const ACCEPT = ".pdf,.docx,.doc,.xlsx,.png,.jpg,.jpeg";
const MAX_BYTES = 50 * 1024 * 1024;
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));

export type GleifCapture = { lei: string; capturedAt: string };

const cell = "h-8 w-full rounded-[3px] border border-transparent bg-transparent px-2 text-[12.5px] text-ink-900 hover:border-stone-300 focus:border-ink-900 focus:outline-none";

/** Hash, de-duplicate and add files. Returns the new list and any message for the user. */
async function ingest(
  list: File[],
  files: RoomFile[],
  opts: { uploader: string; replace?: RoomFile; forceType?: (name: string) => string },
): Promise<{ files: RoomFile[]; message: string | null }> {
  const added: RoomFile[] = [];
  const skipped: string[] = [];
  for (const file of list) {
    if (file.size > MAX_BYTES) {
      skipped.push(`${file.name} (over 50 MB)`);
      continue;
    }
    const sha256 = await sha256Hex(file);
    if ([...files, ...added].some((f) => f.sha256 === sha256 && !f.archived)) {
      skipped.push(`${file.name} (already uploaded)`);
      continue;
    }
    const prev = opts.replace;
    const type = prev?.type ?? opts.forceType?.(file.name) ?? guessType(file.name);
    const id = uid();
    added.push({
      id,
      chain: prev?.chain ?? id,
      title: prev?.title ?? titleFromFile(file.name),
      fileName: file.name,
      type,
      visibility: prev?.visibility ?? docType(type).visibility,
      bytes: file.size,
      sha256,
      effectiveDate: prev?.effectiveDate ?? null,
      version: prev ? prev.version + 1 : 1,
      uploadedAt: new Date().toISOString(),
      uploadedBy: opts.uploader,
    });
  }
  return { files: [...files, ...added], message: skipped.length ? `Skipped ${skipped.join(", ")}.` : null };
}

function useDrop(onFiles: (f: File[]) => void) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  return {
    over,
    bind: {
      onDragEnter: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        depth.current++;
        setOver(true);
      },
      onDragOver: (e: DragEvent) => e.dataTransfer.types.includes("Files") && e.preventDefault(),
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        const list = Array.from(e.dataTransfer.files ?? []);
        if (list.length) onFiles(list);
      },
    },
  };
}

function PickButton({ label, onFiles, multiple = true, icon, className, ariaLabel }: { label?: ReactNode; onFiles: (f: File[]) => void; multiple?: boolean; icon?: ReactNode; className?: string; ariaLabel: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className={className} aria-label={ariaLabel} title={ariaLabel}>
        {icon}
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        multiple={multiple}
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label={`${ariaLabel} file`}
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (list.length) onFiles(list);
        }}
      />
    </>
  );
}

function Row({ f, history, onEdit, onReplace, onRemove }: { f: RoomFile; history: RoomFile[]; onEdit: (patch: Partial<RoomFile>) => void; onReplace: (files: File[]) => void; onRemove: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(f.title);
  const [showVersions, setShowVersions] = useState(false);
  const readOnly = f.source === "gleif";

  return (
    <>
      <tr className="group border-t border-stone-100 hover:bg-stone-50/60">
        <td className="py-2 pl-5 pr-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText size={15} className="shrink-0 text-stone-400" />
            {renaming ? (
              <form
                className="flex flex-1 items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) onEdit({ title: draft.trim() });
                  setRenaming(false);
                }}
              >
                <input autoFocus aria-label="Document name" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => setRenaming(false)} className={cx(cell, "border-ink-900 bg-white")} />
              </form>
            ) : (
              <>
                <span className="truncate text-[13px] font-medium text-ink-900" title={f.fileName}>
                  {f.title}
                </span>
                {f.version > 1 && (
                  <button type="button" onClick={() => setShowVersions((v) => !v)} className="shrink-0 rounded-[2px] bg-stone-100 px-1.5 text-[10.5px] font-semibold text-stone-600 hover:bg-stone-200">
                    v{f.version}
                  </button>
                )}
                {readOnly && (
                  <a href={`https://search.gleif.org/#/record/${f.title}`} target="_blank" rel="noreferrer" className="shrink-0 text-stone-400 hover:text-ink-900" aria-label="Open in GLEIF">
                    <ExternalLink size={12} />
                  </a>
                )}
              </>
            )}
          </div>
        </td>
        <td className="w-[210px] px-1 py-2">
          {readOnly ? (
            <span className="px-2 text-[12.5px] text-stone-600">LEI record</span>
          ) : (
            <select aria-label="Type" value={f.type} onChange={(e) => onEdit({ type: e.target.value })} className={cell}>
              {DOC_TYPES.filter((t) => t.id !== "lei_record").map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="w-[140px] px-1 py-2">
          <select aria-label="Access" disabled={readOnly} value={f.visibility} onChange={(e) => onEdit({ visibility: e.target.value as DocVisibility })} className={cx(cell, readOnly && "text-stone-600")}>
            {(Object.keys(visibilityLabel) as DocVisibility[]).map((v) => (
              <option key={v} value={v}>
                {visibilityLabel[v]}
              </option>
            ))}
          </select>
        </td>
        <td className="w-[150px] px-1 py-2">
          {readOnly ? (
            <span className="px-2 text-[12.5px] text-stone-400">—</span>
          ) : (
            <input type="date" aria-label="Effective date" value={f.effectiveDate ?? ""} onChange={(e) => onEdit({ effectiveDate: e.target.value || null })} className={cx(cell, !f.effectiveDate && "text-stone-400")} />
          )}
        </td>
        <td className="num w-[80px] px-3 py-2 text-right text-[12px] text-stone-500">{readOnly ? "—" : fileSize(f.bytes)}</td>
        <td className="w-[110px] px-3 py-2 text-[12px] text-stone-500" title={`${f.uploadedBy} · SHA-256 ${f.sha256}`}>
          {date(f.uploadedAt.slice(0, 10))}
        </td>
        <td className="w-[104px] py-2 pr-4">
          {!readOnly && (
            <div className="flex justify-end gap-0.5 opacity-40 transition-opacity group-hover:opacity-100">
              <button type="button" aria-label="Rename" title="Rename" onClick={() => (setDraft(f.title), setRenaming(true))} className="rounded-[3px] p-1.5 text-stone-500 hover:bg-stone-200 hover:text-ink-900">
                <Pencil size={13} />
              </button>
              <PickButton ariaLabel="Replace" multiple={false} onFiles={onReplace} icon={<RefreshCw size={13} />} className="rounded-[3px] p-1.5 text-stone-500 hover:bg-stone-200 hover:text-ink-900" />
              <button type="button" aria-label="Remove" title="Remove" onClick={onRemove} className="rounded-[3px] p-1.5 text-stone-500 hover:bg-stone-200 hover:text-negative">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </td>
      </tr>
      {showVersions &&
        history.map((h) => (
          <tr key={h.id} className="bg-stone-50/60 text-[12px] text-stone-500">
            <td className="py-1.5 pl-12 pr-3" colSpan={4}>
              v{h.version} · {h.fileName}
            </td>
            <td className="num px-3 text-right">{fileSize(h.bytes)}</td>
            <td className="px-3">{date(h.uploadedAt.slice(0, 10))}</td>
            <td />
          </tr>
        ))}
    </>
  );
}

/**
 * The vehicle's corporate documents. Drop files anywhere on it; the type is guessed from the file name
 * and can be changed, as can the name, access and effective date. Replacing adds a version.
 */
export function DataRoom({ files, onChange, gleif, uploader = "Luiza Andrade" }: { files: RoomFile[]; onChange: (f: RoomFile[]) => void; gleif?: GleifCapture | null; uploader?: string }) {
  const [group, setGroup] = useState<(typeof DOC_GROUPS)[number] | "All">("All");
  const [message, setMessage] = useState<string | null>(null);

  const add = async (list: File[], replace?: RoomFile) => {
    const res = await ingest(list, files, { uploader, replace });
    onChange(res.files);
    setMessage(res.message);
  };
  const drop = useDrop((l) => add(l));

  const lei: RoomFile | null = gleif
    ? { id: "gleif", chain: "gleif", title: gleif.lei, fileName: "GLEIF record", type: "lei_record", visibility: "gp", bytes: 0, sha256: "", effectiveDate: null, version: 1, uploadedAt: gleif.capturedAt, uploadedBy: "GLEIF", source: "gleif" }
    : null;
  const current = [...(lei ? [lei] : []), ...currentFiles(files)];
  const count = (g: string) => current.filter((f) => docType(f.type).group === g).length;
  const shown = group === "All" ? current : current.filter((f) => docType(f.type).group === group);

  /** Name, type and access apply to every version of a document; the effective date to this version. */
  const edit = (f: RoomFile, patch: Partial<RoomFile>) => {
    const { effectiveDate, ...docWide } = patch;
    onChange(files.map((x) => (x.chain !== f.chain ? x : { ...x, ...docWide, ...(x.id === f.id && "effectiveDate" in patch ? { effectiveDate } : {}) })));
  };

  return (
    <div {...drop.bind} className="relative">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1">
          {(["All", ...DOC_GROUPS] as const).map((g) => {
            const c = g === "All" ? current.length : count(g);
            if (g !== "All" && !c) return null;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={cx("h-7 rounded-full px-3 text-[12px] transition-colors", group === g ? "bg-ink-900 font-semibold text-white" : "text-stone-600 hover:bg-stone-100")}
              >
                {g} <span className={cx("num ml-0.5", group === g ? "text-white/60" : "text-stone-400")}>{c}</span>
              </button>
            );
          })}
        </div>
        <PickButton
          ariaLabel="Upload"
          label="Upload"
          onFiles={(l) => add(l)}
          icon={<Upload size={13} />}
          className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-ink-900 px-3 text-[12px] font-semibold text-white hover:bg-ink-800"
        />
      </div>

      {message && (
        <div className="mb-3 flex items-center justify-between rounded-[3px] bg-caution-bg px-3 py-2 text-[12px] text-caution">
          {message}
          <button type="button" aria-label="Dismiss" onClick={() => setMessage(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {current.length ? (
        <div className="overflow-hidden rounded-[8px] border border-stone-200/70 bg-white shadow-card">
          <table className="w-full table-fixed">
            <thead>
              <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                <th className="py-2.5 pl-5 pr-3 font-semibold">Name</th>
                <th className="w-[210px] px-3 font-semibold">Type</th>
                <th className="w-[140px] px-3 font-semibold">Access</th>
                <th className="w-[150px] px-3 font-semibold">Effective</th>
                <th className="w-[80px] px-3 text-right font-semibold">Size</th>
                <th className="w-[110px] px-3 font-semibold">Added</th>
                <th className="w-[104px]" />
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <Row
                  key={f.id}
                  f={f}
                  history={files.filter((x) => x.chain === f.chain && x.id !== f.id).sort((a, b) => b.version - a.version)}
                  onEdit={(p) => edit(f, p)}
                  onReplace={(l) => add(l.slice(0, 1), f)}
                  onRemove={() => onChange(files.map((x) => (x.chain === f.chain ? { ...x, archived: true } : x)))}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PickButton
          ariaLabel="Browse files"
          onFiles={(l) => add(l)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-[4px] border border-dashed border-stone-300 bg-white py-14 text-[13px] text-stone-500 hover:border-ink-900"
          label={
            <>
              <Upload size={18} className="text-stone-400" />
              <span>
                Drop files here or <span className="font-semibold text-ink-900 underline underline-offset-2">browse</span>
              </span>
            </>
          }
        />
      )}

      {drop.over && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[4px] border-2 border-dashed border-gold-500 bg-gold-50/90 text-[13px] font-semibold text-ink-900">
          Drop to add to corporate documents
        </div>
      )}
    </div>
  );
}

/** Economics: just the LPA and side letters, which go to the LPA review. Shares the vehicle's files. */
export function LpaUpload({ files, onChange, uploader = "Luiza Andrade" }: { files: RoomFile[]; onChange: (f: RoomFile[]) => void; uploader?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const add = async (list: File[]) => {
    const res = await ingest(list, files, { uploader, forceType: (n) => (guessType(n) === "side_letter" ? "side_letter" : "lpa") });
    onChange(res.files);
    setMessage(res.message);
  };
  const drop = useDrop(add);
  const docs = currentFiles(files).filter((f) => f.type === "lpa" || f.type === "side_letter");

  return (
    <div {...drop.bind} className="space-y-2">
      {docs.map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-[3px] border border-stone-200 bg-white px-4 py-2.5">
          <FileText size={15} className="text-stone-400" />
          <span className="flex-1 truncate text-[13px] font-medium">{f.title}</span>
          <select
            aria-label="Document"
            value={f.type}
            onChange={(e) => onChange(files.map((x) => (x.chain === f.chain ? { ...x, type: e.target.value, visibility: docType(e.target.value).visibility } : x)))}
            className="h-8 rounded-[3px] border border-stone-300 bg-white px-2 text-[12.5px]"
          >
            <option value="lpa">LPA</option>
            <option value="side_letter">Side letter</option>
          </select>
          <span className="num w-[70px] text-right text-[12px] text-stone-500">{fileSize(f.bytes)}</span>
          <button type="button" aria-label="Remove" onClick={() => onChange(files.map((x) => (x.chain === f.chain ? { ...x, archived: true } : x)))} className="p-1 text-stone-400 hover:text-negative">
            <X size={14} />
          </button>
        </div>
      ))}
      <PickButton
        ariaLabel="Upload LPA or side letters"
        onFiles={add}
        className={cx(
          "flex w-full items-center justify-center gap-2 rounded-[3px] border border-dashed py-6 text-[13px] transition-colors",
          drop.over ? "border-gold-500 bg-gold-50 text-ink-900" : "border-stone-300 bg-white text-stone-500 hover:border-ink-900",
        )}
        label={
          <>
            <Upload size={15} className="text-stone-400" />
            <span>
              Upload <span className="font-semibold text-ink-900">LPA</span> or <span className="font-semibold text-ink-900">side letters</span>
            </span>
          </>
        }
      />
      {message && <p className="text-[12px] text-caution">{message}</p>}
    </div>
  );
}
