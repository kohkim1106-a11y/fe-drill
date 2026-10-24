// Stats derived from the learning record; recomputed whenever a signal it reads changes.
import { computed } from "@preact/signals";
import { summarize } from "@/core/stats";
import { todayLocal } from "@/core/dates";
import { days, progress, settings } from "@/store";
import { questions } from "./content";

export const summary = computed(() =>
  summarize({
    questions: questions.value,
    progress: progress.value,
    days: days.value,
    settings: settings.value,
    today: todayLocal(),
  }),
);

export const pct = (rate: number | null): string => (rate === null ? "—" : String(Math.round(rate * 100)));
