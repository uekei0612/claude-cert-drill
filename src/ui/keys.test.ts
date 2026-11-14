import { expect, test } from "vitest";
import { ignoreKey, optionIndex, optionKeys } from "./keys";

test("1〜5 と A〜E（大文字も）が選択肢の位置になる。F は模擬試験の旗なので選択肢にしない", () => {
  expect(["1", "2", "3", "4", "5"].map(optionIndex)).toEqual([0, 1, 2, 3, 4]);
  expect(["a", "B", "c", "D", "e"].map(optionIndex)).toEqual([0, 1, 2, 3, 4]);
  expect(["6", "f", "F", "s", "Enter", "12", ""].map(optionIndex)).toEqual([-1, -1, -1, -1, -1, -1, -1]);
});

test("キー操作の説明は選択肢の数に合わせる", () => {
  expect(optionKeys(4)).toBe("1〜4（A〜D）");
  expect(optionKeys(5)).toBe("1〜5（A〜E）");
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
