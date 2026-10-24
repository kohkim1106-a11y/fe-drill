// App-wide learning state as signals, persisted to localStorage (docs/03-design.md §4.3).
// The device copy is the source of truth; sync subscribes via onLocalChange and
// feeds remote data back through mergeRemote (per-document last-write-wins).
import { effect, signal } from "@preact/signals";
import type { DayLog, ItemKind, ItemProgress, SavedSession, Settings, ThemePref } from "@/types";
import { isDateString, todayLocal } from "@/core/dates";
import { review } from "@/core/srs";

export const STORAGE_KEYS = {
  progress: "fe-drill:v1:progress",
  days: "fe-drill:v1:days",
  settings: "fe-drill:v1:settings",
  session: "fe-drill:v1:session",
} as const;

export const DEFAULT_SETTINGS: Settings = { theme: "system", examDate: null, dailyGoal: 20, updatedAt: 0 };

// ---- tolerant validation (old or hand-edited data must never crash the app)

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function isItemProgress(v: unknown): v is ItemProgress {
  return isObj(v) && typeof v.id === "string" && (v.kind === "q" || v.kind === "t")
    && isNum(v.seen) && isNum(v.correct) && isNum(v.reps) && isNum(v.ease) && isNum(v.interval)
    && isDateString(v.due) && isNum(v.lapses) && (v.last === "correct" || v.last === "wrong") && isNum(v.updatedAt);
}

export function isDayLog(v: unknown): v is DayLog {
  return isObj(v) && isDateString(v.date) && isNum(v.answered) && isNum(v.correct) && isNum(v.cards) && isNum(v.updatedAt);
}

export function toSettings(v: unknown): Settings {
  if (!isObj(v)) return { ...DEFAULT_SETTINGS };
  const themes: ThemePref[] = ["system", "dark", "light"];
  return {
    theme: themes.includes(v.theme as ThemePref) ? (v.theme as ThemePref) : DEFAULT_SETTINGS.theme,
    examDate: isDateString(v.examDate) ? v.examDate : null,
    dailyGoal: isNum(v.dailyGoal) && v.dailyGoal > 0 ? Math.round(v.dailyGoal) : DEFAULT_SETTINGS.dailyGoal,
    updatedAt: isNum(v.updatedAt) ? v.updatedAt : 0,
  };
}

function isSavedSession(v: unknown): v is SavedSession {
  return isObj(v) && isObj(v.mode) && typeof v.mode.kind === "string" && Array.isArray(v.itemIds)
    && Array.isArray(v.orders) && Array.isArray(v.answers) && isNum(v.index) && v.itemIds.length === v.orders.length;
}

/** Keeps valid entries of a keyed record, re-keyed by their own id/date. */
export function toRecord<T>(v: unknown, guard: (x: unknown) => x is T, key: (x: T) => string): Record<string, T> {
  const out: Record<string, T> = {};
  const values = Array.isArray(v) ? v : isObj(v) ? Object.values(v) : [];
  for (const x of values) if (guard(x)) out[key(x)] = x;
  return out;
}

// ---- persistence

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled (private mode): keep running in memory.
  }
}

export const progress = signal<Record<string, ItemProgress>>(toRecord(read(STORAGE_KEYS.progress), isItemProgress, (p) => p.id));
export const days = signal<Record<string, DayLog>>(toRecord(read(STORAGE_KEYS.days), isDayLog, (d) => d.date));
export const settings = signal<Settings>(toSettings(read(STORAGE_KEYS.settings)));
export const savedSession = signal<SavedSession | null>((() => {
  const s = read(STORAGE_KEYS.session);
  return isSavedSession(s) ? s : null;
})());

effect(() => write(STORAGE_KEYS.progress, progress.value));
effect(() => write(STORAGE_KEYS.days, days.value));
effect(() => write(STORAGE_KEYS.settings, settings.value));
effect(() => write(STORAGE_KEYS.session, savedSession.value));

// ---- local change feed (consumed by sync)

export interface ChangeSet {
  progress: ItemProgress[];
  days: DayLog[];
  settings: Settings | null;
}

type Listener = (change: ChangeSet) => void;
const listeners = new Set<Listener>();

export function onLocalChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(change: Partial<ChangeSet>): void {
  const full: ChangeSet = { progress: change.progress ?? [], days: change.days ?? [], settings: change.settings ?? null };
  for (const l of listeners) {
    try {
      l(full);
    } catch (error) {
      console.warn("[store] change listener failed", error);
    }
  }
}

// ---- actions

export function recordAnswer(item: { id: string; kind: ItemKind }, correct: boolean): void {
  const today = todayLocal();
  const next = review(progress.value[item.id], correct ? "correct" : "wrong", today, item);
  progress.value = { ...progress.value, [item.id]: next };

  const prev = days.value[today] ?? { date: today, answered: 0, correct: 0, cards: 0, updatedAt: 0 };
  const day: DayLog = item.kind === "q"
    ? { ...prev, answered: prev.answered + 1, correct: prev.correct + (correct ? 1 : 0), updatedAt: Date.now() }
    : { ...prev, cards: prev.cards + 1, updatedAt: Date.now() };
  days.value = { ...days.value, [today]: day };

  emit({ progress: [next], days: [day] });
}

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = toSettings({ ...settings.value, ...patch, updatedAt: Date.now() });
  emit({ settings: settings.value });
}

/** Clears this device's records. Remote copies are not deleted (sync has no tombstones). */
export function resetAll(): void {
  progress.value = {};
  days.value = {};
  settings.value = { ...DEFAULT_SETTINGS };
  savedSession.value = null;
}

// ---- merge (pure) + remote application

/** Per-key last-write-wins. Returns the merged record and the local entries the remote lacks or has older. */
export function mergeRecords<T extends { updatedAt: number }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): { merged: Record<string, T>; changed: boolean; localNewer: T[] } {
  const merged = { ...local };
  let changed = false;
  for (const [key, r] of Object.entries(remote)) {
    const l = local[key];
    if (!l || r.updatedAt > l.updatedAt) {
      merged[key] = r;
      changed = true;
    }
  }
  const localNewer = Object.entries(local)
    .filter(([key, l]) => !remote[key] || l.updatedAt > remote[key]!.updatedAt)
    .map(([, l]) => l);
  return { merged, changed, localNewer };
}

export interface RemoteData {
  progress?: unknown;
  days?: unknown;
  settings?: unknown;
}

/**
 * Applies remote documents (invalid ones are ignored) and returns what the remote
 * is missing or has older, so the caller can push it back.
 */
export function mergeRemote(remote: RemoteData): ChangeSet {
  const p = mergeRecords(progress.value, toRecord(remote.progress, isItemProgress, (x) => x.id));
  if (p.changed) progress.value = p.merged;

  const d = mergeRecords(days.value, toRecord(remote.days, isDayLog, (x) => x.date));
  if (d.changed) days.value = d.merged;

  let settingsToPush: Settings | null = null;
  if (remote.settings !== undefined && remote.settings !== null) {
    const rs = toSettings(remote.settings);
    if (rs.updatedAt > settings.value.updatedAt) settings.value = rs;
    else if (settings.value.updatedAt > rs.updatedAt) settingsToPush = settings.value;
  } else if (settings.value.updatedAt > 0) {
    settingsToPush = settings.value;
  }

  return { progress: p.localNewer, days: d.localNewer, settings: settingsToPush };
}
