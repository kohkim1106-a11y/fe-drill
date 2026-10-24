import { beforeEach, describe, expect, it } from "vitest";
import { act, render } from "@testing-library/preact";
import { App } from "@/app";
import { applyTheme } from "@/features/theme";
import { settings, updateSettings } from "@/store";

function addMeta(content: string, media: string) {
  const m = document.createElement("meta");
  m.name = "theme-color";
  m.content = content;
  m.media = media;
  document.head.appendChild(m);
  return m;
}

describe("applyTheme", () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--c-ground");
  });

  it("dark / light を data-theme に反映し、system で外す", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    applyTheme("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("theme-color を地の色に合わせ、system で元に戻す", () => {
    const dark = addMeta("#101828", "(prefers-color-scheme: dark)");
    const light = addMeta("#F3F5F9", "(prefers-color-scheme: light)");
    document.documentElement.style.setProperty("--c-ground", "#ABCDEF");
    applyTheme("light");
    expect(dark.content).toBe("#ABCDEF");
    expect(light.content).toBe("#ABCDEF");
    applyTheme("system");
    expect(dark.content).toBe("#101828");
    expect(light.content).toBe("#F3F5F9");
  });
});

describe("App のテーマ適用", () => {
  it("設定を変えると <html> の data-theme が変わる", () => {
    render(<App pwa={false} />);
    act(() => updateSettings({ theme: "light" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    act(() => updateSettings({ theme: "system" }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    settings.value = { ...settings.value, theme: "system" };
  });
});
