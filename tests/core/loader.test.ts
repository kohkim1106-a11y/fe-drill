import { describe, expect, it, vi } from "vitest";
import { loadQuestions, loadTerms, validateFiles } from "@/data/loader";
import { questionSchema, termSchema } from "@/data/schema";
import type { Question } from "@/types";
import { q } from "./fixtures";

const valid = (id: string): Question => ({ ...q("tech", "ネットワーク"), id, major: "技術要素" });

describe("loader", () => {
  it("不正な項目・重複IDを警告して除外し、ID順に並べる", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const files = {
      "/data/questions/b.json": [valid("a-tech-net-003"), { ...valid("a-tech-net-004"), answer: 9 }],
      "/data/questions/a.json": [valid("a-tech-net-002"), valid("a-tech-net-001")],
      "/data/questions/c.json": [valid("a-tech-net-001")],
      "/data/questions/d.json": { not: "an array" },
    };
    const out = validateFiles(files, questionSchema);
    expect(out.map((x) => x.id)).toEqual(["a-tech-net-001", "a-tech-net-002", "a-tech-net-003"]);
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });

  it("用語も同様に検証する", () => {
    const out = validateFiles({ "/x.json": [{ id: "term-mtbf", term: "MTBF", meaning: "平均故障間隔", field: "tech", minor: "システム構成要素" }] }, termSchema);
    expect(out).toHaveLength(1);
  });

  it("同梱データを読み込み、メモ化する（全件スキーマ適合・ID昇順・重複なし）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const qs = await loadQuestions();
    expect(await loadQuestions()).toBe(qs);
    const ids = qs.map((x) => x.id);
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    const terms = await loadTerms();
    expect(await loadTerms()).toBe(terms);
    warn.mockRestore();
  });
});
