import { z } from "zod";

// Syllabus minor categories (docs/03-design.md §4.5). Data files must use these exact names.
export const MINORS = {
  tech: [
    "基礎理論", "アルゴリズムとプログラミング",
    "コンピュータ構成要素", "システム構成要素", "ソフトウェア", "ハードウェア",
    "ユーザーインタフェース", "情報メディア", "データベース", "ネットワーク", "セキュリティ",
    "システム開発技術", "ソフトウェア開発管理技術",
  ],
  mgmt: ["プロジェクトマネジメント", "サービスマネジメント", "システム監査"],
  strat: [
    "システム戦略", "システム企画",
    "経営戦略マネジメント", "技術戦略マネジメント", "ビジネスインダストリ",
    "企業活動", "法務",
  ],
  algo: ["アルゴリズムとプログラミング"],
  sec: ["情報セキュリティ"],
} as const;

const sourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("original") }),
  z.object({
    type: z.literal("ipa"),
    title: z.string().min(1),
    number: z.string().min(1),
    url: z.string().url().optional(),
  }),
]);

const nonEmpty = z.string().trim().min(1);

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    exam: z.enum(["A", "B"]),
    field: z.enum(["tech", "mgmt", "strat", "algo", "sec"]),
    major: nonEmpty,
    minor: nonEmpty,
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    stem: nonEmpty,
    code: z.string().optional(),
    choices: z.array(nonEmpty).min(4).max(8),
    answer: z.number().int().min(0),
    explanation: nonEmpty,
    shuffle: z.boolean().optional(),
    source: sourceSchema,
  })
  .strict()
  .superRefine((q, ctx) => {
    if (q.answer >= q.choices.length) ctx.addIssue({ code: "custom", message: "answer is out of range", path: ["answer"] });
    if (new Set(q.choices).size !== q.choices.length) ctx.addIssue({ code: "custom", message: "duplicate choices", path: ["choices"] });
    if (q.exam === "A" && q.choices.length !== 4) ctx.addIssue({ code: "custom", message: "科目A must have 4 choices", path: ["choices"] });
    const examOk = q.exam === "A" ? ["tech", "mgmt", "strat"].includes(q.field) : ["algo", "sec"].includes(q.field);
    if (!examOk) ctx.addIssue({ code: "custom", message: "field does not match exam", path: ["field"] });
    if (!(MINORS[q.field] as readonly string[]).includes(q.minor)) ctx.addIssue({ code: "custom", message: `unknown minor: ${q.minor}`, path: ["minor"] });
  });

export const termSchema = z
  .object({
    id: z.string().regex(/^term-[a-z0-9]+(-[a-z0-9]+)*$/),
    term: nonEmpty,
    reading: z.string().optional(),
    meaning: nonEmpty,
    field: z.enum(["tech", "mgmt", "strat"]),
    minor: nonEmpty,
  })
  .strict()
  .superRefine((t, ctx) => {
    if (!(MINORS[t.field] as readonly string[]).includes(t.minor)) ctx.addIssue({ code: "custom", message: `unknown minor: ${t.minor}`, path: ["minor"] });
  });

export const questionFileSchema = z.array(questionSchema);
export const termFileSchema = z.array(termSchema);
