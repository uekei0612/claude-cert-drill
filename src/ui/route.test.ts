import { expect, test } from "vitest";
import { type Route, href, parseRoute } from "./route";

const routes: Route[] = [
  { name: "picker" },
  { name: "settings" },
  { name: "home", examId: "ccar-f" },
  { name: "practice", examId: "ccar-f" },
  { name: "practice", examId: "ccar-f", only: "1.1" },
  { name: "practice", examId: "ccar-f", only: "d2" },
  { name: "practice", examId: "ccar-f", only: "saved" },
  { name: "practice", examId: "ccar-f", only: "q:s1-01,s4-12" },
  { name: "saved", examId: "ccar-f" },
  { name: "mock", examId: "ccar-f" },
  { name: "mock-result", examId: "ccar-f", at: 1793718460101 },
  { name: "domains", examId: "ccar-f" },
  { name: "domains", examId: "ccar-f", domainId: "d2" },
  { name: "task", examId: "ccar-f", taskId: "5.6" },
  { name: "learn", examId: "ccar-f" },
  { name: "learn", examId: "ccar-f", taskId: "2.3" },
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
