/* 資格の中の画面の下のタブ。練習・模擬試験の最中は出さない。
   よく使う振り返りをタブに置き、使う回数の少ない設定と資格一覧はホームの右上に置く（#30） */
import { href, type Route } from "./route";

const TABS = [
  { name: "home", label: "ホーム" },
  { name: "learn", label: "教科書" },
  { name: "domains", label: "分野" },
  { name: "mock", label: "模擬試験" },
  { name: "saved", label: "振り返り" },
] as const;

export function TabBar({ examId, current }: { examId: string; current: Route["name"] }) {
  return (
    <nav class="tabbar" aria-label="画面">
      {TABS.map(t => {
        const r: Route = { name: t.name, examId };
        const active =
          current === t.name ||
          (t.name === "domains" && current === "task") ||
          (t.name === "mock" && current === "mock-result");
        return (
          <a key={t.name} href={href(r)} class={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
