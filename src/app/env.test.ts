import { expect, test } from "vitest";
import { APP_ENV, APP_VERSION } from "./env";

test("ビルドの環境変数が無いときは dev / dev-local", () => {
  expect(APP_ENV).toBe("dev");
  expect(APP_VERSION).toBe("dev-local");
});
