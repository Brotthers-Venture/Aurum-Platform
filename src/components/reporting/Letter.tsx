"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, Check, Link2, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { cx } from "@/components/ui";
import { GpLogo } from "@/components/brand/GpLogo";
import type { GpClient } from "@/lib/gps";
import { date, money } from "@/lib/format";
import { FIGURE_GROUPS, formatFigure, periodEnd, periodName, prevPeriod, type Figure, type FigureKey } from "@/lib/reporting/figures";
import type { Block, Close, Comment } from "@/lib/reporting/store";

type Figs = Record<string, Figure>;

/* ───────── a linked figure inside text ───────── */

function FigureChip({
  fig,
  prev,
  stale,
  compare,
  active,
  onOpen,
  prevLabel,
}: {
  fig: Figure;
  prevLabel: string;
  prev?: Figure;
  stale?: boolean;
  compare?: boolean;
  active?: boolean;
  onOpen?: () => void;
}) {
  const changed = !!prev && prev.kind !== "text" && prev.kind !== "date" && prev.value !== fig.value;
  const text = formatFigure(fig);
  if (!onOpen) return <span className="tnum">{text}</span>;
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        title={stale ? "Changed since review — open to see the source" : "Linked to the books — open to see the source"}
        className={cx(
          "tnum -mx-[2px] rounded-[3px] px-[2px] decoration-1 underline-offset-[3px] transition-colors",
          fig.kind === "text" || fig.kind === "date" ? "hover:underline hover:decoration-dotted" : "underline decoration-dotted",
          stale ? "bg-[#f6e3b4] decoration-[#8a5a00]" : active ? "bg-[#e9edf3] decoration-[#3d4b5c]" : "decoration-[#9aa3ad] hover:bg-[#eef0f3]",
        )}
      >
        {text}
      </button>
      {compare && changed && (
        <span className="tnum ml-1 text-[0.82em] text-[#6b7280]">
          ({prevLabel}: {formatFigure(prev!)})
        </span>
      )}
    </>
  );
}

/** Text with {{tokens}} rendered as linked figures. */
function Linked({ text, figs, render }: { text: string; figs: Figs; render: (key: string, fig: Figure) => ReactNode }) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{\{(\w+)\}\}$/);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        const fig = figs[m[1]];
        return fig ? (
          <Fragment key={i}>{render(m[1], fig)}</Fragment>
        ) : (
          <span key={i} className="rounded-[3px] bg-[#fde2e1] px-1 text-[#9b2c2c]">
            {p}
          </span>
        );
      })}
    </>
  );
}

/* ───────── the source of a figure ───────── */

