# claude-cert-drill

Anthropic の Claude の資格の試験勉強用アプリ。iPhone のホーム画面アプリ（PWA）として GitHub Pages から配る。
今載せているのは **Claude Certified Architect – Foundations（CCAR-F）**。

- 本番：https://uekei0612.github.io/claude-cert-drill/
- develop：https://uekei0612.github.io/claude-cert-drill/dev/

設計と命名規則は [docs/design.md](docs/design.md)。問題はすべて自作で、Anthropic の試験ガイドの本文やサンプル問題は載せていない。
非公式の教材で、Anthropic とは関係がない。

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
