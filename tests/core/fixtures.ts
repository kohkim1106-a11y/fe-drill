import type { Field, ItemProgress, Question } from "@/types";
import { seededRandom } from "@/core/random";

let n = 0;
export function q(field: Field, minor: string, extra: Partial<Question> = {}): Question {
  n++;
  const exam = field === "algo" || field === "sec" ? "B" : "A";
  return {
    id: `${field}-${String(n).padStart(4, "0")}`,
    exam, field, major: "大分類", minor, difficulty: 1,
    stem: `問題${n}`, choices: ["ア", "イ", "ウ", "エ"], answer: 0, explanation: "解説",
    source: { type: "original" },
    ...extra,
  };
}

export function many(count: number, field: Field, minor: string): Question[] {
  return Array.from({ length: count }, () => q(field, minor));
}

export function prog(id: string, extra: Partial<ItemProgress> = {}): ItemProgress {
  return {
    id, kind: "q", seen: 1, correct: 1, reps: 1, ease: 2.5, interval: 1,
    due: "2026-10-24", lapses: 0, last: "correct", updatedAt: 1, ...extra,
  };
}

export const rng = (seed = 42) => seededRandom(seed);
