// STUB — agent B replaces the body (docs/03-design.md §5).
import type { Field, Rate, StatsContext, StatsSummary } from "@/types";

const empty = (): Rate => ({ answered: 0, correct: 0, rate: null });

export function summarize(_ctx: StatsContext): StatsSummary {
  const byField = { tech: empty(), mgmt: empty(), strat: empty(), algo: empty(), sec: empty() } satisfies Record<Field, Rate>;
  return {
    total: empty(), byField, weakMinors: [], recentRate: null, dueToday: 0, unseen: 0,
    daysLeft: null, suggestedDailyGoal: 20, streak: 0, last14: [], todayAnswered: 0,
  };
}
