import type { ComponentChildren } from "preact";

export function EmptyState({ title, children }: { title: string; children?: ComponentChildren }) {
  return (
    <div class="empty" role="status">
      <p class="empty__title">{title}</p>
      {children && <div class="empty__body">{children}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div class="loading" role="status" aria-live="polite">
      <h1 class="loading__title">基本情報ドリル</h1>
      <p class="loading__text">問題を読み込んでいます…</p>
    </div>
  );
}
