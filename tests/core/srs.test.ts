import { describe, expect, it } from "vitest";
import { review } from "@/core/srs";

const item = { id: "a-tech-net-001", kind: "q" as const };
const T = "2026-10-24";

describe("review (SM-2 簡略版)", () => {
  it("初回正解：interval 1, ease 2.6, due 明日", () => {
    const p = review(undefined, "correct", T, item);
    expect(p).toMatchObject({ id: item.id, kind: "q", seen: 1, correct: 1, reps: 1, interval: 1, ease: 2.6, due: "2026-10-25", lapses: 0, last: "correct" });
    expect(p.updatedAt).toBeGreaterThan(0);
  });

  it("初回不正解：interval 0, 今日が期限, ease 2.3, lapses 1", () => {
    const p = review(undefined, "wrong", T, item);
    expect(p).toMatchObject({ seen: 1, correct: 0, reps: 0, interval: 0, ease: 2.3, due: T, lapses: 1, last: "wrong" });
  });

  it("連続正解で 1 → 3 → round(interval × ease)", () => {
    let p = review(undefined, "correct", T, item);
    p = review(p, "correct", T, item);
    expect(p.interval).toBe(3);
    expect(p.due).toBe("2026-10-27");
    p = review(p, "correct", T, item); // ease before = 2.7
    expect(p.interval).toBe(Math.round(3 * 2.7));
    expect(p.reps).toBe(3);
    expect(p.seen).toBe(3);
    expect(p.correct).toBe(3);
  });

  it("ease は 2.8 を超えない", () => {
    let p = review(undefined, "correct", T, item);
    for (let i = 0; i < 10; i++) p = review(p, "correct", T, item);
    expect(p.ease).toBe(2.8);
  });

  it("ease は 1.3 を下回らない", () => {
    let p = review(undefined, "wrong", T, item);
    for (let i = 0; i < 10; i++) p = review(p, "wrong", T, item);
    expect(p.ease).toBe(1.3);
    expect(p.lapses).toBe(11);
  });

  it("不正解で reps がリセットされ、次の正解は 1日後", () => {
    let p = review(undefined, "correct", T, item);
    p = review(p, "correct", T, item);
    p = review(p, "wrong", T, item);
    expect(p).toMatchObject({ reps: 0, interval: 0, due: T, lapses: 1, seen: 3, correct: 2 });
    p = review(p, "correct", T, item);
    expect(p).toMatchObject({ reps: 1, interval: 1, due: "2026-10-25" });
  });

  it("用語カード (kind t) も同じ規則", () => {
    const p = review(undefined, "correct", T, { id: "term-mtbf", kind: "t" });
    expect(p.kind).toBe("t");
    expect(p.interval).toBe(1);
  });
});
