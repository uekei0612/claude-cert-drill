# ccar-drill

Anthropic の資格 **Claude Certified Architect – Foundations（CCAR-F）** の試験勉強用アプリ。
iPhone のホーム画面アプリ（PWA）として GitHub Pages から配る。

- 本番：https://uekei0612.github.io/ccar-drill/
- develop：https://uekei0612.github.io/ccar-drill/dev/

設計は [docs/design.md](docs/design.md)。問題はすべて自作で、Anthropic の試験ガイドの本文やサンプル問題は載せていない。
非公式の教材で、Anthropic とは関係がない。

## 開発

dev VM の Node は 16 で Vite が動かないので、Node 22 のコンテナで動かす。

```sh
docker compose up -d     # http://almalinux-dev.ukuenokei.duckdns.org:8009/
docker compose run --rm dev npm run check
```

## 進め方（Issue とブランチ）

1. 作業の前に Issue を立てる（タイトルは「場所：内容」）
2. `feature/N-…`（直しは `fix/N-…`）を `develop` から切る
3. コミット本文の最後と、`develop` への `--no-ff` マージに `Refs #N`
4. 本番に出すときは `develop` → `main` のマージに `Closes #N` を並べる
