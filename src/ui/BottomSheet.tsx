// Panel that slides up from the bottom (B3). Two uses:
// - feedback sheet: non-modal, the question stays visible above, swipe up = next
// - modal sheet: scrim + Escape closes (e.g. 誤りを報告)
import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

export const SWIPE_UP_PX = 80;

interface Props {
  open: boolean;
  label: string;
  children: ComponentChildren;
  onSwipeUp?: () => void;
  /** When set, the sheet is modal: scrim click and Escape call it. */
  onClose?: () => void;
  class?: string;
}

export function BottomSheet({ open, label, children, onSwipeUp, onClose, class: cls }: Props) {
  const ref = useRef<HTMLElement>(null);
  const start = useRef<{ y: number; scroll: number } | null>(null);

  // Move focus into the sheet so keyboard and screen reader users land on its action.
  useEffect(() => {
    if (!open) return;
    const target = ref.current?.querySelector<HTMLElement>("[data-autofocus]") ?? ref.current;
    target?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const scroller = () => ref.current?.querySelector<HTMLElement>("[data-sheet-scroll]");
  const begin = (y: number) => {
    start.current = { y, scroll: scroller()?.scrollTop ?? 0 };
  };
  const end = (y: number) => {
    const s = start.current;
    start.current = null;
    if (!s || !onSwipeUp) return;
    // If the explanation scrolled during the gesture, the user was reading, not swiping.
    const scrolled = (scroller()?.scrollTop ?? 0) !== s.scroll;
    if (!scrolled && s.y - y >= SWIPE_UP_PX) onSwipeUp();
  };

  return (
    <>
      {onClose && <div class="sheet-scrim" onClick={onClose} aria-hidden="true" />}
      <section
        ref={ref}
        class={`sheet${cls ? ` ${cls}` : ""}`}
        role={onClose ? "dialog" : "region"}
        aria-modal={onClose ? true : undefined}
        aria-label={label}
        tabIndex={-1}
        // Touch events keep firing while content scrolls (pointer events would cancel).
        onTouchStart={(e) => begin(e.touches[0]?.clientY ?? 0)}
        onTouchEnd={(e) => end(e.changedTouches[0]?.clientY ?? 0)}
        onPointerDown={(e) => e.pointerType === "mouse" && begin(e.clientY)}
        onPointerUp={(e) => e.pointerType === "mouse" && end(e.clientY)}
      >
        <div class="sheet__handle" aria-hidden="true" />
        {children}
      </section>
    </>
  );
}
