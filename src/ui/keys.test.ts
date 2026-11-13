import { expect, test } from "vitest";
import { ignoreKey, optionIndex } from "./keys";

test("1〜4 と A〜D（大文字も）が選択肢の位置になる", () => {
  expect(["1", "2", "3", "4"].map(optionIndex)).toEqual([0, 1, 2, 3]);
  expect(["a", "B", "c", "D"].map(optionIndex)).toEqual([0, 1, 2, 3]);
  expect(["5", "e", "Enter", "12", ""].map(optionIndex)).toEqual([-1, -1, -1, -1, -1]);
});

test("入力欄・修飾キー・ボタンの上の Enter では反応しない", () => {
  const el = (tagName: string) => ({ tagName, isContentEditable: false }) as unknown as EventTarget;
  const k = (key: string, target: EventTarget | null, mod = {}) =>
    ignoreKey({ key, target, metaKey: false, ctrlKey: false, altKey: false, ...mod });
  expect(k("1", el("INPUT"))).toBe(true);
  expect(k("1", el("TEXTAREA"))).toBe(true);
  expect(k("1", el("BODY"))).toBe(false);
  expect(k("c", el("BODY"), { metaKey: true })).toBe(true);
  expect(k("Enter", el("BUTTON"))).toBe(true);
  expect(k("1", el("BUTTON"))).toBe(false);
  expect(k("Enter", el("BODY"))).toBe(false);
});
