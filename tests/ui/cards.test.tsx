import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/preact";
import type { ItemProgress, Term } from "@/types";

vi.mock("@/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/store")>()),
  recordAnswer: vi.fn(),
}));

const { recordAnswer } = await import("@/store");
const { App } = await import("@/app");
const { navigate } = await import("@/router");
const { setContent } = await import("@/features/content");
const deck = await import("@/features/cards/deck");
const { pickCards, sourcePool, startRun, continueRun, cardSession, setSessionSize, setCardSource } = deck;
const { startOptions } = await import("@/features/cards/CardMenu");

const t = (id: string): Term => ({ id, term: `用語${id}`, meaning: `${id}の意味`, field: "tech", minor: "ネットワーク" });
const p = (id: string, due: string): ItemProgress => ({
  id, kind: "t", seen: 1, correct: 1, reps: 1, ease: 2.5, interval: 1, due, lapses: 0, last: "correct", updatedAt: 0,
});

describe("用語カード", () => {
  it("期限が来たカードを古い順に出し、そのあと未出題を出す", () => {
    const terms = [t("a"), t("b"), t("c"), t("d")];
    const prog = { a: p("a", "2026-10-20"), b: p("b", "2026-12-01"), c: p("c", "2026-10-10") };
    expect(pickCards(terms, prog, "2026-10-24").map((x) => x.id)).toEqual(["c", "a", "d"]);
  });

  it("「まだ」「覚えた」を最後の結果で分けて出す", () => {
    const terms = [t("a"), t("b"), t("c"), t("d")];
    const prog = { a: { ...p("a", "2026-12-01"), last: "wrong" as const }, b: p("b", "2026-12-01"), d: { ...p("d", "2026-12-01"), last: "wrong" as const } };
    expect(sourcePool(terms, "notYet", prog, "2026-10-24").map((x) => x.id)).toEqual(["a", "d"]);
    expect(sourcePool(terms, "remembered", prog, "2026-10-24").map((x) => x.id)).toEqual(["b"]);
    expect(sourcePool(terms, "order", prog, "2026-10-24").map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("「続けて」は同じ学習元の次の範囲に進み、同じ単語を繰り返さない", () => {
    const terms = Array.from({ length: 25 }, (_, i) => t(`w${String(i).padStart(2, "0")}`));
    setSessionSize(10);
    expect(startRun(terms, "order", "all", 0)).toBe(true);
    const first = cardSession.value!.deck.map((x) => x.id);
    expect(continueRun()).toBe(true);
    const second = cardSession.value!.deck.map((x) => x.id);
    expect(second[0]).toBe("w10");
    expect(second.some((id) => first.includes(id))).toBe(false);
    expect(continueRun()).toBe(true);
    expect(cardSession.value!.deck.map((x) => x.id)).toEqual(["w20", "w21", "w22", "w23", "w24"]);
    expect(continueRun()).toBe(false);
  });

  it("開始位置は枚数ごとの区切りと、途中なら「前回の続き」を出す", () => {
    expect(startOptions(25, 10, null).map((o) => o.at)).toEqual([0, 10, 20]);
    expect(startOptions(25, 10, null).some((o) => o.resume)).toBe(false);
    expect(startOptions(25, 10, 13)[0]).toEqual({ at: 13, label: "14語目", resume: true });
    expect(startOptions(25, 10, 10).find((o) => o.at === 10)?.resume).toBe(true);
  });

  it("めくって「覚えた」「まだ」で記録し、終了画面に数を出す", () => {
    window.scrollTo = vi.fn() as never;
    setContent([], [t("a"), t("b")]);
    setCardSource("order");
    navigate("/cards");
    render(<App pwa={false} />);
    fireEvent.click(screen.getByRole("button", { name: /語目を始める/ }));

    const card = screen.getByRole("button", { name: /表：用語a/ });
    fireEvent.click(card);
    expect(screen.getByText("aの意味")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "覚えた" }));
    expect(recordAnswer).toHaveBeenCalledWith({ id: "a", kind: "t" }, true);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(recordAnswer).toHaveBeenCalledWith({ id: "b", kind: "t" }, false);
    expect(screen.getByRole("heading", { name: "おつかれさまでした" })).toBeTruthy();
  });
});
