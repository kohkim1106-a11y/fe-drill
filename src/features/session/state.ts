// Practice session state (S03) and the finished result (S04).
// Kept outside components so the menu, home and stats screens can start a session.
import { signal } from "@preact/signals";
import { buildSession } from "@/core/select";
import { todayLocal } from "@/core/dates";
import { progress, recordAnswer, savedSession } from "@/store";
import { navigate } from "@/router";
import { questions } from "@/features/content";
import { isMock, mockMinutes, modeLabel } from "@/features/labels";
import type { Question, SessionAnswer, SessionItem, SessionMode } from "@/types";

export interface ActiveSession {
  mode: SessionMode;
  label: string;
  items: SessionItem[];
  answers: SessionAnswer[]; // answers[i] belongs to items[i]
  index: number;
  remainingMs: number | null; // mock timer, null = untimed
}

export interface SessionResult {
  mode: SessionMode;
  label: string;
  items: SessionItem[];
  answers: SessionAnswer[];
}

export const activeSession = signal<ActiveSession | null>(null);
export const lastResult = signal<SessionResult | null>(null);

const isGenerated = (id: string) => id.startsWith("radix-");

function shuffledOrder(q: Question, random: () => number = Math.random): number[] {
  const order = q.choices.map((_, i) => i);
  if (q.shuffle === false) return order;
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** Builds the items for a mode (buildSession also generates the radix drill). */
export function itemsForMode(mode: SessionMode): SessionItem[] {
  return buildSession(mode, { questions: questions.value, progress: progress.value, today: todayLocal() });
}

export function startSession(mode: SessionMode, items: SessionItem[], label = modeLabel(mode)): boolean {
  if (items.length === 0) return false;
  const minutes = mockMinutes(mode);
  activeSession.value = { mode, label, items, answers: [], index: 0, remainingMs: minutes === null ? null : minutes * 60_000 };
  navigate("/session");
  return true;
}

/** Returns false when there is nothing to ask (caller shows a notice). */
export function startMode(mode: SessionMode): boolean {
  if (isMock(mode)) savedSession.value = null; // a new mock replaces the interrupted one
  return startSession(mode, itemsForMode(mode));
}

/** Answers the current question. `picked` is the ORIGINAL choice index. */
export function answer(picked: number): void {
  const s = activeSession.value;
  if (!s || s.answers[s.index]) return;
  const item = s.items[s.index]!;
  const correct = picked === item.question.answer;
  if (!isGenerated(item.question.id)) recordAnswer({ id: item.question.id, kind: "q" }, correct);
  const answers = [...s.answers];
  answers[s.index] = { questionId: item.question.id, picked, correct };
  activeSession.value = { ...s, answers };
  if (isMock(s.mode)) {
    next(); // mocks give no feedback: move straight on
    saveMock();
  }
}

export function next(): void {
  const s = activeSession.value;
  if (!s) return;
  if (s.index + 1 >= s.items.length) finish();
  else activeSession.value = { ...s, index: s.index + 1 };
}

export function tick(ms: number): void {
  const s = activeSession.value;
  if (!s || s.remainingMs === null) return;
  const remainingMs = Math.max(0, s.remainingMs - ms);
  activeSession.value = { ...s, remainingMs };
  if (remainingMs === 0) finish();
}

export function finish(): void {
  const s = activeSession.value;
  if (!s) return;
  // Unanswered questions count as wrong in the score but are not recorded as reviews.
  const answers = s.items.map(
    (it, i) => s.answers[i] ?? { questionId: it.question.id, picked: null, correct: false },
  );
  lastResult.value = { mode: s.mode, label: s.label, items: s.items, answers };
  if (isMock(s.mode)) savedSession.value = null;
  activeSession.value = null;
  navigate("/result");
}

export function saveMock(): void {
  const s = activeSession.value;
  if (!s || !isMock(s.mode)) return;
  savedSession.value = {
    mode: s.mode,
    itemIds: s.items.map((it) => it.question.id),
    orders: s.items.map((it) => it.order),
    answers: s.answers.filter(Boolean),
    index: s.index,
    remainingMs: s.remainingMs,
    savedAt: Date.now(),
  };
}

/** 終了 button: mocks are saved for later, practice goes to the result if anything was answered. */
export function exitSession(): void {
  const s = activeSession.value;
  if (!s) return;
  if (isMock(s.mode)) {
    saveMock();
    activeSession.value = null;
    navigate("/practice");
  } else if (s.answers.some(Boolean)) {
    finish();
  } else {
    activeSession.value = null;
    navigate("/practice");
  }
}

export function resumeSaved(): boolean {
  const saved = savedSession.value;
  if (!saved) return false;
  const byId = new Map(questions.value.map((q) => [q.id, q]));
  const items: SessionItem[] = [];
  const answers: SessionAnswer[] = [];
  const answerById = new Map(saved.answers.map((a) => [a.questionId, a]));
  let index = 0;
  saved.itemIds.forEach((id, i) => {
    const question = byId.get(id);
    if (!question) return; // the question was removed from the data since saving
    if (i < saved.index) index = items.length + 1;
    const a = answerById.get(id);
    if (a) answers[items.length] = a;
    items.push({ question, order: saved.orders[i] ?? question.choices.map((_, k) => k) });
  });
  if (items.length === 0) {
    savedSession.value = null;
    return false;
  }
  activeSession.value = {
    mode: saved.mode,
    label: modeLabel(saved.mode),
    items,
    answers,
    index: Math.min(index, items.length - 1),
    remainingMs: saved.remainingMs,
  };
  navigate("/session");
  return true;
}

/** S04 「間違えた問題をもう一度」: untimed retry with feedback, choices reshuffled. */
export function retryWrong(): boolean {
  const r = lastResult.value;
  if (!r) return false;
  const wrong = r.items.filter((_, i) => !r.answers[i]?.correct);
  return startSession(
    { kind: "random", count: wrong.length },
    wrong.map((it) => ({ question: it.question, order: shuffledOrder(it.question) })),
    "間違えた問題",
  );
}
