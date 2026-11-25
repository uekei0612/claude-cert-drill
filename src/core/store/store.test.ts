import { beforeEach, describe, expect, test } from "vitest";
import { fixture } from "../engine/fixture";
import { planMock, scoreMock } from "../engine/mock";
import { seeded } from "../engine/rng";
import {
  abandonMock,
  clearPractice,
  practiceOf,
  savePractice,
  answer,
  finishMock,
  markGuess,
  readChapters,
  resetExam,
  daysOf,
  logDay,
  savedIds,
  setExamDate,
  setExamSettings,
  setSettings,
  langOf,
  practiceSizeOf,
  setRead,
  startMock,
  toggleSaved,
  undoAnswer,
  weakIds,
  noteIds,
  noteOf,
  setNote,
  EXPORT_NUDGE_DAYS,
  exportNudge,
  markExported,
  snoozeExportNudge,
} from "./actions";
import { MAX_NOTE, emptyData, parseData } from "./schema";
import { createStore } from "./store";

const store = createStore({ key: "test-store", app: "test-app", storage: () => localStorage });
const { exportJson, getBackup, getData, importJson, replaceData, restoreBackup, setData } = store;
const reloadForTest = store.reload;
const BACKUP_KEY = store.backupKey;

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
    expect(d.settings).toEqual({ practiceSize: 10, lang: "en", theme: "system", lastExam: "ccar-f" });
    expect(d.mocks["ccar-f"]).toHaveLength(1);
  });
  test("はじめての方へを閉じたことを残す（true のときだけ）", () => {
    expect(parseData({ settings: { introDone: true } }).settings.introDone).toBe(true);
    expect(parseData({ settings: { introDone: "yes" } }).settings.introDone).toBeUndefined();
  });
  test("見た目：知らない値は端末に合わせるに戻す", () => {
    expect(parseData({ settings: { theme: "dark" } }).settings.theme).toBe("dark");
    expect(parseData({ settings: { theme: "sepia" } }).settings.theme).toBe("system");
  });
  test("記録でないものは空の記録", () => {
    expect(parseData(null)).toEqual(emptyData());
    expect(parseData([1, 2])).toEqual(emptyData());
  });
  test("途中の模擬試験：選択肢の順番が 0〜n−1 の並べ替えでなければ捨てる", () => {
    const d = parseData({
      activeMock: {
        examId: "ccar-f",
        questionIds: ["s1-01", "s1-02"],
        scenarioIds: ["s1"],
        startedAt: NOW,
        limitMs: 1000,
        answers: { "s1-01": 2, "s1-02": 10, "s1-03": 9 },
        flags: [],
        orders: {
          "s1-01": [3, 2, 1, 0],
          "s1-02": [0, 0, 1, 2],
          "s1-03": [4, 0, 3, 1, 2],
          "s1-04": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          "s1-05": [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        },
        cursor: 5,
      },
    });
    // 10 択まで読む（#54・#59）。11 個以上の並びと、範囲の外の答えは捨てる
    expect(d.activeMock?.answers).toEqual({ "s1-01": 2, "s1-03": 9 });
    expect(Object.keys(d.activeMock!.orders)).toEqual(["s1-01", "s1-03", "s1-05"]);
    expect(d.activeMock?.cursor).toBe(1);
  });
  test("途中の模擬試験：使った時間を持たない記録（#42 より前）は、時間を使っていない扱い", () => {
    const base = {
      examId: "ccar-f",
      questionIds: ["s1-01"],
      scenarioIds: ["s1"],
      startedAt: NOW,
      limitMs: 1000,
      answers: {},
      flags: [],
      orders: {},
      cursor: 0,
    };
    expect(parseData({ activeMock: base }).activeMock?.usedMs).toBe(0);
    expect(parseData({ activeMock: { ...base, usedMs: 300 } }).activeMock?.usedMs).toBe(300);
    expect(parseData({ activeMock: { ...base, usedMs: -5 } }).activeMock?.usedMs).toBe(0);
    expect(parseData({ activeMock: { ...base, usedMs: 9999 } }).activeMock?.usedMs).toBe(1000);
  });
});

