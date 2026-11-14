/* 見た目（ライト／ダーク）を html の data-theme に当てる。端末に合わせるときは属性を外し、CSS の
   prefers-color-scheme に任せる。起動時は描画の前に当てて、一瞬だけ違う色が出るのを防ぐ */
import type { Theme } from "../core/store/schema";

export const THEME_LABEL: Record<Theme, string> = { system: "端末に合わせる", light: "ライト", dark: "ダーク" };

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
