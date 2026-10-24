import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { questionFileSchema, termFileSchema } from "@/data/schema";

const root = join(__dirname, "../../data");
const jsonFiles = (dir: string) =>
  existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => f.endsWith(".json")).map((f) => join(dir, f)) : [];
const read = (rel: string): unknown => JSON.parse(readFileSync(join(root, rel), "utf8"));

describe("問題データ", () => {
  const files = jsonFiles("questions");
  const ids = new Map<string, string>();

  it.each(files.length ? files : ["(なし)"])("%s がスキーマに合う", (rel) => {
    if (rel === "(なし)") return;
    const result = questionFileSchema.safeParse(read(rel));
    expect(result.success, result.success ? "" : JSON.stringify(result.error.issues.slice(0, 5), null, 2)).toBe(true);
  });

  it("IDが全ファイルで重複しない", () => {
    for (const rel of files) {
      for (const q of read(rel) as Array<{ id: string }>) {
        expect(ids.get(q.id), `${q.id} は ${ids.get(q.id)} と ${rel} で重複`).toBeUndefined();
        ids.set(q.id, rel);
      }
    }
  });
});

describe("用語データ", () => {
  const files = jsonFiles("terms");
  it.each(files.length ? files : ["(なし)"])("%s がスキーマに合う", (rel) => {
    if (rel === "(なし)") return;
    const result = termFileSchema.safeParse(read(rel));
    expect(result.success, result.success ? "" : JSON.stringify(result.error.issues.slice(0, 5), null, 2)).toBe(true);
  });

  it("用語IDと用語名が重複しない", () => {
    const seen = new Set<string>();
    for (const rel of files) {
      for (const t of read(rel) as Array<{ id: string; term: string }>) {
        expect(seen.has(t.id), `id ${t.id}`).toBe(false);
        expect(seen.has(`name:${t.term}`), `term ${t.term}`).toBe(false);
        seen.add(t.id).add(`name:${t.term}`);
      }
    }
  });
});
