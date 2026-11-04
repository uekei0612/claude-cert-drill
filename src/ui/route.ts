/* 画面の切り替えは URL のハッシュで持つ。形は #/<資格ID>/<画面>（命名規則は docs/design.md）。
   ホーム画面版にはブラウザの戻るボタンが無いので、画面の中に戻る操作を置く */
import { useEffect, useState } from "preact/hooks";

export type Route =
  | { readonly name: "picker" }
  | { readonly name: "settings" }
  | { readonly name: "home"; readonly examId: string }
  /** only は出題の絞り込み（細目 "1.1"、分野 "d1"、シナリオ "s1"） */
  | { readonly name: "practice"; readonly examId: string; readonly only?: string }
  | { readonly name: "mock"; readonly examId: string }
  /** 終えた模擬試験の見直し。at は finishedAt */
  | { readonly name: "mock-result"; readonly examId: string; readonly at: number }
  | { readonly name: "domains"; readonly examId: string }
  | { readonly name: "task"; readonly examId: string; readonly taskId: string }
  /** 教科書。taskId が無ければ目次 */
  | { readonly name: "learn"; readonly examId: string; readonly taskId?: string };

export function parseRoute(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(query);
  const [examId, screen, arg] = parts;
  if (!examId) return { name: "picker" };
  if (examId === "settings") return { name: "settings" };
  switch (screen) {
    case undefined:
      return { name: "home", examId };
    case "practice": {
      const only = q.get("only");
      return only ? { name: "practice", examId, only } : { name: "practice", examId };
    }
    case "mock":
      if (arg && /^\d+$/.test(arg)) return { name: "mock-result", examId, at: Number(arg) };
      return { name: "mock", examId };
    case "domains":
      return { name: "domains", examId };
    case "task":
      return arg ? { name: "task", examId, taskId: arg } : { name: "domains", examId };
    case "learn":
      return arg ? { name: "learn", examId, taskId: arg } : { name: "learn", examId };
    default:
      return { name: "home", examId };
  }
}

export function href(r: Route): string {
  switch (r.name) {
    case "picker":
      return "#/";
    case "settings":
      return "#/settings";
    case "home":
      return `#/${r.examId}`;
    case "practice":
      return `#/${r.examId}/practice${r.only ? `?${new URLSearchParams({ only: r.only })}` : ""}`;
    case "mock":
      return `#/${r.examId}/mock`;
    case "mock-result":
      return `#/${r.examId}/mock/${r.at}`;
    case "domains":
      return `#/${r.examId}/domains`;
    case "task":
      return `#/${r.examId}/task/${encodeURIComponent(r.taskId)}`;
    case "learn":
      return `#/${r.examId}/learn${r.taskId ? `/${encodeURIComponent(r.taskId)}` : ""}`;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(location.hash));
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

/** 画面を移る（ホーム画面版では履歴に積まない。下の keepHistoryFlat と同じ理由） */
export function go(r: Route, standalone = isStandalone()): void {
  const to = href(r);
  if (to === location.hash) return;
  if (standalone) location.replace(to);
  else location.hash = to;
}

/** ホーム画面アプリとして開いているか（iPhone は navigator.standalone、ほかは display-mode） */
export const isStandalone = (): boolean =>
  (navigator as { standalone?: boolean }).standalone === true ||
  (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches);

/** ホーム画面アプリでは、アプリの中のリンク（#/…）での移動を履歴に積まない（location.replace）。
    iPhone の端からの横スワイプは履歴を戻る・進むので、積まなければスワイプで画面が変わらない */
export function keepHistoryFlat(standalone = isStandalone()): void {
  if (!standalone) return;
  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest("a") : null;
    const to = a?.getAttribute("href");
    if (!a || !to?.startsWith("#") || a.target) return;
    e.preventDefault();
    if (to !== location.hash) location.replace(to);
  });
}
