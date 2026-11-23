import { expect, test } from "vitest";
import { type Route, href, parseRoute } from "./route";

const routes: Route[] = [
  { name: "picker" },
  { name: "settings" },
  { name: "help" },
  { name: "home", examId: "ccar-f" },
  { name: "practice", examId: "ccar-f" },
  { name: "practice", examId: "ccar-f", only: "1.1" },
  { name: "practice", examId: "ccar-f", only: "d2" },
  { name: "practice", examId: "ccar-f", only: "saved" },
  { name: "practice", examId: "ccar-f", only: "q:s1-01,s4-12" },
  { name: "practice", examId: "ccar-f", start: "resume" },
  { name: "practice", examId: "ccar-f", only: "d2", start: "new" },
  { name: "saved", examId: "ccar-f" },
  { name: "saved", examId: "ccar-f", view: "weak" },
  { name: "saved", examId: "ccar-f", view: "notes" },
  { name: "practice", examId: "ccar-f", only: "weak" },
  { name: "mock", examId: "ccar-f" },
  { name: "mock-result", examId: "ccar-f", at: 1793718460101 },
  { name: "domains", examId: "ccar-f" },
  { name: "domains", examId: "ccar-f", domainId: "d2" },
  { name: "task", examId: "ccar-f", taskId: "5.6" },
  { name: "learn", examId: "ccar-f" },
  { name: "learn", examId: "ccar-f", taskId: "2.3" },
  { name: "learn", examId: "ccar-f", taskId: "2.3", section: 2 },
  { name: "search", examId: "ccar-f" },
  { name: "search", examId: "ccar-f", q: "tool_choice PostToolUse" },
  // 来た画面（#91）
  { name: "practice", examId: "ccar-f", only: "1.1", back: { name: "task", examId: "ccar-f", taskId: "1.1" } },
  { name: "practice", examId: "ccar-f", only: "q:s1-01", back: { name: "mock-result", examId: "ccar-f", at: 17 } },
  { name: "task", examId: "ccar-f", taskId: "1.1", back: { name: "search", examId: "ccar-f", q: "a&b=c?d" } },
  {
    name: "learn",
    examId: "ccar-f",
    taskId: "2.3",
    section: 2,
    back: { name: "saved", examId: "ccar-f", view: "weak" },
  },
  { name: "learn", examId: "ccar-f", taskId: "2.3", back: { name: "home", examId: "ccar-f" } },
];

test.each(routes.map(r => [href(r), r] as const))("%s を往復できる", (h, r) => {
  expect(parseRoute(h)).toEqual(r);
});

test("知らない形は資格のホームか一覧に倒す", () => {
  expect(parseRoute("")).toEqual({ name: "picker" });
  expect(parseRoute("#/ccar-f/unknown")).toEqual({ name: "home", examId: "ccar-f" });
  expect(parseRoute("#/ccar-f/task")).toEqual({ name: "domains", examId: "ccar-f" });
  expect(parseRoute("#/ccar-f/mock/abc")).toEqual({ name: "mock", examId: "ccar-f" });
});

test("壊れた % の並びでも例外にならない", () => {
  expect(() => parseRoute("#/%E0%A4%A")).not.toThrow();
  expect(parseRoute("#/ccar-f/learn/%E0%A4%A")).toEqual({ name: "learn", examId: "ccar-f", taskId: "%E0%A4%A" });
});

test("戻り先の戻り先はたどらず、ほかの資格・資格の外の戻り先は捨てる（#91）", () => {
  const inner = href({ name: "learn", examId: "ccar-f", taskId: "1.1", back: { name: "home", examId: "ccar-f" } });
  const r = parseRoute(`#/ccar-f/practice?only=1.1&back=${encodeURIComponent(inner)}`);
  expect(r).toEqual({
    name: "practice",
    examId: "ccar-f",
    only: "1.1",
    back: { name: "learn", examId: "ccar-f", taskId: "1.1" },
  });
  expect(parseRoute(`#/ccar-f/task/1.1?back=${encodeURIComponent("#/fe-a/domains")}`)).toEqual({
    name: "task",
    examId: "ccar-f",
    taskId: "1.1",
  });
  expect(parseRoute(`#/ccar-f/task/1.1?back=${encodeURIComponent("#/settings")}`)).toEqual({
    name: "task",
    examId: "ccar-f",
    taskId: "1.1",
  });
  expect(parseRoute("#/ccar-f/task/1.1?back=https://example.com")).toEqual({
    name: "task",
    examId: "ccar-f",
    taskId: "1.1",
  });
});
