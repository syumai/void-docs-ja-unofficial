# Void ドキュメント 非公式日本語版

[Void](https://github.com/voidzero-dev/void) の公式ドキュメントを日本語に翻訳した、非公式の個人向けリポジトリです。公式のものではなく、内容の正確性は保証されません。正確な情報は[公式ドキュメント](https://void.cloud)を参照してください。

- 公開先: https://void-docs-ja-unofficial.syumai.workers.dev/ja/
- 英語版（原文）: https://void-docs-ja-unofficial.syumai.workers.dev/

## 構成

- `docs/` — 原文（英語）のVitePressプロジェクト
- `docs/ja/` — 日本語訳。原文と同じパス構成で、見出しには原文のスラッグを `{#...}` で保持しています
- `docs/.vitepress/ja.ts` — 日本語ロケールのナビ・サイドバー・フッターのラベルとリンク変換

その他のディレクトリ（`packages/`、`platform/` など）はアップストリームのソースをそのまま含んでいます。

## ローカルで確認する

```sh
cd docs
npx vitepress dev     # 開発サーバー
npx vitepress build   # docs/.vitepress/dist に出力
```

## デプロイ

Cloudflare Workers の静的アセットとしてデプロイします（`docs/wrangler.jsonc`、worker名: `void-docs-ja-unofficial`）。

```sh
cd docs
npx wrangler login    # 初回のみ
npx vitepress build
npx wrangler deploy
```

## 翻訳の方針

- 文体は「です・ます」調。コード、コマンド、API名、設定キー、製品名は翻訳しません。
- サイト内リンクは `/ja/` を前置します。
- 原文が更新された場合は `docs/` の差分を `docs/ja/` に反映します。

## ライセンスと帰属

原文・ソースコードの著作権はアップストリームの権利者に帰属します。ライセンスは [LICENSE](./LICENSE) を参照してください。
