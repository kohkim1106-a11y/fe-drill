// S05 カードメニュー: field filter, counts, and the start button.
import { useState } from "preact/hooks";
import { todayLocal } from "@/core/dates";
import { progress } from "@/store";
import { Icon } from "@/ui/Icon";
import { EmptyState } from "@/ui/EmptyState";
import { terms } from "@/features/content";
import { CARDS_PER_SESSION, cardFilter, isRemembered, pickCards, startCards, type CardFilter } from "./deck";
import "./cards.css";

const FILTERS: Array<{ id: CardFilter; label: string }> = [
  { id: "all", label: "すべて" },
  { id: "tech", label: "テクノロジ" },
  { id: "mgmt", label: "マネジメント" },
  { id: "strat", label: "ストラテジ" },
];

export function CardMenu() {
  const filter = cardFilter.value;
  const all = terms.value;
  const list = filter === "all" ? all : all.filter((t) => t.field === filter);
  const prog = progress.value;
  const remembered = list.filter((t) => isRemembered(prog[t.id])).length;
  const today = todayLocal();
  const due = list.filter((t) => prog[t.id] && prog[t.id]!.due <= today).length;
  const next = pickCards(list, prog, today).length;
  const [notice, setNotice] = useState("");

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

      {all.length === 0 ? (
        <EmptyState title="用語データがまだありません">用語が追加されると、ここでカード学習ができます。</EmptyState>
      ) : (
        <>
          <div class="card cards__stats">
            <div>
              <div class="card__label">覚えた</div>
              <div class="cards__count">
                <span class="num cards__n marker">{remembered}</span>
                <span class="num muted">/ {list.length}</span>
                <span class="muted small">語</span>
              </div>
            </div>
            <div class="bar" role="progressbar" aria-label="覚えた割合" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={remembered}>
              <div class="bar__fill" style={{ width: `${list.length ? (remembered / list.length) * 100 : 0}%` }} />
            </div>
            <p class="muted small">
              復習の期限 <span class="num">{due}</span>枚 ／ 1回 <span class="num">{CARDS_PER_SESSION}</span>枚
            </p>
          </div>

          <div class="cards__start">
            {notice && <p class="notice" role="status">{notice}</p>}
            {next === 0 && <p class="muted small">今日のカードはすべて終わりました。</p>}
            <button
              type="button"
              class="btn-primary"
              disabled={next === 0}
              onClick={() => {
                if (!startCards(list)) setNotice("出せるカードがありません。");
              }}
            >
              今日のカード（{next}枚）
              <Icon name="arrowRight" size={18} stroke={2.2} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
