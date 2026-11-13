/* PC のキー操作（#40）。入力欄にフォーカスがあるとき・修飾キー付きのときは反応しない。
   ボタンやリンクにフォーカスがあるときの Enter は、ブラウザの「押す」に任せる（二重に進まないように） */
import { useEffect } from "preact/hooks";

/** 押したキーが何番目の選択肢か（1〜4 または A〜D）。選択肢でなければ -1 */
export function optionIndex(key: string): number {
  const i = "1234".indexOf(key);
  if (i >= 0 && key.length === 1) return i;
  const j = "abcd".indexOf(key.toLowerCase());
  return j >= 0 && key.length === 1 ? j : -1;
}

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
