import { describe, expect, it } from "vitest";
import { authUser, signIn, signOut, syncAvailable } from "@/sync";

describe("sync（設定なし＝ローカルのみ）", () => {
  it("設定が空なら同期は無効で、signIn/signOut は何もしない", async () => {
    expect(syncAvailable).toBe(false);
    await signIn();
    await signOut();
    expect(authUser.value).toBeNull();
  });
});
