import { describe, expect, it } from "vitest";
import { buildSession } from "@/core/select";
import type { Question, SelectContext, SessionItem, SessionMode } from "@/types";
import { many, prog, q, rng } from "./fixtures";

const T = "2026-10-24";
const ctxOf = (questions: Question[], progress: SelectContext["progress"] = {}, seed = 1): SelectContext => ({ questions, progress, today: T, random: rng(seed) });
const ids = (items: SessionItem[]) => items.map((i) => i.question.id);
const noDup = (items: SessionItem[]) => expect(new Set(ids(items)).size).toBe(items.length);

const bank = [
  ...many(60, "tech", "ネットワーク"),
  ...many(30, "tech", "データベース"),
  ...many(15, "mgmt", "プロジェクトマネジメント"),
  ...many(15, "strat", "法務"),
  ...many(20, "algo", "アルゴリズムとプログラミング"),
  ...many(8, "sec", "情報セキュリティ"),
];

const allModes: SessionMode[] = [
  { kind: "review" }, { kind: "random", count: 10 }, { kind: "field", field: "tech", count: 10 },
  { kind: "weak", count: 10 }, { kind: "radix", count: 10 },
  { kind: "mock", preset: "mini" }, { kind: "mock", preset: "examA" }, { kind: "mock", preset: "examB" },
];

describe("buildSession 共通", () => {
  it.each(allModes)("%o: 重複なし・order は選択肢の並べ替え", (mode) => {
    const items = buildSession(mode, ctxOf(bank));
    noDup(items);
    for (const it of items) expect([...it.order].sort()).toEqual(it.question.choices.map((_, i) => i));
  });

  it.each(allModes.filter((m) => m.kind !== "radix"))("%o: 空のプールでも落ちず空配列", (mode) => {
    expect(buildSession(mode, ctxOf([]))).toEqual([]);
  });

  it("shuffle: false の問題は選択肢の順を保つ", () => {
    const fixed = Array.from({ length: 10 }, () => q("tech", "ネットワーク", { shuffle: false }));
    for (const it of buildSession({ kind: "random", count: 10 }, ctxOf(fixed))) expect(it.order).toEqual([0, 1, 2, 3]);
  });

  it("shuffle 既定では選択肢を並べ替える", () => {
    const items = buildSession({ kind: "random", count: 10 }, ctxOf(bank));
    expect(items.some((it) => it.order.join() !== "0,1,2,3")).toBe(true);
  });

  it("同じ乱数なら同じ結果（決定的）", () => {
    const a = buildSession({ kind: "mock", preset: "examA" }, ctxOf(bank, {}, 9));
    const b = buildSession({ kind: "mock", preset: "examA" }, ctxOf(bank, {}, 9));
    expect(ids(a)).toEqual(ids(b));
    expect(a.map((i) => i.order)).toEqual(b.map((i) => i.order));
  });
});

describe("review", () => {
  it("期限切れを due の古い順に出し、足りない分を未出題で補う（最大20）", () => {
    const qs = many(30, "tech", "ネットワーク");
    const progress = {
      [qs[0]!.id]: prog(qs[0]!.id, { due: "2026-10-24" }),
      [qs[1]!.id]: prog(qs[1]!.id, { due: "2026-10-20" }),
      [qs[2]!.id]: prog(qs[2]!.id, { due: "2026-10-22" }),
      [qs[3]!.id]: prog(qs[3]!.id, { due: "2026-10-25" }), // not due yet
    };
    const items = buildSession({ kind: "review" }, ctxOf(qs, progress));
    expect(items).toHaveLength(20);
    expect(ids(items).slice(0, 3)).toEqual([qs[1]!.id, qs[2]!.id, qs[0]!.id]);
    expect(ids(items)).not.toContain(qs[3]!.id);
    for (const it of items.slice(3)) expect(progress[it.question.id]).toBeUndefined();
    noDup(items);
  });

  it("期限切れが20を超えたら古い20問だけ", () => {
    const qs = many(25, "tech", "ネットワーク");
    const progress = Object.fromEntries(qs.map((x, i) => [x.id, prog(x.id, { due: `2026-09-${String(i + 1).padStart(2, "0")}` })]));
    const items = buildSession({ kind: "review" }, ctxOf(qs, progress));
    expect(ids(items)).toEqual(qs.slice(0, 20).map((x) => x.id));
  });

  it("用語の記録 (kind t) は問題の復習に数えない", () => {
    const qs = many(2, "tech", "ネットワーク");
    const items = buildSession({ kind: "review" }, ctxOf(qs, { [qs[0]!.id]: prog(qs[0]!.id, { kind: "t", due: "2026-01-01" }) }));
    expect(items).toHaveLength(2);
  });
});

