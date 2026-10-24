// STUB — agent B replaces the body (persistence to localStorage, sync hooks).
import { signal } from "@preact/signals";
import type { DayLog, ItemKind, ItemProgress, SavedSession, Settings } from "@/types";

export const progress = signal<Record<string, ItemProgress>>({});
export const days = signal<Record<string, DayLog>>({});
export const settings = signal<Settings>({ theme: "system", examDate: null, dailyGoal: 20, updatedAt: 0 });
export const savedSession = signal<SavedSession | null>(null);

export function recordAnswer(_item: { id: string; kind: ItemKind }, _correct: boolean): void {}

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch, updatedAt: Date.now() };
}