describe("store", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadForTest();
  });
  test("控えのキーは保存のキーの後ろに :backup", () => {
    expect(BACKUP_KEY).toBe("test-store:backup");
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
    // 読めないときは、ブラウザの英語のエラーではなく日本語で理由と次にすることを出す（#49）
    expect(() => importJson("not json")).toThrow(/記録の形式ではありません/);
    expect(() => importJson('{"items":{}}')).toThrow(/このアプリ（test-app）で書き出した記録ではありません/);
  });
});

describe("練習の答えの取り消し", () => {
  test("答えたあとに取り消すと、記録（間隔・ease・回数）が答える前と同じに戻る", () => {
    const k = "ccar-f:s1-01";
    // 2 回正解して間隔が伸びている問題を、押し間違えて誤答にした
    let d = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    d = answer(d, "ccar-f", "s1-01", true, NOW + 864e5);
    const before = d;
    const prev = d.items[k];
    const after = answer(d, "ccar-f", "s1-01", false, NOW + 2 * 864e5);
    expect(after.items[k]).not.toEqual(prev);
    expect(undoAnswer(after, "ccar-f", "s1-01", prev, NOW + 2 * 864e5, false)).toEqual(before);
  });
  test("正解に勘だったを付けると勘の記録に、外すとふつうの正解に戻る（#27）", () => {
    const k = "ccar-f:s1-01";
    const d0 = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    const prev = d0.items[k];
    const ok = answer(d0, "ccar-f", "s1-01", true, NOW + 864e5);
    const guessed = markGuess(ok, "ccar-f", "s1-01", prev, true, NOW + 864e5);
    expect(guessed.items[k]?.interval).toBe(0);
    expect(markGuess(guessed, "ccar-f", "s1-01", prev, false, NOW + 864e5)).toEqual(ok);
  });
  test("初めて答えた問題を取り消すと、記録が無い状態に戻る", () => {
    const d = answer(emptyData(), "ccar-f", "s1-01", false, NOW);
    const back = undoAnswer(d, "ccar-f", "s1-01", undefined, NOW, false);
    expect(back).toEqual(emptyData());
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
      usedMs: 0,
      answers,
      flags: [],
      orders: {},
      cursor: 0,
    });
    d = finishMock(d, scoreMock(fixture, p.questionIds, answers), NOW);
    expect(d.activeMock).toBeUndefined();
    expect(d.mocks[fixture.id]?.[0]?.correct).toBe(1);
    expect(d.mocks[fixture.id]?.[0]?.questionIds).toEqual(p.questionIds);
    expect(parseData(JSON.parse(JSON.stringify(d))).mocks[fixture.id]?.[0]?.answers).toEqual(answers);
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
      usedMs: 0,
      answers: {},
      flags: [],
      orders: {},
      cursor: 0,
    });
    expect(abandonMock(m)).toEqual(d);
  });
});

describe("後で振り返る印", () => {
  test("付ける・外す。新しく付けた順に並び、資格ごとに分かれる", () => {
    let d = toggleSaved(emptyData(), "ccar-f", "s1-01", 1);
    d = toggleSaved(d, "ccar-f", "s2-03", 2);
    d = toggleSaved(d, "ccar-p", "s1-01", 3);
    expect(savedIds(d, "ccar-f")).toEqual(["s2-03", "s1-01"]);
    d = toggleSaved(d, "ccar-f", "s2-03", 4);
    expect(savedIds(d, "ccar-f")).toEqual(["s1-01"]);
    expect(savedIds(d, "ccar-p")).toEqual(["s1-01"]);
  });
  test("記録に残り、壊れた値は捨てる。資格の記録を消すと一緒に消える", () => {
    const d = toggleSaved(toggleSaved(emptyData(), "ccar-f", "s1-01", 5), "ccar-p", "s1-02", 6);
    const back = parseData({ ...JSON.parse(JSON.stringify(d)), saved: { ...d.saved, "bad key": 1, "ccar-f:x": "1" } });
    expect(back.saved).toEqual(d.saved);
    expect(savedIds(resetExam(d, "ccar-f"), "ccar-f")).toEqual([]);
    expect(savedIds(resetExam(d, "ccar-f"), "ccar-p")).toEqual(["s1-02"]);
    expect(parseData(emptyData()).saved).toBeUndefined();
  });
});

