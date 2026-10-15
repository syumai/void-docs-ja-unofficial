---
outline: deep
---

# SvelteKit {#sveltekit}

[SvelteKit](https://svelte.dev/docs/kit) で Void を使用すると、リソースの検出、型付きのデータベースクエリ、マイグレーションが利用できます。SvelteKit は独自のビルドと Cloudflare 連携を維持し、Void はその Vite 設定に組み込まれます。

Void は SvelteKit 3 と SvelteKit 2.62 以降をサポートします。以下のセットアップでは、SvelteKit 3 と `@sveltejs/adapter-cloudflare` 8 を使用します。

## セットアップ {#setup}

### 1. 新しいプロジェクトを作成する {#1-create-a-new-project}

```bash
npx sv create my-app
cd my-app
```

### 2. 依存関係をインストールする {#2-install-dependencies}

```bash
npm install -D @sveltejs/adapter-cloudflare void
```

### 3. `vite.config.ts` を設定する {#3-configure-vite-config-ts}

```ts
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { voidPlugin } from 'void';

export default {
  plugins: [
    voidPlugin(),
    sveltekit({
      adapter: adapter({
        config: './.void-wrangler.jsonc',
        platformProxy: { configPath: './.void-wrangler.jsonc' },
      }),
    }),
  ],
};
```

### 4. `void.config.ts` を作成する {#4-create-void-config-ts}

上記のように、SvelteKit のアダプターが Void の生成する Cloudflare 設定を参照するようにします。Cloudflare の設定は `void.config.ts` に追加します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  cloudflare: {
    name: 'my-app',
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_compat'],
  },
});
```

### 5. `tsconfig.json` を設定する {#5-configure-tsconfig-json}

SvelteKit が生成する設定と、Void が生成する型およびデータベースのエイリアスを継承します。

```json
{
  "extends": ["$app/tsconfig", "./.void/tsconfig.json"],
  "compilerOptions": {
    "types": ["$app/types", "void/env"]
  },
  "include": ["src", "db", "crons", "queues", "*.ts"]
}
```

新しくクローンした後や CI で型チェックを行う前に `void prepare` を実行して、SvelteKit が設定を同期する前に `.void/tsconfig.json` が存在するようにします。SvelteKit 3 の `#lib` のようなエイリアスには、`package.json` のサブパスインポートを使用します。

### 6. デプロイする {#6-deploy}

```bash
void auth login
void deploy
```

## Void の機能を使う {#using-void-features}

[Void プラットフォームの機能](../../guide/app-types.md#void-apps)の多くは SvelteKit でも動作します。サーバーの load 関数、アクション、API ルートで使用してください。

Void が管理する認証は、フレームワークモードではまだサポートされていません。現時点では、Better Auth の公式の SvelteKit 連携を直接使用してください。

### データベース {#database}

```ts
import { users } from '@schema';
// src/routes/users/+page.server.ts
import { db } from 'void/db';

export async function load() {
  return { users: await db.select().from(users) };
}
```

### その他のリソース {#other-resources}

[KV](../../guide/kv.md)、[オブジェクトストレージ](../../guide/storage.md)、[AI](../../guide/ai.md) は、Void アプリと同じインポートを使って、サーバー側のコードから利用できます。[cron ジョブ](../../guide/jobs.md)は `crons/` に、[キューコンシューマー](../../guide/queues.md)は `queues/` に追加します。

### 環境変数 {#environment-variables}

変数を `env.ts` で宣言し、`import { env } from "void/env"` で読み取ります。ローカルの値、本番のシークレット、公開される `VITE_*` の値については、[環境変数](../../guide/env-vars.md)を参照してください。

## バインディングへの直接アクセス {#accessing-bindings-directly}

SvelteKit 3 では、サーバー側のコードで `cloudflare:workers` モジュールを使用します。

```ts
import { env } from 'cloudflare:workers';

const { results } = await env.DB.prepare('SELECT * FROM users').all();
```

## 既存の SvelteKit 2 アプリ {#existing-sveltekit-2-apps}

SvelteKit 2.62 以降と `@sveltejs/adapter-cloudflare` 7 を使用します。上記の Vite 設定は Kit 2 でも動作します。`sveltekit()` のオプションに、Void の tsconfig フックを追加してください。

```ts
import { withVoidTSConfig } from 'void/sveltekit';

sveltekit({
  adapter: adapter({
    config: './.void-wrangler.jsonc',
    platformProxy: { configPath: './.void-wrangler.jsonc' },
  }),
  typescript: {
    config: withVoidTSConfig(),
  },
});
```

Kit 2 の tsconfig の設定を維持してください。

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "types": ["void/env"]
  }
}
```

アプリが `svelte.config.js` または `svelte.config.ts` を使用している場合は、その設定を維持したまま、`kit` の下に `typescript.config: withVoidTSConfig()` を追加します。Kit 2 の `platform.env` は、フックと load 関数で引き続き利用できます。
