// S08 設定.
import { useEffect, useState } from "preact/hooks";
import { href } from "@/router";
import { days, progress, savedSession, settings, updateSettings } from "@/store";
import { syncAvailable } from "@/sync";
import { Icon } from "@/ui/Icon";
import { SyncRow } from "@/features/stats/Stats";
import type { ThemePref } from "@/types";
import { IS_NATIVE } from "@/native";
import { ReminderSetting } from "./ReminderSetting";
import "./settings.css";

const THEMES: Array<{ id: ThemePref; label: string }> = [
  { id: "system", label: "システム" },
  { id: "dark", label: "ダーク" },
  { id: "light", label: "ライト" },
];

export function SettingsScreen() {
  const st = settings.value;
  return (
    <div class="page settings">
      <div class="settings__top">
        <a class="icon-btn" href={href("/stats")} aria-label="分析に戻る">
          <Icon name="chevronLeft" size={22} />
        </a>
        <h1 class="page__title">設定</h1>
      </div>

      <section class="settings__group" aria-labelledby="set-theme">
        <h2 id="set-theme" class="section-title">テーマ</h2>
        <div class="seg" role="radiogroup" aria-labelledby="set-theme">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              class="seg__btn"
              aria-checked={st.theme === t.id}
              onClick={() => updateSettings({ theme: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section class="settings__group" aria-labelledby="set-plan">
        <h2 id="set-plan" class="section-title">学習計画</h2>
        <div class="list">
          <label class="list__row settings__field">
            <span>試験日</span>
            <input
              type="date"
              class="input"
              value={st.examDate ?? ""}
              onChange={(e) => updateSettings({ examDate: e.currentTarget.value || null })}
            />
          </label>
          <label class="list__row settings__field">
            <span>1日の目標（問）</span>
            <GoalInput value={st.dailyGoal} />
          </label>
        </div>
      </section>

      {IS_NATIVE && (
        <section class="settings__group" aria-labelledby="set-reminder">
          <h2 id="set-reminder" class="section-title">学習リマインダー</h2>
          <ReminderSetting />
        </section>
      )}

      {syncAvailable && (
        <section class="settings__group" aria-labelledby="set-sync">
          <h2 id="set-sync" class="section-title">同期</h2>
          <SyncRow />
        </section>
      )}

      <section class="settings__group" aria-labelledby="set-reset">
        <h2 id="set-reset" class="section-title">学習記録のリセット</h2>
        <ResetBox />
      </section>

      <section class="settings__group" aria-labelledby="set-license">
        <h2 id="set-license" class="section-title">出典・ライセンス表記</h2>
        <div class="card settings__license">
          <p>オリジナル問題は本アプリのために作成したものです。</p>
          <p>IPA問題の著作権は独立行政法人情報処理推進機構（IPA）にあります。出典：IPA「基本情報技術者試験 公開問題・サンプル問題」。各問題の解説欄に年度・区分・問題番号を表示しています。図や表を文章に改めた問題は、問題番号の横に「改変」と記しています。</p>
          <p>IPA問題の解説は本アプリ独自のもので、IPAによるものではありません。</p>
          <p>フォント：IBM Plex Sans JP / IBM Plex Mono（SIL Open Font License 1.1）。</p>
        </div>
      </section>
    </div>
  );
}

function GoalInput({ value }: { value: number }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]); // e.g. changed by sync
  const commit = () => {
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 1 && n <= 500) updateSettings({ dailyGoal: n });
    else setDraft(String(value));
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={500}
      class="input input--num num"
      value={draft}
      onInput={(e) => setDraft(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
    />
  );
}

function ResetBox() {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const reset = () => {
    progress.value = {};
    days.value = {};
    savedSession.value = null;
    setStep("done");
  };
  if (step === "confirm") {
    return (
      <div class="card settings__confirm" role="alertdialog" aria-labelledby="reset-q">
        <p id="reset-q">この端末の回答の記録・復習の予定・日ごとの記録をすべて消します。元に戻せません。よろしいですか。</p>
        {syncAvailable && <p class="muted small">同期しているクラウドの記録は消えないため、次にログインすると戻ります。</p>}
        <div class="settings__confirm-actions">
          <button type="button" class="btn-secondary" onClick={() => setStep("idle")}>やめる</button>
          <button type="button" class="btn-secondary btn-danger" onClick={reset}>すべて消す</button>
        </div>
      </div>
    );
  }
  return (
    <div class="settings__reset">
      {step === "done" && <p class="muted small" role="status">学習記録をリセットしました。</p>}
      <button type="button" class="btn-secondary btn-danger btn-block" onClick={() => setStep("confirm")}>
        学習記録をリセット
      </button>
    </div>
  );
}
