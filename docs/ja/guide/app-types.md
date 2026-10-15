---
outline: deep
---

# サポートされるアプリタイプ {#supported-app-types}

Void は 3 種類のアプリをサポートしています。

1. **Void アプリ:** [API ルート](./server-routing.md)、[Pages モード](./pages-routing/overview.md)、[認証](./auth.md)、[cron](./jobs.md)、[キュー](./queues.md) など、Void のフレームワーク層を利用する Vite アプリ
2. **メタフレームワーク:** [TanStack Start](https://tanstack.com/start/latest)、[React Router](https://reactrouter.com/)、[SvelteKit](https://svelte.dev/docs/kit)、[Nuxt](https://nuxt.com/)、[Astro](https://astro.build/)
3. **静的サイト:** SPA、[VitePress](https://vitepress.dev/) などのツールで構築したサイト、または任意の静的ファイルのディレクトリ

タイプはプロジェクト構成から自動検出されます。[`void.config.ts`](../reference/config.md) で明示的に指定することもできます。

## Void アプリ {#void-apps}

Void アプリでは、サーバールーティングとデプロイを Void が担当します。サーバーレンダリングされるページには React、Vue、Svelte、Solid を使えます。また、Vite で動作する任意のライブラリでフロントエンドを構築することもできます。

Void アプリは、**API のみ**(`routes/` だけ)、**SPA + API**(`src/` にフロントエンド、API ルートを併用)、または **Pages モードのフルスタック**(`pages/` にサーバーレンダリングされるページを置き、データ読み込みを同じ場所に配置)のいずれかの構成にできます。

<VoidAppFileTree annotations />

Void は、API ルート、ページレンダリング、任意の[カスタム SSR](./ssr.md) を静的アセットとあわせて配信します。D1、KV、R2 などのリソースは[コードから推論](../reference/resource-inference.md)され、デプロイ時にプロビジョニングされます。

Void アプリでは [`output: 'static'`](./ssg.md) を使って、ビルド時にすべてのページをプリレンダリングすることもできます。これにより、Cloudflare Worker を必要とせず、どこにでもデプロイできる完全な静的サイトが得られます。

**デプロイ:** `void deploy` はアプリをビルドし、リソースをプロビジョニングし、マイグレーションを適用して、保存済みの Cloudflare または Void のターゲットにアップロードします。セットアップについては[デプロイ](./deployment.md)を参照してください。

## メタフレームワーク {#meta-frameworks}

Void は、Vite ベースのメタフレームワークアプリを `void deploy` でデプロイできます。ルーティングと SSR はフレームワークが担当します。Void は[バインディングの推論](../reference/resource-inference.md)、[型付き DB クエリ](./database.md)、マイグレーション、デプロイを担当します。

| フレームワーク                                      | 検出されるパッケージ    | セットアップガイド                                     |
| --------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| [TanStack Start](https://tanstack.com/start/latest) | `@tanstack/react-start` | [ガイド](../integrations/frameworks/tanstack-start.md) |
| [React Router v7](https://reactrouter.com/)         | `@react-router/dev`     | [ガイド](../integrations/frameworks/react-router.md)   |
| [SvelteKit](https://svelte.dev/docs/kit)            | `@sveltejs/kit`         | [ガイド](../integrations/frameworks/sveltekit.md)      |
| [Nuxt](https://nuxt.com/)                           | `nuxt`                  | [ガイド](../integrations/frameworks/nuxt.md)           |
| [Analog](https://analogjs.org/)                     | `@analogjs/platform`    | [ガイド](../integrations/frameworks/analog.md)         |
| [Astro](https://astro.build/)                       | `astro`                 | [ガイド](../integrations/frameworks/astro.md)          |

フレームワークの Vite 設定に `voidPlugin()` を追加すると、バインディングの推論、型付き DB の生成、マイグレーション管理、cron ジョブ、キュー、キャッシュが利用できます。フレームワークモードでは Void が管理する認証はサポートされていません。お使いのフレームワーク向けの Better Auth 公式インテグレーションを使用してください。サポートされる機能とセットアップガイドについては、[メタフレームワークインテグレーション](../integrations/frameworks/overview.md)を参照してください。

## ビルド済みの静的サイト {#pre-built-static-sites}

SPA、静的サイト、単なるディレクトリなど、静的ファイルを生成するあらゆるプロジェクトが対象です。Void はアプリケーションコードを必要とせずにアセットを配信します。

**SPA**(クライアントサイドのシングルページアプリ)は、どのファイルにも一致しないパスに対して `index.html` をステータス 200 で返すため、クライアントサイドルーティングがそのまま動作します。Void プラットフォームでは、ハッシュ付きアセットフォルダー(`/assets/`)配下の存在しないファイルは代わりに 404 を返します。`vite` が依存関係にあり、バックエンドファイルが存在しない場合に検出されます。

**静的サイト**(VitePress、Docusaurus などの静的サイトジェネレーター、またはビルド済みの任意のディレクトリ)は、ページごとの HTML ファイルを生成します。既知の SSG が依存関係にある場合、または `--dir` フラグを使用した場合に検出されます。

エッジでの解決順序は次のとおりです。

1. 完全一致するファイルパス(`/styles.css` → `styles.css`)
2. ネストされた index(`/about` → `about/index.html`)
3. `404.html` を **ステータス 404** で返す(ファイルが存在する場合)
4. 通常の 404 レスポンス

**デプロイ:** `void deploy` または `void deploy --dir <path>` で静的ファイルを直接アップロードします。アセットはエッジから自動キャッシュ付きで配信されます。

## 静的サイトにバックエンドを追加する {#adding-a-backend-to-a-static-site}

静的サイトジェネレーターに API ルートを追加する場合は、バックエンドもデプロイするかどうかを Void に伝えてください。自動検出は SSG の依存関係とバックエンドファイルの両方を検出し、`inference.appType` を設定するまで処理を停止します。

両方をデプロイするには、`appType` を `"void"` に設定し、Void アプリより先に静的サイトをビルドします。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  inference: {
    appType: 'void',
    build: 'vitepress build && vite build',
  },
});
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin()],
  // The SSG's output becomes the static assets of the Void build.
  publicDir: '.vitepress/dist',
});
```

`vitepress build` がサイトを出力し、続いて `vite build` が `publicDir` を `dist/client` にコピーし、Worker を `dist/ssr` に出力します。`voidPlugin()` は**ルートの** `vite.config.ts` にのみ置いてください。ジェネレーター自身の設定(例: `.vitepress/config.ts`)には置かないでください。

一致しないリクエストは Worker が処理します。それらのリクエストにジェネレーターの `404.html` を返すには、[`routing.notFound`](../reference/config.md#routing-notfound) を設定します。

```json
{ "routing": { "notFound": "404-page" } }
```

静的な出力だけをデプロイするには、次のように設定します。

```json
{ "inference": { "appType": "static" } }
```

## 明示的な設定 {#explicit-configuration}

アプリタイプを固定して自動検出をスキップするには、[`void.config.ts`](../reference/config.md) で `inference.appType` を設定します。

```json
{
  "inference": {
    "appType": "static",
    "outputDir": ".vitepress/dist"
  }
}
```

- `inference.appType`: `"void"`、`"framework"`、`"spa"`、または `"static"`
- `inference.outputDir`: 静的アプリタイプの出力ディレクトリ(プロジェクトルートからの相対パス。デフォルトは `"dist"`)
