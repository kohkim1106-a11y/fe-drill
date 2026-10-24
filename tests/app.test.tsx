import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/preact";
import { App } from "@/app";

describe("App", () => {
  it("アプリ名を表示する", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "基本情報ドリル" })).toBeTruthy();
  });
});
