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

1. `src/exams/<資格ID>/` を作り、`Exam` を書く（資格 ID は公式の試験コードを小文字・ハイフン、例 `ccar-p`）
2. `src/exams/index.ts` の一覧に足す
3. `npm test` の `exams.test.ts` が形（選択肢 4 つ・選択肢ごとの解説・全細目に問題がある…）を検査する

## 進め方（Issue とブランチ）

1. 作業の前に Issue を立てる（タイトルは「場所：内容」）
2. `feature/N-…`（直しは `fix/N-…`）を `develop` から切る
3. コミット本文の最後と、`develop` への `--no-ff` マージに `Refs #N`
4. 本番に出すときは `develop` → `main` のマージに `Closes #N` を並べる