describe("苦手（#87）", () => {
  /** 覚えかけにしてから間違える、を n 回 */
  const forget = (d0: ReturnType<typeof emptyData>, id: string, n: number, t0: number) => {
    let d = d0;
    for (let i = 0; i < n; i++) {
      d = answer(d, "test-x", id, true, t0 + 2 * i * 864e5);
      d = answer(d, "test-x", id, false, t0 + (2 * i + 1) * 864e5);
    }
    return d;
  };
  test("忘れた回数の多い順に並べ、2 回未満と今の問題に無い ID は出さない", () => {
    let d = forget(emptyData(), "s1-01", 2, NOW);
    d = forget(d, "s2-03", 3, NOW);
    d = forget(d, "s3-01", 1, NOW);
    d = forget(d, "gone-01", 4, NOW);
    expect(weakIds(d, fixture)).toEqual(["s2-03", "s1-01"]);
  });
  test("忘れた回数は記録に残り、壊れた値（誤答の数を超える・負・小数）は捨てる", () => {
    const d = forget(emptyData(), "s1-01", 2, NOW);
    const s = d.items["test-x:s1-01"]!;
    expect(s.lapses).toBe(2);
    expect(parseData(JSON.parse(JSON.stringify(d))).items["test-x:s1-01"]).toEqual(s);
    for (const lapses of [3, -1, 1.5, "2"])
      expect(parseData({ items: { "test-x:s1-01": { ...s, lapses } } }).items["test-x:s1-01"]?.lapses).toBeUndefined();
  });
  test("取り消すと忘れた回数も戻る", () => {
    const d = answer(emptyData(), "test-x", "s1-01", true, NOW);
    const prev = d.items["test-x:s1-01"];
    const ng = answer(d, "test-x", "s1-01", false, NOW + 864e5);
    expect(ng.items["test-x:s1-01"]?.lapses).toBe(1);
    expect(undoAnswer(ng, "test-x", "s1-01", prev, NOW + 864e5, false).items["test-x:s1-01"]).toEqual(prev);
  });
});

describe("問題のメモ（#88）", () => {
  test("書く・直す・空で消す。前後の空白は除き、新しく書いた順に並ぶ", () => {
    let d = setNote(emptyData(), "ccar-f", "s1-01", "  temperature と取り違えた\n", 1);
    d = setNote(d, "ccar-f", "s2-03", "選択肢 C の言い回し", 2);
    expect(noteOf(d, "ccar-f", "s1-01")).toEqual({ text: "temperature と取り違えた", at: 1 });
    expect(noteIds(d, "ccar-f")).toEqual(["s2-03", "s1-01"]);
    d = setNote(d, "ccar-f", "s1-01", "直した", 3);
    expect(noteIds(d, "ccar-f")).toEqual(["s1-01", "s2-03"]);
    d = setNote(setNote(d, "ccar-f", "s1-01", " ", 4), "ccar-f", "s2-03", "", 5);
    expect(d).toEqual(emptyData());
  });
  test("長すぎるメモは切る。記録に残り、壊れた値は捨てる。資格の記録を消すと一緒に消える", () => {
    const d = setNote(setNote(emptyData(), "ccar-f", "s1-01", "x".repeat(MAX_NOTE + 5), 1), "fe-a", "d1-01", "a", 2);
    expect(noteOf(d, "ccar-f", "s1-01")?.text.length).toBe(MAX_NOTE);
    const raw = JSON.parse(JSON.stringify(d));
    const back = parseData({
      ...raw,
      notes: { ...raw.notes, "bad key": { text: "a", at: 1 }, "ccar-f:x": { text: " ", at: 1 }, "ccar-f:y": "a" },
    });
    expect(back.notes).toEqual(d.notes);
    expect(noteIds(resetExam(d, "ccar-f"), "ccar-f")).toEqual([]);
    expect(noteIds(resetExam(d, "ccar-f"), "fe-a")).toEqual(["d1-01"]);
  });
});

