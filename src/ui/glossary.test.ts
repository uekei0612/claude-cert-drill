import { expect, test } from "vitest";
import { ccarF as exam } from "../exams/ccar-f/exam";
import { STEPS, TERMS } from "./glossary";

test("用語の定義は、資格があってもなくても組める（undefined や空が出ない）", () => {
  for (const t of TERMS)
    for (const e of [exam, undefined]) {
      const d = t.def(e);
      expect(d.length).toBeGreaterThan(10);
      expect(d).not.toMatch(/undefined|NaN/);
    }
  expect(new Set(TERMS.map(t => t.id)).size).toBe(TERMS.length);
  expect(STEPS.length).toBeGreaterThanOrEqual(3);
});

test("定義は今の基準と合っている（#27・#28・#32）", () => {
  const def = (id: string) => TERMS.find(t => t.id === id)!.def(exam);
  expect(def("known")).toContain("日をあけて 2 回続けて正解");
  expect(def("readiness")).toContain(`${Math.round(exam.format.target * 100)}%`);
  expect(def("guess")).toContain("翌日もう一度出します");
  expect(def("gain")).toContain("全部覚えたときに");
});

test("分野の数・細目の例は資格から作る（#53）", () => {
  const def = (id: string) => TERMS.find(t => t.id === id)!.def(exam);
  expect(def("domain")).toContain(`D1〜D${exam.domains.length}`);
  expect(def("task")).toContain(`例：${exam.domains[0]!.tasks[0]!.id}`);
});
