/* 形の違う資格で、すべての画面を描いて操作する（#56）。
   CCAR-F（シナリオ・4 択・教科書・訳）だけで作っていると、別の形の資格を足したときに画面が落ちる。
   ここでは落ちないこと・選択肢の数どおりに出ることだけを見る（見た目は tests/smoke.cjs） */
import { type ComponentChild, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { store } from "../../app/store";
import { fixture, flatFixture, jaFixture } from "../../core/engine/fixture";
import type { Exam } from "../../core/exam/types";
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
    // 記号は A から選択肢の数だけ
    expect(options.map(o => o.querySelector(".letter")?.textContent).join("")).toBe("ABCDE".slice(0, options.length));
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
    // 選択肢の並びは、その問題の選択肢の数の並べ替え
    for (const id of active.questionIds) {
      const n = exam.questions.find(q => q.id === id)!.options.length;
      expect([...active.orders[id]!].sort()).toEqual(Array.from({ length: n }, (_, i) => i));
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
  mount(<Practice exam={jaFixture} now={NOW} />);
  const stem = root.querySelector(".stem span")!;
  expect(stem.getAttribute("lang")).toBe("ja");
  expect(stem.classList.contains("en")).toBe(false);
  expect(root.querySelector(".lang-menu")).toBeNull();
  // 分野の公式名が日本語名と同じなら、下の行に重ねて出さない
  mount(<Domains exam={jaFixture} now={NOW} />);
  expect(root.textContent!.split("テクノロジ系").length - 1).toBe(1);
});

test("英語が原文の資格は、問題文を lang=en で出す", () => {
  mount(<Practice exam={ccarF} now={NOW} />);
  expect(root.querySelector(".stem span.en")?.getAttribute("lang")).toBe("en");
});

test("資格の外の画面（資格一覧・設定・使い方）が描ける", () => {
  for (const node of [<ExamPicker />, <Settings />, <Help />]) {
    mount(node);
    expect(root.querySelector("main")).not.toBeNull();
  }
});
