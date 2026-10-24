import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/preact";
import type { Question } from "@/types";

vi.mock("@/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/store")>()),
  recordAnswer: vi.fn(),
}));

const { recordAnswer, savedSession } = await import("@/store");
const { App } = await import("@/app");
const { navigate } = await import("@/router");
const { setContent } = await import("@/features/content");
const { activeSession, lastResult, startSession } = await import("@/features/session/state");

const q = (id: string, answer: number, extra: Partial<Question> = {}): Question => ({
  id, exam: "A", field: "tech", major: "技術要素", minor: "ネットワーク", difficulty: 1,
  stem: `${id} の問題文`, choices: ["選択肢0", "選択肢1", "選択肢2", "選択肢3"], answer,
  explanation: `${id} の解説`, source: { type: "original" }, ...extra,
});

// Display order is reversed so that "ア" is the last original choice.
const item = (question: Question) => ({ question, order: [3, 2, 1, 0] });

function setup(questions: Question[], mode: Parameters<typeof startSession>[0] = { kind: "random", count: questions.length }) {
  setContent(questions);
  render(<App pwa={false} />);
  act(() => {
    startSession(mode, questions.map(item));
  });
}

describe("演習（S03）", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as never;
    vi.mocked(recordAnswer).mockClear();
    activeSession.value = null;
    lastResult.value = null;
    savedSession.value = null;
    navigate("/");
  });

  it("表示順で並び、正解すると解説パネルを出して記録する", () => {
    setup([q("t-1", 3), q("t-2", 0)]);
    const buttons = screen.getAllByRole("button", { name: /^[アイウエ]/ });
    expect(buttons.map((b) => b.textContent)).toEqual(["ア選択肢3", "イ選択肢2", "ウ選択肢1", "エ選択肢0"]);
    expect(screen.queryByRole("navigation", { name: "メイン" })).toBeNull(); // tab bar hidden

    fireEvent.click(buttons[0]!);
    expect(screen.getByText("○ 正解")).toBeTruthy();
    expect(screen.getByText("t-1 の解説")).toBeTruthy();
    expect(screen.getByText(/オリジナル問題/)).toBeTruthy();
    expect(recordAnswer).toHaveBeenCalledWith({ id: "t-1", kind: "q" }, true);

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByRole("heading", { name: "t-2 の問題文" })).toBeTruthy();
  });

  it("キーで不正解を選ぶと正解の記号を示し、最後は結果画面へ", () => {
    setup([q("t-1", 0)]);
    fireEvent.keyDown(window, { key: "1" }); // ア = original 3, wrong
    expect(screen.getByText(/× 不正解/)).toBeTruthy();
    expect(screen.getByText("正解はエ")).toBeTruthy();
    expect(recordAnswer).toHaveBeenCalledWith({ id: "t-1", kind: "q" }, false);

    fireEvent.click(screen.getByRole("button", { name: "結果を見る" }));
    expect(screen.getByRole("heading", { name: "結果" })).toBeTruthy();
    expect(screen.getByText("間違えた問題（1）")).toBeTruthy();
    expect(screen.getByRole("button", { name: "間違えた問題をもう一度" })).toBeTruthy();
  });

  it("基数変換の自動生成問題は記録しない", () => {
    setup([q("radix-1", 3)], { kind: "radix", count: 1 });
    fireEvent.click(screen.getAllByRole("button", { name: /^ア/ })[0]!);
    expect(screen.getByText("○ 正解")).toBeTruthy();
    expect(recordAnswer).not.toHaveBeenCalled();
  });

  it("模試は解説を出さずに進み、中断すると保存する", () => {
    setup([q("m-1", 3), q("m-2", 0), q("m-3", 1)], { kind: "mock", preset: "mini" });
    expect(screen.getByText("30:00")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /^ア/ })[0]!);
    expect(screen.queryByText("○ 正解")).toBeNull();
    expect(screen.getByRole("heading", { name: "m-2 の問題文" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "模試を中断" }));
    expect(savedSession.value?.index).toBe(1);
    expect(savedSession.value?.itemIds).toEqual(["m-1", "m-2", "m-3"]);
    expect(savedSession.value?.answers).toHaveLength(1);
    expect(screen.getByRole("button", { name: /中断中の模試を再開/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /中断中の模試を再開/ }));
    expect(screen.getByRole("heading", { name: "m-2 の問題文" })).toBeTruthy();
  });

  it("模試の時間切れで結果画面へ移る", () => {
    vi.useFakeTimers();
    try {
      setup([q("m-1", 3)], { kind: "mock", preset: "mini" });
      act(() => {
        vi.advanceTimersByTime(30 * 60_000);
      });
      expect(screen.getByRole("heading", { name: "結果" })).toBeTruthy();
      expect(savedSession.value).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
