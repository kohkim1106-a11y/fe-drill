// Loads question and term JSON bundled from /data (docs/03-design.md §4.1, §4.2).
// Invalid items are dropped with a warning so one bad entry can't break the app.
import type { Question, Term } from "@/types";
import { questionSchema, termSchema } from "./schema";
import type { z } from "zod";

type Loaders = Record<string, () => Promise<unknown>>;

// Lazy globs: each JSON file becomes its own chunk, fetched on first load.
const questionFiles = import.meta.glob("/data/questions/*.json", { import: "default" }) as Loaders;
const termFiles = import.meta.glob("/data/terms/*.json", { import: "default" }) as Loaders;

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Validates each item of each file; keeps the first occurrence of a duplicated id. Sorted by id. */
export function validateFiles<T extends { id: string }>(files: Record<string, unknown>, schema: z.ZodType<T>): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const path of Object.keys(files).sort()) {
    const content = files[path];
    if (!Array.isArray(content)) {
      console.warn(`[loader] ${path}: not an array, skipped`);
      continue;
    }
    content.forEach((raw, index) => {
      const result = schema.safeParse(raw);
      if (!result.success) {
        console.warn(`[loader] ${path}[${index}] invalid, skipped:`, result.error.issues.slice(0, 3));
        return;
      }
      if (seen.has(result.data.id)) {
        console.warn(`[loader] ${path}[${index}] duplicate id ${result.data.id}, skipped`);
        return;
      }
      seen.add(result.data.id);
      out.push(result.data);
    });
  }
  return out.sort(byId);
}

async function readAll(loaders: Loaders): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    Object.entries(loaders).map(async ([path, load]) => {
      try {
        return [path, await load()] as const;
      } catch (error) {
        console.warn(`[loader] ${path}: failed to load`, error);
        return [path, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

let questionsPromise: Promise<Question[]> | null = null;
let termsPromise: Promise<Term[]> | null = null;

export function loadQuestions(): Promise<Question[]> {
  questionsPromise ??= readAll(questionFiles).then((files) => validateFiles(files, questionSchema as z.ZodType<Question>));
  return questionsPromise;
}

export function loadTerms(): Promise<Term[]> {
  termsPromise ??= readAll(termFiles).then((files) => validateFiles(files, termSchema as z.ZodType<Term>));
  return termsPromise;
}
