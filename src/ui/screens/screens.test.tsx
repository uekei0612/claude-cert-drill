/* 形の違う資格で、すべての画面を描いて操作する（#56）。
   CCAR-F（シナリオ・4 択・教科書・訳）だけで作っていると、別の形の資格を足したときに画面が落ちる。
   ここでは落ちないこと・選択肢の数どおりに出ることだけを見る（見た目は tests/smoke.cjs） */
import { type ComponentChild, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { store } from "../../app/store";
import { fixture, flatFixture, jaFixture } from "../../core/engine/fixture";
import { idsOnly } from "../../core/engine/practice";
import { type Exam, optionLabel, optionText, shufflesOptions, stemText } from "../../core/exam/types";
import { ccarF } from "../../exams/ccar-f/exam";
import { Domains } from "./Domains";
import { ExamPicker } from "./ExamPicker";
import { Help } from "./Help";
import { Home } from "./Home";
import { Learn } from "./Learn";
import { Mock } from "./Mock";
import { MockResult } from "./MockResult";
import { Practice } from "./Practice";
import { Saved } from "./Saved";
import { Search } from "./Search";
import { Settings } from "./Settings";
import { TaskDetail } from "./TaskDetail";

const NOW = Date.now();
let root: HTMLElement;

function mount(node: ComponentChild): HTMLElement {
  act(() => render(node, root));
  return root;
}

/** 文字を含むボタン（またはリンク） */
function byText(text: string): HTMLElement {
  const el = [...root.querySelectorAll<HTMLElement>("button, a")].find(b => b.textContent?.includes(text));
  if (!el) throw new Error(`「${text}」が無い：${root.textContent?.slice(0, 200)}`);
  return el;
}

const click = (el: HTMLElement) => act(() => el.click());

beforeEach(() => {
  localStorage.clear();
  store.reload();
  window.confirm = () => true;
  location.hash = "";
  root = document.createElement("div");
  document.body.append(root);
});

afterEach(() => {
  act(() => render(null, root));
  root.remove();
});

describe.each([
  ["CCAR-F", ccarF],
  ["シナリオあり・4 択（テスト用）", fixture],
  ["シナリオ無し・5 択と 3 択・教科書と訳なし（テスト用）", flatFixture],
  ["日本語が原文（テスト用）", jaFixture],
] as const)("%s", (_name, exam: Exam) => {
  const firstTask = exam.domains[0]!.tasks[0]!.id;

  test("見るだけの画面が描ける", () => {
    for (const node of [
      <Home exam={exam} now={NOW} />,
      <Domains exam={exam} now={NOW} />,
      <Domains exam={exam} domainId="d1" now={NOW} />,
      <TaskDetail exam={exam} taskId={firstTask} now={NOW} />,
      <Learn exam={exam} now={NOW} />,
      <Learn exam={exam} taskId={firstTask} now={NOW} />,
      <Search exam={exam} q="a" />,
      <Saved exam={exam} />,
    ]) {
      mount(node);
      expect(root.querySelector("main"), String(node)).not.toBeNull();
    }
  });

  test("練習：選択肢の数どおりに出て、答えると解説と「次へ」が出る", () => {
    mount(<Practice exam={exam} now={NOW} />);
    const options = [...root.querySelectorAll<HTMLButtonElement>("button.option")];
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(exam.questions.some(x => x.options.length === options.length)).toBe(true);
    // 記号は資格の記号（A〜 または ア〜）で、選択肢の数だけ
    expect(options.map(o => o.querySelector(".letter")?.textContent)).toEqual(
      options.map((_, i) => optionLabel(exam, i)),
    );
    click(options[0]!);
    expect(root.querySelectorAll(".why").length).toBe(options.length);
    click(byText("次へ"));
    expect(root.querySelectorAll("button.option").length).toBeGreaterThanOrEqual(2);
  });

  test("模擬試験：始めて、答えて、提出すると結果が描ける", () => {
    mount(<Mock exam={exam} />);
    click(byText("始める"));
    const active = store.getData().activeMock!;
    expect(active.examId).toBe(exam.id);
    // 選択肢の並びは、その問題の選択肢の数の並べ替え。混ぜない資格は元の並び（#58）
    for (const id of active.questionIds) {
      const q = exam.questions.find(x => x.id === id)!;
      const natural = Array.from({ length: q.options.length }, (_, i) => i);
      expect([...active.orders[id]!].sort()).toEqual(natural);
      if (!shufflesOptions(exam, q)) expect(active.orders[id]).toEqual(natural);
    }
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    click(byText("一覧"));
    click(byText("提出して採点する"));
    const result = store.getData().mocks[exam.id]![0]!;
    expect(result.total).toBe(active.questionIds.length);
    mount(<MockResult exam={exam} at={result.finishedAt} />);
    expect(root.textContent).toContain(`${result.total}`);
  });
});

test("日本語が原文の資格は、問題文を lang=ja で出し、言語の切り替えを出さない（#57）", () => {
  // 4 択の文の問題だけで練習する
  mount(<Practice exam={jaFixture} only={idsOnly(["d1-01", "d1-02", "d1-03", "d1-04"])} now={NOW} />);
  const stem = root.querySelector(".stem > [lang]")!;
  expect(stem.getAttribute("lang")).toBe("ja");
  expect(stem.classList.contains("en")).toBe(false);
  expect(root.querySelector(".lang-menu")).toBeNull();
  // 記号はア〜で、選択肢は混ぜない（#58）
  const q = jaFixture.questions.find(x => root.querySelector(".stem")!.textContent!.includes(stemText(x.stem)))!;
  expect([...root.querySelectorAll(".otext")].map(o => o.textContent)).toEqual(q.options.map(o => optionText(q, o)));
  expect(root.querySelector(".letter")!.textContent).toBe("ア");
  expect(root.textContent).toContain("キー：1〜4で選ぶ");
  // 分野の公式名が日本語名と同じなら、下の行に重ねて出さない
  mount(<Domains exam={jaFixture} now={NOW} />);
  expect(root.textContent!.split("テクノロジ系").length - 1).toBe(1);
});

test("10 択の問題は ア〜コ を出し、0 キーで 10 個目を選べる（#59）", () => {
  const q = jaFixture.questions.find(x => x.options.length === 10)!;
  mount(<Practice exam={jaFixture} only={idsOnly([q.id])} now={NOW} />);
  expect([...root.querySelectorAll(".letter")].map(l => l.textContent).join("")).toBe("アイウエオカキクケコ");
  expect(root.textContent).toContain("キー：1〜9・0で選ぶ");
  act(() => {
    dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
  });
  const chosen = root.querySelector<HTMLElement>("button.option.ok, button.option.ng")!;
  expect(chosen.dataset.orig).toBe("9");
});

test("プログラムと表を含む問題文と、解答群の表を出す（#60）", () => {
  const q = jaFixture.questions.find(x => x.columns)!;
  mount(<Practice exam={jaFixture} only={idsOnly([q.id])} now={NOW} />);
  expect(root.querySelector(".stem pre.code")!.textContent).toContain("return 空欄b");
  // 空欄は枠付きの記号（#62）。段落とプログラムの両方
  expect([...root.querySelectorAll(".stem p .blank")].map(b => b.textContent)).toEqual(["空欄a", "空欄b"]);
  expect([...root.querySelectorAll(".stem pre.code .blank")].map(b => b.textContent)).toEqual(["空欄a", "空欄b"]);
  expect(root.querySelector(".stem .qtable th")!.textContent).toBe("引数");
  expect(root.querySelector(".stem code")!.textContent).toBe("sum");
  const rows = [...root.querySelectorAll("button.option .cells")];
  expect(rows.length).toBe(q.options.length);
  expect(rows[0]!.querySelectorAll(".ocell").length).toBe(2);
  expect(rows[0]!.textContent).toContain("a");
  expect(rows[0]!.textContent).toContain("s + arr[i]");
  // 出典（#61）
  const src = root.querySelector<HTMLAnchorElement>(".qsource a")!;
  expect(src.textContent).toBe("出典：テスト用の公開問題 問1（一部改変）");
  expect(src.getAttribute("href")).toBe("https://example.com/q1");
});

test("出典の無い問題には出典を出さない（#61）", () => {
  mount(<Practice exam={jaFixture} only={idsOnly(["d1-01"])} now={NOW} />);
  expect(root.querySelector(".qsource")).toBeNull();
});

test("英語が原文の資格は、問題文を lang=en で出す", () => {
  mount(<Practice exam={ccarF} now={NOW} />);
  expect(root.querySelector(".stem > .en")?.getAttribute("lang")).toBe("en");
});

test("資格の外の画面（資格一覧・設定・使い方）が描ける", () => {
  for (const node of [<ExamPicker />, <Settings />, <Help />]) {
    mount(node);
    expect(root.querySelector("main")).not.toBeNull();
  }
});

test("使い方と設定の下に、資格ごとの断り書きを出す（#61）", () => {
  for (const node of [<Settings />, <Help />]) {
    mount(node);
    const text = root.querySelector(".notices")!.textContent!;
    expect(text).toContain("非公式の教材");
    expect(text).toContain("CCAR-F：問題と教科書はすべて自作の非公式教材です。Anthropic とは関係がありません。");
  }
});
