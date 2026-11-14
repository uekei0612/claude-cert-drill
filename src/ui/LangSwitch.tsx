/* 問題文の言語の切り替え（英語／訳はタップ／併記／日本語）。設定に保存し、練習・模擬試験の途中でも切り替えられる。
   問題文を上に出すため、4 つ並べた帯ではなく、今の言語を 1 字で出す小さなボタンにし、押すと選択肢が開く（#31）。
   訳の無い資格では出さない */
import { useEffect, useRef, useState } from "preact/hooks";
import type { Exam } from "../core/exam/types";
import { setSettings } from "../core/store/actions";
import { QUESTION_LANGS, type QuestionLang } from "../core/store/schema";
import { update, useData } from "../app/store";

export const LANG_LABEL: Record<QuestionLang, string> = { en: "英語", peek: "訳はタップ", both: "併記", ja: "日本語" };

/** ボタンに出す今の言語（1〜2 字） */
const LANG_SHORT: Record<QuestionLang, string> = { en: "英", peek: "英(訳)", both: "併記", ja: "日" };

/** 開いた選択肢の補足 */
const LANG_NOTE: Record<QuestionLang, string> = {
  en: "本番と同じ",
  peek: "英語で読み、訳は押すと開く",
  both: "英語の下に訳",
  ja: "訳だけ",
};

export function LangSwitch({ exam }: { exam: Exam }) {
  const lang = useData().settings.lang;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // 外を押したら閉じる
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  if (!exam.translations?.ja) return null;
  return (
    <div class="lang-menu" ref={root}>
      <button
        type="button"
        class="btn ghost small lang-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`問題文の言語：${LANG_LABEL[lang]}`}
        onClick={() => setOpen(!open)}
      >
        <span class="lang-cur">{LANG_SHORT[lang]}</span> ▾
      </button>
      {open && (
        <div class="lang-pop" role="group" aria-label="問題文の言語">
          {QUESTION_LANGS.map(l => (
            <button
              key={l}
              type="button"
              class={l === lang ? "on" : ""}
              aria-pressed={l === lang}
              onClick={() => {
                update(d => setSettings(d, { lang: l }));
                setOpen(false);
              }}
            >
              {LANG_LABEL[l]}
              <span class="muted small">{LANG_NOTE[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
