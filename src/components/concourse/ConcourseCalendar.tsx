"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, ChevronLeft, ChevronRight, Download, Trash2, Video } from "lucide-react";
import { Button, cx } from "@/components/ui";
import { Dialog } from "@/components/offering/Forms";
import { ModuleName } from "@/components/brand/ModuleName";
import { useBrand } from "@/components/brand/BrandProvider";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { addDays, meetingEvent, platformDates, SOURCES, TODAY, toIcs, type CalEvent, type Meeting, type Source } from "@/lib/concourse";
import { addMeeting, removeMeeting, useMeetings } from "@/lib/concourse-store";
import { MEMBERS, memberById } from "@/lib/parties";
import { funds } from "@/lib/data";
import { moduleName } from "@/lib/brand";

const ALL_DATES = platformDates();
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const colorOf = (s: Source) => SOURCES.find((x) => x.id === s)!.color;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { ...o, timeZone: "UTC" });
const monthKey = (iso: string) => iso.slice(0, 7);
const shiftMonth = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const overdue = (e: CalEvent) => e.date < TODAY && !e.done;

type View = "month" | "agenda";

/**
 * The Concourse calendar: each person's dates from across the platform, and meetings scheduled here. Every entry
 * opens the record it belongs to.
 */
export function ConcourseCalendar() {
  const params = useSearchParams();
  const router = useRouter();
  const { brand } = useBrand();
  const { member, user } = usePreviewRole();
  const meetings = useMeetings();
  const insider = member.party === "employee";

  const [view, setView] = useState<View>(params.get("view") === "agenda" ? "agenda" : "month");
  const [month, setMonth] = useState(monthKey(TODAY));
  const [day, setDay] = useState(TODAY);
  const [mine, setMine] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(params.get("show") === "overdue");
  const [hidden, setHidden] = useState<Set<Source>>(() => {
    const only = params.get("filter") as Source | null;
    return only && SOURCES.some((s) => s.id === only) ? new Set(SOURCES.map((s) => s.id).filter((s) => s !== only)) : new Set();
  });
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [openMeeting, setOpenMeeting] = useState<string | null>(params.get("meeting"));

  // People outside the firm see only their own funds' dates and the meetings they are invited to.
  const ownFunds = useMemo(() => new Set(funds.filter((f) => f.gpId === member.org).map((f) => f.id)), [member.org]);
  const events = useMemo(() => {
    const mtg = meetings.filter((m) => insider || m.attendees.includes(member.id)).map(meetingEvent);
    const base = insider ? ALL_DATES : ALL_DATES.filter((e) => e.fundId && ownFunds.has(e.fundId));
    return [...base, ...mtg]
      .filter((e) => !hidden.has(e.source))
      .filter((e) => !mine || e.owner === user.name || (e.source === "meeting" && meetings.find((m) => `meet-${m.id}` === e.id)?.attendees.includes(member.id)))
      .filter((e) => !onlyOverdue || overdue(e))
      .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
  }, [meetings, insider, member.id, ownFunds, hidden, mine, onlyOverdue, user.name]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);

  const exportIcs = () => {
    const name = `${moduleName(brand, "communication")} — ${user.name}`;
    const blob = new Blob([toIcs(events, window.location.origin, name)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "concourse-calendar.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggle = (s: Source) => setHidden((h) => (h.has(s) ? new Set([...h].filter((x) => x !== s)) : new Set([...h, s])));
  const meeting = openMeeting ? meetings.find((m) => m.id === openMeeting) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-900">
            <ModuleName id="communication" />
          </h1>
          <nav aria-label="Concourse" className="mt-3 flex gap-1 text-[13px]">
            <Link href="/admin/communication" className="rounded-[6px] px-3 py-1.5 text-stone-500 hover:bg-stone-100 hover:text-ink-900">
              Messages
            </Link>
            <span aria-current="page" className="rounded-[6px] bg-stone-100 px-3 py-1.5 font-semibold text-ink-900">
              Calendar
            </span>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportIcs} title="Download these dates as an .ics file for Google, Outlook or Apple Calendar">
            <Download size={14} strokeWidth={1.8} /> Export .ics
          </Button>
          <Button onClick={() => setCreating(true)}>
            <CalendarPlus size={14} strokeWidth={1.8} /> New meeting
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-stone-200 py-2.5">
        <div className="flex items-center gap-1">
          <button aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-[6px] p-1.5 text-stone-500 hover:bg-stone-100 hover:text-ink-900">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              setMonth(monthKey(TODAY));
              setDay(TODAY);
            }}
            className="rounded-[6px] border border-stone-200 px-2.5 py-1 text-[12.5px] font-semibold text-ink-900 hover:bg-stone-100"
          >
            Today
          </button>
          <button aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-[6px] p-1.5 text-stone-500 hover:bg-stone-100 hover:text-ink-900">
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 min-w-[140px] text-[15px] font-semibold text-ink-900">{fmt(`${month}-01`, { month: "long", year: "numeric" })}</span>
        </div>
        <div role="group" aria-label="View" className="flex rounded-[8px] border border-stone-200 p-0.5">
          {(["month", "agenda"] as View[]).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cx("h-7 rounded-[6px] px-3 text-[12.5px]", view === v ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-500 hover:text-ink-900")}
            >
              {v === "month" ? "Month" : "Agenda"}
            </button>
          ))}
        </div>
        {insider && (
          <label className="flex items-center gap-1.5 text-[12.5px] text-stone-600">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-[var(--tenant-accent)]" /> Only mine
          </label>
        )}
        <label className="flex items-center gap-1.5 text-[12.5px] text-stone-600">
          <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} className="accent-[var(--tenant-accent)]" /> Only overdue
        </label>
        <div className="flex flex-wrap gap-1.5 lg:ml-auto">
          {SOURCES.filter((s) => insider || s.id === "fund" || s.id === "meeting").map((s) => (
            <button
              key={s.id}
              aria-pressed={!hidden.has(s.id)}
              onClick={() => toggle(s.id)}
              className={cx(
                "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px]",
                hidden.has(s.id) ? "border-stone-200 text-stone-400" : "border-stone-300 text-ink-900",
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: hidden.has(s.id) ? "transparent" : s.color, boxShadow: `inset 0 0 0 1.5px ${s.color}` }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {view === "month" ? (
            <MonthGrid month={month} byDay={byDay} day={day} onDay={setDay} />
          ) : (
            <Agenda events={events.filter((e) => e.date >= TODAY || overdue(e))} onMeeting={setOpenMeeting} />
          )}
        </div>
        <DayPanel day={day} events={byDay.get(day) ?? []} onMeeting={setOpenMeeting} />
      </div>

      {creating && (
        <NewMeeting
          defaultDate={day < TODAY ? TODAY : day}
          by={user.name}
          me={member.id}
          onClose={() => {
            setCreating(false);
            if (params.get("new")) router.replace("/admin/communication/calendar");
          }}
          onSaved={(m) => {
            setMonth(monthKey(m.date));
            setDay(m.date);
          }}
        />
      )}
      {meeting && <MeetingDetail m={meeting} onClose={() => setOpenMeeting(null)} />}
    </div>
  );
}

function MonthGrid({ month, byDay, day, onDay }: { month: string; byDay: Map<string, CalEvent[]>; day: string; onDay: (d: string) => void }) {
  const first = `${month}-01`;
  const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday first
  const start = addDays(first, -lead);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const rows = cells[35].slice(0, 7) === month ? 6 : 5;
  return (
    <div className="overflow-hidden rounded-[10px] border border-stone-200">
      <div className="grid grid-cols-7 border-b border-stone-200 text-[11.5px] font-semibold text-stone-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2.5 py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.slice(0, rows * 7).map((d, i) => {
          const list = byDay.get(d) ?? [];
          const inMonth = d.slice(0, 7) === month;
          return (
            <button
              key={d}
              onClick={() => onDay(d)}
              aria-label={`${fmt(d, { weekday: "long", month: "long", day: "numeric" })}, ${list.length} ${list.length === 1 ? "date" : "dates"}`}
              aria-pressed={d === day}
              className={cx(
                "flex min-h-[64px] flex-col items-stretch gap-1 border-stone-200 p-1 sm:min-h-[104px] sm:p-1.5 text-left align-top hover:bg-stone-50",
                i % 7 !== 6 && "border-r",
                i < (rows - 1) * 7 && "border-b",
                d === day && "bg-stone-100 hover:bg-stone-100",
              )}
            >
              <span
                className={cx(
                  "ml-1 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[12px] tabular-nums",
                  d === TODAY ? "bg-[var(--tenant-accent)] font-semibold text-[var(--tenant-accent-ink)]" : inMonth ? "text-ink-900" : "text-stone-400",
                )}
              >
                {Number(d.slice(8))}
              </span>
              {/* phones: a dot per date; the day panel below lists them */}
              {list.length > 0 && (
                <span className="flex flex-wrap gap-1 px-1 sm:hidden" aria-hidden>
                  {list.slice(0, 6).map((e) => (
                    <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: colorOf(e.source) }} />
                  ))}
                </span>
              )}
              {list.slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  className={cx("flex min-w-0 max-sm:hidden items-center gap-1.5 rounded-[4px] px-1 text-[11.5px] leading-[18px]", e.done ? "text-stone-400" : "text-ink-900")}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colorOf(e.source) }} />
                  {e.time && <span className="shrink-0 tabular-nums text-stone-500">{time12(e.time).replace(":00", "")}</span>}
                  <span className={cx("truncate", overdue(e) && "text-[#c0392b]")}>{e.title}</span>
                </span>
              ))}
              {list.length > 3 && <span className="px-1 text-[11px] text-stone-500 max-sm:hidden">{list.length - 3} more</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({ e, onMeeting, grouped }: { e: CalEvent; onMeeting: (id: string) => void; grouped?: boolean }) {
  const body = (
    <>
      <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(e.source) }} />
      <span className="min-w-0 flex-1">
        <span className={cx("block text-[13px] font-medium", e.done ? "text-stone-400 line-through decoration-stone-300" : "text-ink-900")}>{e.title}</span>
        <span className="block text-[12px] text-stone-500">
          {grouped ? `Due ${fmt(e.date, { month: "short", day: "numeric" })} · ` : ""}
          {e.time ? `${time12(e.time)} · ${e.minutes} min · ` : ""}
          {e.detail}
          {e.owner && e.source !== "meeting" ? ` · ${e.owner}` : ""}
        </span>
        {overdue(e) && !grouped && <span className="text-[11.5px] font-semibold text-[#c0392b]">Overdue</span>}
      </span>
    </>
  );
  const cls = "flex w-full gap-2.5 rounded-[8px] px-2 py-2 text-left hover:bg-stone-100";
  return e.source === "meeting" ? (
    <button className={cls} onClick={() => onMeeting(e.id.replace(/^meet-/, ""))}>
      {body}
    </button>
  ) : (
    <Link href={e.href} className={cls}>
      {body}
    </Link>
  );
}

