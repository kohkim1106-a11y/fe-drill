import { afterEach, describe, expect, it, vi } from "vitest";
import { addDays, diffDays, isDateString, todayLocal } from "@/core/dates";

describe("dates", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("todayLocal はローカル日付を YYYY-MM-DD で返す", () => {
    expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(todayLocal(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });

  it("addDays は月末・年末・うるう年をまたぐ", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-10-24", 0)).toBe("2026-10-24");
  });

  it("DST の切り替え日をまたいでも1日ずつ進む", () => {
    // US DST 2026: Mar 8 / Nov 1; EU: Mar 29 / Oct 25. UTC arithmetic makes these irrelevant.
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(diffDays("2026-03-01", "2026-04-01")).toBe(31);
    expect(diffDays("2026-10-01", "2026-11-30")).toBe(60);
  });

  it("diffDays は向きを持つ", () => {
    expect(diffDays("2026-10-24", "2026-10-25")).toBe(1);
    expect(diffDays("2026-10-25", "2026-10-24")).toBe(-1);
    expect(diffDays("2026-12-25", "2027-01-05")).toBe(11);
    expect(diffDays("2028-01-01", "2029-01-01")).toBe(366);
  });

  it("addDays と diffDays は逆演算", () => {
    for (const d of [-400, -31, -1, 0, 1, 29, 365, 1000]) {
      expect(diffDays("2026-10-24", addDays("2026-10-24", d))).toBe(d);
    }
  });

  it("isDateString は実在する日付だけを認める", () => {
    expect(isDateString("2026-02-28")).toBe(true);
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("2026-2-3")).toBe(false);
    expect(isDateString(20261024)).toBe(false);
  });
});
