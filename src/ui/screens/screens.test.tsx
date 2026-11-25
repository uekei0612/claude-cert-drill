/* 形の違う資格で、すべての画面を描いて操作する（#56）。
   CCAR-F（シナリオ・4 択・教科書・訳）だけで作っていると、別の形の資格を足したときに画面が落ちる。
   ここでは落ちないこと・選択肢の数どおりに出ることだけを見る（見た目は tests/smoke.cjs） */
import { type ComponentChild, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { store } from "../../app/store";
import { answer } from "../../core/store/actions";
import { type Route, parseRoute } from "../route";
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
      <Saved exam={exam} now={NOW} />,
      <Saved exam={exam} view="weak" now={NOW} />,
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
    // 解いた問題は最初から全部並ぶ。間違えた問題だけに絞れる（#103）
    expect(root.querySelectorAll(".solved-list .review-row").length).toBe(result.total);
    click(root.querySelector<HTMLInputElement>(".check input")!);
    expect(root.querySelectorAll(".solved-list .review-row").length).toBe(result.total - result.correct);
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

describe("練習の続き（#86）", () => {
  const stemNow = () => root.querySelector(".stem")!.textContent;

  test("答えてから離れると、ホームに続きと新しくのボタンが出て、続きからは同じ問題・答えを見た状態に戻る", () => {
    mount(<Practice exam={fixture} now={NOW} />);
    // 開いただけでは残さない
    expect(store.getData().practices).toBeUndefined();
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    const stem = stemNow();
    const saved = store.getData().practices![fixture.id]!;
    expect(saved.done.length).toBe(1);
    expect(saved.chosen).toBeDefined();

    mount(<Home exam={fixture} now={NOW} />);
    expect(root.textContent).toContain("練習の途中です");
    expect(byText("続きから再開する").getAttribute("href")).toBe(`#/${fixture.id}/practice?start=resume`);
    expect(byText("新しく始める").getAttribute("href")).toBe(`#/${fixture.id}/practice?start=new`);

    act(() => render(null, root));
    mount(<Practice exam={fixture} start="resume" now={NOW} />);
    expect(stemNow()).toBe(stem);
    expect(root.querySelectorAll(".why").length).toBeGreaterThan(0);
    click(byText("次へ"));
    expect(store.getData().practices![fixture.id]!.pos).toBe(1);
  });

  test("指定なしで開くと続きか新しくかを選べる。新しくを選ぶと途中の回は消える", () => {
    mount(<Practice exam={fixture} now={NOW} />);
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    click(byText("次へ"));
    const queue = store.getData().practices![fixture.id]!.queue;

    act(() => render(null, root));
    mount(<Practice exam={fixture} now={NOW} />);
    expect(root.textContent).toContain("練習の途中です");
    click(byText("続きから再開する"));
    expect(root.textContent).toContain(`2 / ${queue.length - store.getData().practices![fixture.id]!.requeued.length}`);

    act(() => render(null, root));
    mount(<Practice exam={fixture} now={NOW} />);
    click(byText("新しく始める"));
    expect(store.getData().practices).toBeUndefined();
    expect(root.querySelectorAll("button.option").length).toBeGreaterThan(0);
  });

  test("ホームの「新しく始める」（start=new）は途中の回を消して新しい回にする。絞り込みが違えば聞かない", () => {
    mount(<Practice exam={fixture} now={NOW} />);
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    act(() => render(null, root));
    mount(<Practice exam={fixture} only="d1" now={NOW} />);
    expect(root.textContent).not.toContain("練習の途中です");
    act(() => render(null, root));
    mount(<Practice exam={fixture} start="new" now={NOW} />);
    expect(store.getData().practices).toBeUndefined();
    expect(root.querySelectorAll(".why").length).toBe(0);
  });

  test("回を最後まで終えると途中の回は消える", () => {
    mount(<Practice exam={fixture} only={idsOnly([fixture.questions[0]!.id])} now={NOW} />);
    const q = fixture.questions[0]!;
    click(root.querySelector<HTMLButtonElement>(`button.option[data-orig="${q.answer}"]`)!);
    expect(store.getData().practices).toBeDefined();
    click(byText("結果を見る"));
    expect(store.getData().practices).toBeUndefined();
  });
});

describe("苦手（#87）", () => {
  /** s1-01 を 3 回、s2-01 を 2 回、s3-01 を 1 回忘れた記録 */
  const seed = () => {
    let d = store.getData();
    const forget = (id: string, n: number) => {
      for (let i = 0; i < n; i++) {
        d = answer(d, fixture.id, id, true, NOW - (20 - 2 * i) * 864e5);
        d = answer(d, fixture.id, id, false, NOW - (19 - 2 * i) * 864e5);
      }
    };
    forget("s1-01", 3);
    forget("s2-01", 2);
    forget("s3-01", 1);
    act(() => store.setData(d));
  };

  test("ホームに件数、振り返りに忘れた回数の多い順の一覧、そこから苦手だけで練習できる", () => {
    seed();
    mount(<Home exam={fixture} now={NOW} />);
    expect(root.textContent).toContain("苦手 2 問");
    // 印が無いので、振り返りのカードは苦手の一覧へ
    expect(root.querySelector(`a[href="#/${fixture.id}/saved/weak"]`)).not.toBeNull();

    mount(<Saved exam={fixture} view="weak" now={NOW} />);
    const rows = [...root.querySelectorAll(".weak-tag")].map(e => e.textContent);
    expect(rows).toEqual(["忘れた 3 回・まだ", "忘れた 2 回・まだ"]);
    expect(byText("この 2 問を練習する").getAttribute("href")).toBe(`#/${fixture.id}/practice?only=weak`);

    act(() => render(null, root));
    mount(<Practice exam={fixture} only="weak" now={NOW} />);
    expect(root.textContent).toContain("苦手・1 / 2");
    // 答えると苦手の注意が出る
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    expect(root.querySelector(".weak-note")?.textContent).toMatch(/覚えたあとに \d 回間違えています/);
  });

  test("苦手が無ければ、理由を出す", () => {
    mount(<Saved exam={fixture} view="weak" now={NOW} />);
    expect(root.textContent).toContain("今は苦手な問題はありません");
    mount(<Practice exam={fixture} only="weak" now={NOW} />);
    expect(root.textContent).toContain("苦手な問題はありません");
  });
});

describe("問題のメモ（#88）", () => {
  test("答える前は出さない。答えたあとに書いて次へ進んでも残り、振り返りのメモの一覧に出る", () => {
    mount(<Practice exam={fixture} now={NOW} />);
    expect(root.querySelector(".note-add")).toBeNull();
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    const id = store.getData().practices![fixture.id]!.done[0]!.id;
    click(byText("✎ メモを書く"));
    const ta = root.querySelector<HTMLTextAreaElement>(".note-box textarea")!;
    act(() => {
      ta.value = "期限と間隔を取り違えた";
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // 「完了」を押さずに次へ進んでも保存する
    click(byText("次へ"));
    expect(store.getData().notes?.[`${fixture.id}:${id}`]?.text).toBe("期限と間隔を取り違えた");

    act(() => render(null, root));
    mount(<Saved exam={fixture} view="notes" now={NOW} />);
    expect(root.querySelector(".row-note")?.textContent).toContain("期限と間隔を取り違えた");
    expect(byText("この 1 問を練習する").getAttribute("href")).toBe(`#/${fixture.id}/practice?only=notes`);
    // 開くとメモを直せる。空にして完了すると消える
    click(root.querySelector<HTMLButtonElement>(".review-row")!);
    click(byText("直す"));
    const ta2 = root.querySelector<HTMLTextAreaElement>(".note-box textarea")!;
    expect(ta2.value).toBe("期限と間隔を取り違えた");
    act(() => {
      ta2.value = "";
      ta2.dispatchEvent(new Event("input", { bubbles: true }));
    });
    click(byText("完了"));
    expect(store.getData().notes).toBeUndefined();
  });
});

describe("書き出しの案内（#89）", () => {
  test("しばらく書き出していないとホームに出る。書き出すと記録に時刻が残って消え、「あとで」でも消える", () => {
    act(() => store.setData(answer(store.getData(), fixture.id, "s1-01", true, NOW - 20 * 864e5)));
    mount(<Home exam={fixture} now={NOW} />);
    expect(root.querySelector(".export-nudge")?.textContent).toContain("最初に答えてから 20 日");
    click(byText("あとで"));
    expect(root.querySelector(".export-nudge")).toBeNull();

    act(() => store.setData({ ...store.getData(), exportNudgeSnoozedAt: undefined }));
    mount(<Home exam={fixture} now={NOW} />);
    URL.createObjectURL = () => "blob:x";
    URL.revokeObjectURL = () => {};
    click(byText("ファイルに書き出す"));
    expect(store.getData().exportedAt).toBeGreaterThan(NOW - 1000);
    expect(root.querySelector(".export-nudge")).toBeNull();
  });
});

describe("来た画面へ戻る（#91）", () => {
  const task = fixture.domains[0]!.tasks[0]!.id;

  test("細目の画面から練習すると、やめる・結果から細目の画面へ戻る。既定の戻り先は細目の分野の位置", () => {
    mount(<TaskDetail exam={fixture} taskId={task} now={NOW} />);
    expect(byText("← 分野").getAttribute("href")).toBe(`#/${fixture.id}/domains/d1`);
    const go = byText("この細目を練習する").getAttribute("href")!;
    expect(go).toContain("back=");
    const r = parseRoute(go);
    expect(r).toMatchObject({ name: "practice", only: task, back: { name: "task", taskId: task } });

    act(() => render(null, root));
    mount(<Practice exam={fixture} only={task} back={(r as { back: Route }).back} now={NOW} />);
    expect(byText("やめる").getAttribute("href")).toBe(`#/${fixture.id}/task/${task}`);
    // 最後まで答えると、結果の画面にも細目へ戻るボタン
    for (let i = 0; i < 30 && !root.textContent!.includes("おつかれさまでした"); i++) {
      click(root.querySelector<HTMLButtonElement>("button.option")!);
      click(byText(root.textContent!.includes("結果を見る") ? "結果を見る" : "次へ"));
    }
    expect(byText("細目へ").getAttribute("href")).toBe(`#/${fixture.id}/task/${task}`);
  });

  test("教科書の章は来た画面へ戻り、無ければ目次へ", () => {
    mount(<Learn exam={ccarF} taskId="1.1" now={NOW} />);
    expect(byText("← 目次").getAttribute("href")).toBe(`#/${ccarF.id}/learn`);
    mount(<Learn exam={ccarF} taskId="1.1" back={{ name: "saved", examId: ccarF.id, view: "weak" }} now={NOW} />);
    expect(byText("← 振り返り").getAttribute("href")).toBe(`#/${ccarF.id}/saved/weak`);
    expect(parseRoute(byText("この細目を練習する").getAttribute("href")!)).toMatchObject({
      back: { name: "learn", taskId: "1.1" },
    });
  });
});

describe("覚えたへの進み具合（#92）", () => {
  test("同じ日に正解し直しても「あと 1 回」で、いつから解けばよいかが出る。細目の画面と結果の画面にも出る", () => {
    const only = fixture.domains[0]!.tasks[0]!.id;
    const solveAll = () => {
      for (let i = 0; i < 30 && !root.textContent!.includes("おつかれさまでした"); i++) {
        const q = fixture.questions.find(x => root.querySelector(".stem")?.textContent?.includes(stemText(x.stem)))!;
        const order = [...root.querySelectorAll<HTMLButtonElement>("button.option")];
        click(order.find(b => Number(b.dataset.orig) === q.answer)!);
        expect(root.querySelector(".sticky-next .known-note")?.textContent).toContain("明日");
        click(byText(root.textContent!.includes("結果を見る") ? "結果を見る" : "次へ"));
      }
    };
    mount(<Practice exam={fixture} only={only} now={NOW} />);
    solveAll();
    expect(root.querySelector(".known-summary")?.textContent).toMatch(/覚えた 0 問・あと 1 回 \d+ 問（明日/);
    // 同じ日にもう一度
    click(byText("続けてもう 1 回"));
    solveAll();
    expect(root.querySelector(".known-summary")?.textContent).toContain("覚えた 0 問");

    act(() => render(null, root));
    mount(<TaskDetail exam={fixture} taskId={only} now={NOW} />);
    expect(root.textContent).toMatch(/あと 1 回・明日 \d+\/\d+から/);
    expect(root.querySelector(".learning-note")).not.toBeNull();
  });
});

test("前の日に正解した問題を今日正解すると「覚えた」に入ったと出る（#92）", () => {
  const q = fixture.questions[0]!;
  act(() => store.setData(answer(store.getData(), fixture.id, q.id, true, NOW - 2 * 864e5)));
  mount(<Practice exam={fixture} only={`q:${q.id}`} now={NOW} />);
  click(root.querySelector<HTMLButtonElement>(`button.option[data-orig="${q.answer}"]`)!);
  expect(root.querySelector(".sticky-next .known-note")?.textContent).toContain("「覚えた」に入りました");
});

test("メーターに「あと 1 回」を薄い色で出し、数も添える。合格の目安は覚えただけで数える（#94）", () => {
  const q = fixture.questions[0]!;
  act(() => store.setData(answer(store.getData(), fixture.id, q.id, true, NOW)));
  mount(<Home exam={fixture} now={NOW} />);
  expect(root.querySelector(".learning-line")?.textContent).toContain("あと 1 回 1 問");
  expect(root.querySelectorAll(".meter .fill.sub").length).toBe(1);
  expect(root.querySelector(".big")?.textContent).toBe("0%");
  mount(<Domains exam={fixture} now={NOW} />);
  expect(root.textContent).toContain("（あと 1 回 1）");
});

describe("練習の途中で教科書の章を開く（#102）", () => {
  test("答えたあとの細目の番号から章を開き、「← 練習」で同じ問題の解説に戻る。やめる先も失わない", () => {
    const from: Route = { name: "domains", examId: ccarF.id, domainId: "d1" };
    mount(<Practice exam={ccarF} only="1.1" back={from} now={NOW} />);
    // 答える前は出さない
    expect(root.querySelector(".chapter-link")).toBeNull();
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    const stem = root.querySelector(".stem")!.textContent;
    const link = root.querySelector<HTMLAnchorElement>(".chapter-link")!;
    expect(link.textContent).toContain("1.1");
    expect(byText("教科書で読む（1.1）").getAttribute("href")).toBe(link.getAttribute("href"));

    const learn = parseRoute(link.getAttribute("href")!);
    expect(learn).toEqual({
      name: "learn",
      examId: ccarF.id,
      taskId: "1.1",
      back: { name: "practice", examId: ccarF.id, only: "1.1", start: "resume", back: from },
    });
    if (learn.name !== "learn") throw new Error("learn ではない");

    act(() => render(null, root));
    mount(<Learn exam={ccarF} taskId="1.1" back={learn.back} now={NOW} />);
    const back = parseRoute(byText("← 練習").getAttribute("href")!);
    if (back.name !== "practice") throw new Error("練習に戻らない");

    act(() => render(null, root));
    mount(<Practice exam={ccarF} only={back.only} start={back.start} back={back.back} now={NOW} />);
    expect(root.textContent).not.toContain("練習の途中です");
    expect(root.querySelector(".stem")!.textContent).toBe(stem);
    expect(root.querySelectorAll(".why").length).toBeGreaterThan(0);
    expect(byText("やめる").getAttribute("href")).toBe("#/ccar-f/domains/d1");
  });

  test("教科書の無い資格では、細目の番号は文字のまま", () => {
    mount(<Practice exam={flatFixture} now={NOW} />);
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    expect(root.querySelectorAll(".why").length).toBeGreaterThan(0);
    expect(root.querySelector(".chapter-link")).toBeNull();
    expect(root.textContent).not.toContain("教科書で読む");
  });
});

describe("回の終わりの解いた問題の一覧（#103）", () => {
  test("練習の終わりに、1 回目の答えで ○・× を付けて並べ、押すと自分の答えと解説が開く", () => {
    const [q1, q2] = fixture.questions;
    mount(<Practice exam={fixture} only={idsOnly([q1!.id, q2!.id])} now={NOW} />);
    const pick = (right: boolean) => {
      const q = fixture.questions.find(x => root.querySelector(".stem")!.textContent!.includes(stemText(x.stem)))!;
      const b = [...root.querySelectorAll<HTMLButtonElement>("button.option")].find(
        x => (Number(x.dataset.orig) === q.answer) === right,
      )!;
      click(b);
      return { q, orig: Number(b.dataset.orig) };
    };
    const first = pick(false);
    click(byText("次へ"));
    const second = pick(true);
    click(byText("次へ"));
    // やり直し（1 問目）は正解しても、一覧は 1 回目の答えで付ける
    pick(true);
    click(byText("結果を見る"));

    const rows = [...root.querySelectorAll<HTMLElement>(".solved-list .review-row")];
    expect(rows.map(r => r.textContent!.slice(0, 1))).toEqual(["×", "○"]);
    expect(rows[0]!.textContent).toContain(stemText(first.q.stem).slice(0, 10));
    click(rows[0]!);
    expect(root.querySelector(".solved-list .option.ng")?.getAttribute("data-orig")).toBe(String(first.orig));
    expect(root.querySelectorAll(".solved-list .why").length).toBe(first.q.options.length);
    click(rows[1]!);
    expect(root.querySelector(".solved-list .option.ng")).toBeNull();
    expect(root.querySelector(".solved-list .option.ok")?.getAttribute("data-orig")).toBe(String(second.q.answer));
  });
});

describe("新しい問題だけの練習（#104）", () => {
  test("復習が溜まっていても、ホームの「新しい問題を解く」からはまだ解いていない問題だけが出る", () => {
    // 半分を間違えて答えた（10 分後に復習の期限が来る）ことにし、期限が来たあとで開く
    const seen = ccarF.questions.slice(0, 90).map(q => q.id);
    store.update(d => seen.reduce((x, id) => answer(x, ccarF.id, id, false, NOW - 60 * 60 * 1000), d));
    mount(<Home exam={ccarF} now={NOW} />);
    const link = byText("新しい問題を解く");
    expect(link.textContent).toContain(`未解答 ${ccarF.questions.length - 90} 問`);
    const r = parseRoute(link.getAttribute("href")!);
    expect(r).toEqual({ name: "practice", examId: ccarF.id, only: "new" });

    act(() => render(null, root));
    mount(<Practice exam={ccarF} only="new" now={NOW} />);
    expect(root.textContent).toContain("新しい問題・");
    // 答えると回が記録に残る。回の 10 問はすべてまだ解いていなかった問題
    click(root.querySelector<HTMLButtonElement>("button.option")!);
    const queue = store.getData().practices![ccarF.id]!.queue;
    expect(new Set(queue).size).toBe(10);
    for (const id of queue) expect(seen).not.toContain(id);
  });

  test("復習が無ければ出さない。全部解いたあとの「新しい問題」は理由を出す", () => {
    mount(<Home exam={fixture} now={NOW} />);
    expect(root.textContent).not.toContain("新しい問題を解く");
    store.update(d => fixture.questions.reduce((x, q) => answer(x, fixture.id, q.id, true, NOW), d));
    act(() => render(null, root));
    mount(<Practice exam={fixture} only="new" now={NOW} />);
    expect(root.textContent).toContain("まだ解いていない問題はありません");
  });
});
