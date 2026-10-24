// Question and term data shared by every screen, loaded once at startup.
import { signal } from "@preact/signals";
import { loadQuestions, loadTerms } from "@/data/loader";
import type { Question, Term } from "@/types";

export type ContentStatus = "loading" | "ready" | "error";

export const questions = signal<Question[]>([]);
export const terms = signal<Term[]>([]);
export const contentStatus = signal<ContentStatus>("loading");

let pending: Promise<void> | null = null;

export function loadContent(): Promise<void> {
  pending ??= Promise.all([loadQuestions(), loadTerms()])
    .then(([q, t]) => {
      questions.value = q;
      terms.value = t;
      contentStatus.value = "ready";
    })
    .catch((err: unknown) => {
      console.error(err);
      contentStatus.value = "error";
      pending = null; // allow a retry
    });
  return pending;
}

/** Test seam: inject data without going through the loader. */
export function setContent(q: Question[], t: Term[] = []): void {
  questions.value = q;
  terms.value = t;
  contentStatus.value = "ready";
}
