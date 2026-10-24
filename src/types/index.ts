// Domain types shared by every module. This file is the contract between the
// parallel build agents (docs/03-design.md §6); change it only with the design.

export type Exam = "A" | "B";
export type Field = "tech" | "mgmt" | "strat" | "algo" | "sec";
export type Difficulty = 1 | 2 | 3;

export type Source =
  | { type: "original" }
  | { type: "ipa"; title: string; number: string; url?: string };

export interface Question {
  id: string;
  exam: Exam;
  field: Field;
  major: string;
  minor: string;
  difficulty: Difficulty;
  stem: string;
  code?: string;
  choices: string[];
  answer: number;
  explanation: string;
  shuffle?: boolean;
  source: Source;
}

export interface Term {
  id: string;
  term: string;
  reading?: string;
  meaning: string;
  field: "tech" | "mgmt" | "strat";
  minor: string;
}

// ---- learning records

export type ItemKind = "q" | "t";
export type ReviewResult = "correct" | "wrong";

export interface ItemProgress {
  id: string;
  kind: ItemKind;
  seen: number;
  correct: number;
  reps: number;
  ease: number;
  interval: number; // days
  due: string; // YYYY-MM-DD (local)
  lapses: number;
  last: ReviewResult;
  updatedAt: number; // epoch ms, used for last-write-wins sync
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  answered: number;
  correct: number;
  cards: number;
  updatedAt: number;
}

export type ThemePref = "system" | "dark" | "light";

export interface Settings {
  theme: ThemePref;
  examDate: string | null; // YYYY-MM-DD
  dailyGoal: number;
  updatedAt: number;
}

// ---- sessions

export type SessionMode =
  | { kind: "review" }
  | { kind: "random"; count: number }
  | { kind: "field"; field: Field; minor?: string; count: number }
  | { kind: "weak"; count: number }
  | { kind: "radix"; count: number }
  | { kind: "mock"; preset: "mini" | "examA" | "examB" };

export interface SessionItem {
  question: Question;
  order: number[]; // display order of choice indexes (shuffled unless question.shuffle === false)
}

export interface SelectContext {
  questions: Question[];
  progress: Record<string, ItemProgress>;
  today: string;
  random?: () => number; // injectable for tests
}

export interface SessionAnswer {
  questionId: string;
  picked: number | null; // original choice index, null = unanswered
  correct: boolean;
}

export interface SavedSession {
  mode: SessionMode;
  itemIds: string[];
  orders: number[][];
  answers: SessionAnswer[];
  index: number;
  remainingMs: number | null;
  savedAt: number;
}

export const MOCK_PRESETS = {
  mini: { exam: "A", count: 20, minutes: 30 },
  examA: { exam: "A", count: 60, minutes: 90 },
  examB: { exam: "B", count: 20, minutes: 100 },
} as const satisfies Record<string, { exam: Exam; count: number; minutes: number }>;

// ---- stats

export interface StatsContext {
  questions: Question[];
  progress: Record<string, ItemProgress>;
  days: Record<string, DayLog>;
  settings: Settings;
  today: string;
}

export interface Rate {
  answered: number;
  correct: number;
  rate: number | null; // 0..1, null when nothing answered
}

export interface StatsSummary {
  total: Rate;
  byField: Record<Field, Rate>;
  weakMinors: Array<{ minor: string; field: Field } & Rate>; // up to 5, worst first
  recentRate: number | null; // last 200 answers
  dueToday: number;
  unseen: number;
  daysLeft: number | null;
  suggestedDailyGoal: number;
  streak: number;
  last14: Array<{ date: string; answered: number }>; // oldest first
  todayAnswered: number;
}

// ---- sync

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export const PASS_LINE = 0.6;
