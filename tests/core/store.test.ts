import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayLog, ItemProgress } from "@/types";
import { prog } from "./fixtures";

type Store = typeof import("@/store");
const load = async (): Promise<Store> => {
  vi.resetModules();
  return import("@/store");
};
const dayLog = (date: string, updatedAt: number, answered = 1): DayLog => ({ date, answered, correct: 0, cards: 0, updatedAt });

describe("store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("recordAnswer で進捗と今日の DayLog を更新し、localStorage に保存する", async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 24, 9, 0), toFake: ["Date"] });
    const s = await load();
    s.recordAnswer({ id: "a-1", kind: "q" }, true);
    s.recordAnswer({ id: "a-1", kind: "q" }, false);
    s.recordAnswer({ id: "term-x", kind: "t" }, true);
    expect(s.progress.value["a-1"]).toMatchObject({ seen: 2, correct: 1, reps: 0, due: "2026-10-24" });
    expect(s.days.value["2026-10-24"]).toMatchObject({ answered: 2, correct: 1, cards: 1 });
    expect(JSON.parse(localStorage.getItem("fe-drill:v1:progress")!)["term-x"].kind).toBe("t");

    const reloaded = await load();
    expect(reloaded.progress.value["a-1"]!.seen).toBe(2);
    expect(reloaded.days.value["2026-10-24"]!.cards).toBe(1);
  });

  it("壊れた・古い形式のデータを読んでも落ちず、正しい項目だけ残す", async () => {
    localStorage.setItem("fe-drill:v1:progress", JSON.stringify({ ok: prog("ok"), bad: { id: "bad", seen: "x" } }));
    localStorage.setItem("fe-drill:v1:days", "{not json");
    localStorage.setItem("fe-drill:v1:settings", JSON.stringify({ theme: "neon", dailyGoal: 30, examDate: "2027-04-19" }));
    localStorage.setItem("fe-drill:v1:session", JSON.stringify({ broken: true }));
    const s = await load();
    expect(Object.keys(s.progress.value)).toEqual(["ok"]);
    expect(s.days.value).toEqual({});
    expect(s.settings.value).toEqual({ theme: "system", examDate: "2027-04-19", dailyGoal: 30, updatedAt: 0 });
    expect(s.savedSession.value).toBeNull();
  });

  it("updateSettings・savedSession を保存し、resetAll で消す", async () => {
    const s = await load();
    s.updateSettings({ theme: "dark", examDate: "2027-04-19" });
    s.savedSession.value = { mode: { kind: "mock", preset: "mini" }, itemIds: ["a"], orders: [[0, 1, 2, 3]], answers: [], index: 0, remainingMs: 1000, savedAt: 1 };
    const r = await load();
    expect(r.settings.value.theme).toBe("dark");
    expect(r.settings.value.updatedAt).toBeGreaterThan(0);
    expect(r.savedSession.value?.itemIds).toEqual(["a"]);
    r.resetAll();
    expect(localStorage.getItem("fe-drill:v1:session")).toBeNull();
    expect((await load()).settings.value.theme).toBe("system");
  });

  it("onLocalChange はローカル操作を通知し、解除できる", async () => {
    const s = await load();
    const seen: unknown[] = [];
    const off = s.onLocalChange((c) => seen.push(c));
    s.recordAnswer({ id: "a-1", kind: "q" }, true);
    s.updateSettings({ dailyGoal: 15 });
    off();
    s.recordAnswer({ id: "a-2", kind: "q" }, true);
    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatchObject({ progress: [{ id: "a-1" }], settings: null });
    expect(seen[1]).toMatchObject({ progress: [], days: [], settings: { dailyGoal: 15 } });
  });
});

describe("mergeRecords / mergeRemote（項目単位の後勝ち）", () => {
  it("mergeRecords は updatedAt の新しい方を採用し、送り返す分を返す", async () => {
    const { mergeRecords } = await load();
    const local: Record<string, ItemProgress> = { a: prog("a", { updatedAt: 10, seen: 1 }), b: prog("b", { updatedAt: 10 }), c: prog("c", { updatedAt: 5 }) };
    const remote: Record<string, ItemProgress> = { a: prog("a", { updatedAt: 20, seen: 9 }), b: prog("b", { updatedAt: 5 }), d: prog("d", { updatedAt: 1 }), c: prog("c", { updatedAt: 5 }) };
    const r = mergeRecords(local, remote);
    expect(r.merged.a!.seen).toBe(9);
    expect(r.merged.b!.updatedAt).toBe(10);
    expect(r.merged.d).toBeDefined();
    expect(r.changed).toBe(true);
    expect(r.localNewer.map((x) => x.id)).toEqual(["b"]);
  });

  it("同じ内容なら changed=false", async () => {
    const { mergeRecords } = await load();
    const local = { a: prog("a", { updatedAt: 10 }) };
    expect(mergeRecords(local, { a: prog("a", { updatedAt: 10 }) })).toMatchObject({ changed: false, localNewer: [] });
  });

  it("mergeRemote はシグナルに反映し、不正な文書は無視する", async () => {
    const s = await load();
    s.progress.value = { a: prog("a", { updatedAt: 10 }), local: prog("local", { updatedAt: 3 }) };
    s.days.value = { "2026-10-24": dayLog("2026-10-24", 50, 7) };
    s.settings.value = { theme: "light", examDate: null, dailyGoal: 20, updatedAt: 100 };
    const toPush = s.mergeRemote({
      progress: [prog("a", { updatedAt: 20, seen: 5 }), { id: "junk" }],
      days: [dayLog("2026-10-24", 40, 99), dayLog("2026-10-23", 1, 2)],
      settings: { theme: "dark", examDate: null, dailyGoal: 30, updatedAt: 200 },
    });
    expect(s.progress.value.a!.seen).toBe(5);
    expect(s.progress.value.junk).toBeUndefined();
    expect(s.days.value["2026-10-24"]!.answered).toBe(7);
    expect(s.days.value["2026-10-23"]!.answered).toBe(2);
    expect(s.settings.value.theme).toBe("dark");
    expect(toPush.progress.map((p) => p.id)).toEqual(["local"]);
    expect(toPush.days.map((d) => d.date)).toEqual(["2026-10-24"]);
    expect(toPush.settings).toBeNull();
    expect(JSON.parse(localStorage.getItem("fe-drill:v1:progress")!).a.seen).toBe(5);
  });

  it("ローカル設定の方が新しければ送り返す", async () => {
    const s = await load();
    s.settings.value = { theme: "light", examDate: null, dailyGoal: 20, updatedAt: 300 };
    expect(s.mergeRemote({ settings: { theme: "dark", examDate: null, dailyGoal: 30, updatedAt: 200 } }).settings?.theme).toBe("light");
    expect(s.settings.value.theme).toBe("light");
    expect(s.mergeRemote({ settings: null }).settings?.theme).toBe("light");
  });
});
