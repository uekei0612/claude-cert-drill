/* 画面の切り替えは URL のハッシュで持つ。形は #/<資格ID>/<画面>（命名規則は docs/design.md）。
   ホーム画面版にはブラウザの戻るボタンが無いので、画面の中に戻る操作を置く */
import { useEffect, useState } from "preact/hooks";

export type Route =
  | { readonly name: "picker" }
  | { readonly name: "settings" }
  /** 使い方と用語（#50） */
  | { readonly name: "help" }
  | { readonly name: "home"; readonly examId: string }
  /** only は出題の絞り込み（細目 "1.1"、分野 "d1"、シナリオ "s1"、後で振り返る印を付けた問題 "saved"、
      問題を名指し "q:s1-01,s2-03"） */
  | { readonly name: "practice"; readonly examId: string; readonly only?: string }
  | { readonly name: "mock"; readonly examId: string }
  /** 終えた模擬試験の見直し。at は finishedAt */
  | { readonly name: "mock-result"; readonly examId: string; readonly at: number }
  /** 分野と細目の一覧。domainId があればその分野の位置から見せる */
  | { readonly name: "domains"; readonly examId: string; readonly domainId?: string }
  /** 後で振り返る印を付けた問題の一覧 */
  | { readonly name: "saved"; readonly examId: string }
  | { readonly name: "task"; readonly examId: string; readonly taskId: string }
  /** 教科書。taskId が無ければ目次。section があればその節の位置から見せる */
  | { readonly name: "learn"; readonly examId: string; readonly taskId?: string; readonly section?: number }
  /** 教科書と要点の検索（#41）。q は入れた語 */
  | { readonly name: "search"; readonly examId: string; readonly q?: string };

export function parseRoute(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#\/?/, "").split("?");
  // 壊れた % の並び（#/%E0%A4%A など）で例外にしない。そのままの文字として扱う
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const parts = path.split("/").filter(Boolean).map(decode);
  const q = new URLSearchParams(query);
  const [examId, screen, arg] = parts;
  if (!examId) return { name: "picker" };
  if (examId === "settings") return { name: "settings" };
  if (examId === "help") return { name: "help" };
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
      return arg ? { name: "domains", examId, domainId: arg } : { name: "domains", examId };
    case "saved":
      return { name: "saved", examId };
    case "task":
      return arg ? { name: "task", examId, taskId: arg } : { name: "domains", examId };
    case "learn": {
      if (!arg) return { name: "learn", examId };
      const sec = q.get("sec");
      return sec && /^\d+$/.test(sec)
        ? { name: "learn", examId, taskId: arg, section: Number(sec) }
        : { name: "learn", examId, taskId: arg };
    }
    case "search": {
      const text = q.get("q");
      return text ? { name: "search", examId, q: text } : { name: "search", examId };
    }
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
    case "help":
      return "#/help";
    case "home":
      return `#/${r.examId}`;
    case "practice":
      return `#/${r.examId}/practice${r.only ? `?${new URLSearchParams({ only: r.only })}` : ""}`;
    case "mock":
      return `#/${r.examId}/mock`;
    case "mock-result":
      return `#/${r.examId}/mock/${r.at}`;
    case "domains":
      return `#/${r.examId}/domains${r.domainId ? `/${encodeURIComponent(r.domainId)}` : ""}`;
    case "saved":
      return `#/${r.examId}/saved`;
    case "task":
      return `#/${r.examId}/task/${encodeURIComponent(r.taskId)}`;
    case "learn":
      return `#/${r.examId}/learn${r.taskId ? `/${encodeURIComponent(r.taskId)}` : ""}${r.taskId && r.section !== undefined ? `?sec=${r.section}` : ""}`;
    case "search":
      return `#/${r.examId}/search${r.q ? `?${new URLSearchParams({ q: r.q })}` : ""}`;
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
