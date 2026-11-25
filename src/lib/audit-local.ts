/**
 * Until the database is connected, changes made in this browser (status, owner and approval changes in
 * Corporate Chat, for example) are appended here and shown with the platform audit log. Append-only:
 * nothing in the app edits or deletes an entry.
 */
import type { AuditEvent } from "./access";

const KEY = "aurum-audit-v1";

export function localAudit(): AuditEvent[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
  } catch {
    return [];
  }
}

export function recordAudit(e: Omit<AuditEvent, "at" | "ip"> & { at?: string }) {
  try {
    const all = localAudit();
    all.push({ at: e.at ?? new Date().toISOString().slice(0, 19), user: e.user, action: e.action, object: e.object, ip: "This browser" });
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(-1000)));
  } catch {
    /* storage unavailable: the audit entry exists for this visit only */
  }
}
