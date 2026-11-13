/* 文をクリップボードに写すボタン。押したときに文を組む（描くたびに組まない）。
   写せなかったときは、文を選べる欄に出して手で写せるようにする（行き止まりにしない。#49）。
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
  cls = "",
}: {
  text: () => string;
  label: string;
  done?: string;
  /** ボタンに足す class */
  cls?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "ng">("idle");
  // 写せなかった文（手で写すための欄に出す）
  const [manual, setManual] = useState<string | undefined>();
  useEffect(() => {
    if (state !== "ok") return;
    const t = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <>
      <button
        type="button"
        class={`btn ghost small copy ${cls} ${state}`}
        onClick={async () => {
          const t = text();
          const ok = await copyToClipboard(t);
          setState(ok ? "ok" : "ng");
          setManual(ok ? undefined : t);
        }}
      >
        <span aria-live="polite">
          {state === "ok" ? `✓ ${done}` : state === "ng" ? "コピーできませんでした" : label}
        </span>
      </button>
      {manual !== undefined && <ManualCopy text={manual} />}
    </>
  );
}

/** 写せなかったときに、文を全部選んだ状態の欄に出す（長押し・Ctrl+C で手で写せる） */
export function ManualCopy({ text }: { text: string }) {
  return (
    <div class="manual-copy">
      <p class="small">自動で写せませんでした。下の欄の文を選んで、手でコピーしてください。</p>
      <textarea
        readOnly
        rows={6}
        value={text}
        ref={el => el?.select()}
        onFocus={e => e.currentTarget.select()}
        aria-label="コピーする文"
      />
    </div>
  );
}
