/* PC のキー操作（#40）。入力欄にフォーカスがあるとき・修飾キー付きのときは反応しない。
   ボタンやリンクにフォーカスがあるときの Enter は、ブラウザの「押す」に任せる（二重に進まないように） */
import { useEffect } from "preact/hooks";
import { type ExamMeta, optionLabel, optionLabels } from "../core/exam/types";

/** 押したキーが何番目の選択肢か（1〜5、記号が A〜 の資格は A〜E も。F は模擬試験の旗）。
    選択肢でなければ -1。問題の選択肢の数は呼ぶ側で見る */
export function optionIndex(key: string, exam: Pick<ExamMeta, "options">): number {
  if (key.length !== 1) return -1;
  const i = "12345".indexOf(key);
  if (i >= 0) return i;
  return optionLabels(exam) === "latin" ? "abcde".indexOf(key.toLowerCase()) : -1;
}

/** キー操作の説明の「1〜4（A〜D）」。記号がア〜の資格は英字で選べないので「1〜4」 */
export const optionKeys = (exam: Pick<ExamMeta, "options">, n: number): string =>
  optionLabels(exam) === "latin" ? `1〜${n}（A〜${optionLabel(exam, n - 1)}）` : `1〜${n}`;

/** このキー入力を、画面のキー操作として扱わないか */
export function ignoreKey(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "target">): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const t = e.target as HTMLElement | null;
  if (!t || !t.tagName) return false;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return true;
  return (e.key === "Enter" || e.key === " ") && /^(BUTTON|A|SUMMARY)$/.test(t.tagName);
}

/** キー操作を受け取る。handler が true を返したら、ブラウザの既定の動き（スクロールなど）を止める */
export function useKeys(handler: (key: string) => boolean | void): void {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      if (handler(e.key)) e.preventDefault();
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  });
}
