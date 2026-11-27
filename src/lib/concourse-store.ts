"use client";

/** Meetings scheduled in Concourse, kept in this browser until the database is connected. */
import { useSyncExternalStore } from "react";
import type { Meeting } from "@/lib/concourse";

const KEY = "aurum-concourse-v1";
const EMPTY: Meeting[] = [];
let state: Meeting[] | null = null;
const listeners = new Set<() => void>();

function load(): Meeting[] {
  if (state) return state;
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    state = Array.isArray(v) ? (v as Meeting[]) : [];
  } catch {
    state = [];
  }
  return state;
}
function save(next: Meeting[]) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: meetings last for this visit */
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export const useMeetings = () => useSyncExternalStore(subscribe, load, () => EMPTY);
export const addMeeting = (m: Meeting) => save([...load(), m]);
export const removeMeeting = (id: string) => save(load().filter((m) => m.id !== id));
