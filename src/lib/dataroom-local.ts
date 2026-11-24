/**
 * Until the database is connected, the viewer page and the admin page share activity through this
 * browser's storage, so a preview visit shows up in the room's analytics and Q&A. Storage can be
 * unavailable (private windows, embedded previews) — every call is guarded.
 */
import type { PageView, Question } from "./dataroom";

const PV = "aurum-vdr-pageviews";
const QA = "aurum-vdr-questions";

function read<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function write<T>(key: string, v: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v.slice(-2000)));
  } catch {
    /* storage unavailable: activity simply isn't kept */
  }
}

export const localPageViews = () => read<PageView>(PV);
export const localQuestions = () => read<Question>(QA);

/** Add seconds to one viewer's page, merging into today's record. */
export function trackPage(docId: string, viewer: string, firm: string, page: number, seconds: number) {
  const all = read<PageView>(PV);
  const i = all.findIndex((v) => v.docId === docId && v.viewer === viewer && v.page === page);
  const at = new Date().toISOString();
  if (i >= 0) all[i] = { ...all[i], seconds: all[i].seconds + seconds, at };
  else all.push({ docId, viewer, firm, page, seconds, at });
  write(PV, all);
}

export function addLocalQuestion(q: Question) {
  write(QA, [...read<Question>(QA), q]);
}
