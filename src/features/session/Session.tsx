// S03 演習（集中モード, B3-Quiz）. One question per screen; feedback slides up from below.
import { useEffect, useRef, useState } from "preact/hooks";
import { navigate } from "@/router";
import { BottomSheet } from "@/ui/BottomSheet";
import { Icon } from "@/ui/Icon";
import { FIELD_SHORT, choiceLabel, isMock, sourceLabel } from "@/features/labels";
import type { SessionItem } from "@/types";
import { activeSession, answer, exitSession, next, saveMock, tick, type ActiveSession } from "./state";
import "./session.css";

export function SessionScreen() {
  const s = activeSession.value;

  useEffect(() => {
    if (!s) navigate("/practice");
  }, [s === null]);

  if (!s) return null;
  return <SessionView s={s} />;
}

function SessionView({ s }: { s: ActiveSession }) {
  const item = s.items[s.index]!;
  const given = s.answers[s.index];
  const mock = isMock(s.mode);
  const showFeedback = !mock && given !== undefined;
  const [reporting, setReporting] = useState(false);
  const stemRef = useRef<HTMLHeadingElement>(null);

  // Each new question: move focus to the stem so screen readers read it first.
  useEffect(() => {
    stemRef.current?.focus({ preventScroll: true });
    window.scrollTo?.(0, 0);
  }, [s.index]);

  // Mock timer, and keep the mock resumable if the app is closed mid-way.
  const timed = s.remainingMs !== null;
  useEffect(() => {
    if (!timed) return;
    const id = window.setInterval(() => tick(1000), 1000);
    const onHide = () => document.visibilityState === "hidden" && saveMock();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", saveMock);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", saveMock);
    };
  }, [timed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reporting || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= item.order.length && given === undefined) {
        e.preventDefault();
        answer(item.order[n - 1]!);
        return;
      }
      // Enter/Space on a focused control already activates it natively.
      const el = e.target as HTMLElement | null;
      if (el?.closest("button, a, input, textarea, select, pre")) return;
      if ((e.key === "Enter" || e.key === " ") && showFeedback) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, given, showFeedback, reporting]);

  const isLast = s.index + 1 >= s.items.length;

  return (
    <div class="focus quiz">
      <header class="focus__bar">
        <Progress total={s.items.length} index={s.index} answeredCurrent={given !== undefined} />
        <div class="focus__row">
          <button type="button" class="icon-btn" aria-label={mock ? "模試を中断" : "演習を終了"} onClick={exitSession}>
            <Icon name="close" size={22} />
          </button>
          <div class="focus__title">
            {s.label} ・ <span class="num focus__count">{s.index + 1}</span>/<span class="num">{s.items.length}</span>
          </div>
          {s.remainingMs !== null ? <Timer ms={s.remainingMs} /> : <div class="icon-btn-spacer" />}
        </div>
      </header>

      <main class={`quiz__main${showFeedback ? " has-sheet" : ""}`}>
        <div class="tags">
          <span class="tag tag--info">{item.question.exam === "B" ? "科目B" : "科目A"}</span>
          <span class="tag">{item.question.minor || FIELD_SHORT[item.question.field]}</span>
        </div>
        <h1 class="quiz__stem" ref={stemRef} tabIndex={-1}>
          {item.question.stem}
        </h1>
        {item.question.code && (
          <pre class="code" tabIndex={0} aria-label="コード">
            {item.question.code}
          </pre>
        )}
        <Choices item={item} picked={given?.picked ?? null} reveal={showFeedback} disabled={given !== undefined} />
        {mock && <p class="quiz__hint">模試中は解説を表示しません。終了後にまとめて確認できます。</p>}
      </main>

      <BottomSheet open={showFeedback && !reporting} label="解説" onSwipeUp={next} class="feedback">
        {given && <Feedback item={item} picked={given.picked} correct={given.correct} />}
        <div class="feedback__actions">
          <button type="button" class="text-btn" onClick={() => setReporting(true)}>
            <Icon name="flag" size={16} />
            誤りを報告
          </button>
          <button type="button" class="btn-primary btn-primary--big" data-autofocus onClick={next}>
            {isLast ? "結果を見る" : "次へ"}
            <Icon name="arrowRight" size={20} stroke={2.4} />
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={reporting} label="誤りを報告" onClose={() => setReporting(false)} class="report">
        <ReportBody id={item.question.id} onClose={() => setReporting(false)} />
      </BottomSheet>
    </div>
  );
}

