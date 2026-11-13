/* 画面の確かめ（iPhone の幅）。dev サーバー（docker compose up）を立てた状態で:
   docker run --rm --network host -v "$PWD":/work -w /work -e NODE_PATH=/usr/src/app/node_modules \
     zenika/alpine-chrome:with-puppeteer node tests/smoke.cjs [URL] [画像の出力先]
   主な画面を順にたどり、スクリーンショットを撮る。エラー（console.error・例外）があれば失敗にする */
const puppeteer = require("puppeteer");
const path = require("path");

const BASE = process.argv[2] || "http://localhost:8009/claude-cert-drill/";
const OUT = process.argv[3] || "/tmp/shots";

(async () => {
  require("fs").mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
  page.on("console", m => m.type() === "error" && errors.push(`console: ${m.text()}`));
  page.on("dialog", d => d.accept());

  const shot = async name => {
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  };
  const goto = async hash => {
    await page.evaluate(h => (location.hash = h), hash);
    await new Promise(r => setTimeout(r, 300));
  };
  const text = () => page.evaluate(() => document.body.innerText);
  const click = async sel => {
    await page.waitForSelector(sel, { timeout: 5000 });
    // 座標でなく要素に直接送る（公開版では「オフラインでも使えるように」の通知が下に重なることがある）
    await page.$eval(sel, e => e.click());
    await new Promise(r => setTimeout(r, 200));
  };
  const clickText = async t => {
    const ok = await page.evaluate(t => {
      const el = [...document.querySelectorAll("a,button")].find(x => x.textContent.trim().startsWith(t));
      if (el) el.click();
      return !!el;
    }, t);
    if (!ok) throw new Error(`押せる「${t}」が無い`);
    await new Promise(r => setTimeout(r, 300));
  };

  // 問題文の言語は、小さなボタンを押して開いた選択肢から選ぶ（#31）
  const setLang = async label => {
    await click(".lang-toggle");
    await clickText(label);
    if (await page.$(".lang-pop")) throw new Error("言語を選んでも選択肢が閉じない");
  };

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + "#/", { waitUntil: "networkidle0" });
  await shot("01-picker");

  await goto("#/ccar-f");
  if (!(await text()).includes("合格の目安")) throw new Error("ホームが出ない");
  await shot("02-home");

  // 練習：3 問答える（1 問目は誤答を選ぶ＝解説が出るのを確かめる）
  await goto("#/ccar-f/practice");
  await shot("03-practice-question");
  // 言語の切り替えは上の帯に収め、問題は画面の上から始まる（#31）
  const cardTop = await page.$eval(".qcard", e => Math.round(e.getBoundingClientRect().top));
  if (cardTop > 140) throw new Error(`練習の問題が下がっている：${cardTop}px`);
  // 答える前は、答えを含めないヒント用のコピーだけを出す（答え入りは答えたあと。#24・#36）
  if ((await page.$$(".qcard .copy")).length !== 1 || !(await page.$(".qcard .copy.hint")))
    throw new Error("答える前のコピーのボタンが、ヒント用だけになっていない");
  for (let i = 0; i < 3; i++) {
    await click(".option");
    if (!(await page.$(".why"))) throw new Error("解説が出ない");
    if (!(await page.$(".qcard .copy:not(.hint)")) || (await page.$(".qcard .copy.hint")))
      throw new Error("答えたあとにコピーのボタンが、答え入りのものに替わらない");
    // 一番下までスクロールしても、帯は画面の下端に付いたまま（下の余白の分だけ持ち上がらない。#25）
    if (i === 0) {
      const gap = await page.evaluate(async () => {
        scrollTo(0, document.documentElement.scrollHeight);
        await new Promise(r => setTimeout(r, 100));
        return innerHeight - document.querySelector(".sticky-next").getBoundingClientRect().bottom;
      });
      if (Math.abs(gap) > 1) throw new Error(`一番下で帯が ${gap}px 持ち上がる`);
    }
    if (i === 0) await shot("04-practice-revealed");
    // 間違えても元の問題数（10）は変わらず、やり直しは別に出す（#43）
    const headLabel = await page.$eval(".head-label", e => e.textContent);
    if (!new RegExp(`^${i + 1} / 10`).test(headLabel)) throw new Error(`練習の問題数の表示が変わる：${headLabel}`);
    if ((await page.$(".option.ng")) && !headLabel.includes("やり直し +")) throw new Error("やり直しの数が出ない");
    // 練習の途中では章へのリンクを出さない（移ると練習の残りが消える。#26）
    if (await page.$(".qcard .learn-link")) throw new Error("練習の途中に教科書へのリンクが出ている");
    // 1・2 問目に「後で振り返る」の印を付ける（#23）
    if (i < 2) {
      await click(".sticky-next .save");
      if (!(await page.$(".sticky-next .save.on"))) throw new Error("後で振り返るの印が付かない");
    }
    await click(".sticky-next .btn.primary");
  }
  await goto("#/ccar-f");
  const homeAfter = await text();
  if (homeAfter.includes("未解答 60 問")) throw new Error("練習の答えが記録されていない");
  if (!/振り返り\s*2 問/.test(homeAfter)) throw new Error("ホームに振り返りの問題数が出ない");
  // 今日答えた分が、続けた日数とカレンダーに出る（#38）
  if (!/続けた日数 1 日[\s\S]*今日 3 問/.test(homeAfter)) throw new Error("今日の回答が続けた日数に出ない");
  if (!(await page.$(".cal .cell.today.l1"))) throw new Error("今日の回答がカレンダーに出ない");
  await shot("05-home-after");
  // ホームで問題数を変えて練習を始められる。設定にも残る（#48）
  await page.$$eval(".size-row .seg button", bs => bs.find(b => b.textContent.trim() === "5 問").click());
  await clickText("練習する");
  if (!/^1 \/ 5/.test(await page.$eval(".head-label", e => e.textContent)))
    throw new Error("ホームで変えた問題数で練習にならない");
  await goto("#/ccar-f");
  await page.$$eval(".size-row .seg button", bs => bs.find(b => b.textContent.trim() === "10 問").click());
  // ホームのカード：本体は詳細へ、右端の「練習 ▶」は練習へ。押す前に行き先が分かる（#32・#33）
  if (!/目安 \+\d+\.\d/.test(homeAfter)) throw new Error("伸ばすと効く細目の数字の意味が出ない");
  await page.$$eval("section[aria-labelledby=dom-h] .card.split .card-main", as => as[1].click());
  await new Promise(r => setTimeout(r, 400));
  if (!(await page.evaluate(() => location.hash)).endsWith("/domains/d2"))
    throw new Error("分野カードで分野の画面に移れない");
  const d2top = await page.$eval("#domain-d2", e => Math.round(e.getBoundingClientRect().top));
  if (d2top < 0 || d2top > 120) throw new Error(`分野の画面で、押した分野の位置に移らない：${d2top}px`);
  await goto("#/ccar-f");
  await page.$$eval("section[aria-labelledby=dom-h] .card.split .go", as => as[0].click());
  await new Promise(r => setTimeout(r, 300));
  if (!/D1|エージェント設計/.test(await page.$eval(".head-label", e => e.textContent)))
    throw new Error("分野カードの練習で、その分野の練習にならない");
  await goto("#/ccar-f");

  // 振り返り：印を付けた 2 問が並び、開くと解説が出る。その 2 問だけで練習できる
  await clickText("★ 振り返り");
  if ((await page.$$(".review-row")).length !== 2) throw new Error("振り返りに印を付けた問題が並ばない");
  await click(".review-row");
  if (!(await page.$(".why"))) throw new Error("振り返りで開いても解説が出ない");
  // 一覧の行には「覚えること」（答え）を出さず、問題文の冒頭を出す（#47）
  const leak = await page.evaluate(() => {
    const point = document
      .querySelector(".qcard .point p")
      .textContent.replace(/^覚えること\s*/, "")
      .trim();
    return [...document.querySelectorAll(".review-row")].some(r => r.textContent.includes(point));
  });
  if (leak) throw new Error("振り返りの一覧の行に覚えることが出ている");
  if (!(await page.$(".review-row .row-stem"))) throw new Error("振り返りの一覧の行に問題文が出ない");
  await shot("24-saved");
  // 答えのあとから、その細目の教科書の章へ行ける（#26）
  await click(".qcard .learn-link");
  if (!/#\/ccar-f\/learn\/\d\.\d$/.test(await page.evaluate(() => location.hash)))
    throw new Error("振り返りから教科書の章に移れない");
  await goto("#/ccar-f/saved");
  await clickText("この 2 問を練習する");
  if (!/振り返り・1 \/ 2/.test(await text())) throw new Error("振り返りの 2 問だけで練習にならない");
  // 2 問とも、誤答か勘の正解にする。誤答なら一度取り消して（#44）選び直し、正解なら「勘だった」を付ける（#27）
  for (let n = 0; n < 2; n++) {
    await click(".option");
    if (await page.$(".option.ng")) {
      if (await page.$(".sticky-next .guess")) throw new Error("誤答なのに勘だったが出ている");
      await click(".sticky-next .undo");
      if (await page.$(".why")) throw new Error("取り消しても答えが残っている");
      await click(".option");
    }
    if (!(await page.$(".option.ng"))) {
      if (await page.$(".sticky-next .undo")) throw new Error("正解なのに取り消すが出ている");
      await click(".sticky-next .guess");
      if (!(await page.$(".sticky-next .guess.on"))) throw new Error("勘だったが付かない");
    }
    await click(".sticky-next .btn.primary");
  }
  // やり直しの問題（誤答だけ出る）は何か答えて、結果の画面へ
  while (!(await text()).includes("おつかれさまでした")) {
    await click(".option");
    await click(".sticky-next .btn.primary");
  }
  // 結果の画面：勘の正解は正解に数えない。間違えた・勘の問題ごとに、教科書の章へのリンクがある（#26）
  if (!/^0 \/ 2 問/m.test(await text())) throw new Error("勘の正解を正解に数えている");
  if ((await page.$$(".learn-link")).length !== 2) throw new Error("練習の結果に教科書へのリンクが無い");
  await shot("26-practice-result");
  // 間違えた問題だけを解き直せる（#39）
  await clickText("間違えた");
  if (!/解き直し・1 \/ 2/.test(await text())) throw new Error("練習の結果から間違えた問題だけの練習にならない");
  await goto("#/ccar-f/saved");
  // 印を外しても、その場では一覧から消さない（付け直せる）。次に開くと消えている
  await click(".card .save.on");
  if ((await page.$$(".review-row")).length !== 2) throw new Error("印を外したらその場で一覧から消えた");
  await goto("#/ccar-f");
  await goto("#/ccar-f/saved");
  if ((await page.$$(".review-row")).length !== 1) throw new Error("外した印が残っている");

  // 分野・細目
  await goto("#/ccar-f/domains");
  await shot("06-domains");
  await goto("#/ccar-f/task/1.1");
  if (!(await text()).includes("stop_reason")) throw new Error("要点が出ない");
  // 未解答の問題は 1 行にまとめる（#35）
  if ((await page.$$(".unseen")).length !== 1 || !/未解答 \d+ 問/.test(await text()))
    throw new Error("細目の未解答が 1 行にまとまらない");
  await shot("07-task");

  // 教科書：目次 → 細目の画面から章へ → 次の章。どの章も横にはみ出さない（コードは枠の中で横に送る）
  await goto("#/ccar-f/learn");
  if (!(await text()).includes("エージェントループの設計と実装")) throw new Error("教科書の目次が出ない");
  // 章の終わりまで読むと「読んだ」になり、目次とホームに出る。手で外せる（#29）
  await goto("#/ccar-f/learn/intro");
  if ((await text()).includes("この章は読んだ")) throw new Error("開いただけで読んだになる");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await new Promise(r => setTimeout(r, 400));
  if (!(await text()).includes("この章は読んだ")) throw new Error("最後まで読んでも読んだにならない");
  await goto("#/ccar-f/learn");
  if ((await page.$$(".read-mark")).length !== 1) throw new Error("目次に読んだ印が出ない");
  if (!/読んだ 1 \/ \d+ 章/.test(await text())) throw new Error("目次に読んだ章の数が出ない");
  await goto("#/ccar-f");
  if (!/教科書の続き[\s\S]*1\.1/.test(await text())) throw new Error("ホームに次に読む章が出ない");
  await goto("#/ccar-f/learn/intro");
  await clickText("読んだを外す");
  if ((await text()).includes("この章は読んだ")) throw new Error("読んだを外せない");
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await new Promise(r => setTimeout(r, 400));
  if ((await text()).includes("この章は読んだ")) throw new Error("外した読んだが、すぐまた付く");
  // 章と各節に、Claude に貼るためのコピーのボタンがある（#24）
  await goto("#/ccar-f/learn/1.1");
  if (!(await text()).includes("この章をコピー")) throw new Error("章のコピーのボタンが無い");
  if ((await page.$$(".sec-head .copy")).length < 3) throw new Error("節ごとのコピーのボタンが無い");
  await goto("#/ccar-f/learn");
  await shot("19-learn-toc");
  // はじめに → 次の章で 1.1 へ。用語の枠・手順・まとめが出る
  await clickText("0 はじめに");
  if (!(await page.$(".lesson dl.terms"))) throw new Error("はじめにに用語の一覧が出ない");
  if (!(await page.$(".lesson ol.steps"))) throw new Error("はじめにに手順が出ない");
  if (!(await page.$(".lesson .summary"))) throw new Error("はじめににまとめが出ない");
  await shot("22-learn-primer");
  if (!(await page.$(".lesson figure.fig svg"))) throw new Error("はじめにに図が出ない");
  await clickText("次の章");
  if (!(await text()).includes("最小のループ")) throw new Error("はじめにから 1.1 に進めない");
  if (!(await page.$(".lesson .note"))) throw new Error("1.1 に注意の枠が出ない");
  if (!(await page.$(".lesson figure.fig svg"))) throw new Error("1.1 に図が出ない");
  // 例題：答えは最初は閉じていて、開くと出る
  if (!(await page.$(".lesson .quiz"))) throw new Error("1.1 に例題が出ない");
  if (await page.$eval(".lesson .quiz details", d => d.open)) throw new Error("例題の答えが最初から開いている");
  await page.$eval(".lesson .quiz summary", s => s.click());
  if (!(await page.$eval(".lesson .quiz details", d => d.open))) throw new Error("例題の答えが開かない");
  await page.$eval(".lesson .quiz", e => e.scrollIntoView());
  await page.screenshot({ path: path.join(OUT, "23-learn-quiz.png") });
  await goto("#/ccar-f/task/1.1");
  await clickText("教科書で読む");
  if (!(await text()).includes("最小のループ")) throw new Error("細目から章に移れない");
  await shot("20-learn-chapter");
  await clickText("次の章");
  if (!(await text()).includes("ハブ＆スポーク")) throw new Error("次の章に進めない");
  const wide = [];
  for (const id of ["intro", "1.1", "1.5", "2.2", "2.3", "2.4", "3.2", "3.6", "4.3", "4.5", "5.4", "5.6"]) {
    await goto(`#/ccar-f/learn/${id}`);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > 390) wide.push(`${id}: ${w}px`);
  }
  if (wide.length) throw new Error(`教科書が横にはみ出す：${wide.join(", ")}`);
  await goto("#/ccar-f/learn/3.6");
  await shot("21-learn-cli");

  // 検索：目次から入り、語を入れると章の節と細目の要点が並ぶ。節を押すとその節の位置へ（#41）
  await goto("#/ccar-f/learn");
  await clickText("教科書と要点を検索");
  await page.type(".search-box", "PostToolUse");
  await new Promise(r => setTimeout(r, 300));
  const found = await text();
  if (!/教科書 \d+ 件/.test(found) || !/細目の要点 \d+ 件/.test(found)) throw new Error("検索で章の節と要点が並ばない");
  if (!(await page.evaluate(() => location.hash)).includes("q=PostToolUse"))
    throw new Error("検索の語が URL に残らない");
  await shot("28-search");
  const target = await page.$eval("main section .card", a => a.getAttribute("href"));
  await page.$eval("main section .card", a => a.click());
  await new Promise(r => setTimeout(r, 500));
  const sec = /sec=(\d+)/.exec(target)[1];
  const top = await page.$eval(`#sec-${sec}`, e => Math.round(e.getBoundingClientRect().top));
  if (Number(sec) > 0 && (top < 0 || top > 120))
    throw new Error(`検索から移った章で、その節の位置に移らない：${top}px`);

  // 画面を移ったら先頭から（ホームを下まで送ってから別のタブへ。前の位置が残らない）
  await goto("#/ccar-f");
  await page.evaluate(() => scrollTo(0, 1e6));
  await clickText("分野");
  if ((await page.evaluate(() => Math.round(scrollY))) !== 0)
    throw new Error("画面を移っても、前の画面のスクロール位置が残る");

  // 練習の上の帯：題名の長い細目でも、「やめる」が縦に折れず、横にはみ出さない（320 幅）
  await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await goto("#/ccar-f/practice?only=1.5");
  const head = await page.evaluate(() => {
    const r = document.querySelector(".drill-head > .btn").getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), sw: document.documentElement.scrollWidth };
  });
  if (head.w < 44 || head.h > 60) throw new Error(`練習の「やめる」が縦に折れる：${head.w}×${head.h}`);
  if (head.sw > 320) throw new Error(`練習の画面が横にはみ出す：${head.sw}px`);
  // 答えたあとの下の帯（正誤・後で振り返る・次へ）も、折れず・はみ出さない
  await click(".option");
  const bar = await page.evaluate(() => {
    const h = e => Math.round(document.querySelector(e).getBoundingClientRect().height);
    return {
      save: h(".sticky-next .save"),
      next: h(".sticky-next .btn.primary"),
      sw: document.documentElement.scrollWidth,
    };
  });
  if (bar.save > 60 || bar.next > 60 || bar.sw > 320) throw new Error(`練習の下の帯が崩れる：${JSON.stringify(bar)}`);
  await shot("25-practice-bar-320");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 壊れた URL でも落ちない（errors に例外が入れば最後に失敗にする）
  await goto("#/%E0%A4%A");
  await goto("#/ccar-f");

  // 模擬試験：始めて 2 問答え、旗を立て、一覧から提出
  await goto("#/ccar-f/mock");
  await shot("08-mock-intro");
  // 始める前に問題数と時間が分かる（#34）
  if (!/60 問・120 分/.test(await text())) throw new Error("模擬試験の案内に問題数と時間が出ない");
  await clickText("始める");
  // 本番と同じ 60 問（4 シナリオ × 15 問）
  const total = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith("claude-cert-drill"))))
        .activeMock.questionIds.length,
  );
  if (total !== 60) throw new Error(`模擬試験が 60 問でない：${total}`);
  // 模擬試験の最中は、コピーのボタンを出さない（本番に近い状態を保つ。#36）
  if (await page.$(".qcard .copy")) throw new Error("模擬試験の最中にコピーのボタンが出ている");
  await click(".option");
  await shot("09-mock-question");
  await clickText("⚐ 旗を立てる");
  await clickText("次へ");
  await click(".option");
  // 途中で再読み込みしても続きから
  await page.reload({ waitUntil: "networkidle0" });
  if (!(await text()).includes("2 / ")) throw new Error("再読み込みで模擬試験の位置が戻った");
  await clickText("一覧");
  await shot("10-mock-list");
  await clickText("提出して採点する");
  await new Promise(r => setTimeout(r, 500));
  if (!(await text()).includes("模擬試験の結果")) throw new Error("結果が出ない");
  // 見直しの言語切り替えが、狭い幅でも縦に折れない
  await click(".lang-toggle");
  const seg = await page.$$eval(".lang-toggle, .lang-pop button", bs =>
    bs.map(b => b.getBoundingClientRect()).map(r => [Math.round(r.width), Math.round(r.height), Math.round(r.right)]),
  );
  if (seg.length !== 5 || seg.some(([w, h, right]) => w < 44 || h < 44 || h > 80 || right > 390))
    throw new Error(`見直しの言語切り替えが崩れている：${JSON.stringify(seg)}`);
  await click(".lang-toggle");
  await shot("11-mock-result");
  await click(".review-row");
  if (!(await page.$(".qcard .learn-link"))) throw new Error("模擬試験の見直しに教科書へのリンクが無い");
  await shot("12-mock-review");
  // 間違えた（未回答を含む）問題だけを練習できる（#39）。60 問中、正解は多くても 2 問
  await clickText("間違えた（未回答を含む）");
  if (!/解き直し・1 \/ (5[89]|60)\b/.test(await text()))
    throw new Error("模擬試験の結果から間違えた問題の練習にならない");

  // 下のタブは ホーム / 教科書 / 分野 / 模擬試験 / 振り返り。設定と資格一覧はホームの右上から（#30）
  await goto("#/ccar-f");
  const tabs = await page.$$eval(".tabbar a", as => as.map(a => a.textContent.trim()).join("/"));
  if (tabs !== "ホーム/教科書/分野/模擬試験/振り返り") throw new Error(`タブの並びが違う：${tabs}`);
  await clickText("振り返り");
  if (!(await page.evaluate(() => location.hash)).endsWith("/saved")) throw new Error("振り返りのタブで移れない");
  await goto("#/ccar-f");
  await clickText("資格一覧");
  if ((await page.evaluate(() => location.hash)) !== "#/") throw new Error("ホームから資格一覧に移れない");
  await goto("#/ccar-f");
  await clickText("設定");
  if (!(await text()).includes("設定と記録")) throw new Error("ホームから設定に移れない");
  // 試験日を入れると、ホームに日数と今日の目安が出る。消すと出ない（#37）
  if ((await text()).includes("試験まであと")) throw new Error("試験日を入れていないのに逆算が出る");
  await page.$eval('input[type="date"]', el => {
    const d = new Date(Date.now() + 10 * 864e5);
    el.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));
  await shot("13-settings");
  await goto("#/ccar-f");
  if (!/試験まであと 10 日[\s\S]*今日の目安：復習 \d+ 問＋新しい問題 \d+ 問/.test(await text()))
    throw new Error("試験日を入れてもホームに逆算が出ない");
  await shot("27-home-plan");
  await goto("#/settings");
  await clickText("消す");
  await goto("#/ccar-f");
  if ((await text()).includes("試験まであと")) throw new Error("試験日を消しても逆算が残る");
  await goto("#/settings");
  // 記録のコピーは、問題のコピーと同じ仕組みで写せる（#46）
  await clickText("コピーする");
  if (!(await text()).includes("記録をコピーしました")) throw new Error("設定の記録のコピーができない");
  // 記録を消しても、直前の状態に戻せる（#45）
  const countItems = () =>
    page.evaluate(() => {
      const k = Object.keys(localStorage).find(x => /^claude-cert-drill(-dev)?$/.test(x));
      return Object.keys(JSON.parse(localStorage.getItem(k)).items).length;
    });
  const answeredBefore = await countItems();
  if (!answeredBefore) throw new Error("消す前の記録が無い");
  if ((await text()).includes("直前の状態に戻す")) throw new Error("控えが無いのに戻すが出ている");
  await clickText("CCAR-F の記録を消す");
  if ((await countItems()) !== 0) throw new Error("記録が消えない");
  await clickText("直前の状態に戻す");
  if ((await countItems()) !== answeredBefore) throw new Error("消した記録を直前の状態に戻せない");

  // 問題文の言語：日本語・併記に切り替え、設定が残ることを確かめる
  await goto("#/ccar-f/practice");
  await setLang("日本語");
  if (!/[ぁ-ん]/.test(await page.$eval(".stem", e => e.textContent))) throw new Error("日本語に切り替わらない");
  await shot("15-practice-ja");
  await setLang("併記");
  if (!(await page.$(".stem .ja-sub"))) throw new Error("併記にならない");
  await click(".option");
  await shot("16-practice-both");
  await page.reload({ waitUntil: "networkidle0" });
  if (!(await page.$(".stem .ja-sub"))) throw new Error("言語の設定が残らない");
  await setLang("英語");

  // 訳はタップ：最初は英語だけ。「訳を見る」で訳が出て、次の問題ではまた閉じる。答えたら訳が出る
  await goto("#/ccar-f/practice");
  await setLang("訳はタップ");
  if (await page.$(".stem .ja-sub")) throw new Error("訳はタップなのに最初から訳が出ている");
  await clickText("訳を見る");
  if (!(await page.$(".stem .ja-sub"))) throw new Error("訳を見るで訳が出ない");
  await shot("18-practice-peek");
  await click(".option");
  await clickText("次へ");
  if (await page.$(".stem .ja-sub")) throw new Error("次の問題で訳が閉じない");
  // 答えても、押した選択肢は画面の同じ位置に残る（上に解説と訳が入っても下にずれない。#22）
  const moved = await page.evaluate(async () => {
    const el = document.querySelectorAll(".option")[2];
    el.scrollIntoView({ block: "center" });
    await new Promise(r => requestAnimationFrame(r));
    const before = el.getBoundingClientRect().top;
    el.click();
    await new Promise(r => requestAnimationFrame(r));
    const a = document.querySelector('.option[data-orig="' + el.dataset.orig + '"]').getBoundingClientRect();
    const bar = document.querySelector(".sticky-next").getBoundingClientRect();
    return { dy: Math.round(a.top - before), gap: Math.round(bar.top - a.bottom), top: Math.round(a.top) };
  });
  // 動かないのが基本。ただし訳が入って選択肢が伸び、下の「次へ」の帯に隠れるときは、
  // 帯の 8px 上まで持ち上げるのが仕様（どの問題が出るかで起きたり起きなかったりする）
  const lifted = moved.dy < 0 && Math.abs(moved.gap - 8) <= 2 && moved.top >= 8;
  if (Math.abs(moved.dy) > 2 && !lifted) throw new Error(`答えたら押した選択肢がずれた：${JSON.stringify(moved)}`);
  if (!(await page.$(".stem .ja-sub"))) throw new Error("答えたあとに訳が出ない");
  await setLang("英語");

  // キーだけで練習 1 回を最後まで進められる（#40）
  await goto("#/ccar-f/practice?only=1.1");
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  for (let n = 0; n < 20 && !(await text()).includes("おつかれさまでした"); n++) {
    await page.keyboard.press("2");
    await new Promise(r => setTimeout(r, 150));
    if (!(await page.$(".why"))) throw new Error("キーの 2 で選べない");
    if (n === 0) {
      await page.keyboard.press("s");
      await new Promise(r => setTimeout(r, 100));
      if (!(await page.$(".sticky-next .save.on"))) throw new Error("キーの S で振り返りに入らない");
    }
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 150));
  }
  if (!(await text()).includes("おつかれさまでした")) throw new Error("キーだけで練習が終わらない");

  // ダーク
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await goto("#/ccar-f/practice");
  await click(".option");
  await shot("14-dark-practice");

  // 見た目の切り替え：端末がダークでもライトを選べば明るい背景。再読み込みしても残る
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await goto("#/settings");
  await clickText("ライト");
  if ((await bg()) !== "rgb(250, 248, 245)") throw new Error(`ライトにならない：${await bg()}`);
  await page.reload({ waitUntil: "networkidle0" });
  if ((await bg()) !== "rgb(250, 248, 245)") throw new Error("見た目の設定が残らない");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await clickText("ダーク");
  if ((await bg()) !== "rgb(23, 21, 19)") throw new Error(`ダークにならない：${await bg()}`);
  await shot("17-settings-dark");
  await clickText("端末に合わせる");
  if ((await bg()) !== "rgb(250, 248, 245)") throw new Error("端末に合わせるに戻らない");

  await browser.close();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("ok", OUT);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