describe("書き出しの案内（#89）", () => {
  const DAY = 864e5;
  const W = EXPORT_NUDGE_DAYS * DAY;
  test("答えていなければ出さない。最初に答えてから 14 日で、まだ書き出していないと出す", () => {
    expect(exportNudge(emptyData(), NOW)).toBeUndefined();
    const d = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    expect(exportNudge(d, NOW + W - DAY)).toBeUndefined();
    expect(exportNudge(d, NOW + W + DAY)).toEqual({ days: EXPORT_NUDGE_DAYS + 1, never: true });
  });
  test("書き出したあとに答えていなければ出さない。答えていれば、書き出してから 14 日で出す", () => {
    const d = markExported(answer(emptyData(), "ccar-f", "s1-01", true, NOW), NOW + DAY);
    expect(exportNudge(d, NOW + 100 * DAY)).toBeUndefined();
    const later = answer(d, "ccar-f", "s1-02", true, NOW + 2 * DAY);
    expect(exportNudge(later, NOW + DAY + W - 1)).toBeUndefined();
    expect(exportNudge(later, NOW + DAY + W)).toEqual({ days: EXPORT_NUDGE_DAYS, never: false });
  });
  test("「あとで」から 14 日は出さない。時刻は記録に残る", () => {
    const d = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    const s = snoozeExportNudge(d, NOW + W);
    expect(exportNudge(s, NOW + 2 * W - 1)).toBeUndefined();
    expect(exportNudge(s, NOW + 2 * W)).toBeDefined();
    const back = parseData(JSON.parse(JSON.stringify(markExported(s, NOW + 3 * W))));
    expect([back.exportedAt, back.exportNudgeSnoozedAt]).toEqual([NOW + 3 * W, NOW + W]);
    expect(parseData({ exportedAt: "x" }).exportedAt).toBeUndefined();
  });
});

describe("教科書の読んだ章（#29）", () => {
  test("付ける・外す。資格ごとに分かれる", () => {
    let d = setRead(emptyData(), "ccar-f", "1.1", true, 5);
    d = setRead(d, "ccar-f", "intro", true, 6);
    d = setRead(d, "ccar-p", "1.1", true, 7);
    expect([...readChapters(d, "ccar-f")].sort()).toEqual(["1.1", "intro"]);
    d = setRead(d, "ccar-f", "1.1", false, 8);
    expect([...readChapters(d, "ccar-f")]).toEqual(["intro"]);
    expect([...readChapters(d, "ccar-p")]).toEqual(["1.1"]);
  });
  test("記録に残り（書き出し・読み込みにも入る）、壊れた値は捨てる。資格の記録を消すと一緒に消える", () => {
    const d = setRead(setRead(emptyData(), "ccar-f", "2.3", true, 5), "ccar-p", "intro", true, 6);
    const back = parseData({ ...JSON.parse(JSON.stringify(d)), read: { ...d.read, "bad key": 1, "ccar-f:3.1": "x" } });
    expect(back.read).toEqual(d.read);
    expect(importJson(exportJson(d)).read).toEqual(d.read);
    expect([...readChapters(resetExam(d, "ccar-f"), "ccar-f")]).toEqual([]);
    expect([...readChapters(resetExam(d, "ccar-f"), "ccar-p")]).toEqual(["intro"]);
    expect(parseData(emptyData()).read).toBeUndefined();
  });
});

describe("試験日（#37）", () => {
  test("資格ごとに決め・消せる。記録に残り、壊れた値は捨てる", () => {
    let d = setExamDate(emptyData(), "ccar-f", "2026-12-01");
    d = setExamDate(d, "ccar-p", "2027-01-15");
    expect(d.settings.examDates).toEqual({ "ccar-f": "2026-12-01", "ccar-p": "2027-01-15" });
    const back = parseData({
      ...JSON.parse(JSON.stringify(d)),
      settings: { ...d.settings, examDates: { ...d.settings.examDates, bad: "2026-02-30", "x y": "2026-12-01" } },
    });
    expect(back.settings.examDates).toEqual(d.settings.examDates);
    expect(setExamDate(d, "ccar-f", "").settings.examDates).toEqual({ "ccar-p": "2027-01-15" });
    expect(parseData(emptyData()).settings.examDates).toBeUndefined();
  });
});

