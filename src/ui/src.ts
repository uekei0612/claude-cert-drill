/* 原文（資格の言語で書いた文）に付ける属性（#57）。
   英語の資格は英語用の字体と lang="en"、日本語の資格は lang="ja" にする */
import { type ExamMeta, sourceLang } from "../core/exam/types";

export function srcAttrs(exam: Pick<ExamMeta, "lang">, cls = ""): { lang: string; class?: string } {
  const lang = sourceLang(exam);
  const c = [cls, lang === "en" ? "en" : ""].filter(Boolean).join(" ");
  return c ? { lang, class: c } : { lang };
}

/** 公式の名前を日本語名の下に出すか（同じなら重ねて出さない） */
export const showOfficial = (x: { readonly title: string; readonly ja: string }): boolean => x.title !== x.ja;
