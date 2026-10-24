import { describe, expect, it } from "vitest";
import { summarize } from "@/core/stats";
import { addDays } from "@/core/dates";
import type { DayLog, Settings, StatsContext } from "@/types";
import { many, prog } from "./fixtures";

const T = "2026-10-24";
const settings: Settings = { theme: "system", examDate: null, dailyGoal: 25, updatedAt: 0 };
const day = (date: string, answered: number, correct = 0): DayLog => ({ date, answered, correct, cards: 0, updatedAt: 1 });
const ctx = (over: Partial<StatsContext> = {}): StatsContext => ({ questions: [], progress: {}, days: {}, settings, today: T, ...over });

describe("summarize", () => {
  it("空の状態", () => {
    const s = summarize(ctx());
    expect(s.total).toEqual({ answered: 0, correct: 0, rate: null });
    expect(Object.keys(s.byField).sort()).toEqual(["algo", "mgmt", "sec", "strat", "tech"]);
    expect(s.byField.sec.rate).toBeNull();
    expect(s.weakMinors).toEqual([]);
    expect(s.recentRate).toBeNull();
    expect(s.streak).toBe(0);
    expect(s.last14).toHaveLength(14);
    expect(s.suggestedDailyGoal).toBe(25);
    expect(s.daysLeft).toBeNull();
    expect(s.todayAnswered).toBe(0);
  });

  it("total と byField を集計する（用語カードは数えない）", () => {
    const tech = many(2, "tech", "ネットワーク");
    const algo = many(1, "algo", "アルゴリズムとプログラミング");
    const s = summarize(ctx({
      questions: [...tech, ...algo],
      progress: {
        [tech[0]!.id]: prog(tech[0]!.id, { seen: 4, correct: 3 }),
        [tech[1]!.id]: prog(tech[1]!.id, { seen: 2, correct: 0 }),
        [algo[0]!.id]: prog(algo[0]!.id, { seen: 1, correct: 1 }),
        "term-x": prog("term-x", { kind: "t", seen: 9, correct: 9 }),
      },
    }));
    expect(s.total).toEqual({ answered: 7, correct: 4, rate: 4 / 7 });
    expect(s.byField.tech).toEqual({ answered: 6, correct: 3, rate: 0.5 });
    expect(s.byField.algo.rate).toBe(1);
    expect(s.byField.mgmt).toEqual({ answered: 0, correct: 0, rate: null });
  });

  it("苦手は回答5回以上の中分類を正答率の低い順に最大5件", () => {
    const minors = ["ネットワーク", "データベース", "ソフトウェア", "ハードウェア", "基礎理論", "情報メディア", "セキュリティ"];
    const questions = minors.map((m) => many(1, "tech", m)[0]!);
    const progress = Object.fromEntries(questions.map((x, i) => [x.id, prog(x.id, { seen: i === 6 ? 4 : 10, correct: i })]));
    const s = summarize(ctx({ questions, progress }));
    expect(s.weakMinors).toHaveLength(5);
    expect(s.weakMinors.map((w) => w.minor)).toEqual(minors.slice(0, 5));
    expect(s.weakMinors[0]).toMatchObject({ field: "tech", answered: 10, correct: 0, rate: 0 });
    expect(s.weakMinors.some((w) => w.minor === "セキュリティ")).toBe(false); // 4 answers only
  });

  it("dueToday・unseen・目標の提案", () => {
    const qs = many(100, "tech", "ネットワーク");
    const progress = {
      [qs[0]!.id]: prog(qs[0]!.id, { due: "2026-10-23" }),
      [qs[1]!.id]: prog(qs[1]!.id, { due: T }),
      [qs[2]!.id]: prog(qs[2]!.id, { due: "2026-10-30" }),
      "deleted-question": prog("deleted-question", { due: "2026-01-01" }),
    };
    const s = summarize(ctx({ questions: qs, progress, settings: { ...settings, examDate: "2026-11-03" } }));
    expect(s.dueToday).toBe(2);
    expect(s.unseen).toBe(97);
    expect(s.daysLeft).toBe(10);
    expect(s.suggestedDailyGoal).toBe(Math.ceil(97 / 10) + 2); // 12
  });

  it("目標の提案は最低10", () => {
    const s = summarize(ctx({ questions: many(5, "tech", "ネットワーク"), settings: { ...settings, examDate: "2027-04-01" } }));
    expect(s.suggestedDailyGoal).toBe(10);
  });

  it("試験日当日・過ぎた場合も0除算しない", () => {
    const qs = many(30, "tech", "ネットワーク");
    expect(summarize(ctx({ questions: qs, settings: { ...settings, examDate: T } })).suggestedDailyGoal).toBe(30);
    const past = summarize(ctx({ questions: qs, settings: { ...settings, examDate: "2026-10-01" } }));
    expect(past.daysLeft).toBe(-23);
    expect(Number.isFinite(past.suggestedDailyGoal)).toBe(true);
  });

  it("連続学習日数は今日または昨日から遡る", () => {
    const days = { [T]: day(T, 3), [addDays(T, -1)]: day(addDays(T, -1), 1), [addDays(T, -2)]: day(addDays(T, -2), 2), [addDays(T, -4)]: day(addDays(T, -4), 5) };
    expect(summarize(ctx({ days })).streak).toBe(3);
    const fromYesterday = { [addDays(T, -1)]: day(addDays(T, -1), 1), [addDays(T, -2)]: day(addDays(T, -2), 1) };
    expect(summarize(ctx({ days: fromYesterday })).streak).toBe(2);
    expect(summarize(ctx({ days: { [addDays(T, -2)]: day(addDays(T, -2), 1) } })).streak).toBe(0);
    expect(summarize(ctx({ days: { [T]: day(T, 0) } })).streak).toBe(0);
  });

  it("last14 は古い順14日・欠けた日は0、recentRate は直近14日の DayLog", () => {
    const days = { [T]: day(T, 10, 7), [addDays(T, -13)]: day(addDays(T, -13), 10, 3), [addDays(T, -14)]: day(addDays(T, -14), 100, 0) };
    const s = summarize(ctx({ days }));
    expect(s.last14).toHaveLength(14);
    expect(s.last14[0]).toEqual({ date: addDays(T, -13), answered: 10 });
    expect(s.last14[13]).toEqual({ date: T, answered: 10 });
    expect(s.last14[5]!.answered).toBe(0);
    expect(s.recentRate).toBe(0.5);
    expect(s.todayAnswered).toBe(10);
  });
});
