// STUB — agent B replaces the body (docs/03-design.md §4.4).
import type { ItemKind, ItemProgress, ReviewResult } from "@/types";

export function review(prev: ItemProgress | undefined, result: ReviewResult, today: string, item: { id: string; kind: ItemKind }): ItemProgress {
  return {
    id: item.id, kind: item.kind,
    seen: (prev?.seen ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (result === "correct" ? 1 : 0),
    reps: 0, ease: 2.5, interval: 0, due: today, lapses: 0, last: result, updatedAt: Date.now(),
  };
}
