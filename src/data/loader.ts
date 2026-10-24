// STUB — agent B replaces the body (docs/03-design.md §6.1). Signatures are the contract.
import type { Question, Term } from "@/types";

export async function loadQuestions(): Promise<Question[]> {
  return [];
}

export async function loadTerms(): Promise<Term[]> {
  return [];
}
