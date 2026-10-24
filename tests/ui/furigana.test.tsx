import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { Furigana, annotate, setFurigana } from "@/ui/Furigana";

describe("ふりがな", () => {
  it("辞書の語にだけ読みを付け、ほかの文字はそのまま残す", () => {
    expect(annotate("暗号の危殆化に該当する")).toEqual(["暗号の", ["危殆化", "きたいか"], "に該当する"]);
  });

  it("長い語を優先して照合する", () => {
    const parts = annotate("仮名加工情報");
    expect(parts[0]).toEqual(["仮名加工", "かめいかこう"]);
  });

  it("オフにすると読みを出さない", () => {
    setFurigana(false);
    const { container } = render(<p><Furigana text="危殆化" /></p>);
    expect(container.querySelector("rt")).toBeNull();
    setFurigana(true);
    const on = render(<p><Furigana text="危殆化" /></p>);
    expect(on.container.querySelector("rt")?.textContent).toBe("きたいか");
  });
});
