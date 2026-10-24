// S02 演習メニュー (docs/03-design.md §3.1).
import { useMemo, useState } from "preact/hooks";
import { savedSession } from "@/store";
import { Icon } from "@/ui/Icon";
import { EmptyState } from "@/ui/EmptyState";
import { questions } from "@/features/content";
import { summary } from "@/features/summary";
import { FIELDS, FIELD_LABEL, MINORS, modeLabel } from "@/features/labels";
import { resumeSaved, startMode } from "@/features/session/state";
import { MOCK_PRESETS, type Field, type SessionMode } from "@/types";
import "./practice.css";

export function PracticeMenu() {
  const qs = questions.value;
  const saved = savedSession.value;
  const due = summary.value.dueToday;
  const [notice, setNotice] = useState("");
  const [field, setField] = useState<Field | null>(null);
  const [minor, setMinor] = useState<string | null>(null);
  const empty = qs.length === 0;

  // Question counts per field and per minor, so empty categories can be disabled.
  const counts = useMemo(() => {
    const byField = new Map<Field, number>();
    const byMinor = new Map<string, number>();
    for (const q of qs) {
      byField.set(q.field, (byField.get(q.field) ?? 0) + 1);
      byMinor.set(`${q.field}/${q.minor}`, (byMinor.get(`${q.field}/${q.minor}`) ?? 0) + 1);
    }
    return { byField, byMinor };
  }, [qs]);

  const start = (mode: SessionMode) => {
    setNotice("");
    if (!startMode(mode)) setNotice(`「${modeLabel(mode)}」で出題できる問題がありません。`);
  };

  const row = (label: string, mode: SessionMode, sub?: string, disabled = empty) => (
    <button type="button" class="list__row" disabled={disabled} onClick={() => start(mode)}>
      <span>
        {label}
        {sub && <span class="list__sub">{sub}</span>}
      </span>
      <Icon name="chevronRight" size={16} />
    </button>
  );

  const resumeLabel = saved ? `${modeLabel(saved.mode)}（${saved.answers.length}/${saved.itemIds.length}問）` : "";

  return (
    <div class="page practice">
      <h1 class="page__title">演習メニュー</h1>

      {saved && (
        <div class="card practice__resume">
          <div class="card__label">中断中の模試</div>
          <p>{resumeLabel}</p>
          <button
            type="button"
            class="btn-primary"
            onClick={() => {
              if (!resumeSaved()) setNotice("中断中の模試の問題が見つかりませんでした。");
            }}
          >
            中断中の模試を再開
            <Icon name="arrowRight" size={18} stroke={2.2} />
          </button>
        </div>
      )}

      {empty && <EmptyState title="問題データがまだありません">基数変換ドリルは問題データがなくても使えます。</EmptyState>}
      {notice && <p class="notice" role="status">{notice}</p>}

      <section class="practice__section">
        <h2 class="section-title">クイックスタート</h2>
        <div class="list">
          {row("今日の復習", { kind: "review" }, `期限 ${due}問`)}
          {row("ランダム10問", { kind: "random", count: 10 }, "科目A全体")}
          {row("弱点", { kind: "weak", count: 10 }, "正答率の低い分野から")}
          {row("基数変換ドリル", { kind: "radix", count: 10 }, "自動生成10問", false)}
        </div>
      </section>

      <section class="practice__section" aria-labelledby="by-field">
        <h2 id="by-field" class="section-title">分野別に解く</h2>
        <div class="chips" role="group" aria-label="大分類">
          {FIELDS.map((f) => (
            <button
              key={f}
              type="button"
              class="chip"
              aria-pressed={field === f}
              disabled={!counts.byField.get(f)}
              onClick={() => {
                setField(field === f ? null : f);
                setMinor(null);
              }}
            >
              {FIELD_LABEL[f]}
            </button>
          ))}
        </div>
        {field && (
          <div class="card practice__minors">
            <div class="chips" role="group" aria-label="中分類">
              <button type="button" class="chip" aria-pressed={minor === null} onClick={() => setMinor(null)}>
                すべて <span class="num">{counts.byField.get(field) ?? 0}</span>
              </button>
              {MINORS[field].map((m) => {
                const n = counts.byMinor.get(`${field}/${m}`) ?? 0;
                return (
                  <button key={m} type="button" class="chip" aria-pressed={minor === m} disabled={n === 0} onClick={() => setMinor(m)}>
                    {m} <span class="num">{n}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              class="btn-primary"
              onClick={() => start(minor ? { kind: "field", field, minor, count: 10 } : { kind: "field", field, count: 10 })}
            >
              {minor ?? FIELD_LABEL[field]}を10問解く
            </button>
          </div>
        )}
      </section>

      <section class="practice__section">
        <h2 class="section-title">模試</h2>
        <div class="list">
          {row("ミニ模試", { kind: "mock", preset: "mini" }, `${MOCK_PRESETS.mini.count}問・${MOCK_PRESETS.mini.minutes}分`)}
          {row("科目A 本番形式", { kind: "mock", preset: "examA" }, `${MOCK_PRESETS.examA.count}問・${MOCK_PRESETS.examA.minutes}分`)}
          {row("科目B 本番形式", { kind: "mock", preset: "examB" }, `${MOCK_PRESETS.examB.count}問・${MOCK_PRESETS.examB.minutes}分`)}
        </div>
        <p class="muted small">模試は解説を最後にまとめて表示します。途中で閉じても再開できます。</p>
      </section>
    </div>
  );
}
