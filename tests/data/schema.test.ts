import { describe, expect, it } from "vitest";
import { questionSchema, termSchema } from "@/data/schema";

const valid = {
  id: "a-tech-net-001",
  exam: "A",
  field: "tech",
  major: "技術要素",
  minor: "ネットワーク",
  difficulty: 1,
  stem: "HTTPS で標準的に使用されるポート番号はどれか。",
  choices: ["443", "80", "25", "110"],
  answer: 0,
  explanation: "HTTP = 80、HTTPS = 443、SMTP = 25、POP3 = 110。",
  source: { type: "original" },
};

describe("questionSchema", () => {
  it("正しい問題を受け付ける", () => {
    expect(questionSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["正解の添字が範囲外", { answer: 4 }],
    ["選択肢が重複", { choices: ["443", "443", "25", "110"] }],
    ["科目Aで選択肢が5つ", { choices: ["1", "2", "3", "4", "5"] }],
    ["科目と分野が合わない", { field: "algo", minor: "アルゴリズムとプログラミング" }],
    ["一覧にない中分類", { minor: "インターネット" }],
    ["解説が空", { explanation: " " }],
    ["未定義の項目", { note: "x" }],
  ])("%s なら拒否する", (_label, patch) => {
    expect(questionSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("IPA問題の出典を受け付ける", () => {
    const ipa = { ...valid, id: "ipa-r5-a-003", source: { type: "ipa", title: "令和5年度 科目A 公開問題", number: "問3" } };
    expect(questionSchema.safeParse(ipa).success).toBe(true);
  });
});

describe("termSchema", () => {
  it("正しい用語を受け付ける", () => {
    const t = { id: "term-mtbf", term: "MTBF", meaning: "平均故障間隔。", field: "tech", minor: "システム構成要素" };
    expect(termSchema.safeParse(t).success).toBe(true);
  });
});
