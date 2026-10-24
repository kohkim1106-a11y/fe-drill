import { describe, expect, it } from "vitest";
import { greeting } from "@/features/home/Home";

describe("ホームのあいさつ", () => {
  it.each([[6], [13], [21], [2]])("%i時のあいさつは「。」で2文に分かれる", (hour) => {
    expect(greeting(hour).split(/(?<=。)/)).toHaveLength(2);
  });
});
