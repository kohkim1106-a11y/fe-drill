import { describe, expect, it } from "vitest";
import { FOCUS_ROUTES, navigate, parseHash, route } from "@/router";

describe("parseHash", () => {
  it("既知のルートをそのまま返す", () => {
    expect(parseHash("#/")).toBe("/");
    expect(parseHash("#/practice")).toBe("/practice");
    expect(parseHash("#/cards/session")).toBe("/cards/session");
    expect(parseHash("#/stats?x=1")).toBe("/stats");
    expect(parseHash("#/settings/")).toBe("/settings");
  });

  it("空・未知のルートはホームにする", () => {
    expect(parseHash("")).toBe("/");
    expect(parseHash("#")).toBe("/");
    expect(parseHash("#/nope")).toBe("/");
    expect(parseHash("#/cards/unknown")).toBe("/");
  });

  it("集中モードの画面はタブを隠す対象になっている", () => {
    expect([...FOCUS_ROUTES].sort()).toEqual(["/cards/session", "/result", "/session"]);
  });
});

describe("navigate", () => {
  it("ハッシュとシグナルを更新する", () => {
    navigate("/stats");
    expect(location.hash).toBe("#/stats");
    expect(route.value).toBe("/stats");
    navigate("/");
    expect(route.value).toBe("/");
  });

  it("hashchange で未知のURLを開くとホームになる", () => {
    location.hash = "#/unknown";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(route.value).toBe("/");
  });
});