export function FigureSource({ fig, asOf, prev, wasValue, onClose }: { fig: Figure; asOf: string; prev?: Figure | null; wasValue?: number | string; onClose: () => void }) {
  const m = (v: number) => money(v, fig.currency);
  const was = wasValue !== undefined ? formatFigure({ ...fig, value: wasValue }) : null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-stone-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-stone-500">
            <Link2 size={12} /> Linked figure
          </div>
          <div className="mt-0.5 text-[14px] font-semibold text-ink-900">{fig.label}</div>
        </div>
        <button onClick={onClose} aria-label="Close the source" className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
          <X size={15} />
        </button>
      </div>
      <div className="scroll-quiet flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[12.5px]">
        <div>
          <div className="fig text-[26px] leading-none text-ink-900">{formatFigure(fig)}</div>
          {fig.kind !== "text" && fig.kind !== "date" && <div className="mt-1.5 text-[12px] text-stone-500">As of {date(asOf)}</div>}
        </div>
        {was && (
          <div className="flex gap-2 rounded-[8px] border border-attn-line bg-[color-mix(in_oklab,var(--color-gold-500)_10%,transparent)] px-3 py-2 text-ink-900">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold-700" />
            <span>
              Changed since review: it was <span className="tnum font-semibold">{was}</span> when the package was sent for review.
            </span>
          </div>
        )}
        <div>
          <div className="mb-1 font-semibold text-ink-900">How it is calculated</div>
          <p className="leading-relaxed text-stone-600">{fig.formula}</p>
          {fig.adjusted && <p className="mt-1.5 leading-relaxed text-stone-600">Includes a valuation adjustment posted from the manager’s quarter-end fair value.</p>}
        </div>
        {fig.accounts.length > 0 && (
          <div>
            <div className="mb-1 font-semibold text-ink-900">Ledger accounts</div>
            <ul className="divide-y divide-stone-100 rounded-[8px] border border-stone-100">
              {fig.accounts.map((a) => (
                <li key={a.code} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="tnum w-10 text-stone-500">{a.code}</span>
                  <span className="min-w-0 flex-1 truncate text-stone-700">{a.name}</span>
                  <span className="tnum text-ink-900">{m(a.balance)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {fig.records.length > 0 && (
          <div>
            <div className="mb-1 font-semibold text-ink-900">Records</div>
            <ul className="divide-y divide-stone-100 rounded-[8px] border border-stone-100">
              {fig.records.map((r, i) => (
                <li key={i} className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{r.ref}</span>
                    <span className="tnum text-ink-900">{m(r.amount)}</span>
                  </div>
                  <div className="truncate text-[11.5px] text-stone-500">
                    {date(r.date)} · {r.label}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {prev && prev.kind !== "text" && (
          <div className="rounded-[8px] bg-stone-100/70 px-3 py-2 text-stone-600">
            Previous quarter: <span className="tnum font-semibold text-ink-900">{formatFigure(prev)}</span>
            {typeof prev.value === "number" && typeof fig.value === "number" && fig.kind === "money" && <span className="tnum"> · change {m(fig.value - prev.value)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── comments ───────── */

export function CommentThread({ comments, onReply, onResolve }: { comments: Comment[]; onReply?: (id: string, text: string) => void; onResolve?: (id: string) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  if (!comments.length) return <p className="px-1 py-4 text-center text-[12.5px] text-stone-500">No comments here yet.</p>;
  return (
    <ul className="space-y-2.5">
      {comments.map((c) => (
        <li key={c.id} className={cx("rounded-[10px] border px-3 py-2.5 text-[12.5px]", c.resolved ? "border-stone-100 opacity-70" : "border-stone-200 bg-white")}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink-900">{c.author}</span>
            <span className="text-[11px] text-stone-500">{c.side === "gp" ? "Manager" : "Aurum"}</span>
            <span className="ml-auto text-[11px] text-stone-400">{date(c.at.slice(0, 10))}</span>
          </div>
          <p className="mt-1 leading-relaxed text-stone-700">{c.text}</p>
          {c.replies.map((r, i) => (
            <div key={i} className="mt-2 border-l-2 border-stone-200 pl-2.5">
              <div className="text-[11.5px]">
                <span className="font-semibold text-ink-900">{r.author}</span> <span className="text-stone-500">{r.side === "gp" ? "Manager" : "Aurum"}</span>
              </div>
              <p className="leading-relaxed text-stone-700">{r.text}</p>
            </div>
          ))}
          {c.resolved ? (
            <div className="mt-2 flex items-center gap-1 text-[11.5px] text-up-ink">
              <Check size={12} /> Resolved
            </div>
          ) : (
            (onReply || onResolve) && (
              <div className="mt-2 flex items-center gap-2">
                {onReply && (
                  <input
                    value={draft[c.id] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [c.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draft[c.id]?.trim()) {
                        onReply(c.id, draft[c.id].trim());
                        setDraft({ ...draft, [c.id]: "" });
                      }
                    }}
                    placeholder="Reply and press Enter"
                    aria-label="Reply"
                    className="h-7 min-w-0 flex-1 rounded-[6px] border border-stone-200 bg-transparent px-2 text-[12px] text-ink-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
                  />
                )}
                {onResolve && (
                  <button
                    onClick={() => onResolve(c.id)}
                    className="h-7 shrink-0 rounded-[6px] border border-stone-200 px-2 text-[11.5px] font-semibold text-ink-900 hover:bg-stone-100"
                  >
                    Resolve
                  </button>
                )}
              </div>
            )
          )}
        </li>
      ))}
    </ul>
  );
}

/* ───────── the letter ───────── */

export type LetterProps = {
  close: Close;
  gp: GpClient;
  figures: Figs;
  prevFigures?: Figs | null;
  stale?: string[];
  /** interactive: figures open their source and paragraphs take comments */
  side?: "aurum" | "gp" | "investor";
  onComment?: (target: string, text: string) => void;
  onReply?: (id: string, text: string) => void;
  onResolve?: (id: string) => void;
  /** extra content for the side column, shown above comments (e.g. edit help) */
  aside?: ReactNode;
};

/** The investor letter on paper. Figures are linked; paragraphs can be commented on. */
export function LetterView({ close, gp, figures, prevFigures, stale = [], side = "investor", onComment, onReply, onResolve, aside }: LetterProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [thread, setThread] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [draft, setDraft] = useState("");
  const interactive = side !== "investor";
  const openFig = open ? figures[open] : null;
  const forBlock = (id: string) => close.comments.filter((c) => c.target === id);
  const unresolved = close.comments.filter((c) => !c.resolved);

  const paper = (
    <article className="mx-auto w-full max-w-[760px] rounded-[4px] bg-[#fbfaf7] px-8 py-9 text-[#1c2025] shadow-[0_1px_2px_rgba(30,25,15,0.06),0_14px_40px_-22px_rgba(30,25,15,0.35)] ring-1 ring-black/5 sm:px-12 sm:py-11">
      <header className="flex items-end justify-between gap-6 border-b border-[#e4dfd6] pb-5">
        <GpLogo gp={gp} height={gp.logo && gp.logo.width / gp.logo.height < 3 ? 46 : 26} tone="light" />
        <div className="text-right text-[11.5px] leading-relaxed text-[#6b7078]">
          {periodName(close.period)} investor letter
          <br />
          {figures.fund.value as string}
        </div>
      </header>
      <div className="mt-7 space-y-4 font-serif text-[15.5px] leading-[1.75]">
        {close.blocks.map((b) => {
          const count = forBlock(b.id).filter((c) => !c.resolved).length;
          const body =
            b.kind === "commentary" ? (
              close.request.commentary ? (
                <blockquote className="border-l-2 border-[#d6cfc2] pl-4 text-[#2b3036]">
                  {close.request.commentary}
                  <footer className="mt-1 font-sans text-[11.5px] not-italic text-[#6b7078]">Commentary from {gp.shortName}</footer>
                </blockquote>
              ) : (
                <p className="rounded-[4px] border border-dashed border-[#d6cfc2] px-4 py-3 font-sans text-[13px] text-[#6b7078]">
                  The manager’s commentary for the quarter appears here once {gp.shortName} answers the request.
                </p>
              )
            ) : (
              <p>
                <Linked
                  text={b.text}
                  figs={figures}
                  render={(key, fig) => (
                    <FigureChip
                      fig={fig}
                      prev={prevFigures?.[key]}
                      stale={stale.includes(key)}
                      compare={compare}
                      prevLabel={periodName(prevPeriod(close.period))}
                      active={open === key}
                      onOpen={
                        interactive
                          ? () => {
                              setOpen(key);
                              setThread(null);
                            }
                          : undefined
                      }
                    />
                  )}
                />
              </p>
            );
          return (
            <div key={b.id} className="group relative">
              {body}
              {interactive && (
                <button
                  onClick={() => {
                    setThread(b.id);
                    setOpen(null);
                  }}
                  aria-label={count ? `${count} comments on this paragraph` : "Comment on this paragraph"}
                  className={cx(
                    "absolute -right-9 top-1 flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full font-sans text-[11px] transition-opacity",
                    count ? "bg-[#f6e3b4] px-1.5 font-semibold text-[#6b4a00] opacity-100" : "text-[#9aa3ad] opacity-0 hover:bg-[#eef0f3] group-hover:opacity-100",
                    thread === b.id && "opacity-100 ring-1 ring-[#c9c1b2]",
                  )}
                >
                  <MessageSquare size={13} />
                  {count > 0 && count}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <footer className="mt-9 border-t border-[#e4dfd6] pt-5 font-sans text-[12.5px] text-[#4b5159]">
        <div className="font-semibold text-[#1c2025]">{gp.name}</div>
        <div className="mt-0.5">General partner</div>
        <div className="mt-5 text-[11px] text-[#8a8f96]">
          Administered by <span className="font-serif font-semibold tracking-[0.12em]">AURUM</span> Asset Management · Figures as of {date(periodEnd(close.period))}
        </div>
      </footer>
    </article>
  );

  if (!interactive) return paper;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-d-text-2">
          <span className="inline-flex items-center gap-1.5">
            <Link2 size={13} /> Underlined figures are linked to the books — select one to see where it comes from.
          </span>
          {prevFigures && (
            <label className="ml-auto inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="accent-[var(--d-accent)]" />
              Show {periodName(prevPeriod(close.period))} values
            </label>
          )}
        </div>
        <div className="pr-10">{paper}</div>
      </div>
      <aside className="h-fit overflow-hidden rounded-[12px] border border-stone-200 bg-white xl:sticky xl:top-4">
        {openFig ? (
          <FigureSource
            fig={openFig}
            asOf={periodEnd(close.period)}
            prev={prevFigures?.[open!]}
            wasValue={stale.includes(open!) ? close.snapshot?.[open!] : undefined}
            onClose={() => setOpen(null)}
          />
        ) : thread ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
              <MessageSquare size={14} className="text-stone-500" />
              <span className="flex-1 text-[13.5px] font-semibold text-ink-900">Comments on this paragraph</span>
              <button onClick={() => setThread(null)} aria-label="Close comments" className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3 px-4 py-3">
              <CommentThread comments={forBlock(thread)} onReply={onReply} onResolve={onResolve} />
              {onComment && (
                <div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder={side === "gp" ? "Ask Aurum about this paragraph" : "Comment or ask the manager"}
                    aria-label="New comment"
                    className="w-full resize-none rounded-[8px] border border-stone-200 bg-transparent px-3 py-2 text-[12.5px] text-ink-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
                  />
                  <button
                    disabled={!draft.trim()}
                    onClick={() => {
                      onComment(thread, draft.trim());
                      setDraft("");
                    }}
                    className="mt-1.5 h-8 rounded-[7px] bg-brand px-3 text-[12.5px] font-semibold text-brand-ink disabled:opacity-40"
                  >
                    Add comment
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {aside}
            <div className="border-b border-stone-100 px-4 py-3 text-[13.5px] font-semibold text-ink-900">
              Open comments <span className="tnum font-normal text-stone-500">{unresolved.length}</span>
            </div>
            <div className="px-4 py-3">
              {unresolved.length ? (
                <ul className="space-y-2">
                  {unresolved.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setThread(c.target)} className="w-full rounded-[8px] border border-stone-200 px-3 py-2 text-left text-[12.5px] hover:bg-stone-100/60">
                        <span className="font-semibold text-ink-900">{c.author}</span>
                        <span className="mt-0.5 line-clamp-2 block text-stone-600">{c.text}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-stone-500">
                          Open the paragraph <ArrowRight size={11} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-stone-500">
                  Hover over a paragraph and select the speech bubble to comment. Select an underlined figure to see its source.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ───────── editing ───────── */

/** Edit the letter's paragraphs. Figures are inserted as {{name}} and stay linked to the books. */
export function LetterEditor({ blocks, figures, onSave, onCancel }: { blocks: Block[]; figures: Figs; onSave: (b: Block[]) => void; onCancel: () => void }) {
  const [list, setList] = useState<Block[]>(() => blocks.map((b) => ({ ...b })));
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const unknown = list.flatMap((b) => [...b.text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).filter((k) => !figures[k]));

  const insert = (key: FigureKey) => {
    const id = focus ?? list.find((b) => b.kind !== "commentary")?.id;
    if (!id) return;
    const el = refs.current[id];
    const token = `{{${key}}}`;
    setList((l) =>
      l.map((b) => {
        if (b.id !== id) return b;
        const pos = el?.selectionStart ?? b.text.length;
        return { ...b, text: b.text.slice(0, pos) + token + b.text.slice(pos) };
      }),
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        {list.map((b, i) =>
          b.kind === "commentary" ? (
            <div key={b.id} className="rounded-[10px] border border-dashed border-stone-300 px-4 py-3 text-[12.5px] text-stone-600">
              The manager’s commentary goes here. It is filled in from their answer to the valuation request and can’t be edited by Aurum.
            </div>
          ) : (
            <div key={b.id} className="rounded-[10px] border border-stone-200 bg-white">
              <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-1.5 text-[11.5px] text-stone-500">
                Paragraph {i + 1}
                <button
                  onClick={() => setList((l) => l.filter((x) => x.id !== b.id))}
                  aria-label={`Remove paragraph ${i + 1}`}
                  className="ml-auto rounded-[5px] p-1 text-stone-400 hover:bg-stone-100 hover:text-negative"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <textarea
                ref={(el) => {
                  refs.current[b.id] = el;
                }}
                value={b.text}
                onFocus={() => setFocus(b.id)}
                onChange={(e) => setList((l) => l.map((x) => (x.id === b.id ? { ...x, text: e.target.value } : x)))}
                rows={Math.max(3, Math.ceil(b.text.length / 90))}
                aria-label={`Paragraph ${i + 1}`}
                className="w-full resize-y bg-transparent px-3 py-2.5 font-serif text-[14.5px] leading-relaxed text-ink-900 focus:outline-none"
              />
            </div>
          ),
        )}
        <button
          onClick={() => setList((l) => [...l, { id: `b${Date.now()}`, text: "" }])}
          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-stone-200 px-3 text-[12.5px] font-semibold text-ink-900 hover:bg-stone-100"
        >
          <Plus size={13} /> Add paragraph
        </button>
        {unknown.length > 0 && (
          <p className="rounded-[8px] border border-neg-line px-3 py-2 text-[12.5px] text-negative">
            {unknown.map((k) => `{{${k}}}`).join(", ")} {unknown.length === 1 ? "isn’t a linked figure" : "aren’t linked figures"}. Choose a figure from the list instead.
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            disabled={unknown.length > 0}
            onClick={() => onSave(list.filter((b) => b.kind === "commentary" || b.text.trim()))}
            className="h-9 rounded-[8px] bg-brand px-4 text-[13px] font-semibold text-brand-ink disabled:opacity-40"
          >
            Save the letter
          </button>
          <button onClick={onCancel} className="h-9 rounded-[8px] border border-stone-200 px-4 text-[13px] font-semibold text-ink-900 hover:bg-stone-100">
            Cancel
          </button>
        </div>
      </div>
      <aside className="h-fit rounded-[12px] border border-stone-200 bg-white xl:sticky xl:top-4">
        <div className="border-b border-stone-100 px-4 py-3">
          <div className="text-[13.5px] font-semibold text-ink-900">Insert a linked figure</div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
            Place the cursor in a paragraph, then choose a figure. It appears as {"{{name}}"} here and as the live value in the letter.
          </p>
        </div>
        <div className="scroll-quiet max-h-[60vh] overflow-y-auto px-2 py-2">
          {FIGURE_GROUPS.map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-2 py-1 text-[11.5px] font-semibold text-stone-500">{g.label}</div>
              {g.keys.map((k) => (
                <button key={k} onClick={() => insert(k)} className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] hover:bg-stone-100">
                  <span className="min-w-0 flex-1 truncate text-ink-900">{figures[k].label}</span>
                  <span className="tnum shrink-0 text-stone-500">{formatFigure(figures[k])}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
