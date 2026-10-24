import { describe, expect, it } from "vitest";
import { generateRadixQuestions } from "@/core/radix";
import { questionSchema } from "@/data/schema";

function parse(text: string, name: string): number {
  if (name.startsWith("2進")) return parseInt(text, 2);
  if (name.startsWith("16進")) return parseInt(text, 16);
  return parseInt(text, 10);
}

describe("generateRadixQuestions", () => {
  const qs = generateRadixQuestions(300, 7);

  it("指定数を生成し、IDは radix-<n>", () => {
    expect(qs).toHaveLength(300);
    expect(qs[0]!.id).toBe("radix-1");
    expect(new Set(qs.map((q) => q.id)).size).toBe(300);
  });

  it("問題スキーマに合う（科目A・tech・基礎理論）", () => {
    for (const q of qs) {
      expect(questionSchema.safeParse(q).success).toBe(true);
      expect(q).toMatchObject({ exam: "A", field: "tech", minor: "基礎理論" });
    }
  });

  it("正解の選択肢が問題の値と一致し、選択肢は4つで重複しない", () => {
    for (const q of qs) {
      const m = /^(\S+) (\S+) を(\S+)で表したものはどれか。$/.exec(q.stem);
      expect(m, q.stem).not.toBeNull();
      const [, fromName, text, toName] = m!;
      const value = parse(text!, fromName!);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(255);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(parse(q.choices[q.answer]!, toName!)).toBe(value);
      for (const [i, c] of q.choices.entries()) {
        const v = parse(c, toName!);
        expect(v >= 0 && v <= 255).toBe(true);
        if (i !== q.answer) expect(v).not.toBe(value);
      }
    }
  });

  it("解説に計算過程が含まれる", () => {
    for (const q of qs) {
      expect(q.explanation.length).toBeGreaterThan(20);
      expect(q.explanation).toMatch(/[=→]/);
    }
  });

  it("同じ seed なら同じ問題、違う seed なら違う問題", () => {
    expect(generateRadixQuestions(10, 123)).toEqual(generateRadixQuestions(10, 123));
    expect(generateRadixQuestions(10, 123)).not.toEqual(generateRadixQuestions(10, 124));
  });

  it("0件・負数でも落ちない", () => {
    expect(generateRadixQuestions(0, 1)).toEqual([]);
    expect(generateRadixQuestions(-3, 1)).toEqual([]);
  });

  it("全ての変換方向を出題する", () => {
    const kinds = new Set(qs.map((q) => q.stem.replace(/ \S+ を/, " を")));
    expect(kinds.size).toBe(6);
  });
});
