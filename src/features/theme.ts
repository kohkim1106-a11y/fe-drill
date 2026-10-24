// Applies Settings.theme to <html data-theme> and keeps the browser chrome color in step.
import type { ThemePref } from "@/types";

const ORIGINAL = "data-original-content";

export function applyTheme(pref: ThemePref, doc: Document = document): void {
  const root = doc.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;

  const metas = Array.from(doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  // index.html ships one meta per color scheme; remember them so "system" can restore both.
  for (const m of metas) if (!m.hasAttribute(ORIGINAL)) m.setAttribute(ORIGINAL, m.content);
  if (pref === "system") {
    for (const m of metas) m.content = m.getAttribute(ORIGINAL) ?? m.content;
    return;
  }
  // Read the resolved token so the chrome matches whatever tokens.css defines.
  const ground = getComputedStyle(root).getPropertyValue("--c-ground").trim();
  if (!ground) return;
  if (metas.length === 0) {
    const m = doc.createElement("meta");
    m.name = "theme-color";
    doc.head.appendChild(m);
    metas.push(m);
  }
  for (const m of metas) m.content = ground;
}
