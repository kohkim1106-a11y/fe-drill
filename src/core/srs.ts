// Simplified SM-2 (docs/03-design.md §4.4).
import type { ItemKind, ItemProgress, ReviewResult } from "@/types";
import { addDays } from "./dates";

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;

const round2 = (n: number) => Math.round(n * 100) / 100; // avoid 2.5999999 drift

export function newProgress(item: { id: string; kind: ItemKind }, today: string): ItemProgress {
  return {
    id: item.id, kind: item.kind, seen: 0, correct: 0, reps: 0, ease: INITIAL_EASE,
    interval: 0, due: today, lapses: 0, last: "wrong", updatedAt: 0,
  };
}

function nextInterval(reps: number, prevInterval: number, ease: number): number {
  if (reps === 1) return 1;
  if (reps === 2) return 3;
  return Math.max(1, Math.round(prevInterval * ease));
}

export function review(
  prev: ItemProgress | undefined,
  result: ReviewResult,
  today: string,
  item: { id: string; kind: ItemKind },
): ItemProgress {
  const base = prev ?? newProgress(item, today);
  const seen = base.seen + 1;

  if (result === "correct") {
    const reps = base.reps + 1;
    const interval = nextInterval(reps, base.interval, base.ease);
    return {
      ...base, id: item.id, kind: item.kind, seen, correct: base.correct + 1, reps, interval,
      ease: round2(Math.min(MAX_EASE, base.ease + 0.1)),
      due: addDays(today, interval), last: "correct", updatedAt: Date.now(),
    };
  }
  return {
    ...base, id: item.id, kind: item.kind, seen, reps: 0, interval: 0,
    ease: round2(Math.max(MIN_EASE, base.ease - 0.2)),
    lapses: base.lapses + 1, due: today, last: "wrong", updatedAt: Date.now(),
  };
}
