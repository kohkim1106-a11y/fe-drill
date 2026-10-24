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
const { pickCards, pickExtra } = await import("@/features/cards/deck");

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

  it("期限も未出題もないときは、前に見た順に見直しのカードを出す", () => {
    const terms = [t("a"), t("b"), t("c")];
    const prog = {
      a: { ...p("a", "2026-12-01"), updatedAt: 300 },
      b: { ...p("b", "2026-12-01"), updatedAt: 100 },
      c: { ...p("c", "2026-12-01"), updatedAt: 200 },
    };
    expect(pickCards(terms, prog, "2026-10-24")).toEqual([]);
    expect(pickExtra(terms, prog, 2).map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("めくって「覚えた」「まだ」で記録し、終了画面に数を出す", () => {
    window.scrollTo = vi.fn() as never;
    setContent([], [t("a"), t("b")]);
    navigate("/cards");
    render(<App pwa={false} />);
    fireEvent.click(screen.getByRole("button", { name: /カードを始める/ }));

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
