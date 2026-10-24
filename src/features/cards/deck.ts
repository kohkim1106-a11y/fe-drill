// Card deck selection and session state (S05/S06).
//
// A study run takes a snapshot of one card source (e.g. "まだ" cards) and walks
// through it in slices, so "続けて" always moves on to the next cards instead of
// re-serving the ones just marked.
import { signal } from "@preact/signals";
import { todayLocal } from "@/core/dates";
import { progress, recordAnswer } from "@/store";
import { navigate } from "@/router";
import type { ItemProgress, Term } from "@/types";

export type CardFilter = "all" | Term["field"];
export const SESSION_SIZES = [10, 20, 30] as const;
export type SessionSize = (typeof SESSION_SIZES)[number];

/** order = every card by list number; notYet / remembered = last answer; review = spaced-repetition due. */
export type CardSource = "order" | "notYet" | "remembered" | "review";
const SOURCES: readonly CardSource[] = ["order", "notYet", "remembered", "review"];

const SIZE_KEY = "fe-drill:v1:card-size";
const SOURCE_KEY = "fe-drill:v1:card-source";
const CURSOR_KEY = "fe-drill:v1:card-cursor";

function read<T>(key: string, parse: (raw: string) => T | undefined, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return (raw !== null && parse(raw)) || fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // per-device convenience only
  }
}

export const cardFilter = signal<CardFilter>("all");
/** Cards per round. There is no daily cap: a round can be repeated as often as the user likes. */
export const sessionSize = signal<SessionSize>(
  read(SIZE_KEY, (r) => (SESSION_SIZES as readonly number[]).includes(Number(r)) ? (Number(r) as SessionSize) : undefined, 10),
);
export const cardSource = signal<CardSource>(read(SOURCE_KEY, (r) => (SOURCES.includes(r as CardSource) ? (r as CardSource) : undefined), "order"));
/** Where "順番に" resumes, per field filter (0-based index into the filtered list). */
export const orderCursor = signal<Partial<Record<CardFilter, number>>>(read(CURSOR_KEY, (r) => JSON.parse(r) ?? undefined, {}));

export function setSessionSize(n: SessionSize): void {
  sessionSize.value = n;
  write(SIZE_KEY, String(n));
}
export function setCardSource(s: CardSource): void {
  cardSource.value = s;
  write(SOURCE_KEY, s);
}
export function setOrderCursor(filter: CardFilter, index: number): void {
  orderCursor.value = { ...orderCursor.value, [filter]: index };
  write(CURSOR_KEY, JSON.stringify(orderCursor.value));
}

export interface CardSession {
  source: CardSource;
  filter: CardFilter;
  pool: Term[]; // snapshot of the source when the run started
  start: number; // index in pool of deck[0]
  deck: Term[];
  index: number;
  remembered: number;
  notYet: number;
}
export const cardSession = signal<CardSession | null>(null);

export const isRemembered = (p: ItemProgress | undefined): boolean => p?.kind === "t" && p.last === "correct";
export const isNotYet = (p: ItemProgress | undefined): boolean => p?.kind === "t" && p.last === "wrong";

export function filterTerms(terms: Term[], filter: CardFilter): Term[] {
  return filter === "all" ? terms : terms.filter((t) => t.field === filter);
}

/** Due cards first (oldest due first), then unseen cards in data order. */
export function pickCards(terms: Term[], prog: Record<string, ItemProgress>, today: string, n: number = sessionSize.value): Term[] {
  const due = terms
    .filter((t) => {
      const p = prog[t.id];
      return p !== undefined && p.due <= today;
    })
    .sort((a, b) => prog[a.id]!.due.localeCompare(prog[b.id]!.due));
  const unseen = terms.filter((t) => prog[t.id] === undefined);
  return [...due, ...unseen].slice(0, n);
}

/** The cards a source offers, in the order a run walks through them. */
export function sourcePool(terms: Term[], source: CardSource, prog: Record<string, ItemProgress>, today: string): Term[] {
  switch (source) {
    case "order":
      return terms;
    case "notYet":
      return terms.filter((t) => isNotYet(prog[t.id]));
    case "remembered":
      return terms.filter((t) => isRemembered(prog[t.id]));
    case "review":
      return pickCards(terms, prog, today, Infinity);
  }
}

/** Starts a run over the source at `start` (only "順番に" uses a non-zero start). */
export function startRun(terms: Term[], source: CardSource, filter: CardFilter, start = 0): boolean {
  const pool = sourcePool(terms, source, progress.value, todayLocal());
  const from = Math.min(Math.max(0, start), pool.length);
  const deck = pool.slice(from, from + sessionSize.value);
  if (deck.length === 0) return false;
  cardSession.value = { source, filter, pool, start: from, deck, index: 0, remembered: 0, notYet: 0 };
  navigate("/cards/session");
  return true;
}

/** Index in the pool right after the current deck. */
export const nextStart = (s: CardSession): number => s.start + s.deck.length;

/** Moves to the next slice of the same snapshot; false when the run has reached the end. */
export function continueRun(): boolean {
  const s = cardSession.value;
  if (!s) return false;
  const from = nextStart(s);
  const deck = s.pool.slice(from, from + sessionSize.value);
  if (deck.length === 0) return false;
  cardSession.value = { ...s, start: from, deck, index: 0, remembered: 0, notYet: 0 };
  return true;
}

export function judge(remembered: boolean): void {
  const s = cardSession.value;
  if (!s || s.index >= s.deck.length) return;
  const term = s.deck[s.index]!;
  recordAnswer({ id: term.id, kind: "t" }, remembered);
  const next = {
    ...s,
    index: s.index + 1,
    remembered: s.remembered + (remembered ? 1 : 0),
    notYet: s.notYet + (remembered ? 0 : 1),
  };
  cardSession.value = next;
  // "順番に" remembers how far the user got, so the menu can offer "前回の続き".
  if (next.source === "order") setOrderCursor(next.filter, next.start + next.index);
}
