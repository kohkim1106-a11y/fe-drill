// Question selection per practice mode (docs/03-design.md §3.1).
import { MOCK_PRESETS } from "@/types";
import type { Field, ItemProgress, Question, SelectContext, SessionItem, SessionMode } from "@/types";
import { generateRadixQuestions } from "./radix";
import { shuffled } from "./random";

export const REVIEW_MAX = 20;
export const WEAK_MIN_ANSWERS = 5;

type Random = () => number;

function choiceOrder(q: Question, random: Random): number[] {
  const order = q.choices.map((_, i) => i);
  return q.shuffle === false ? order : shuffled(order, random);
}

function toItems(questions: Question[], random: Random): SessionItem[] {
  return questions.map((question) => ({ question, order: choiceOrder(question, random) }));
}

/** Up to `count` random questions from `pool`, skipping ids already in `taken`. Mutates `taken`. */
function pick(pool: Question[], count: number, random: Random, taken: Set<string>): Question[] {
  const out: Question[] = [];
  for (const q of shuffled(pool, random)) {
    if (out.length >= count) break;
    if (taken.has(q.id)) continue;
    taken.add(q.id);
    out.push(q);
  }
  return out;
}

const qProgress = (ctx: SelectContext, id: string): ItemProgress | undefined => {
  const p = ctx.progress[id];
  return p && p.kind === "q" ? p : undefined;
};

const isUnseen = (ctx: SelectContext, q: Question) => (qProgress(ctx, q.id)?.seen ?? 0) === 0;

function selectReview(ctx: SelectContext, random: Random): Question[] {
  const due = ctx.questions
    .filter((q) => {
      const p = qProgress(ctx, q.id);
      return p !== undefined && p.seen > 0 && p.due <= ctx.today;
    })
    .sort((a, b) => {
      const da = qProgress(ctx, a.id)!.due;
      const db = qProgress(ctx, b.id)!.due;
      return da < db ? -1 : da > db ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, REVIEW_MAX);
  const taken = new Set(due.map((q) => q.id));
  // Top up with unseen 科目A questions first, then unseen 科目B.
  const unseen = ctx.questions.filter((q) => isUnseen(ctx, q));
  const topUpA = pick(unseen.filter((q) => q.exam === "A"), REVIEW_MAX - due.length, random, taken);
  const topUpB = pick(unseen.filter((q) => q.exam === "B"), REVIEW_MAX - due.length - topUpA.length, random, taken);
  return [...due, ...topUpA, ...topUpB];
}

interface MinorStat { field: Field; minor: string; answered: number; correct: number }

export function minorStats(questions: Question[], progress: Record<string, ItemProgress>): MinorStat[] {
  const map = new Map<string, MinorStat>();
  for (const q of questions) {
    const p = progress[q.id];
    if (!p || p.kind !== "q" || p.seen === 0) continue;
    const key = `${q.field}/${q.minor}`;
    const s = map.get(key) ?? { field: q.field, minor: q.minor, answered: 0, correct: 0 };
    s.answered += p.seen;
    s.correct += p.correct;
    map.set(key, s);
  }
  return [...map.values()];
}

/** Worst first; ties broken by more answers, then name, for a stable order. */
export function weakestMinors(stats: MinorStat[], minAnswers = WEAK_MIN_ANSWERS): MinorStat[] {
  return stats
    .filter((s) => s.answered >= minAnswers)
    .sort((a, b) => a.correct / a.answered - b.correct / b.answered || b.answered - a.answered || (`${a.field}/${a.minor}` < `${b.field}/${b.minor}` ? -1 : 1));
}

function selectWeak(ctx: SelectContext, count: number, random: Random): Question[] {
  const taken = new Set<string>();
  const out: Question[] = [];
  for (const m of weakestMinors(minorStats(ctx.questions, ctx.progress))) {
    if (out.length >= count) break;
    const pool = ctx.questions.filter((q) => q.field === m.field && q.minor === m.minor);
    // Within a weak minor, prefer questions the learner got wrong last time.
    const missed = pool.filter((q) => qProgress(ctx, q.id)?.last === "wrong");
    out.push(...pick(missed, count - out.length, random, taken));
    out.push(...pick(pool, count - out.length, random, taken));
  }
  if (out.length < count) out.push(...pick(ctx.questions.filter((q) => q.exam === "A"), count - out.length, random, taken));
  return out;
}

/** Picks per-group quotas; any shortfall is filled from the remaining groups' pools. */
function pickWithQuotas(groups: Array<{ pool: Question[]; count: number }>, total: number, random: Random): Question[] {
  const taken = new Set<string>();
  const parts = groups.map((g) => pick(g.pool, g.count, random, taken));
  let missing = total - parts.reduce((n, p) => n + p.length, 0);
  for (let i = 0; i < groups.length && missing > 0; i++) {
    const extra = pick(groups[i]!.pool, missing, random, taken);
    parts[i]!.push(...extra);
    missing -= extra.length;
  }
  return parts.flat(); // keep group order, like the real exam (tech → mgmt/strat, algo → sec)
}

function selectMock(ctx: SelectContext, preset: keyof typeof MOCK_PRESETS, random: Random): Question[] {
  const { exam, count } = MOCK_PRESETS[preset];
  const pool = ctx.questions.filter((q) => q.exam === exam);
  const byField = (...fields: Field[]) => pool.filter((q) => fields.includes(q.field));
  if (preset === "examA") {
    const tech = Math.round(count * 0.7);
    return pickWithQuotas([{ pool: byField("tech"), count: tech }, { pool: byField("mgmt", "strat"), count: count - tech }], count, random);
  }
  if (preset === "examB") {
    return pickWithQuotas([{ pool: byField("algo"), count: 16 }, { pool: byField("sec"), count: 4 }], count, random);
  }
  return pick(pool, count, random, new Set());
}

function selectQuestions(mode: SessionMode, ctx: SelectContext, random: Random): Question[] {
  switch (mode.kind) {
    case "review":
      return selectReview(ctx, random);
    case "random":
      return pick(ctx.questions.filter((q) => q.exam === "A"), mode.count, random, new Set());
    case "field":
      return pick(ctx.questions.filter((q) => q.field === mode.field && (mode.minor === undefined || q.minor === mode.minor)), mode.count, random, new Set());
    case "weak":
      return selectWeak(ctx, mode.count, random);
    case "radix":
      return generateRadixQuestions(mode.count, Math.floor(random() * 2 ** 31));
    case "mock":
      return selectMock(ctx, mode.preset, random);
  }
}

export function buildSession(mode: SessionMode, ctx: SelectContext): SessionItem[] {
  const random = ctx.random ?? Math.random;
  return toItems(selectQuestions(mode, ctx, random), random);
}
