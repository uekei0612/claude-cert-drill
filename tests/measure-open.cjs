/* 資格を開くまでの時間を測る（#83）。公開版か dev サーバーに向けて:
   docker run --rm --network host -v "$PWD":/work:ro -w /work -e NODE_PATH=/usr/src/app/node_modules \
     [-e CPU=4] zenika/alpine-chrome:with-puppeteer node tests/measure-open.cjs [URL] [資格ID] [回数]
   測るのは 3 つで、どれも中央値を出す。CPU は CPU=n で 1/n に絞る（既定 4）
   - coldDirect: 何も入っていない状態で #/<資格ID> を直接開き、ホームが出るまで（最初の JS ＋ 資格の JS）
   - coldPick:   何も入っていない状態で一覧を開き、資格を選んでからホームが出るまで（資格の JS だけ）
   - warmPick:   service worker が先読みを終えた状態（ホーム画面版の 2 回目から）で、資格を選んでからホームが出るまで
   cold の 2 つは回線を 1.6Mbps・往復 150ms に絞る。ホームが出た印は「合格の目安」の見出し（#ready-h） */
const puppeteer = require("puppeteer");

const BASE = process.argv[2] || "http://localhost:8009/claude-cert-drill/";
const EXAM = process.argv[3] || "fe-a";
const RUNS = Number(process.argv[4] || 3);
const CPU = Number(process.env.CPU || 4);
const NET = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};
const VIEW = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const median = a => Math.round([...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]);

const newPage = async (browser, { slowNet = false, noCache = false } = {}) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(VIEW);
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  if (noCache) await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (slowNet) await cdp.send("Network.emulateNetworkConditions", NET);
  return { ctx, page };
};

// 一覧から資格を選ぶのと同じ：ハッシュを変えて、ホームの指標が出るまで
const pick = page =>
  page.evaluate(
    id =>
      new Promise(res => {
        const t0 = performance.now();
        location.hash = `#/${id}`;
        const tick = () =>
          document.querySelector("#ready-h") ? res(performance.now() - t0) : requestAnimationFrame(tick);
        tick();
      }),
    EXAM,
  );

(async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const coldDirect = [];
  const coldPick = [];
  const warmPick = [];
  for (let i = 0; i < RUNS; i++) {
    {
      const { ctx, page } = await newPage(browser, { slowNet: true });
      await page.emulateCPUThrottling(CPU);
      const t0 = Date.now();
      await page.goto(`${BASE}#/${EXAM}`);
      await page.waitForSelector("#ready-h", { timeout: 120000 });
      coldDirect.push(Date.now() - t0);
      await ctx.close();
    }
    {
      const { ctx, page } = await newPage(browser, { slowNet: true, noCache: true });
      await page.emulateCPUThrottling(CPU);
      await page.goto(`${BASE}#/`, { waitUntil: "load" });
      await page.waitForSelector("a.card");
      coldPick.push(await pick(page));
      await ctx.close();
    }
    {
      const { ctx, page } = await newPage(browser);
      await page.goto(`${BASE}#/`, { waitUntil: "networkidle0" });
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
      await page.reload({ waitUntil: "networkidle0" });
      if (!(await page.evaluate(() => !!navigator.serviceWorker.controller)))
        throw new Error("service worker が効いていない（warmPick を測れない）");
      await page.emulateCPUThrottling(CPU);
      await page.waitForSelector("a.card");
      warmPick.push(await pick(page));
      await ctx.close();
    }
  }
  console.log(
    JSON.stringify({
      base: BASE,
      exam: EXAM,
      cpu: `1/${CPU}`,
      coldDirect: median(coldDirect),
      coldPick: median(coldPick),
      warmPick: median(warmPick),
    }),
  );
  await browser.close();
})();