describe("日ごとの回答（#38）", () => {
  test("答えるとその日に足され、取り消すと戻る。勘は正解から外す", () => {
    let d = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    d = answer(d, "ccar-f", "s1-02", false, NOW + 1000);
    const day = [...daysOf(d, "ccar-f").values()];
    expect(day).toEqual([[2, 1]]);
    const prev = d.items["ccar-f:s1-02"];
    const more = answer(d, "ccar-f", "s1-02", false, NOW + 2000);
    expect(undoAnswer(more, "ccar-f", "s1-02", prev, NOW + 2000, false)).toEqual(d);
    const g = markGuess(d, "ccar-f", "s1-01", undefined, true, NOW + 3000);
    expect([...daysOf(g, "ccar-f").values()]).toEqual([[2, 0]]);
  });
  test("模擬試験を終えると、出した問題の数と正解の数が入る", () => {
    const p = planMock(fixture, seeded(3));
    const start = startMock(emptyData(), {
      examId: "test-x",
      questionIds: p.questionIds,
      scenarioIds: p.scenarioIds,
      startedAt: NOW,
      limitMs: p.limitMs,
      usedMs: 0,
      answers: {},
      flags: [],
      orders: {},
      cursor: 0,
    });
    const done = finishMock(start, scoreMock(fixture, p.questionIds, {}), NOW);
    expect([...daysOf(done, "test-x").values()]).toEqual([[p.questionIds.length, 0]]);
  });
  test("記録に残り、壊れた値は捨て、古い日から捨てて上限に収める。資格の記録を消すと一緒に消える", () => {
    let d = emptyData();
    for (let i = 0; i < 410; i++) d = logDay(d, "ccar-f", NOW - i * 864e5, 1, 1);
    expect(Object.keys(d.days!)).toHaveLength(400);
    const newest = [...daysOf(d, "ccar-f").keys()].sort().at(-1);
    const back = parseData({
      ...JSON.parse(JSON.stringify(d)),
      days: { ...d.days, "ccar-f:2026-1-1": [1, 1], "ccar-f:2020-01-01": [1, 2], "ccar-f:2020-01-02": [-1, 0] },
    });
    expect(back.days).toEqual(d.days);
    expect([...daysOf(back, "ccar-f").keys()].sort().at(-1)).toBe(newest);
    expect(resetExam(d, "ccar-f").days).toEqual({});
  });
});

describe("直前の状態に戻す（#45）", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadForTest();
  });
  test("読み込み・消去のあとに、直前の記録へ戻せる。戻したことも取り消せる", () => {
    const mine = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    setData(mine);
    expect(getBackup()).toBeUndefined();
    const other = answer(emptyData(), "ccar-f", "s2-01", false, NOW);
    replaceData(other, "読み込み", NOW + 1);
    expect(getData()).toEqual(other);
    expect(getBackup()).toMatchObject({ at: NOW + 1, reason: "読み込み" });
    expect(restoreBackup(NOW + 2)).toBe(true);
    expect(getData()).toEqual(mine);
    // もう一度戻すと、戻す前（読み込んだ記録）になる
    expect(restoreBackup(NOW + 3)).toBe(true);
    expect(getData()).toEqual(other);
  });
  test("すべて消したあとも戻せる。控えが無い・壊れていれば戻さない", () => {
    const mine = answer(emptyData(), "ccar-f", "s1-01", true, NOW);
    setData(mine);
    replaceData(emptyData(), "すべての消去", NOW);
    expect(restoreBackup()).toBe(true);
    expect(getData()).toEqual(mine);
    localStorage.setItem(BACKUP_KEY, "{broken");
    expect(getBackup()).toBeUndefined();
    expect(restoreBackup()).toBe(false);
    expect(getData()).toEqual(mine);
  });
});

describe("模擬試験の見直しの選択肢の並び（#46）", () => {
  test("解いたときの並びを結果に残し、記録から読み戻せる（壊れた並びは捨てる）", () => {
    const start = startMock(emptyData(), {
      examId: "ccar-f",
      questionIds: ["s1-01", "s1-02"],
      scenarioIds: ["s1"],
      startedAt: NOW,
      limitMs: 1000,
      usedMs: 0,
      answers: { "s1-01": 2 },
      flags: [],
      orders: { "s1-01": [3, 1, 0, 2], "s1-02": [1, 0, 3, 2] },
      cursor: 0,
    });
    const done = finishMock(start, scoreMock(fixture, ["s1-01", "s1-02"], { "s1-01": 2 }), NOW);
    const r = done.mocks["ccar-f"]![0]!;
    expect(r.orders).toEqual({ "s1-01": [3, 1, 0, 2], "s1-02": [1, 0, 3, 2] });
    const raw = JSON.parse(JSON.stringify(done));
    raw.mocks["ccar-f"][0].orders["s1-02"] = [0, 0, 1, 2];
    expect(parseData(raw).mocks["ccar-f"]![0]!.orders).toEqual({ "s1-01": [3, 1, 0, 2] });
  });
});

