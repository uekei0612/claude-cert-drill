import { describe, expect, test } from "vitest";
import { exams } from "../exams";
import { buildIndex, normalize, search } from "./search";

const exam = exams.find(e => e.id === "ccar-f")!;
const docs = buildIndex(exam);

describe("検索（#41）", () => {
  test("語を入れると、教科書の節と細目が並ぶ", () => {
    const hits = search(docs, "tool_choice");
    expect(hits.some(h => h.kind === "section")).toBe(true);
    expect(hits.some(h => h.kind === "task")).toBe(true);
    for (const h of hits) expect(normalize(h.snippet)).toContain("tool_choice");
  });
  test("空白で区切った語は、すべて含むものだけ（AND）", () => {
    const one = search(docs, "PostToolUse");
    const both = search(docs, "PostToolUse 正規化");
    expect(one.length).toBeGreaterThan(0);
    expect(both.length).toBeLessThanOrEqual(one.length);
    expect(search(docs, "PostToolUse zzzz-no-such-word")).toEqual([]);
  });
  test("大文字小文字と全角半角は区別しない", () => {
    expect(search(docs, "ＰＯＳＴＴＯＯＬＵＳＥ").length).toBe(search(docs, "posttooluse").length);
  });
  test("空の入力は何も出さない。上限で切る", () => {
    expect(search(docs, "   ")).toEqual([]);
    expect(search(docs, "の", 5)).toHaveLength(5);
  });
  test("問題文・選択肢・解説は探さない（答えが見えるため）", () => {
    // 問題文にしか出てこない語は見つからない
    const q = exam.questions[0]!;
    const all = docs.map(d => d.text).join("\n");
    expect(all).not.toContain(q.stem);
    for (const o of q.options) {
      expect(all).not.toContain(o.text);
      expect(all).not.toContain(o.why);
    }
    // 覚えることは探す
    expect(all).toContain(q.point.replace(/`/g, ""));
  });
  test("見出し・名前に入っているものを先に並べる", () => {
    const hits = search(docs, "MCP");
    const firstBodyOnly = hits.findIndex(h => !normalize(h.title).includes("mcp"));
    const lastTitle = hits.map(h => normalize(h.title).includes("mcp")).lastIndexOf(true);
    if (firstBodyOnly >= 0) expect(lastTitle).toBeLessThan(firstBodyOnly);
  });
});
