// STUB — agent B replaces the body (docs/03-design.md §3.1).
import type { SelectContext, SessionItem, SessionMode } from "@/types";

export function buildSession(_mode: SessionMode, ctx: SelectContext): SessionItem[] {
  return ctx.questions.slice(0, 10).map((question) => ({ question, order: question.choices.map((_, i) => i) }));
}
