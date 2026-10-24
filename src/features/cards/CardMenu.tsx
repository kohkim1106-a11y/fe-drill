// S05 カードメニュー: field filter, where to study from, start position and round size.
import { useState } from "preact/hooks";
import { todayLocal } from "@/core/dates";
import { progress } from "@/store";
import { Icon } from "@/ui/Icon";
import { EmptyState } from "@/ui/EmptyState";
import { terms } from "@/features/content";
import {
  SESSION_SIZES,
  cardFilter,
  cardSource,
  filterTerms,
  isRemembered,
  orderCursor,
  sessionSize,
  setCardSource,
  setSessionSize,
  sourcePool,
  startRun,
  type CardFilter,
  type CardSource,
} from "./deck";
import "./cards.css";

const FILTERS: Array<{ id: CardFilter; label: string }> = [
  { id: "all", label: "すべて" },
  { id: "tech", label: "テクノロジ" },
  { id: "mgmt", label: "マネジメント" },
  { id: "strat", label: "ストラテジ" },
];

const SOURCE_LABEL: Record<CardSource, { title: string; sub: string; empty: string }> = {
  order: { title: "順番に", sub: "番号順に、選んだ位置から", empty: "" },
  notYet: { title: "「まだ」の単語", sub: "最後に「まだ」を押した単語", empty: "「まだ」の単語はありません。" },
  remembered: { title: "「覚えた」の単語", sub: "最後に「覚えた」を押した単語", empty: "「覚えた」の単語はまだありません。" },
  review: { title: "今日の復習", sub: "復習の期限が来た単語と新しい単語", empty: "今日の復習はありません。" },
};
const SOURCE_ORDER: CardSource[] = ["order", "notYet", "remembered", "review"];

export function CardMenu() {
  const filter = cardFilter.value;
  const list = filterTerms(terms.value, filter);
  const prog = progress.value;
  const today = todayLocal();
  const size = sessionSize.value;
  const source = cardSource.value;

  const counts: Record<CardSource, number> = {
    order: list.length,
    notYet: sourcePool(list, "notYet", prog, today).length,
    remembered: list.filter((t) => isRemembered(prog[t.id])).length,
    review: sourcePool(list, "review", prog, today).length,
  };

  // Resume "順番に" where the user left off; wrap to the top after the last card.
  const saved = orderCursor.value[filter];
  const resume = saved === undefined ? null : saved < list.length ? saved : 0;
  const [pickedStart, setPickedStart] = useState<{ filter: CardFilter; at: number } | null>(null);
  const start = pickedStart?.filter === filter ? pickedStart.at : (resume ?? 0);
  const [notice, setNotice] = useState("");

  const poolSize = counts[source];
  const roundEnd = source === "order" ? Math.min(start + size, list.length) : Math.min(size, poolSize);

  const begin = () => {
    setNotice("");
    if (!startRun(list, source, filter, source === "order" ? start : 0)) setNotice(SOURCE_LABEL[source].empty || "出せるカードがありません。");
  };

  return (
    <div class="page cards">
      <h1 class="page__title">用語カード</h1>

      <div class="chips" role="group" aria-label="分野で絞り込み">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" class="chip" aria-pressed={filter === f.id} onClick={() => (cardFilter.value = f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {terms.value.length === 0 ? (
        <EmptyState title="用語データがまだありません">用語が追加されると、ここでカード学習ができます。</EmptyState>
      ) : (
        <>
          <div class="card cards__stats">
            <div>
              <div class="card__label">覚えた</div>
              <div class="cards__count">
                <span class="num cards__n marker">{counts.remembered}</span>
                <span class="num muted">/ {list.length}</span>
                <span class="muted small">語</span>
              </div>
            </div>
            <div class="bar" role="progressbar" aria-label="覚えた割合" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={counts.remembered}>
              <div class="bar__fill" style={{ width: `${list.length ? (counts.remembered / list.length) * 100 : 0}%` }} />
            </div>
          </div>

          <section class="home__section" aria-labelledby="cards-source">
            <h2 id="cards-source" class="section-title">どこから学習する？</h2>
            <div class="list" role="radiogroup" aria-labelledby="cards-source">
              {SOURCE_ORDER.map((id) => (
                <button key={id} type="button" role="radio" aria-checked={source === id} class="list__row cards__source" onClick={() => setCardSource(id)}>
                  <span class="cards__radio" aria-hidden="true" />
                  <span class="cards__source-text">
                    <span>{SOURCE_LABEL[id].title}</span>
                    <span class="list__sub">{SOURCE_LABEL[id].sub}</span>
                  </span>
                  <span class="num muted small">{counts[id]}語</span>
                </button>
              ))}
            </div>
          </section>

          {source === "order" && list.length > 0 && (
            <label class="cards__field">
              <span class="small">開始位置</span>
              <select
                id="cards-start"
                class="input cards__select"
                value={String(start)}
                onChange={(e) => setPickedStart({ filter, at: Number(e.currentTarget.value) })}
              >
                {startOptions(list.length, size, resume).map((o) => (
                  <option key={o.at} value={String(o.at)}>
                    {o.label}
                    {list[o.at] ? `：${list[o.at]!.term}から` : ""}
                    {o.resume ? "（前回の続き）" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div class="cards__field">
            <span class="small">1回の枚数</span>
            <div class="seg" role="radiogroup" aria-label="1回の枚数">
              {SESSION_SIZES.map((n) => (
                <button key={n} type="button" role="radio" class="seg__btn" aria-checked={size === n} onClick={() => setSessionSize(n)}>
                  <span class="num">{n}</span>枚
                </button>
              ))}
            </div>
          </div>

          <div class="cards__start">
            {notice && <p class="notice" role="status">{notice}</p>}
            <button type="button" class="btn-primary" disabled={poolSize === 0} onClick={begin}>
              {source === "order" ? `${start + 1}〜${roundEnd}語目を始める` : `${SOURCE_LABEL[source].title}を始める（${roundEnd}枚）`}
              <Icon name="arrowRight" size={18} stroke={2.2} />
            </button>
            <p class="muted small">
              {poolSize === 0 ? SOURCE_LABEL[source].empty : "終わったら「続けて」で次のカードに進みます。"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Start positions in steps of the round size, plus the saved position when it falls mid-block. */
export function startOptions(total: number, size: number, resume: number | null): Array<{ at: number; label: string; resume: boolean }> {
  const opts: Array<{ at: number; label: string; resume: boolean }> = [];
  if (resume !== null && resume % size !== 0) opts.push({ at: resume, label: `${resume + 1}語目`, resume: true });
  for (let at = 0; at < total; at += size) {
    opts.push({ at, label: `${at + 1}〜${Math.min(at + size, total)}語目`, resume: at === resume });
  }
  return opts;
}
