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
      苦手な問題 "weak"（#87）、メモのある問題 "notes"（#88）、まだ解いていない問題 "new"（#104）、難しい問題 "hard"（#106）、問題を名指し "q:s1-01,s2-03"） */
  /** start は途中の回があるときの始め方（resume＝続きから、new＝捨てて新しく。無ければ画面で選ぶ。#86）。
      back は来た画面（やめる・終えたときの戻り先。#91） */
  | {
      readonly name: "practice";
      readonly examId: string;
      readonly only?: string;
      readonly start?: PracticeStart;
      readonly back?: Route;
    }
  | { readonly name: "mock"; readonly examId: string }
  /** 終えた模擬試験の見直し。at は finishedAt */
  | { readonly name: "mock-result"; readonly examId: string; readonly at: number }
  /** 分野と細目の一覧。domainId があればその分野の位置から見せる */
  | { readonly name: "domains"; readonly examId: string; readonly domainId?: string }
  /** 振り返り。view が無ければ後で振り返る印を付けた問題、weak は苦手な問題（#87）、notes はメモのある問題（#88） */
  | { readonly name: "saved"; readonly examId: string; readonly view?: ReviewView }
  /** 細目の要点と問題。back は来た画面（無ければその細目の分野の位置。#91） */
  | { readonly name: "task"; readonly examId: string; readonly taskId: string; readonly back?: Route }
  /** 教科書。taskId が無ければ目次。section があればその節の位置から見せる。back は来た画面（無ければ目次。#91） */
  | {
      readonly name: "learn";
      readonly examId: string;
      readonly taskId?: string;
      readonly section?: number;
      readonly back?: Route;
    }
  /** 教科書と要点の検索（#41）。q は入れた語 */
  | { readonly name: "search"; readonly examId: string; readonly q?: string };

export type PracticeStart = "resume" | "new";

/** 振り返りの一覧の種類（印のほか） */
export type ReviewView = "weak" | "notes";
const REVIEW_VIEWS: readonly string[] = ["weak", "notes"] satisfies readonly ReviewView[];

/** 戻り先を持てる画面 */
type WithBack = Extract<Route, { back?: Route }>;

/** 戻り先を外した画面（戻り先の URL を入れ子にしないため。戻り先の戻り先はたどらない） */
export function withoutBack(r: Route): Route {
  if (!("back" in r)) return r;
  const { back: _drop, ...rest } = r as WithBack;
  return rest as Route;
}

/** 戻るボタンに出す、その画面の名前（#91） */
export function routeLabel(r: Route): string {
  switch (r.name) {
    case "home":
      return "ホーム";
    case "domains":
      return "分野";
    case "task":
      return "細目";
    case "learn":
      return r.taskId ? "教科書の章" : "目次";
    case "saved":
      return "振り返り";
    case "mock":
      return "模擬試験";
    case "mock-result":
      return "模擬試験の結果";
    case "search":
      return "検索";
    case "practice":
      return "練習";
    case "settings":
      return "設定";
    case "help":
      return "使い方";
    case "picker":
      return "資格一覧";
  }
}

/** 戻り先として持つ形。戻り先の戻り先はたどらない。
    ただし練習は、途中で教科書の章を開いて戻ってきても、やめる・終えたときの戻り先を失わないように、
    自分の戻り先を 1 段だけ持ったままにする（#102） */
export function asBack(r: Route): Route {
  if (r.name === "practice" && r.back) return { ...r, back: withoutBack(r.back) };
  return withoutBack(r);
}

/** URL の back（来た画面）を読む。同じ資格の、戻り先として持つ形（asBack）にそろえる。資格一覧などほかの資格の外は捨てる */
function parseBack(value: string | null, examId: string): Route | undefined {
  if (!value || !value.startsWith("#/")) return undefined;
  const r = asBack(parseRoute(value));
  return "examId" in r && r.examId === examId ? r : undefined;
}

export function parseRoute(hash: string): Route {
  // 問い合わせ部分（back の中にも ? があるので、最初の ? で分ける）
  const body = hash.replace(/^#\/?/, "");
  const cut = body.indexOf("?");
  const [path, query] = cut < 0 ? [body, ""] : [body.slice(0, cut), body.slice(cut + 1)];
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
      const start = q.get("start");
      const back = parseBack(q.get("back"), examId);
      return {
        name: "practice",
        examId,
        ...(only ? { only } : {}),
        ...(start === "resume" || start === "new" ? { start } : {}),
        ...(back ? { back } : {}),
      };
    }
    case "mock":
      if (arg && /^\d+$/.test(arg)) return { name: "mock-result", examId, at: Number(arg) };
      return { name: "mock", examId };
    case "domains":
      return arg ? { name: "domains", examId, domainId: arg } : { name: "domains", examId };
    case "saved":
      return arg && REVIEW_VIEWS.includes(arg)
        ? { name: "saved", examId, view: arg as ReviewView }
        : { name: "saved", examId };
    case "task": {
      if (!arg) return { name: "domains", examId };
      const back = parseBack(q.get("back"), examId);
      return { name: "task", examId, taskId: arg, ...(back ? { back } : {}) };
    }
    case "learn": {
      if (!arg) return { name: "learn", examId };
      const sec = q.get("sec");
      const back = parseBack(q.get("back"), examId);
      return {
        name: "learn",
        examId,
        taskId: arg,
        ...(sec && /^\d+$/.test(sec) ? { section: Number(sec) } : {}),
        ...(back ? { back } : {}),
      };
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
      return `#/${r.examId}/practice${query({ only: r.only, start: r.start, back: backHref(r.back) })}`;
    case "mock":
      return `#/${r.examId}/mock`;
    case "mock-result":
      return `#/${r.examId}/mock/${r.at}`;
    case "domains":
      return `#/${r.examId}/domains${r.domainId ? `/${encodeURIComponent(r.domainId)}` : ""}`;
    case "saved":
      return `#/${r.examId}/saved${r.view ? `/${r.view}` : ""}`;
    case "task":
      return `#/${r.examId}/task/${encodeURIComponent(r.taskId)}${query({ back: backHref(r.back) })}`;
    case "learn":
      if (!r.taskId) return `#/${r.examId}/learn`;
      return `#/${r.examId}/learn/${encodeURIComponent(r.taskId)}${query({ sec: r.section?.toString(), back: backHref(r.back) })}`;
    case "search":
      return `#/${r.examId}/search${r.q ? `?${new URLSearchParams({ q: r.q })}` : ""}`;
  }
}

/** 問い合わせ部分（値の無い項目は入れない） */
function query(items: Record<string, string | undefined>): string {
  const q = new URLSearchParams(Object.entries(items).filter((e): e is [string, string] => !!e[1])).toString();
  return q ? `?${q}` : "";
}

const backHref = (b?: Route): string | undefined => (b ? href(asBack(b)) : undefined);

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
