---
outline: deep
---

# Analog {#analog}

[Analog](https://analogjs.org/) で Void を使うと、リソースの検出、型付きデータベースクエリ、マイグレーションが利用できます。Analog は独自のビルドと Cloudflare インテグレーションを維持し、Void はその Vite 設定に組み込まれます。

## セットアップ {#setup}

### 1. 新しいプロジェクトを作成する {#_1-create-a-new-project}

```bash
npx create-analog@latest my-app
cd my-app
```

### 2. 依存関係をインストールする {#_2-install-dependencies}

```bash
npm install -D void nitro-cloudflare-dev
```

Void はローカルの Cloudflare バインディングランタイムを提供します。`nitro-cloudflare-dev` は開発中にプラットフォームプロキシを作成し、`void/db`、`void/kv` などのランタイムヘルパーがバインディングにアクセスできるようにします。

### 3. `vite.config.ts` を設定する {#_3-configure-vite-config-ts}

```ts
import analog from '@analogjs/platform';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      ssr: true,
      nitro: {
        preset: 'cloudflare-module',
        cloudflareDev: { configPath: './.void-wrangler.jsonc' },
        modules: ['nitro-cloudflare-dev', 'void/nitro'],
      },
    }),
    voidPlugin(),
  ],
});
```

`void/nitro` モジュールにより、Analog の API ルートとページのサーバーロードから、アプリの `void/db` と `@schema` を利用できるようになります。

### 4. `void.config.ts` を作成する {#_4-create-void-config-ts}

Void は、Analog の開発ランタイムが使用する Cloudflare の設定を生成します。

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

`nodejs_compat` は Nitro の Cloudflare ランタイムに必要です。`nodejs_als` は `void/*` のランタイムヘルパー(例: `void/db`、`void/kv`)に必要です。

### 5. デプロイする {#_5-deploy}

```bash
void auth login
void deploy
```

## Void の機能を使う {#using-void-features}

[Void プラットフォームの機能](../../guide/app-types.md#void-apps)のほとんどは Analog で動作します。ページのサーバーローダー、アクション、API ルートで使用できます。

Void が管理する認証は、フレームワークモードではまだサポートされていません。当面は Better Auth の公式インテグレーションを直接使用してください。

### データベース {#database}

```ts
// src/app/pages/users.server.ts
import type { PageServerLoad } from '@analogjs/router';
import { users } from '@schema';
import { db } from 'void/db';

export const load = async ({ event }: PageServerLoad) => {
  return { users: await db.select().from(users) };
};
```

### その他のリソース {#other-resources}

[KV](../../guide/kv.md)、[オブジェクトストレージ](../../guide/storage.md)、[AI](../../guide/ai.md) は、Void アプリと同じインポートでサーバーサイドのコードから使用できます。[cron ジョブ](../../guide/jobs.md)は `crons/` に、[キューコンシューマー](../../guide/queues.md)は `queues/` に追加します。

### 環境変数 {#environment-variables}

変数は `env.ts` で宣言し、`import { env } from "void/env"` で読み取ります。ローカルの値、本番用のシークレット、公開用の `VITE_*` の値については[環境変数](../../guide/env-vars.md)を参照してください。

`void/env` は、環境変数へのアクセスにおいて、H3 のイベントコンテキストと `import { env } from "cloudflare:workers"` の代わりになります。生のバインディング(D1、KV、R2 など)へのアクセスが必要な場合は、これらを引き続き使用してください。

## バインディングに直接アクセスする {#accessing-bindings-directly}

H3 のイベントコンテキストまたは `cloudflare:workers` モジュールを通じて、生の Cloudflare バインディングにアクセスすることもできます。

```ts
import { env } from 'cloudflare:workers';
// src/server/routes/api/users.ts
import { eventHandler } from 'h3';

export default eventHandler(async () => {
  const { results } = await env.DB.prepare('SELECT * FROM users').all();
  return results;
});
```
