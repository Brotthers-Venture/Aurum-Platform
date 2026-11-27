/**
 * Concourse calendar: every dated thing the platform already knows, in one place, plus meetings scheduled here.
 * Nothing is copied in by hand: capital calls, distributions, PMO tasks, compliance deadlines, training, access
 * reviews, invoices, data room expiries and sales follow-ups are read from their own records, and each entry
 * opens the record it came from.
 *
 * Google Calendar sync and Meet links need the database and the firm's Google Workspace connection; until then,
 * meetings live in this browser and the calendar can be exported as an .ics file.
 */
import { capitalCalls, distributions, fundById, funds } from "@/lib/data";
import { plans, isTopic, PLAN_TODAY } from "@/lib/plans";
import { deadlines, courses, accessReviews } from "@/lib/compliance";
import { invoices } from "@/lib/billing";
import { rooms } from "@/lib/dataroom";
import { deals } from "@/lib/sales";
import { money } from "@/lib/format";

/** Which part of the platform a date comes from; it sets the colour and the filter. */
export type Source = "fund" | "pmo" | "compliance" | "billing" | "dataroom" | "sales" | "meeting";

export const SOURCES: { id: Source; label: string; color: string }[] = [
  { id: "meeting", label: "Meetings", color: "var(--module-communication, #1F8A84)" },
  { id: "fund", label: "Funds", color: "var(--tenant-accent)" },
  { id: "pmo", label: "PMO", color: "var(--module-pmo, #8A4A9E)" },
  { id: "compliance", label: "Compliance", color: "var(--module-compliance, #9B2F3F)" },
  { id: "billing", label: "Treasury", color: "var(--module-billing, #4F8A2B)" },
  { id: "dataroom", label: "Data rooms", color: "var(--module-dataroom, #3558C0)" },
  { id: "sales", label: "Sales", color: "var(--module-sales, #C46A1E)" },
];

export type CalEvent = {
  id: string;
  date: string;
  /** "HH:MM", meetings only; everything else is a date for the whole day */
  time?: string;
  minutes?: number;
  title: string;
  detail: string;
  source: Source;
  /** the person responsible, when the record names one */
  owner?: string;
  /** fund the date belongs to, for people outside the firm who see only their own funds */
  fundId?: string;
  href: string;
  done?: boolean;
};

/** The platform's demo "today", shared with the PMO and Compliance views. */
export const TODAY = PLAN_TODAY;

