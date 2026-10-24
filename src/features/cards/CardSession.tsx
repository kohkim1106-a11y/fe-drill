// S06 カード学習（集中モード, B3-Cards）. Tap flips; swipe right = 覚えた, left = まだ.
import { useEffect, useRef, useState } from "preact/hooks";
import { navigate } from "@/router";
import { Icon } from "@/ui/Icon";
import type { Term } from "@/types";
import { cardSession, continueRun, judge, nextStart, sessionSize, type CardSession } from "./deck";
import "./cards.css";

export const SWIPE_X_PX = 100;

export function CardSessionScreen() {
  const s = cardSession.value;
  useEffect(() => {
    if (!s) navigate("/cards");
  }, [s === null]);
  if (!s) return null;
  return <CardSessionView s={s} />;
}

function CardSessionView({ s }: { s: CardSession }) {
  const done = s.index >= s.deck.length;
  const exit = () => {
    cardSession.value = null;
    navigate("/cards");
  };

  return (
    <div class="focus flash">
      <header class="focus__bar">
        <div class="bar flash__bar" role="progressbar" aria-label={`${s.deck.length}枚中${Math.min(s.index + 1, s.deck.length)}枚目`} aria-valuemin={0} aria-valuemax={s.deck.length} aria-valuenow={s.index}>
          <div class="bar__fill" style={{ width: `${(s.index / s.deck.length) * 100}%` }} />
        </div>
        <div class="focus__row">
          <button type="button" class="icon-btn" aria-label="カードを終了" onClick={exit}>
            <Icon name="close" size={22} />
          </button>
          <div class="focus__title">
            用語カード ・ <span class="num focus__count">{Math.min(s.index + 1, s.deck.length)}</span> / <span class="num">{s.deck.length}</span>
          </div>
          <div class="icon-btn-spacer" />
        </div>
      </header>
      {done ? <Finished s={s} onExit={exit} /> : <Deck key={s.index} term={s.deck[s.index]!} behind={s.deck.length - s.index - 1} />}
    </div>
  );
}

function Deck({ term, behind }: { term: Term; behind: number }) {
  const [flipped, setFlipped] = useState(false);
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); judge(false); }
      else if (e.key === "ArrowRight") { e.preventDefault(); judge(true); }
      else if ((e.key === " " || e.key === "Enter") && !(e.target as HTMLElement | null)?.closest("button, a")) {
        // On the card button itself, Space/Enter flips via the native click.
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const delta = e.clientX - d.x;
    if (Math.abs(delta) > 8) d.moved = true;
    setDx(delta);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    suppressClick.current = d.moved;
    if (dx >= SWIPE_X_PX) judge(true);
    else if (dx <= -SWIPE_X_PX) judge(false);
    else setDx(0);
  };
  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setFlipped((f) => !f);
  };

  const hint = Math.min(1, Math.abs(dx) / SWIPE_X_PX);
  return (
    <>
      <main class="flash__main">
        <div class="flash__side flash__side--left" aria-hidden="true" style={{ opacity: 0.35 + (dx < 0 ? hint * 0.65 : 0) }}>
          <Icon name="chevronLeft" size={20} />
          <span>まだ</span>
        </div>
        <div class="flash__side flash__side--right" aria-hidden="true" style={{ opacity: 0.35 + (dx > 0 ? hint * 0.65 : 0) }}>
          <Icon name="chevronRight" size={20} />
          <span>覚えた</span>
        </div>

        <div class="flash__stack">
          {behind >= 2 && <div class="flash__behind flash__behind--2" aria-hidden="true" />}
          {behind >= 1 && <div class="flash__behind flash__behind--1" aria-hidden="true" />}
          <button
            ref={cardRef}
            type="button"
            class={`flash__card${drag.current ? " is-dragging" : ""}`}
            style={{ transform: dx ? `translateX(${dx}px) rotate(${dx / 24}deg)` : undefined }}
            aria-label={flipped ? `カードをめくる（裏：${term.meaning}）` : `カードをめくる（表：${term.term}）`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => { drag.current = null; setDx(0); }}
            onClick={onClick}
          >
            <div class="flash__top">
              <span class="tag tag--info">{term.minor}</span>
              <span class="muted small">{flipped ? "裏" : "表"}</span>
            </div>
            {flipped ? (
              <div class="flash__center flash__center--back">
                <p class="flash__term-sm">{term.term}</p>
                <p class="flash__meaning">{term.meaning}</p>
              </div>
            ) : (
              <div class="flash__center">
                <span class="flash__term marker">{term.term}</span>
                {term.reading && <span class="flash__reading">{term.reading}</span>}
              </div>
            )}
            {!flipped && (
              <div class="flash__foot">
                <Icon name="tap" size={28} stroke={1.8} />
                <span>タップで意味を見る</span>
              </div>
            )}
          </button>
        </div>
      </main>

      <footer class="flash__footer">
        <div class="flash__help">左右にスワイプ、またはボタンで仕分け</div>
        <div class="flash__buttons">
          <button type="button" class="flash__btn flash__btn--ng" onClick={() => judge(false)}>
            <Icon name="arrowLeft" size={18} stroke={2.2} />
            まだ
          </button>
          <button type="button" class="btn-primary flash__btn" onClick={() => judge(true)}>
            覚えた
            <Icon name="arrowRight" size={18} stroke={2.2} />
          </button>
        </div>
      </footer>
    </>
  );
}

function Finished({ s, onExit }: { s: CardSession; onExit: () => void }) {
  const from = nextStart(s);
  const left = s.pool.length - from;
  const nextCount = Math.min(sessionSize.value, left);
  return (
    <main class="flash__done">
      <h1 class="page__title">おつかれさまでした</h1>
      <div class="card flash__summary">
        <div class="flash__sum-row">
          <span>覚えた</span>
          <span class="num flash__sum-n marker">{s.remembered}</span>
        </div>
        <div class="flash__sum-row">
          <span>まだ</span>
          <span class="num flash__sum-n">{s.notYet}</span>
        </div>
      </div>
      <p class="muted small">
        {left > 0 ? `残り${left}枚。` : "この学習元は最後まで終わりました。"}「まだ」にした単語は、カードメニューの「「まだ」の単語」から復習できます。
      </p>
      <div class="flash__done-actions">
        {left > 0 && (
          <button type="button" class="btn-primary" onClick={() => continueRun()}>
            {s.source === "order" ? `続けて${from + 1}〜${from + nextCount}語目` : `続けて次の${nextCount}枚`}
          </button>
        )}
        <button type="button" class={left > 0 ? "btn-secondary btn-block" : "btn-primary"} onClick={onExit}>
          カードメニューへ
        </button>
      </div>
    </main>
  );
}
