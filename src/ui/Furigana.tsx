// Furigana over difficult words (data/furigana.json), switchable in 設定.
// Renders <ruby> so screen readers and copy/paste keep the base text.
import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import furigana from "../../data/furigana.json";

const dict: Record<string, string> = furigana;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest words first so 冗長化 wins over 冗長.
const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
const pattern = keys.length ? new RegExp(keys.map(escape).join("|"), "g") : null;

const KEY = "fe-drill:v1:furigana";
function load(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export const furiganaOn = signal<boolean>(load());

export function setFurigana(on: boolean): void {
  furiganaOn.value = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // per-device preference only
  }
}

/** Splits text into plain strings and [word, reading] pairs. */
export function annotate(text: string): Array<string | [string, string]> {
  if (!pattern) return [text];
  const out: Array<string | [string, string]> = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    out.push([m[0], dict[m[0]]!]);
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Furigana({ text }: { text: string }): ComponentChildren {
  if (!furiganaOn.value) return text;
  return annotate(text).map((part, i) =>
    typeof part === "string" ? part : (
      <ruby key={i}>
        {part[0]}
        <rt>{part[1]}</rt>
      </ruby>
    ),
  );
}
