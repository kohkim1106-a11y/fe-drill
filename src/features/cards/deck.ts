// Card deck selection and session state (S05/S06).
import { signal } from "@preact/signals";
import { todayLocal } from "@/core/dates";
import { progress, recordAnswer } from "@/store";
import { navigate } from "@/router";
import type { ItemProgress, Term } from "@/types";

export type CardFilter = "all" | Term["field"];
export const SESSION_SIZES = [10, 20, 30] as const;
export type SessionSize = (typeof SESSION_SIZES)[number];

const SIZE_KEY = "fe-drill:v1:card-size";
function loadSize(): SessionSize {
  try {
    const n = Number(localStorage.getItem(SIZE_KEY));
    return (SESSION_SIZES as readonly number[]).includes(n) ? (n as SessionSize) : 10;
  } catch {
    return 10;
  }
}

export const cardFilter = signal<CardFilter>("all");
/** Cards per round. There is no daily cap: a round can be repeated as often as the user likes. */
export const sessionSize = signal<SessionSize>(loadSize());

export function setSessionSize(n: SessionSize): void {
  sessionSize.value = n;
  try {
    localStorage.setItem(SIZE_KEY, String(n));
  } catch {
    // per-device convenience only
  }
}

export interface CardSession {
  deck: Term[];
  index: number;
  remembered: number;
  notYet: number;
}
export const cardSession = signal<CardSession | null>(null);

export const isRemembered = (p: ItemProgress | undefined): boolean => p?.kind === "t" && p.last === "correct";

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

/** Cards not due yet, least recently reviewed first; used once nothing is due or unseen. */
export function pickExtra(terms: Term[], prog: Record<string, ItemProgress>, n: number = sessionSize.value): Term[] {
  return terms
    .filter((t) => prog[t.id] !== undefined)
    .sort((a, b) => prog[a.id]!.updatedAt - prog[b.id]!.updatedAt)
    .slice(0, n);
}

/** Starts a round; falls back to extra review so studying is never blocked. */
export function startCards(terms: Term[]): boolean {
  const prog = progress.value;
  let deck = pickCards(terms, prog, todayLocal());
  if (deck.length === 0) deck = pickExtra(terms, prog);
  if (deck.length === 0) return false;
  cardSession.value = { deck, index: 0, remembered: 0, notYet: 0 };
  navigate("/cards/session");
  return true;
}

export function judge(remembered: boolean): void {
  const s = cardSession.value;
  if (!s || s.index >= s.deck.length) return;
  const term = s.deck[s.index]!;
  recordAnswer({ id: term.id, kind: "t" }, remembered);
  cardSession.value = {
    ...s,
    index: s.index + 1,
    remembered: s.remembered + (remembered ? 1 : 0),
    notYet: s.notYet + (remembered ? 0 : 1),
  };
}
