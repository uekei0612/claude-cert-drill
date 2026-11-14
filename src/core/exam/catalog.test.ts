import { expect, test } from "vitest";
import { fixture } from "../engine/fixture";
import { createCatalog } from "./catalog";

const meta = {
  id: fixture.id,
  code: fixture.code,
  title: fixture.title,
  summary: fixture.summary,
  notice: fixture.notice,
  format: fixture.format,
};

test("一覧の情報はすぐ使え、中身は読み込んでから（2 回目は読み込み直さない）", async () => {
  let calls = 0;
  const c = createCatalog([{ meta, load: async () => (calls++, fixture) }]);
  expect(c.list.map(m => m.id)).toEqual(["test-x"]);
  expect(c.find("test-x")?.code).toBe("TEST-X");
  expect(c.peek("test-x")).toBeUndefined();
  const [a, b] = await Promise.all([c.load("test-x"), c.load("test-x")]);
  expect(a).toBe(fixture);
  expect(b).toBe(fixture);
  expect(await c.load("test-x")).toBe(fixture);
  expect(c.peek("test-x")).toBe(fixture);
  expect(calls).toBe(1);
  expect(await c.load("nope")).toBeUndefined();
});

test("読み込みに失敗したら例外。次に呼んだときは読み直す", async () => {
  let fail = true;
  const c = createCatalog([
    {
      meta,
      load: async () => {
        if (fail) throw new Error("offline");
        return fixture;
      },
    },
  ]);
  await expect(c.load("test-x")).rejects.toThrow("offline");
  fail = false;
  expect(await c.load("test-x")).toBe(fixture);
});

test("中身の ID が一覧と違えば失敗にする。一覧の ID が重なれば作らない", async () => {
  const c = createCatalog([{ meta: { ...meta, id: "other" }, load: async () => fixture }]);
  await expect(c.load("other")).rejects.toThrow(/違う/);
  expect(() =>
    createCatalog([
      { meta, load: async () => fixture },
      { meta, load: async () => fixture },
    ]),
  ).toThrow();
});