function Progress({ total, index, answeredCurrent }: { total: number; index: number; answeredCurrent: boolean }) {
  const done = index + (answeredCurrent ? 1 : 0);
  const label = `${total}問中${index + 1}問目`;
  // Segments read well up to ~20; long mocks get a continuous bar instead.
  if (total > 20) {
    return (
      <div class="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div class="bar__fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>
    );
  }
  return (
    <div class="segments" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} class={`segments__item${i < done ? " is-done" : ""}`} />
      ))}
    </div>
  );
}

function Timer({ ms }: { ms: number }) {
  const sec = Math.ceil(ms / 1000);
  const text = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  return (
    <div class={`timer num${sec <= 300 ? " is-low" : ""}`} aria-label={`残り${Math.floor(sec / 60)}分`}>
      <Icon name="clock" size={16} />
      {text}
    </div>
  );
}

function Choices({ item, picked, reveal, disabled }: { item: SessionItem; picked: number | null; reveal: boolean; disabled: boolean }) {
  const { question, order } = item;
  // Short answers (numbers, single words) sit two per row like the mockup; sentences get full width.
  const compact = order.length === 4 && question.choices.every((c) => c.length <= 10 && !c.includes("\n"));
  return (
    <div class={`choices${compact ? " choices--grid" : ""}`} role="group" aria-label="選択肢">
      {order.map((orig, i) => {
        const state = !reveal
          ? picked === orig ? " is-picked" : ""
          : orig === question.answer ? " is-correct" : orig === picked ? " is-wrong" : " is-dim";
        return (
          <button
            key={`${question.id}-${orig}`}
            type="button"
            class={`choice${state}`}
            disabled={disabled}
            aria-pressed={picked === orig}
            onClick={() => answer(orig)}
          >
            <span class="choice__label">{choiceLabel(i)}</span>
            <span class="choice__text">{question.choices[orig]}</span>
          </button>
        );
      })}
    </div>
  );
}

function Feedback({ item, picked, correct }: { item: SessionItem; picked: number | null; correct: boolean }) {
  const { question, order } = item;
  const labelOf = (orig: number | null) => (orig === null ? "—" : choiceLabel(order.indexOf(orig)));
  const src = question.source;
  return (
    <>
      <div class="feedback__hint" aria-hidden="true">
        <Icon name="chevronUp" size={14} />
        上にスワイプで次へ
      </div>
      <div class="feedback__head" role="status">
        <div class={`feedback__verdict ${correct ? "is-ok" : "is-ng"}`}>
          {correct ? "○ 正解" : <>× 不正解 <span class="feedback__answer">正解は{labelOf(question.answer)}</span></>}
        </div>
        <div class="feedback__mine">
          あなたの解答 <strong>{labelOf(picked)}</strong>
        </div>
      </div>
      <div class="feedback__body" data-sheet-scroll>
        <div class="feedback__label">解説</div>
        <p class="feedback__text">{question.explanation}</p>
        <div class="feedback__source">
          出典：
          {src.type === "ipa" && src.url ? (
            <a href={src.url} target="_blank" rel="noopener noreferrer">{sourceLabel(src)}</a>
          ) : (
            sourceLabel(src)
          )}
        </div>
      </div>
    </>
  );
}

function ReportBody({ id, onClose }: { id: string; onClose: () => void }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "ng">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied("ok");
    } catch {
      setCopied("ng");
    }
  };
  return (
    <div class="report__body">
      <h2 class="report__title">誤りを報告</h2>
      <p class="report__text">問題IDを控えて、内容の誤りを開発者に知らせてください。この画面からは何も送信されません。</p>
      <div class="report__id">
        <code class="num">{id}</code>
        <button type="button" class="btn-secondary" data-autofocus onClick={() => void copy()}>
          <Icon name="copy" size={16} />
          コピー
        </button>
      </div>
      <p class="report__status" role="status">
        {copied === "ok" ? "コピーしました" : copied === "ng" ? "コピーできませんでした。IDを長押しして選択してください" : ""}
      </p>
      <button type="button" class="btn-secondary btn-block" onClick={onClose}>
        閉じる
      </button>
    </div>
  );
}