function DayPanel({ day, events, onMeeting }: { day: string; events: CalEvent[]; onMeeting: (id: string) => void }) {
  return (
    <aside className="h-fit rounded-[10px] border border-stone-200 p-3">
      <h2 className="px-2 pt-1 text-[14px] font-semibold text-ink-900">{fmt(day, { weekday: "long", month: "long", day: "numeric" })}</h2>
      <p className="px-2 text-[12px] text-stone-500">
        {day === TODAY ? "Today" : events.length ? `${events.length} ${events.length === 1 ? "date" : "dates"}` : "Nothing scheduled"}
      </p>
      <div className="mt-2 space-y-0.5">
        {events.map((e) => (
          <EventRow key={e.id} e={e} onMeeting={onMeeting} />
        ))}
      </div>
    </aside>
  );
}

function Agenda({ events, onMeeting }: { events: CalEvent[]; onMeeting: (id: string) => void }) {
  const groups: [string, CalEvent[]][] = [];
  for (const e of events) {
    const key = overdue(e) ? "overdue" : e.date;
    const g = groups.find(([k]) => k === key);
    if (g) g[1].push(e);
    else groups.push([key, [e]]);
  }
  groups.sort(([a], [b]) => (a === "overdue" ? -1 : b === "overdue" ? 1 : a.localeCompare(b)));
  if (!groups.length) return <p className="rounded-[10px] border border-stone-200 px-5 py-10 text-center text-[13px] text-stone-500">Nothing matches these filters.</p>;
  return (
    <div className="divide-y divide-stone-200 rounded-[10px] border border-stone-200">
      {groups.map(([k, list]) => (
        <section key={k} className="grid gap-x-4 px-3 py-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <h3 className={cx("px-2 pt-2 text-[12.5px] font-semibold", k === "overdue" ? "text-[#c0392b]" : "text-ink-900")}>
            {k === "overdue" ? `Overdue · ${list.length}` : k === TODAY ? "Today" : fmt(k, { weekday: "short", month: "short", day: "numeric" })}
          </h3>
          <div className="space-y-0.5">
            {list.map((e) => (
              <EventRow key={e.id} e={e} onMeeting={onMeeting} grouped={k === "overdue"} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const field = "h-9 w-full rounded-[8px] border border-stone-200 bg-white px-2.5 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none";
const people = MEMBERS.filter((m) => m.party !== "guest");

function NewMeeting({ defaultDate, by, me, onClose, onSaved }: { defaultDate: string; by: string; me: string; onClose: () => void; onSaved: (m: Meeting) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");
  const [minutes, setMinutes] = useState(30);
  const [fundId, setFundId] = useState("");
  const [attendees, setAttendees] = useState<string[]>([me]);
  const [q, setQ] = useState("");
  const [agenda, setAgenda] = useState("");
  const matches = people.filter((p) => !attendees.includes(p.id) && q && `${p.name} ${p.orgName}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const problem = !title.trim() ? "Give the meeting a title." : attendees.length < 2 ? "Add at least one other person." : null;

  return (
    <Dialog title="New meeting" sub="Saved in Concourse and on everyone's calendar here. A Google Meet link is added once Google Workspace is connected." onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="text-[12px] font-semibold text-d-text">Title</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q4 capital call review" className={cx(field, "mt-1")} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[12px] font-semibold text-d-text">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cx(field, "mt-1")} />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-d-text">Start</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cx(field, "mt-1")} />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-d-text">Length</span>
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={cx(field, "mt-1")}>
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-[12px] font-semibold text-d-text">About (optional)</span>
          <select value={fundId} onChange={(e) => setFundId(e.target.value)} className={cx(field, "mt-1")}>
            <option value="">No fund</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="text-[12px] font-semibold text-d-text">People</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {attendees.map((id) => {
              const p = memberById(id);
              return (
                <span key={id} className="flex items-center gap-1 rounded-full border border-stone-200 py-0.5 pl-2.5 pr-1 text-[12px] text-ink-900">
                  {p?.name} <span className="text-stone-500">· {p?.orgName}</span>
                  {id !== me && (
                    <button
                      aria-label={`Remove ${p?.name}`}
                      onClick={() => setAttendees(attendees.filter((x) => x !== id))}
                      className="rounded-full px-1 text-stone-500 hover:text-ink-900"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add people by name or firm" className={cx(field, "mt-2")} />
          {matches.length > 0 && (
            <div className="mt-1 rounded-[8px] border border-stone-200">
              {matches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setAttendees([...attendees, p.id]);
                    setQ("");
                  }}
                  className="block w-full px-3 py-1.5 text-left text-[12.5px] text-ink-900 hover:bg-stone-100"
                >
                  {p.name} <span className="text-stone-500">· {p.orgName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="block">
          <span className="text-[12px] font-semibold text-d-text">Agenda (optional)</span>
          <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} className={cx(field, "mt-1 h-auto py-2")} />
        </label>
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-3">
          {problem && <span className="mr-auto text-[12px] text-stone-500">{problem}</span>}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!!problem}
            onClick={() => {
              const m: Meeting = {
                id: Date.now().toString(36),
                title: title.trim(),
                date,
                time,
                minutes,
                attendees,
                fundId: fundId || undefined,
                agenda: agenda.trim(),
                createdBy: by,
              };
              addMeeting(m);
              onSaved(m);
              onClose();
            }}
          >
            Schedule
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function MeetingDetail({ m, onClose }: { m: Meeting; onClose: () => void }) {
  const fund = funds.find((f) => f.id === m.fundId);
  return (
    <Dialog
      title={m.title}
      sub={`${fmt(m.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · ${time12(m.time)} · ${m.minutes} min`}
      onClose={onClose}
      width={480}
    >
      <div className="space-y-4 text-[13px]">
        <p className="flex items-center gap-2 rounded-[8px] border border-dashed border-stone-300 px-3 py-2 text-[12.5px] text-stone-500">
          <Video size={14} /> The Google Meet link appears here once Google Workspace is connected.
        </p>
        {fund && (
          <p>
            <span className="text-stone-500">About </span>
            <Link href={`/admin/fund/funds/${fund.id}`} className="font-semibold text-ink-900 hover:underline">
              {fund.name}
            </Link>
          </p>
        )}
        <div>
          <div className="text-[12px] font-semibold text-stone-500">People</div>
          <ul className="mt-1 space-y-0.5">
            {m.attendees.map((id) => {
              const p = memberById(id);
              return (
                <li key={id} className="text-ink-900">
                  {p?.name} <span className="text-stone-500">· {p?.orgName}</span>
                </li>
              );
            })}
          </ul>
        </div>
        {m.agenda && (
          <div>
            <div className="text-[12px] font-semibold text-stone-500">Agenda</div>
            <p className="mt-1 whitespace-pre-wrap text-ink-900">{m.agenda}</p>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-stone-200 pt-3">
          <span className="text-[12px] text-stone-500">Scheduled by {m.createdBy}</span>
          <Button
            variant="ghost"
            onClick={() => {
              removeMeeting(m.id);
              onClose();
            }}
          >
            <Trash2 size={13} /> Cancel meeting
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
