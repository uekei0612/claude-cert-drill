import { expect, test } from "vitest";
import { fixture, jaFixture } from "../core/engine/fixture";
import { ignoreKey, optionIndex, optionKeys } from "./keys";

const latin = (k: string) => optionIndex(k, fixture);
const kana = (k: string) => optionIndex(k, jaFixture);

test("1〜5 と A〜E（大文字も）が選択肢の位置になる。F は模擬試験の旗なので選択肢にしない", () => {
  expect(["1", "2", "3", "4", "5"].map(latin)).toEqual([0, 1, 2, 3, 4]);
  expect(["a", "B", "c", "D", "e"].map(latin)).toEqual([0, 1, 2, 3, 4]);
  expect(["6", "f", "F", "s", "Enter", "12", ""].map(latin)).toEqual([-1, -1, -1, -1, -1, -1, -1]);
});

test("記号がア〜の資格は数字だけで選ぶ（#58）", () => {
  expect(["1", "2", "3", "4"].map(kana)).toEqual([0, 1, 2, 3]);
  expect(["a", "b", "ア"].map(kana)).toEqual([-1, -1, -1]);
});

test("キー操作の説明は選択肢の数と記号に合わせる", () => {
  expect(optionKeys(fixture, 4)).toBe("1〜4（A〜D）");
  expect(optionKeys(fixture, 5)).toBe("1〜5（A〜E）");
  expect(optionKeys(jaFixture, 4)).toBe("1〜4");
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
