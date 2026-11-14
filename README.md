# claude-cert-drill

資格の試験勉強用アプリ（画面での名前は cert-drill）。iPhone のホーム画面アプリ（PWA）として GitHub Pages から配る。
今載せているのは次の資格。

- **Claude Certified Architect – Foundations（CCAR-F）**：問題・教科書はすべて自作。Anthropic の試験ガイドの本文やサンプル問題は載せていない
- **基本情報技術者試験 科目B（FE-B）**：IPA の公開問題を、出典（年度・問番号、手を加えたものは「一部改変」）を明記して載せる。解説と要点は自作

最初は Claude の資格だけのアプリとして作ったので、リポ名・URL・保存キーは claude-cert-drill のまま（変えると記録やホーム画面のアプリが使えなくなる）。

- 本番：https://uekei0612.github.io/claude-cert-drill/
- develop：https://uekei0612.github.io/claude-cert-drill/dev/

設計と命名規則は [docs/design.md](docs/design.md)、資格の足し方は [docs/adding-an-exam.md](docs/adding-an-exam.md)。
非公式の教材で、Anthropic・IPA とは関係がない。

## 開発

dev VM の Node は 16 で Vite が動かないので、Node 22 のコンテナで動かす。

```sh
docker compose up -d                       # http://almalinux-dev.ukuenokei.duckdns.org:8009/
docker compose run --rm dev npm run check  # 型・整形・テスト・ビルド
```

## 資格を足す

`src/exams/<資格ID>/` にデータを書き、`src/exams/index.ts` の一覧に 1 行足すだけ（画面や出題の仕組みは変えない）。
手順と雛形は [docs/adding-an-exam.md](docs/adding-an-exam.md)。

## 構成

| 層 | 場所 | 役目 |
|---|---|---|
| 基盤 | `src/core/` | 資格の型・形の検査・出題・採点・記録。Preact も画面も知らない |
| 画面 | `src/ui/` | 部品と画面。資格は `Exam` で受け取り、資格の名前を知らない |
| 資格の中身 | `src/exams/` | データだけ。中身は資格を開いたときに読み込む |
| アプリ | `src/app/` | 名前・保存キー（`config.ts`）、記録の実体、組み立て |

層の向きは `src/layers.test.ts` が見張る。詳しくは [docs/design.md](docs/design.md#構成)。

## 進め方（Issue とブランチ）

1. 作業の前に Issue を立てる（タイトルは「場所：内容」）
2. `feature/N-…`（直しは `fix/N-…`）を `develop` から切る
3. コミット本文の最後と、`develop` への `--no-ff` マージに `Refs #N`
4. 本番に出すときは `develop` → `main` のマージに `Closes #N` を並べる

## 画面の確かめ

dev サーバーを立てた状態で、iPhone の幅で主な画面をたどってスクリーンショットを撮る（エラーが出たら失敗）。

```sh
docker run --rm --network host -v "$PWD":/work:ro -v /tmp/shots:/shots -w /work \
  -e NODE_PATH=/usr/src/app/node_modules --user root zenika/alpine-chrome:with-puppeteer \
  node tests/smoke.cjs http://localhost:8009/claude-cert-drill/ /shots
```
