---
outline: deep
---

# 静的サイト生成 (SSG) {#static-site-generation-ssg}

`void.config.ts` で `output: "static"` を設定すると、すべてのページをビルド時にプリレンダリングします。

```json
{
  "output": "static"
}
```

`output` が `"static"` の場合:

- ページはデフォルトで `prerender = true` となり、HTML ファイルとして `dist/client/` に書き出されます。
- オプトアウトするには、ページの `.server.ts` で `export const prerender = false` を使用します。そのページはリクエスト時にサーバーレンダリングされます。
- `getPrerenderPaths()` のない動的ページは、暗黙的にプリレンダリングされません（パスがビルド時にわからないためです）。
- ビルド出力は自己完結しており、Cloudflare への直接デプロイ、セルフホスティング、`void deploy` のいずれでも動作します。

## ページごとの上書き {#per-page-overrides}

個々のページで、プリレンダリングをオプトアウトできます。

```ts
// pages/dashboard.server.ts
export const prerender = false;
```

`getPrerenderPaths()` を持つ動的ページは、返されたパラメーターの組み合わせごとにプリレンダリングされます。

```ts
// pages/blog/[slug].server.ts
export async function getPrerenderPaths() {
  return [{ slug: 'hello-world' }, { slug: 'getting-started' }];
}
```

## エッジプリレンダリングとの比較 {#comparison-with-edge-prerendering}

| `output` の値        | デフォルトのプリレンダリング | ページごとの上書き               | プリレンダリングのタイミング         |
| -------------------- | ---------------------------- | -------------------------------- | ------------------------------------ |
| `"server"` (default) | `false`                      | `export const prerender = true`  | デプロイ時（プラットフォームの ISR） |
| `"static"`           | `true`                       | `export const prerender = false` | ビルド時、またはデプロイのビルド後   |

デフォルトの `output: "server"` では、デプロイ時の[エッジプリレンダリング](./edge/prerendering.md)に `export const prerender = true` を使用します。

## デプロイの動作 {#deployment-behavior}

`void deploy` は、デプロイ方法を自動的に選択します。

- **完全な静的サイト:** すべてのページがプリレンダリングされ、API ルート、ミドルウェア、cron ジョブ、キューがない場合、Void は Worker なしの純粋な静的サイトとしてデプロイします。
- **ハイブリッド:** `getPrerenderPaths()` のない動的ページや `export const prerender = false` のページなど、プリレンダリングできないページがある場合は、それらのルートを実行時に処理する Worker がデプロイされます。プリレンダリングされたページは、引き続き静的アセットとして配信されます。

## `inference.appType: "static"` との関係 {#relationship-to-inference-apptype-static}

`inference.appType` フィールドはアプリの種類（SPA、static、void）を表し、`output` はレンダリング戦略を制御します。

|                  | `inference.appType: "static"`                               | `output: "static"`                                   |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| **内容**         | ビルド済みの静的サイトをデプロイする（Void プラグインなし） | ビルド時に Void アプリをプリレンダリングする         |
| **Worker**       | なし（静的アセットのみ）                                    | プリレンダリングできないページがある場合のみ         |
| **ユースケース** | VitePress、プレーンな HTML、外部の SSG ツール               | ほぼ、または完全に静的なコンテンツを持つ Void アプリ |
