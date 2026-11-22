/* 記録をファイルに書き出す。設定の「記録を移す」と、ホームの書き出しの案内（#89）の両方で使う。
   書き出したら、その時刻を記録に残す（しばらく書き出していないときに案内を出すため） */
import { APP } from "../app/config";
import { exportJson, update } from "../app/store";
import { markExported } from "../core/store/actions";

export function downloadRecord(): void {
  const blob = new Blob([exportJson()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${APP.id}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  update(d => markExported(d, Date.now()));
}