/** Every date the platform holds, before any person or filter is applied. */
export function platformDates(): CalEvent[] {
  const out: CalEvent[] = [];

  for (const c of capitalCalls) {
    const f = fundById(c.fundId)!;
    const href = `/admin/fund/capital-calls/${c.id}`;
    out.push({
      id: `call-due-${c.id}`,
      date: c.dueDate,
      title: `${f.shortName} call No. ${c.number} due`,
      detail: money(c.amount, f.currency),
      source: "fund",
      fundId: f.id,
      href,
      done: c.received >= c.amount,
    });
    if (c.status === "Draft")
      out.push({
        id: `call-notice-${c.id}`,
        date: c.noticeDate,
        title: `${f.shortName} call No. ${c.number} notices`,
        detail: "Notices go out",
        source: "fund",
        fundId: f.id,
        href,
      });
  }
  for (const d of distributions) {
    const f = fundById(d.fundId)!;
    out.push({
      id: `dist-${d.id}`,
      date: d.date,
      title: `${f.shortName} distribution`,
      detail: `${money(d.amount, f.currency)} · ${d.type}`,
      source: "fund",
      fundId: f.id,
      href: "/admin/fund/distributions",
      done: d.status === "Paid",
    });
  }
  for (const p of plans)
    for (const r of p.rows)
      if (!isTopic(r) && r.deadline)
        out.push({
          id: `pmo-${p.id}-${r.id}`,
          date: r.deadline,
          title: r.title,
          detail: p.name,
          source: "pmo",
          owner: r.owner,
          href: "/admin/pmo?tab=tasks",
          done: r.status === "Completed",
        });
  for (const d of deadlines)
    out.push({
      id: `comp-${d.id}`,
      date: d.due,
      title: d.title,
      detail: `${d.authority} · ${d.entity}`,
      source: "compliance",
      owner: d.owner,
      href: "/admin/compliance?tab=calendar",
      done: d.status === "Filed",
    });
  for (const c of courses)
    out.push({ id: `course-${c.id}`, date: c.due, title: `Training due: ${c.name}`, detail: "All staff", source: "compliance", href: "/admin/compliance?tab=training" });
  for (const a of accessReviews)
    out.push({
      id: `review-${a.id}`,
      date: a.due,
      title: `Access review: ${a.system}`,
      detail: `${a.users} users`,
      source: "compliance",
      owner: a.reviewer,
      href: "/admin/compliance?tab=reviews",
      done: a.status === "Complete",
    });
  for (const i of invoices)
    if (i.status !== "Draft" && i.status !== "Void")
      out.push({
        id: `inv-${i.id}`,
        date: i.due,
        title: `Invoice ${i.number} due`,
        detail: i.period,
        source: "billing",
        owner: i.preparedBy,
        href: "/admin/treasury?tab=invoices",
        done: i.status === "Paid",
      });
  for (const r of rooms)
    if (r.status !== "Closed" && r.expires)
      out.push({
        id: `room-${r.id}`,
        date: r.expires,
        title: `Data room closes: ${r.name}`,
        detail: r.client,
        source: "dataroom",
        owner: r.owner,
        href: "/admin/dataroom?tab=rooms",
      });
  for (const d of deals)
    if (d.nextDate && d.stage !== "Won" && d.stage !== "Lost")
      out.push({
        id: `deal-${d.id}`,
        date: d.nextDate,
        title: d.nextStep ?? `Follow up: ${d.account}`,
        detail: d.account,
        source: "sales",
        owner: d.owner,
        href: "/admin/sales?tab=pipeline",
      });

  return out.sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
}

export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Counts for the hub ring, from the platform's own dates. */
export function concourseCounts() {
  const all = platformDates();
  const week = addDays(TODAY, 7);
  return {
    week: all.filter((e) => e.date >= TODAY && e.date <= week && !e.done).length,
    overdue: all.filter((e) => e.date < TODAY && !e.done).length,
  };
}

/* ───────────────────────── meetings scheduled in Concourse (this browser) ───────────────────────── */

export type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  minutes: number;
  /** member ids from the platform's people */
  attendees: string[];
  /** what the meeting is about: a fund, by id */
  fundId?: string;
  agenda: string;
  createdBy: string;
};

export const meetingEvent = (m: Meeting): CalEvent => ({
  id: `meet-${m.id}`,
  date: m.date,
  time: m.time,
  minutes: m.minutes,
  title: m.title,
  detail: m.fundId ? (fundById(m.fundId)?.shortName ?? "") : `${m.attendees.length} attendees`,
  source: "meeting",
  owner: m.createdBy,
  fundId: m.fundId,
  href: `/admin/communication/calendar?meeting=${m.id}`,
});

/* ───────────────────────── .ics export ───────────────────────── */

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const compact = (iso: string) => iso.replace(/-/g, "");

/** A standard iCalendar file of the given dates; Google, Outlook and Apple calendars all import it. */
export function toIcs(events: CalEvent[], origin: string, calName: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Concourse//Calendar//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsText(calName)}`];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@concourse`, `DTSTAMP:${stamp}`);
    if (e.time) {
      // floating local time: the calendar shows it at the time written, in the reader's own zone
      const [h, m] = e.time.split(":").map(Number);
      const end = h * 60 + m + (e.minutes ?? 30);
      const hhmm = (t: number) => `${String(Math.floor(t / 60) % 24).padStart(2, "0")}${String(t % 60).padStart(2, "0")}00`;
      lines.push(`DTSTART:${compact(e.date)}T${hhmm(h * 60 + m)}`, `DTEND:${compact(e.date)}T${hhmm(end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`);
    }
    lines.push(`SUMMARY:${icsText(e.title)}`, `DESCRIPTION:${icsText(e.detail)}`, `URL:${origin}${e.href}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export const allFundIds = funds.map((f) => f.id);
