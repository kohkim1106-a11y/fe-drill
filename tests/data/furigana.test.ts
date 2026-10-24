import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../data");
const jsonFiles = (dir: string) =>
  existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => f.endsWith(".json")).map((f) => join(dir, f)) : [];
const read = (rel: string): unknown => JSON.parse(readFileSync(join(root, rel), "utf8"));

// 1文字でも登録してよい語（常用外で単独で使われるもの）
const singleKanjiWhitelist = new Set(["罠"]);

const collectTexts = (): string[] => {
  const texts: string[] = [];
  for (const rel of jsonFiles("questions")) {
    for (const q of read(rel) as Array<{ stem?: string; choices?: unknown; explanation?: string }>) {
      if (typeof q.stem === "string") texts.push(q.stem);
      if (Array.isArray(q.choices)) texts.push(...q.choices.filter((c): c is string => typeof c === "string"));
      if (typeof q.explanation === "string") texts.push(q.explanation);
    }
  }
  for (const rel of jsonFiles("terms")) {
    for (const t of read(rel) as Array<{ term?: string; meaning?: string }>) {
      if (typeof t.term === "string") texts.push(t.term);
      if (typeof t.meaning === "string") texts.push(t.meaning);
    }
  }
  return texts;
};

describe("ふりがな辞書", () => {
  const raw = readFileSync(join(root, "furigana.json"), "utf8");
  const dict = JSON.parse(raw) as Record<string, string>;
  const entries = Object.entries(dict);

  it("JSONオブジェクトとして読み込める", () => {
    expect(typeof dict).toBe("object");
    expect(Array.isArray(dict)).toBe(false);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("キーがキー順に並んでいる", () => {
    const keys = Object.keys(dict);
    expect(keys).toEqual([...keys].sort());
  });

  it("キーは漢字のみで2文字以上（例外を除く）", () => {
    for (const [word] of entries) {
      expect(/^[一-鿿々]+$/.test(word), `漢字以外を含む: ${word}`).toBe(true);
      if (!singleKanjiWhitelist.has(word)) expect([...word].length, `1文字: ${word}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("読みはひらがなのみ", () => {
    for (const [word, reading] of entries) {
      expect(/^[ぁ-ゖー]+$/.test(reading), `${word}: ${reading}`).toBe(true);
    }
  });

  it("全ての語が問題・用語データに出現する", () => {
    const corpus = collectTexts().join("\n");
    const missing = entries.map(([w]) => w).filter((w) => !corpus.includes(w));
    expect(missing).toEqual([]);
  });
});
