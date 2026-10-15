---
outline: deep
---

# Nuxt {#nuxt}

[Nuxt](https://nuxt.com/) で Void を使うと、リソースの検出、型付きのデータベースクエリ、マイグレーションが利用できます。Nuxt は独自のビルドと Cloudflare 統合をそのまま保持し、Void はその Vite 設定に組み込まれます。

## セットアップ {#setup}

### 1. 新しいプロジェクトを作成する {#_1-create-a-new-project}

```bash
npm create nuxt@latest my-app
cd my-app
```

### 2. 依存関係をインストールする {#_2-install-dependencies}

```bash
npm install -D void
```

Void には、開発中に Nuxt のプラットフォームプロキシが使用する Cloudflare のツールが含まれています。

### 3. `nuxt.config.ts` を設定する {#_3-configure-nuxt-config-ts}

```ts
import { resolve } from 'node:path';
import { voidPlugin } from 'void';

export default defineNuxtConfig({
  alias: {
    '@schema': resolve(import.meta.dirname, 'db/schema.ts'),
  },
  nitro: {
    preset: 'cloudflare-module',
    modules: ['void/nitro'],
    cloudflare: { dev: { configPath: './.void-wrangler.jsonc' } },
    // Windows 上の Nuxt 4.6.0 で必要です。
    externals: {
      inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/],
    },
  },
  vite: { plugins: [voidPlugin()] },
});
```

`void/nitro` モジュールにより、Nuxt のサーバールートでアプリの `void/db` と `@schema` が使えるようになります。Nuxt はサーバールートもアプリの型でチェックするため、トップレベルの `alias` によって `nuxi typecheck` が `@schema` を解決できます。`cloudflare.dev` は、Void が生成した Cloudflare 設定のバインディングを開発サーバーに与えます。Nuxt は、`compatibilityDate` が `2025-07-15` 以降の場合に、開発時にこれを実行します。

### 4. `void.config.ts` を作成する {#_4-create-void-config-ts}

Void は、Nuxt の開発ランタイムが使用する Cloudflare 設定を生成します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  cloudflare: {
    name: 'my-app',
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_compat', 'nodejs_als'],
  },
});
```

### 5. デプロイする {#_5-deploy}

```bash
void auth login
void deploy
```

## Void の機能を使う {#using-void-features}

[Void プラットフォームの機能](../../guide/app-types.md#void-apps)のほとんどは、Nuxt でも動作します。サーバールート、API ハンドラー、ミドルウェアで使用してください。

Void が管理する認証は、フレームワークモードではまだサポートされていません。当面は、Better Auth の公式 Nuxt 統合を直接使用してください。

### データベース {#database}

```ts
import { users } from '@schema';
// server/api/users.get.ts
import { db } from 'void/db';

export default defineEventHandler(async () => {
  return db.select().from(users);
});
```

### その他のリソース {#other-resources}

[KV](../../guide/kv.md)、[オブジェクトストレージ](../../guide/storage.md)、[AI](../../guide/ai.md) は、Void アプリと同じインポートでサーバーサイドのコードから使用できます。[cron ジョブ](../../guide/jobs.md)は `crons/` に、[キューコンシューマー](../../guide/queues.md)は `queues/` に追加します。

### 環境変数 {#environment-variables}

変数は `env.ts` で宣言し、`import { env } from "void/env"` で読み取ります。ローカル値、本番シークレット、公開用の `VITE_*` 値については、[環境変数](../../guide/env-vars.md)を参照してください。

`void/env` は、環境変数へのアクセスにおける `useRuntimeConfig()` と `event.context.cloudflare.env` の代わりになります。生のバインディング(D1、KV、R2 など)に直接アクセスする必要がある場合は `event.context.cloudflare.env` を、環境変数以外のランタイム設定が必要な場合は `useRuntimeConfig()` を引き続き使用してください。

## バインディングに直接アクセスする {#accessing-bindings-directly}

Nitro のイベントコンテキストを通じて、Cloudflare の生のバインディングにアクセスすることもできます。

```ts
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env;
  const { results } = await DB.prepare('SELECT * FROM users').all();
  return results;
});
```
