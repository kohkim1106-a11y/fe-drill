// Card deck selection and session state (S05/S06).
import { signal } from "@preact/signals";
import { todayLocal } from "@/core/dates";
import { progress, recordAnswer } from "@/store";
import { navigate } from "@/router";
import type { ItemProgress, Term } from "@/types";

export type CardFilter = "all" | Term["field"];
export const CARDS_PER_SESSION = 10;

export const cardFilter = signal<CardFilter>("all");

export interface CardSession {
  deck: Term[];
  index: number;
  remembered: number;
  notYet: number;
}
export const cardSession = signal<CardSession | null>(null);

export const isRemembered = (p: ItemProgress | undefined): boolean => p?.kind === "t" && p.last === "correct";

/** Due cards first (oldest due first), then unseen cards in data order. */
export function pickCards(terms: Term[], prog: Record<string, ItemProgress>, today: string, n = CARDS_PER_SESSION): Term[] {
  const due = terms
    .filter((t) => {
      const p = prog[t.id];
      return p !== undefined && p.due <= today;
    })
    .sort((a, b) => prog[a.id]!.due.localeCompare(prog[b.id]!.due));
  const unseen = terms.filter((t) => prog[t.id] === undefined);
  return [...due, ...unseen].slice(0, n);
}

export function startCards(terms: Term[]): boolean {
  const deck = pickCards(terms, progress.value, todayLocal());
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
