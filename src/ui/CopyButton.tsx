/* 文をクリップボードに写すボタン。押したときに文を組む（描くたびに組まない）。
   Clipboard API は安全な接続（https・localhost）でしか使えない。dev は http で開くので、
   そのときは画面外の textarea を選んで execCommand("copy") に落とす */
import { useEffect, useState } from "preact/hooks";

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 下の方法を試す
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  // iOS は readonly でないと選択時にキーボードが出る。画面外に置いてスクロールさせない
  ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px";
  document.body.appendChild(ta);
  try {
    ta.select();
    ta.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    ta.remove();
  }
}

export function CopyButton({
  text,
  label,
  done = "コピーしました",
}: {
  text: () => string;
  label: string;
  done?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "ng">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <button
      type="button"
      class={`btn ghost small copy ${state}`}
      onClick={async () => setState((await copyToClipboard(text())) ? "ok" : "ng")}
    >
      <span aria-live="polite">{state === "ok" ? `✓ ${done}` : state === "ng" ? "コピーできませんでした" : label}</span>
    </button>
  );
}
