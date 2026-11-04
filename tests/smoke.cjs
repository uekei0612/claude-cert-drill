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
  for (let i = 0; i < 3; i++) {
    await click(".option");
    if (!(await page.$(".why"))) throw new Error("解説が出ない");
    if (i === 0) await shot("04-practice-revealed");
    await click(".sticky-next .btn.primary");
  }
  await goto("#/ccar-f");
  const homeAfter = await text();
  if (homeAfter.includes("未解答 60 問")) throw new Error("練習の答えが記録されていない");
  await shot("05-home-after");

  // 分野・細目
  await goto("#/ccar-f/domains");
  await shot("06-domains");
  await goto("#/ccar-f/task/1.1");
  if (!(await text()).includes("stop_reason")) throw new Error("要点が出ない");
  await shot("07-task");

  // 模擬試験：始めて 2 問答え、旗を立て、一覧から提出
  await goto("#/ccar-f/mock");
  await shot("08-mock-intro");
  await clickText("始める");
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
  await shot("11-mock-result");
  await click(".review-row");
  await shot("12-mock-review");

  await goto("#/settings");
  await shot("13-settings");

  // 問題文の言語：日本語・併記に切り替え、設定が残ることを確かめる
  await goto("#/ccar-f/practice");
  await clickText("日本語");
  if (!/[ぁ-ん]/.test(await page.$eval(".stem", e => e.textContent))) throw new Error("日本語に切り替わらない");
  await shot("15-practice-ja");
  await clickText("併記");
  if (!(await page.$(".stem .ja-sub"))) throw new Error("併記にならない");
  await click(".option");
  await shot("16-practice-both");
  await page.reload({ waitUntil: "networkidle0" });
  if (!(await page.$(".stem .ja-sub"))) throw new Error("言語の設定が残らない");
  await clickText("英語");

  // 訳はタップ：最初は英語だけ。「訳を見る」で訳が出て、次の問題ではまた閉じる。答えたら訳が出る
  await goto("#/ccar-f/practice");
  await clickText("訳はタップ");
  if (await page.$(".stem .ja-sub")) throw new Error("訳はタップなのに最初から訳が出ている");
  await clickText("訳を見る");
  if (!(await page.$(".stem .ja-sub"))) throw new Error("訳を見るで訳が出ない");
  await shot("18-practice-peek");
  await click(".option");
  await clickText("次へ");
  if (await page.$(".stem .ja-sub")) throw new Error("次の問題で訳が閉じない");
  await click(".option");
  if (!(await page.$(".stem .ja-sub"))) throw new Error("答えたあとに訳が出ない");
  await clickText("英語");

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
