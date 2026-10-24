// Display labels for fields, syllabus minors (docs/03-design.md §4.5) and modes.
import { MOCK_PRESETS, type Field, type SessionMode, type Source } from "@/types";

export const FIELD_LABEL: Record<Field, string> = {
  tech: "テクノロジ",
  mgmt: "マネジメント",
  strat: "ストラテジ",
  algo: "科目B アルゴリズム",
  sec: "科目B セキュリティ",
};

export const FIELD_SHORT: Record<Field, string> = {
  tech: "テクノロジ",
  mgmt: "マネジメント",
  strat: "ストラテジ",
  algo: "アルゴリズム",
  sec: "セキュリティ",
};

export const FIELDS: Field[] = ["tech", "mgmt", "strat", "algo", "sec"];

export const MINORS: Record<Field, string[]> = {
  tech: [
    "基礎理論", "アルゴリズムとプログラミング",
    "コンピュータ構成要素", "システム構成要素", "ソフトウェア", "ハードウェア",
    "ユーザーインタフェース", "情報メディア", "データベース", "ネットワーク", "セキュリティ",
    "システム開発技術", "ソフトウェア開発管理技術",
  ],
  mgmt: ["プロジェクトマネジメント", "サービスマネジメント", "システム監査"],
  strat: ["システム戦略", "システム企画", "経営戦略マネジメント", "技術戦略マネジメント", "ビジネスインダストリ", "企業活動", "法務"],
  algo: ["アルゴリズムとプログラミング"],
  sec: ["情報セキュリティ"],
};

// ア〜エ for 科目A; 科目B may have up to 8 choices.
export const CHOICE_LABELS = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク"];
export const choiceLabel = (displayIndex: number): string => CHOICE_LABELS[displayIndex] ?? String(displayIndex + 1);

export function modeLabel(mode: SessionMode): string {
  switch (mode.kind) {
    case "review": return "今日の復習";
    case "random": return `ランダム${mode.count}問`;
    case "field": return mode.minor ?? FIELD_LABEL[mode.field];
    case "weak": return "弱点";
    case "radix": return "基数変換ドリル";
    case "mock":
      return { mini: "ミニ模試", examA: "科目A 本番形式", examB: "科目B 本番形式" }[mode.preset];
  }
}

export const isMock = (mode: SessionMode): mode is Extract<SessionMode, { kind: "mock" }> => mode.kind === "mock";

export const mockMinutes = (mode: SessionMode): number | null => (isMock(mode) ? MOCK_PRESETS[mode.preset].minutes : null);

export const sourceLabel = (s: Source): string => (s.type === "original" ? "オリジナル問題" : `${s.title} ${s.number}`);
