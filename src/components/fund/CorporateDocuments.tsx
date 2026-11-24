"use client";

import { useRef, useState } from "react";
import { CircleAlert, CircleCheck, ExternalLink, FileText, History, Loader2, Lock, Plus, Upload } from "lucide-react";
import { cx } from "@/components/ui";
import { CORPORATE_DOC_TYPES, fileSize, sha256Hex, visibilityLabel, type CorporateDocType, type CorporateFile } from "@/lib/corporateDocs";
import { date, dateTime } from "@/lib/format";

const ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,application/pdf";
const MAX_BYTES = 50 * 1024 * 1024;

export type GleifCapture = { lei: string; legalName: string; capturedAt: string; status: string | null };

function UploadButton({ label, onFiles, busy, primary }: { label: string; onFiles: (files: File[]) => void; busy?: boolean; primary?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className={cx(
          "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-[12px] font-semibold transition-colors disabled:opacity-50",
          primary ? "bg-ink-900 text-white hover:bg-ink-800" : "border border-stone-300 bg-white text-ink-900 hover:border-ink-900",
        )}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : primary ? <Upload size={13} /> : <Plus size={13} />} {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </>
  );
}

function DocRow({
  t,
  files,
  onAdd,
  onDate,
}: {
  t: CorporateDocType;
  files: CorporateFile[];
  onAdd: (t: CorporateDocType, files: File[]) => Promise<string | null>;
  onDate: (f: CorporateFile, d: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // current = latest version (per file name for multi-file types)
  const current = t.multiple
    ? files.filter((f) => !files.some((o) => o.name === f.name && o.version > f.version))
    : files.filter((f) => f.version === Math.max(...files.map((x) => x.version)));
  const history = files.filter((f) => !current.includes(f));
  const has = current.length > 0;

  const add = async (list: File[]) => {
    setBusy(true);
    setError(await onAdd(t, t.multiple ? list : list.slice(0, 1)));
    setBusy(false);
  };

  return (
    <li className="grid grid-cols-[22px_1fr_auto] gap-x-4 px-5 py-4">
      <span className="pt-0.5">
        {has ? <CircleCheck size={17} className="text-positive" /> : t.required ? <CircleAlert size={17} className="text-caution" /> : <span className="mt-1.5 block h-2 w-2 rounded-full border border-stone-300" />}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-ink-900">{t.label}</span>
          {t.required && !has && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-caution">Required</span>}
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
            <Lock size={10} /> {visibilityLabel[t.visibility]}
          </span>
        </div>
        {!has && <p className="mt-0.5 text-[12px] text-stone-500">{t.hint}</p>}

        {current.map((f) => (
          <div key={`${f.name}-${f.version}`} className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[3px] bg-stone-50 px-3 py-2 text-[12px]">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-ink-900">
              <FileText size={13} className="shrink-0 text-stone-400" />
              <span className="truncate">{f.name}</span>
            </span>
            <span className="text-stone-500">v{f.version}</span>
            <span className="text-stone-500">{fileSize(f.bytes)}</span>
            <span className="font-mono text-[11px] text-stone-400" title={`SHA-256 ${f.sha256}`}>
              SHA-256 {f.sha256.slice(0, 10)}…
            </span>
            <label className="ml-auto inline-flex items-center gap-1.5 text-stone-500">
              Effective
              <input
                type="date"
                aria-label={`Effective date of ${f.name}`}
                value={f.effectiveDate ?? ""}
                onChange={(e) => onDate(f, e.target.value)}
                className="h-7 rounded-[3px] border border-stone-300 bg-white px-2 text-[12px] text-ink-900"
              />
            </label>
            <span className="w-full text-[11px] text-stone-400">
              Uploaded {dateTime(f.uploadedAt)} by {f.uploadedBy}
              {f.effectiveDate ? ` · effective ${date(f.effectiveDate)}` : ""}
            </span>
          </div>
        ))}

        {history.length > 0 && (
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-ink-900">
            <History size={11} /> {showHistory ? "Hide" : "Show"} {history.length} earlier version{history.length > 1 ? "s" : ""}
          </button>
        )}
        {showHistory &&
          history.map((f) => (
            <div key={`h-${f.name}-${f.version}`} className="mt-1 pl-4 text-[11px] text-stone-400">
              v{f.version} · {f.name} · {fileSize(f.bytes)} · {dateTime(f.uploadedAt)} · superseded
            </div>
          ))}
        {error && <p className="mt-1.5 text-[12px] text-negative">{error}</p>}
      </div>
      <div className="flex items-start pt-0.5">
        <UploadButton
          label={has ? (t.multiple ? "Add" : "New version") : "Upload"}
          primary={!has && t.required}
          busy={busy}
          onFiles={add}
        />
      </div>
    </li>
  );
}

/**
 * The vehicle's corporate record: formation documents with required/optional status,
 * per-document visibility, effective dates, versions and SHA-256 fingerprints.
 */
export function CorporateDocuments({
  files,
  onChange,
  gleif,
  uploader = "Luiza Andrade",
  persisted = false,
}: {
  files: CorporateFile[];
  onChange: (files: CorporateFile[]) => void;
  gleif?: GleifCapture | null;
  uploader?: string;
  /** true once Supabase Storage is connected */
  persisted?: boolean;
}) {
  const required = CORPORATE_DOC_TYPES.filter((t) => t.required);
  const onFile = required.filter((t) => files.some((f) => f.type === t.id)).length;

  const onAdd = async (t: CorporateDocType, list: File[]) => {
    const tooBig = list.find((f) => f.size > MAX_BYTES);
    if (tooBig) return `${tooBig.name} is over 50 MB.`;
    const added: CorporateFile[] = [];
    for (const file of list) {
      const sha256 = await sha256Hex(file);
      const dupe = files.find((f) => f.sha256 === sha256);
      if (dupe) return `${file.name} is identical to ${dupe.name} (v${dupe.version}), already on file.`;
      const sameSlot = files.filter((f) => f.type === t.id && (!t.multiple || f.name === file.name));
      added.push({
        type: t.id,
        name: file.name,
        bytes: file.size,
        sha256,
        effectiveDate: null,
        version: sameSlot.length ? Math.max(...sameSlot.map((f) => f.version)) + 1 : 1,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploader,
      });
    }
    onChange([...files, ...added]);
    return null;
  };

  const onDate = (f: CorporateFile, d: string) => onChange(files.map((x) => (x === f ? { ...x, effectiveDate: d || null } : x)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full bg-ink-900 transition-all" style={{ width: `${(onFile / required.length) * 100}%` }} />
          </div>
          <span className="text-[12px] text-stone-600">
            <strong className="text-ink-900">{onFile}</strong> of {required.length} required documents on file
          </span>
        </div>
        <span className="text-[12px] text-stone-500">{files.length} file{files.length === 1 ? "" : "s"} · PDF, DOCX or image · up to 50 MB each</span>
      </div>

      <ul className="divide-y divide-stone-100 rounded-[3px] border border-stone-200 bg-white">
        {gleif && (
          <li className="grid grid-cols-[22px_1fr_auto] gap-x-4 px-5 py-4">
            <CircleCheck size={17} className="mt-0.5 text-positive" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">LEI record</span>
                <span className="rounded-[2px] bg-gold-100 px-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gold-700">Captured from GLEIF</span>
              </div>
              <p className="mt-0.5 text-[12px] text-stone-500">
                <span className="font-mono">{gleif.lei}</span> · {gleif.status ?? "—"} · snapshot taken {dateTime(gleif.capturedAt)}, stored with the vehicle and refreshed on renewal.
              </p>
            </div>
            <a href={`https://search.gleif.org/#/record/${gleif.lei}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 text-[12px] font-semibold text-stone-600 hover:text-ink-900">
              GLEIF <ExternalLink size={12} />
            </a>
          </li>
        )}
        {CORPORATE_DOC_TYPES.map((t) => (
          <DocRow key={t.id} t={t} files={files.filter((f) => f.type === t.id)} onAdd={onAdd} onDate={onDate} />
        ))}
      </ul>

      <p className="text-[11.5px] leading-relaxed text-stone-500">
        Stored in Aurum&apos;s private document vault, organised by GP, vehicle and document type. Files are never overwritten: a new upload becomes the next version
        and earlier versions stay on record. Each file&apos;s SHA-256 fingerprint is recorded so any copy can be checked against the original.
        {!persisted && " Preview only: files stay in this browser session until the platform's database (Supabase) is connected."}
      </p>
    </div>
  );
}
