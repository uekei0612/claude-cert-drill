import { expect, test } from "vitest";
import { applyTheme } from "./theme";

test("ライト・ダークは data-theme に入れ、端末に合わせるときは外す", () => {
  const el = document.createElement("html");
  applyTheme("dark", el);
  expect(el.getAttribute("data-theme")).toBe("dark");
  applyTheme("light", el);
  expect(el.getAttribute("data-theme")).toBe("light");
  applyTheme("system", el);
  expect(el.hasAttribute("data-theme")).toBe(false);
});
