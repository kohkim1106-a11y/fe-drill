// S04 結果. Mock explanations are shown here, since the mock itself gives no feedback.
import { useEffect } from "preact/hooks";
import { navigate } from "@/router";
import { Icon } from "@/ui/Icon";
import { FIELDS, FIELD_SHORT, choiceLabel, sourceLabel } from "@/features/labels";
import { lastResult, retryWrong, type SessionResult } from "@/features/session/state";
import { PASS_LINE, type Field } from "@/types";
import "./result.css";

export function ResultScreen() {
  const r = lastResult.value;
  useEffect(() => {
    if (!r) navigate("/");
  }, [r === null]);
  if (!r) return null;
  return <ResultView r={r} />;
}

function ResultView({ r }: { r: SessionResult }) {
  const total = r.items.length;
  const correct = r.answers.filter((a) => a.correct).length;
  const rate = total > 0 ? correct / total : 0;
  const passed = rate >= PASS_LINE;
  const wrong = r.items.map((it, i) => ({ it, a: r.answers[i]!, i })).filter((x) => !x.a.correct);

  const byField = new Map<Field, { n: number; ok: number }>();
  r.items.forEach((it, i) => {
    const f = byField.get(it.question.field) ?? { n: 0, ok: 0 };
    f.n += 1;
    if (r.answers[i]?.correct) f.ok += 1;
    byField.set(it.question.field, f);
  });

  return (
    <div class="page page--focus result">
      <header class="result__head">
        <p class="muted small">{r.label}</p>
        <h1 class="page__title">結果</h1>
      </header>

      <section class="card result__score" aria-label="得点">
        <div class="result__big">
          <span class="num result__n marker">{correct}</span>
          <span class="num muted result__total">/{total}</span>
          <span class="num result__pct">{Math.round(rate * 100)}%</span>
        </div>
        <p class={passed ? "result__msg is-ok" : "result__msg is-ng"}>
          {passed
            ? `合格目安（${PASS_LINE * 100}%）に届いています。`
            : `合格目安（${PASS_LINE * 100}%）まであと${Math.max(1, Math.ceil(PASS_LINE * total) - correct)}問。間違えた問題を見直しましょう。`}
        </p>
      </section>

      <section class="card" aria-labelledby="rf-title">
          <h2 id="rf-title" class="section-title">分野別</h2>
          <div class="rbars">
            {FIELDS.filter((f) => byField.has(f)).map((f) => {
              const v = byField.get(f)!;
              const p = v.ok / v.n;
              return (
                <div key={f} class="rbars__row">
                  <span>{FIELD_SHORT[f]}</span>
                  <div class="rate-bar" aria-hidden="true">
                    <div class={`rate-bar__fill${p < PASS_LINE ? " is-low" : ""}`} style={{ width: `${p * 100}%` }} />
                    <div class="rate-bar__line" style={{ left: `${PASS_LINE * 100}%` }} />
                  </div>
                  <span class="num rbars__val">{v.ok}/{v.n}</span>
                </div>
              );
            })}
          </div>
      </section>

      {wrong.length > 0 && (
        <section class="result__wrong" aria-labelledby="rw-title">
          <h2 id="rw-title" class="section-title">間違えた問題（{wrong.length}）</h2>
          {wrong.map(({ it, a, i: n }) => {
            const q = it.question;
            const label = (orig: number | null) => (orig === null ? "未回答" : choiceLabel(it.order.indexOf(orig)));
            return (
              <details key={n} class="wrong">
                <summary class="wrong__summary">
                  <span class="wrong__stem">{q.stem}</span>
                  <Icon name="chevronRight" size={16} />
                </summary>
                <div class="wrong__body">
                  {q.code && <pre class="code" tabIndex={0}>{q.code}</pre>}
                  <ol class="wrong__choices">
                    {it.order.map((orig, i) => (
                      <li key={orig} class={orig === q.answer ? "is-correct" : orig === a.picked ? "is-wrong" : undefined}>
                        <span class="wrong__label">{choiceLabel(i)}</span>
                        {q.choices[orig]}
                      </li>
                    ))}
                  </ol>
                  <p class="small">
                    正解 <strong>{label(q.answer)}</strong> ／ あなたの解答 <strong>{label(a.picked)}</strong>
                  </p>
                  <p class="wrong__exp">{q.explanation}</p>
                  <p class="muted small">出典：{sourceLabel(q.source)}</p>
                </div>
              </details>
            );
          })}
        </section>
      )}

      <div class="result__actions">
        {wrong.length > 0 && (
          <button type="button" class="btn-primary" onClick={() => retryWrong()}>
            間違えた問題をもう一度
          </button>
        )}
        <button type="button" class="btn-secondary btn-block" onClick={() => navigate("/")}>
          ホームへ
        </button>
      </div>
    </div>
  );
}
