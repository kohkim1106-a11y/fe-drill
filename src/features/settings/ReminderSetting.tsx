// 学習リマインダー (iOS app only): one local notification per day at the chosen time.
import { useState } from "preact/hooks";
import { reminder, setReminder } from "@/native";

export function ReminderSetting() {
  const r = reminder.value;
  const [denied, setDenied] = useState(false);

  const apply = async (enabled: boolean, time: string) => {
    const result = await setReminder({ enabled, time });
    setDenied(result === "denied");
  };

  return (
    <div class="list">
      <label class="list__row settings__field">
        <span>毎日通知する</span>
        <input
          id="reminder-enabled"
          type="checkbox"
          role="switch"
          class="settings__switch"
          checked={r.enabled}
          onChange={(e) => void apply(e.currentTarget.checked, r.time)}
        />
      </label>
      <label class="list__row settings__field">
        <span>時刻</span>
        <input
          id="reminder-time"
          type="time"
          class="input"
          value={r.time}
          disabled={!r.enabled}
          onChange={(e) => void apply(r.enabled, e.currentTarget.value)}
        />
      </label>
      {denied && (
        <p class="muted small" role="status">
          通知が許可されていません。iPhoneの「設定」→「通知」→「基本情報ドリル」で許可してください。
        </p>
      )}
    </div>
  );
}
