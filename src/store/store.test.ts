import { beforeEach, describe, expect, test } from "vitest";
import { fixture } from "../engine/fixture";
import { planMock, scoreMock } from "../engine/mock";
import { seeded } from "../engine/rng";
import { abandonMock, answer, finishMock, resetExam, startMock } from "./actions";
import { emptyData, parseData } from "./schema";
import { STORAGE_KEY, exportJson, getData, importJson, reloadForTest, setData } from "./store";

const NOW = Date.UTC(2026, 10, 4);

describe("parseData", () => {
  test("壊れた値は 1 つずつ捨て、残りは読む", () => {
    const d = parseData({
      version: 1,
      settings: { practiceSize: 7, lastExam: "ccar-f" },
      items: {
        "ccar-f:s1-01": { ease: 2.3, interval: 1, due: NOW, tries: 1, correct: 1, last: NOW },
        "ccar-f:s1-02": { ease: "x" },
        "bad key": { ease: 2.3, interval: 1, due: NOW, tries: 1, correct: 1 },
        "ccar-f:s1-03": { ease: 2.3, interval: 1, due: NOW, tries: 1, correct: 2 },
      },
      mocks: {
        "ccar-f": [{ finishedAt: 1, correct: 1, total: 2, weighted: 0.5, scenarioIds: ["s1"], byDomain: {} }, 3],
      },
    });
    expect(Object.keys(d.items)).toEqual(["ccar-f:s1-01"]);
    expect(d.settings).toEqual({ practiceSize: 10, lastExam: "ccar-f" });
    expect(d.mocks["ccar-f"]).toHaveLength(1);
  });
  test("記録でないものは空の記録", () => {
    expect(parseData(null)).toEqual(emptyData());
    expect(parseData([1, 2])).toEqual(emptyData());
  });
  test("途中の模擬試験：選択肢の順番が 0〜3 の並べ替えでなければ捨てる", () => {
    const d = parseData({
      activeMock: {
        examId: "ccar-f",
        questionIds: ["s1-01", "s1-02"],
        scenarioIds: ["s1"],
        startedAt: NOW,
        limitMs: 1000,
        answers: { "s1-01": 2, "s1-02": 9 },
        flags: [],
        orders: { "s1-01": [3, 2, 1, 0], "s1-02": [0, 0, 1, 2] },
        cursor: 5,
      },
    });
    expect(d.activeMock?.answers).toEqual({ "s1-01": 2 });
    expect(Object.keys(d.activeMock!.orders)).toEqual(["s1-01"]);
    expect(d.activeMock?.cursor).toBe(1);
  });
});

describe("store", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadForTest();
  });
  test("develop・開発の保存先は本番と分ける", () => {
    expect(STORAGE_KEY).toBe("claude-cert-drill-dev");
  });
  test("保存して読み直せる", () => {
    setData(answer(getData(), "ccar-f", "s1-01", true, NOW));
    reloadForTest();
    expect(getData().items["ccar-f:s1-01"]?.interval).toBe(1);
  });
  test("書き出し → 取り込み で同じ記録になる。別のアプリの JSON は断る", () => {
    const d = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    expect(importJson(exportJson(d))).toEqual(d);
    expect(() => importJson('{"items":{}}')).toThrow();
    expect(() => importJson("not json")).toThrow();
  });
});

describe("模擬試験の記録", () => {
  test("終えると結果が残り、出した問題に正誤が付き、途中の記録は消える", () => {
    const p = planMock(fixture, seeded(1));
    const answers = { [p.questionIds[0]!]: 0 }; // 1 問だけ正解（正解はすべて 0）
    let d = startMock(emptyData(), {
      examId: fixture.id,
      questionIds: p.questionIds,
      scenarioIds: p.scenarioIds,
      startedAt: NOW,
      limitMs: p.limitMs,
      answers,
      flags: [],
      orders: {},
      cursor: 0,
    });
    d = finishMock(d, scoreMock(fixture, p.questionIds, answers), NOW);
    expect(d.activeMock).toBeUndefined();
    expect(d.mocks[fixture.id]?.[0]?.correct).toBe(1);
    expect(d.items[`${fixture.id}:${p.questionIds[0]}`]?.interval).toBe(1);
    expect(d.items[`${fixture.id}:${p.questionIds[1]}`]?.interval).toBe(0);
  });
  test("資格ごとに消せる。やめると途中の記録だけ消える", () => {
    let d = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    d = answer(d, "ccar-p", "s1-01", true, NOW);
    expect(Object.keys(resetExam(d, "ccar-f").items)).toEqual(["ccar-p:s1-01"]);
    const m = startMock(d, {
      examId: "ccar-f",
      questionIds: [],
      scenarioIds: [],
      startedAt: 0,
      limitMs: 0,
      answers: {},
      flags: [],
      orders: {},
      cursor: 0,
    });
    expect(abandonMock(m)).toEqual(d);
  });
});
