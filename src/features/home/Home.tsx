// S01 ホーム (B-Home / B2-Home). The primary action sits at the bottom for thumb reach.
import { useState } from "preact/hooks";
import { href } from "@/router";
import { settings } from "@/store";
import { Icon } from "@/ui/Icon";
import { EmptyState } from "@/ui/EmptyState";
import { questions } from "@/features/content";
import { summary } from "@/features/summary";
import { startMode } from "@/features/session/state";
import "./home.css";

export function greeting(hour: number): string {
  if (hour >= 4 && hour < 11) return "おはようございます。今日も少しずつ。";
  if (hour >= 11 && hour < 18) return "こんにちは。今日もあと少し。";
  return "こんばんは。今日もあと少し。";
}

export function Home() {
  const s = summary.value;
  const goal = settings.value.dailyGoal;
  const examDate = settings.value.examDate;
  const hasQuestions = questions.value.length > 0;
  const [notice, setNotice] = useState("");
  const done = Math.min(s.todayAnswered, goal);
  const left = Math.max(0, goal - s.todayAnswered);

  const startReview = () => {
    if (!startMode({ kind: "review" })) setNotice("出題できる問題がありません。");
  };

  return (
    <div class="page home">
      <header class="home__head">
        <div class="home__titles">
          <h1 class="home__app">基本情報ドリル</h1>
          <p class="home__greet">{greeting(new Date().getHours())}</p>
        </div>
        <div class="pill" aria-label={`連続${s.streak}日`}>
          <span class="pill__icon"><Icon name="flame" size={16} /></span>
          連続 <span class="num pill__num">{s.streak}</span>日
        </div>
      </header>

      <div class="home__grid">
        <div class="card">
          <div class="card__label">試験まで</div>
          {examDate && s.daysLeft !== null ? (
            <>
              <div class="home__big">
                <span class="num home__days marker">{Math.max(0, s.daysLeft)}</span>
                <span class="home__unit">日</span>
              </div>
              <div class="card__label small">{formatDate(examDate)}</div>
            </>
          ) : (
            <a class="link-accent home__set" href={href("/settings")}>試験日を設定</a>
          )}
        </div>
        <div class="card">
          <div class="card__label">今日の目標</div>
          <div class="home__goal">
            <span class="num home__goal-n">{s.todayAnswered}</span>
            <span class="num muted">/{goal}</span>
            <span class="muted small">問</span>
          </div>
          <div class="bar" role="progressbar" aria-label="今日の目標の達成度" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={done}>
            <div class="bar__fill" style={{ width: `${goal > 0 ? (done / goal) * 100 : 0}%` }} />
          </div>
          <div class="card__label small">
            {left > 0 ? <>あと<span class="num">{left}</span>問で達成</> : "達成しました"}
          </div>
        </div>
      </div>

      {!hasQuestions && (
        <EmptyState title="問題データがまだありません">問題が追加されると、ここから演習を始められます。用語カードと基数変換ドリルは使えます。</EmptyState>
      )}

      <section class="home__section">
        <h2 class="section-title">学習メニュー</h2>
        <nav class="list" aria-label="学習メニュー">
          <a class="list__row" href={href("/practice")}>
            <span>演習メニュー<span class="list__sub">分野別・弱点・模試</span></span>
            <Icon name="chevronRight" size={16} />
          </a>
          <a class="list__row" href={href("/cards")}>
            <span>用語カード</span>
            <Icon name="chevronRight" size={16} />
          </a>
          <a class="list__row" href={href("/stats")}>
            <span>分析・学習計画</span>
            <Icon name="chevronRight" size={16} />
          </a>
        </nav>
      </section>

      <section class="card home__review" aria-labelledby="review-title">
        <div class="home__review-head">
          <h2 id="review-title" class="home__review-title">今日の復習</h2>
          <div class="muted small">
            期限が来た問題 <span class="num home__due marker">{s.dueToday}</span>問
          </div>
        </div>
        {s.dueToday === 0 && hasQuestions && <p class="muted small">期限の問題はありません。まだ解いていない問題から出題します。</p>}
        {notice && <p class="notice" role="status">{notice}</p>}
        <button type="button" class="btn-primary" disabled={!hasQuestions} onClick={startReview}>
          復習を始める
          <Icon name="arrowRight" size={18} stroke={2.2} />
        </button>
      </section>
    </div>
  );
}

function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return (
    <>
      <span class="num">{y}</span>年<span class="num">{m}</span>月<span class="num">{d}</span>日
    </>
  );
}