describe("資格ごとの設定（#85）", () => {
  test("資格ごとの値が無ければ共通の値、あればその資格にだけ効く", () => {
    let d = setSettings(emptyData(), { practiceSize: 20, lang: "peek" });
    expect([practiceSizeOf(d, "ccar-f"), langOf(d, "ccar-f")]).toEqual([20, "peek"]);
    d = setExamSettings(d, "ccar-f", { practiceSize: 5 });
    d = setExamSettings(d, "ccar-f", { lang: "ja" });
    expect([practiceSizeOf(d, "ccar-f"), langOf(d, "ccar-f")]).toEqual([5, "ja"]);
    expect([practiceSizeOf(d, "fe-b"), langOf(d, "fe-b")]).toEqual([20, "peek"]);
  });
  test("記録に残り、知らない値の項目と資格 ID でないキーは捨てる", () => {
    const d = setExamSettings(emptyData(), "ccar-f", { practiceSize: 5, lang: "both" });
    expect(parseData(JSON.parse(JSON.stringify(d))).settings.exams).toEqual({
      "ccar-f": { practiceSize: 5, lang: "both" },
    });
    const back = parseData({
      settings: {
        exams: { "ccar-f": { practiceSize: 7, lang: "ja" }, "fe-b": { practiceSize: "x" }, "x y": { lang: "ja" } },
      },
    });
    expect(back.settings.exams).toEqual({ "ccar-f": { lang: "ja" } });
    expect(parseData(emptyData()).settings.exams).toBeUndefined();
  });
});

describe("途中の練習（#86）", () => {
  const p = {
    only: "d1",
    queue: [fixture.questions[0]!.id, fixture.questions[1]!.id],
    pos: 1,
    done: [{ id: fixture.questions[0]!.id, ok: false }],
    requeued: [fixture.questions[0]!.id],
    orders: { [fixture.questions[0]!.id]: [1, 0, 2, 3] },
    updatedAt: 1,
  };
  test("資格ごとに残り、読み戻せる。答えを見ている途中（選んだ答え・取り消し・勘）も戻る", () => {
    const withAnswer = {
      ...p,
      chosen: 2,
      undo: { prev: { ease: 2.5, interval: 1, due: 5, tries: 1, correct: 1, last: 4 }, requeued: false, at: 9 },
      guess: true,
    };
    let d = savePractice(emptyData(), fixture.id, withAnswer);
    d = savePractice(d, "other", p);
    expect(parseData(JSON.parse(JSON.stringify(d))).practices).toEqual({ [fixture.id]: withAnswer, other: p });
    expect(practiceOf(d, fixture)).toEqual(withAnswer);
  });
  test("問題が見つからない回は続きにしない。形の崩れた回は捨てる", () => {
    const d = savePractice(emptyData(), fixture.id, { ...p, queue: [...p.queue, "zz-99"] });
    expect(practiceOf(d, fixture)).toBeUndefined();
    const back = parseData({
      practices: {
        a: { ...p, pos: 2 },
        b: { ...p, queue: [] },
        c: { ...p, done: [{ id: 1 }] },
        "x y": p,
        ok: p,
      },
    });
    expect(Object.keys(back.practices!)).toEqual(["ok"]);
    expect(parseData(emptyData()).practices).toBeUndefined();
  });
  test("答えごとに選んだ選択肢を読み戻す。範囲外の添字は捨て、選択肢の無い前の記録もそのまま読む（#103）", () => {
    const id = fixture.questions[0]!.id;
    const back = parseData({
      practices: {
        a: {
          ...p,
          done: [
            { id, ok: true, guess: true, chosen: 1 },
            { id, ok: false, chosen: 99 },
            { id, ok: false },
          ],
        },
      },
    });
    expect(back.practices!.a!.done).toEqual([
      { id, ok: true, guess: true, chosen: 1 },
      { id, ok: false },
      { id, ok: false },
    ]);
  });
  test("捨てる・資格の記録を消すと一緒に消える。ほかの資格の回は残る", () => {
    let d = savePractice(savePractice(emptyData(), fixture.id, p), "other", p);
    expect(Object.keys(resetExam(d, fixture.id).practices!)).toEqual(["other"]);
    d = clearPractice(clearPractice(d, fixture.id), "other");
    expect(d.practices).toBeUndefined();
  });
});
