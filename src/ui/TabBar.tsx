/* 資格の中の画面の下のタブ。練習・模擬試験の最中は出さない */
import { href, type Route } from "./route";

const TABS = [
  { name: "home", label: "ホーム" },
  { name: "domains", label: "分野" },
  { name: "mock", label: "模擬試験" },
  { name: "settings", label: "設定" },
] as const;

export function TabBar({ examId, current }: { examId: string; current: Route["name"] }) {
  return (
    <nav class="tabbar" aria-label="画面">
      {TABS.map(t => {
        const r: Route = t.name === "settings" ? { name: "settings" } : { name: t.name, examId };
        const active = current === t.name || (t.name === "domains" && current === "task");
        return (
          <a key={t.name} href={href(r)} class={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
