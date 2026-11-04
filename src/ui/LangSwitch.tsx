/* 問題文の言語の切り替え（英語／訳はタップ／併記／日本語）。設定に保存し、練習・模擬試験の途中でも切り替えられる。
   訳の無い資格では出さない */
import type { Exam } from "../exams/types";
import { setSettings } from "../store/actions";
import { QUESTION_LANGS, type QuestionLang } from "../store/schema";
import { update, useData } from "../store/store";

export const LANG_LABEL: Record<QuestionLang, string> = { en: "英語", peek: "訳はタップ", both: "併記", ja: "日本語" };

export function LangSwitch({ exam }: { exam: Exam }) {
  const lang = useData().settings.lang;
  if (!exam.translations?.ja) return null;
  return (
    <div class="seg" role="group" aria-label="問題文の言語">
      {QUESTION_LANGS.map(l => (
        <button
          key={l}
          class={l === lang ? "on" : ""}
          aria-pressed={l === lang}
          onClick={() => update(d => setSettings(d, { lang: l }))}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
