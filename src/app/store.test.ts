import { expect, test } from "vitest";
import { BACKUP_KEY, STORAGE_KEY, exportJson, importJson } from "./store";

test("develop・開発の保存先は本番と分ける（控えも）", () => {
  expect(STORAGE_KEY).toBe("claude-cert-drill-dev");
  expect(BACKUP_KEY).toBe("claude-cert-drill-dev:backup");
});

test("書き出した記録には、このアプリの名前が入る（今までに書き出したファイルも読める）", () => {
  expect(JSON.parse(exportJson()).app).toBe("claude-cert-drill");
  expect(() => importJson('{"app":"claude-cert-drill","items":{}}')).not.toThrow();
});
