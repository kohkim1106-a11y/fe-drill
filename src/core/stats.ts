// Analysis and study-plan numbers (docs/03-design.md §5).
import type { DayLog, Field, ItemProgress, Rate, StatsContext, StatsSummary } from "@/types";
import { addDays, diffDays } from "./dates";
import { minorStats, weakestMinors } from "./select";

const FIELDS: Field[] = ["tech", "mgmt", "strat", "algo", "sec"];
const WEAK_TOP = 5;
const RECENT_DAYS = 14;

export function rate(answered: number, correct: number): Rate {
  return { answered, correct, rate: answered > 0 ? correct / answered : null };
}

const isQ = (p: ItemProgress | undefined): p is ItemProgress => p !== undefined && p.kind === "q";

function streakFrom(days: Record<string, DayLog>, today: string): number {
  const active = (d: string) => (days[d]?.answered ?? 0) > 0;
  let day = active(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function summarize(ctx: StatsContext): StatsSummary {
  const { questions, progress, days, settings, today } = ctx;

  // Every answer counts toward the total, including generated drills (radix-*).
  const qEntries = Object.values(progress).filter(isQ);
  const total = rate(
    qEntries.reduce((n, p) => n + p.seen, 0),
    qEntries.reduce((n, p) => n + p.correct, 0),
  );

  const fieldSums = Object.fromEntries(FIELDS.map((f) => [f, { answered: 0, correct: 0 }])) as Record<Field, { answered: number; correct: number }>;
  let dueToday = 0;
  let unseen = 0;
  for (const q of questions) {
    const p = progress[q.id];
    if (!isQ(p) || p.seen === 0) {
      unseen++;
      continue;
    }
    fieldSums[q.field].answered += p.seen;
    fieldSums[q.field].correct += p.correct;
    if (p.due <= today) dueToday++;
  }
  const byField = Object.fromEntries(FIELDS.map((f) => [f, rate(fieldSums[f].answered, fieldSums[f].correct)])) as Record<Field, Rate>;

  const weakMinors = weakestMinors(minorStats(questions, progress))
    .slice(0, WEAK_TOP)
    .map((m) => ({ minor: m.minor, field: m.field, ...rate(m.answered, m.correct) }));

  // The type describes recentRate as "last 200 answers", but progress keeps only
  // per-item totals, so individual answers can't be ordered. We approximate it with
  // the correct/answered ratio of the last 14 days' DayLogs instead.
  const last14 = Array.from({ length: RECENT_DAYS }, (_, i) => {
    const date = addDays(today, i - (RECENT_DAYS - 1));
    return { date, answered: days[date]?.answered ?? 0 };
  });
  const recentAnswered = last14.reduce((n, d) => n + d.answered, 0);
  const recentCorrect = last14.reduce((n, d) => n + (days[d.date]?.correct ?? 0), 0);
  const recentRate = recentAnswered > 0 ? recentCorrect / recentAnswered : null;

  const daysLeft = settings.examDate ? diffDays(today, settings.examDate) : null;
  const suggestedDailyGoal =
    daysLeft === null ? settings.dailyGoal : Math.max(10, Math.ceil(unseen / Math.max(1, daysLeft)) + dueToday);

  return {
    total, byField, weakMinors, recentRate, dueToday, unseen, daysLeft, suggestedDailyGoal,
    streak: streakFrom(days, today),
    last14,
    todayAnswered: days[today]?.answered ?? 0,
  };
}
