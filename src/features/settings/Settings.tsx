// S08 設定.
import { useEffect, useState } from "preact/hooks";
import { navigate } from "@/router";
import { days, progress, savedSession, settings, updateSettings } from "@/store";
import { syncAvailable } from "@/sync";
import { Icon } from "@/ui/Icon";
import { SyncRow } from "@/features/stats/Stats";
import type { ThemePref } from "@/types";
import { IS_NATIVE } from "@/native";
import { ReminderSetting } from "./ReminderSetting";
import { furiganaOn, setFurigana } from "@/ui/Furigana";
import "./settings.css";

// Settings opens from both ホーム and 分析, so "back" returns to wherever the user came from.
function goBack() {
  if (history.length > 1) history.back();
  else navigate("/");
}

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
        <button type="button" class="icon-btn" aria-label="戻る" onClick={goBack}>
          <Icon name="chevronLeft" size={22} />
        </button>
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

      <section class="settings__group" aria-labelledby="set-display">
        <h2 id="set-display" class="section-title">表示</h2>
        <div class="list">
          <label class="list__row settings__field">
            <span>
              難しい漢字にふりがなを表示
              <span class="list__sub">例：<ruby>危殆化<rt>きたいか</rt></ruby>、<ruby>冪等<rt>べきとう</rt></ruby></span>
            </span>
            <input
              id="furigana"
              type="checkbox"
              role="switch"
              class="settings__switch"
              checked={furiganaOn.value}
              onChange={(e) => setFurigana(e.currentTarget.checked)}
            />
          </label>
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