describe("random / field", () => {
  it("random は科目Aだけから count 問", () => {
    const items = buildSession({ kind: "random", count: 10 }, ctxOf(bank));
    expect(items).toHaveLength(10);
    for (const it of items) expect(it.question.exam).toBe("A");
  });

  it("プールが少なければあるだけ返す", () => {
    expect(buildSession({ kind: "random", count: 10 }, ctxOf(many(3, "tech", "ネットワーク")))).toHaveLength(3);
  });

  it("field は field と minor で絞る", () => {
    const items = buildSession({ kind: "field", field: "tech", minor: "データベース", count: 10 }, ctxOf(bank));
    expect(items).toHaveLength(10);
    for (const it of items) expect(it.question).toMatchObject({ field: "tech", minor: "データベース" });
    const strat = buildSession({ kind: "field", field: "strat", count: 50 }, ctxOf(bank));
    expect(strat).toHaveLength(15);
  });
});

describe("weak", () => {
  it("回答5回以上で正答率の低い中分類から出す", () => {
    const net = many(10, "tech", "ネットワーク");
    const db = many(10, "tech", "データベース");
    const law = many(10, "strat", "法務");
    const progress = {
      [net[0]!.id]: prog(net[0]!.id, { seen: 6, correct: 5 }),
      [db[0]!.id]: prog(db[0]!.id, { seen: 6, correct: 1, last: "wrong" }),
      [law[0]!.id]: prog(law[0]!.id, { seen: 4, correct: 0 }), // below threshold
    };
    const items = buildSession({ kind: "weak", count: 10 }, ctxOf([...net, ...db, ...law], progress));
    expect(items).toHaveLength(10);
    expect(items[0]!.question.id).toBe(db[0]!.id); // missed question first
    for (const it of items) expect(it.question.minor).toBe("データベース");
  });

  it("苦手な中分類で足りなければ次の中分類、さらに科目Aランダムで補う", () => {
    const net = many(3, "tech", "ネットワーク");
    const db = many(3, "tech", "データベース");
    const law = many(10, "strat", "法務");
    const progress = {
      [net[0]!.id]: prog(net[0]!.id, { seen: 5, correct: 4 }),
      [db[0]!.id]: prog(db[0]!.id, { seen: 5, correct: 1 }),
    };
    const items = buildSession({ kind: "weak", count: 10 }, ctxOf([...net, ...db, ...law], progress));
    expect(items).toHaveLength(10);
    expect(items.slice(0, 3).every((i) => i.question.minor === "データベース")).toBe(true);
    expect(items.slice(3, 6).every((i) => i.question.minor === "ネットワーク")).toBe(true);
    noDup(items);
  });

  it("記録がなければ科目Aランダム", () => {
    const items = buildSession({ kind: "weak", count: 10 }, ctxOf(bank));
    expect(items).toHaveLength(10);
    for (const it of items) expect(it.question.exam).toBe("A");
  });
});

describe("radix / mock", () => {
  it("radix は自動生成", () => {
    const items = buildSession({ kind: "radix", count: 10 }, ctxOf([]));
    expect(items).toHaveLength(10);
    expect(items[0]!.question.id).toBe("radix-1");
  });

  it("mini は科目A 20問", () => {
    const items = buildSession({ kind: "mock", preset: "mini" }, ctxOf(bank));
    expect(items).toHaveLength(20);
    for (const it of items) expect(it.question.exam).toBe("A");
  });

  it("examA は60問、テクノロジ42＋マネジメント/ストラテジ18", () => {
    const items = buildSession({ kind: "mock", preset: "examA" }, ctxOf(bank));
    expect(items).toHaveLength(60);
    expect(items.filter((i) => i.question.field === "tech")).toHaveLength(42);
    expect(items.filter((i) => i.question.field !== "tech")).toHaveLength(18);
  });

  it("examA はマネジメント系が足りなければテクノロジで補う", () => {
    const qs = [...many(70, "tech", "ネットワーク"), ...many(5, "mgmt", "システム監査")];
    const items = buildSession({ kind: "mock", preset: "examA" }, ctxOf(qs));
    expect(items).toHaveLength(60);
    expect(items.filter((i) => i.question.field === "mgmt")).toHaveLength(5);
  });

  it("examB はアルゴリズム16＋セキュリティ4", () => {
    const items = buildSession({ kind: "mock", preset: "examB" }, ctxOf(bank));
    expect(items).toHaveLength(20);
    expect(items.filter((i) => i.question.field === "algo")).toHaveLength(16);
    expect(items.filter((i) => i.question.field === "sec")).toHaveLength(4);
  });

  it("examB は少ないプールならあるだけ", () => {
    const qs = [...many(5, "algo", "アルゴリズムとプログラミング"), ...many(2, "sec", "情報セキュリティ")];
    expect(buildSession({ kind: "mock", preset: "examB" }, ctxOf(qs))).toHaveLength(7);
  });
});
