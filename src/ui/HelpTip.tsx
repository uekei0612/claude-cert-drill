/* 指標や用語の横の「?」。押すと定義が開き、もう一度押すか外を押すと閉じる（#50）。
   定義の箱は画面からはみ出さないよう、ボタンの位置から画面の中に収めて置く */
import { useEffect, useRef, useState } from "preact/hooks";
import type { Exam } from "../exams/types";
import { type TermId, termOf } from "./glossary";
import { href } from "./route";

export function HelpTip({ id, exam }: { id: TermId; exam?: Exam }) {
  const t = termOf(id);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | undefined>();
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setPos(undefined);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPos(undefined);
    const off = () => setPos(undefined);
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    addEventListener("scroll", off, { passive: true });
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
      removeEventListener("scroll", off);
    };
  }, [pos]);
  const toggle = (e: MouseEvent) => {
    if (pos) return setPos(undefined);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = Math.min(320, innerWidth - 32);
    setPos({ width, top: r.bottom + 6, left: Math.max(16, Math.min(r.left - 16, innerWidth - width - 16)) });
  };
  return (
    <span class="help-tip" ref={root}>
      <button type="button" class="help-btn" aria-expanded={!!pos} aria-label={`「${t.term}」とは`} onClick={toggle}>
        ?
      </button>
      {pos && (
        <span
          class="help-pop"
          role="note"
          style={{ left: `${pos.left}px`, top: `${pos.top}px`, width: `${pos.width}px` }}
        >
          <strong>{t.term}</strong>
          <span>{t.def(exam)}</span>
          <a class="small" href={href({ name: "help" })}>
            使い方と用語をすべて見る →
          </a>
        </span>
      )}
    </span>
  );
}
