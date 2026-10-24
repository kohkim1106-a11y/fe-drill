// S07 分析・学習計画 (B-Stats / B2-Stats).
import { useState } from "preact/hooks";
import { todayLocal } from "@/core/dates";
import { href } from "@/router";
import { settings } from "@/store";
import { authUser, signIn, signOut, syncAvailable } from "@/sync";
import { Icon } from "@/ui/Icon";
import { summary, pct } from "@/features/summary";
import { FIELDS, FIELD_SHORT, modeLabel } from "@/features/labels";
import { startMode } from "@/features/session/state";
import { PASS_LINE, type Field, type SessionMode } from "@/types";
import "@/features/result/result.css";
import "./stats.css";

export function Stats() {
  const s = summary.value;
  const st = settings.value;
  const [notice, setNotice] = useState("");

  const solve = (mode: SessionMode) => {
    setNotice("");
    if (!startMode(mode)) setNotice(`「${modeLabel(mode)}」で出題できる問題がありません。`);
  };

  return (
    <div class="page stats">
      <h1 class="page__title">分析・学習計画</h1>

      <div class="list">
        <div class="list__row stats__plan">
          <span class="muted">試験日</span>
          <span class="stats__plan-val">
            <span class="num">{st.examDate ? st.examDate.replaceAll("-", "/") : "未設定"}</span>
            {s.daysLeft !== null && <span class="muted small">あと<span class="num">{Math.max(0, s.daysLeft)}</span>日</span>}
            <a class="link-accent" href={href("/settings")} aria-label="試験日を変更">変更</a>
          </span>
        </div>
        <div class="list__row stats__plan">
          <span class="muted">1日の目標</span>
          <span class="stats__plan-val">
            <span><span class="num">{st.dailyGoal}</span>問</span>
            <a class="link-accent" href={href("/settings")} aria-label="1日の目標を変更">変更</a>
          </span>
        </div>
      </div>
      {st.examDate && s.suggestedDailyGoal !== st.dailyGoal && (
        <p class="muted small">試験日までに一通り解くなら、1日 <span class="num">{s.suggestedDailyGoal}</span>問がおすすめです。</p>
      )}

      <div class="stats__tiles">
        <div class="card stats__tile">
          <span class="card__label">累計</span>
          <span><span class="num stats__tile-n">{s.total.answered}</span><span class="small"> 問</span></span>
        </div>
        <div class="card stats__tile">
          <span class="card__label">正答率</span>
          <span><span class="num stats__tile-n">{pct(s.total.rate ?? 0)}</span><span class="small"> %</span></span>
        </div>
      </div>

      <section class="card" aria-labelledby="sf-title">
        <div class="stats__head">
          <h2 id="sf-title" class="section-title">分野別 正答率</h2>
          <span class="stats__legend"><span class="stats__dash" aria-hidden="true" />合格目安 {PASS_LINE * 100}%</span>
        </div>
        <div class="rbars">
          {FIELDS.map((f) => <FieldBar key={f} field={f} rate={s.byField[f].rate} answered={s.byField[f].answered} />)}
        </div>
      </section>

      <section class="card" aria-labelledby="sw-title">
        <h2 id="sw-title" class="section-title">苦手トップ5</h2>
        {notice && <p class="notice" role="status">{notice}</p>}
        {s.weakMinors.length === 0 ? (
          <p class="muted small">1つの分野で5問以上解くと、ここに苦手な分野が出ます。</p>
        ) : (
          <ol class="weak">
            {s.weakMinors.map((w, i) => (
              <li key={`${w.field}/${w.minor}`} class="weak__row">
                <span class="num muted">{i + 1}</span>
                <span class="weak__name">{w.minor}</span>
                <span class="num weak__rate">{pct(w.rate)}%</span>
                <button
                  type="button"
                  class="weak__btn"
                  aria-label={`${w.minor}を解く`}
                  onClick={() => solve({ kind: "field", field: w.field, minor: w.minor, count: 10 })}
                >
                  解く
                </button>
              </li>
            ))}
          </ol>
        )}
        {s.weakMinors.length > 0 && (
          <button type="button" class="btn-secondary btn-block" onClick={() => solve({ kind: "weak", count: 10 })}>
            弱点から10問
          </button>
        )}
      </section>

      <Last14 days={s.last14} goal={st.dailyGoal} />

      {syncAvailable && <SyncRow />}
    </div>
  );
}

function FieldBar({ field, rate, answered }: { field: Field; rate: number | null; answered: number }) {
  const low = rate !== null && rate < PASS_LINE;
  return (
    <>
      <span>{FIELD_SHORT[field]}</span>
      <div class="rate-bar" role="img" aria-label={`${FIELD_SHORT[field]} 正答率${pct(rate)}% ・ ${answered}問`}>
        <div class={`rate-bar__fill${low ? " is-low" : ""}`} style={{ width: `${(rate ?? 0) * 100}%` }} />
        <div class="rate-bar__line" style={{ left: `${PASS_LINE * 100}%` }} />
      </div>
      <span class={`num rbars__val${low ? " is-low" : ""}`}>{rate === null ? "—" : `${pct(rate)}%`}</span>
    </>
  );
}

function Last14({ days, goal }: { days: Array<{ date: string; answered: number }>; goal: number }) {
  const today = todayLocal();
  const total = days.reduce((n, d) => n + d.answered, 0);
  // Scale so both the tallest day and the goal line fit.
  const max = Math.max(goal, ...days.map((d) => d.answered), 1);
  return (
    <section class="card" aria-labelledby="sl-title">
      <div class="stats__head">
        <h2 id="sl-title" class="section-title">直近14日の学習量</h2>
        <span class="muted small">合計 <span class="num">{total}</span>問</span>
      </div>
      {days.length === 0 ? (
        <p class="muted small">まだ記録がありません。</p>
      ) : (
        <>
          <div class="chart" role="img" aria-label={days.map((d) => `${d.date.slice(5)} ${d.answered}問`).join("、")}>
            <div class="chart__goal" style={{ bottom: `${(goal / max) * 100}%` }} />
            {days.map((d) => (
              <div
                key={d.date}
                class={`chart__bar${d.date === today ? " is-today" : ""}${d.answered === 0 ? " is-zero" : ""}`}
                style={{ height: d.answered === 0 ? "2px" : `${(d.answered / max) * 100}%` }}
              />
            ))}
          </div>
          <div class="chart__labels num" aria-hidden="true">
            {days.map((d) => (
              <span key={d.date} class={d.date === today ? "is-today" : undefined}>{Number(d.date.slice(8))}</span>
            ))}
          </div>
          <div class="muted stats__note">点線＝目標 <span class="num">{goal}</span>問 ／ 強調＝今日</div>
        </>
      )}
    </section>
  );
}

export function SyncRow() {
  const user = authUser.value;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch {
      setError("うまくいきませんでした。通信状態を確認してもう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div class="sync">
      <span class="sync__icon"><Icon name="cloud" size={20} /></span>
      <span class="sync__text">
        {user ? <>同期中：{user.displayName ?? user.email ?? "ログイン済み"}</> : "Googleでログインすると端末間で同期できます"}
        {error && <span class="notice" role="alert"> {error}</span>}
      </span>
      <button type="button" class="sync__btn" disabled={busy} onClick={() => void run(user ? signOut : signIn)}>
        {user ? "ログアウト" : "ログイン"}
      </button>
    </div>
  );
}
