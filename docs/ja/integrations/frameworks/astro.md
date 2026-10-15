---
outline: deep
---

# Astro {#astro}

[Astro](https://astro.build/) で Void を使用すると、リソースの検出、型付きのデータベースクエリ、マイグレーションを利用できます。Astro は独自のビルドと Cloudflare インテグレーションを維持し、Void はその Vite 設定に組み込まれます。

::: warning Astro 6 が必要です

- Astro アプリで `import { x } from "void/x"` ヘルパーを使用するには、[Astro 6 以上](https://astro.build/blog/astro-6/)が必要です。
- また、Cloudflare の設定で `compatibility_flags` に `"nodejs_als"` を有効にする必要があります。
:::

## セットアップ {#setup}

### 1. 新しいプロジェクトを作成する {#1-create-a-new-project}

```bash
npm create astro@latest my-app
cd my-app
```

### 2. 依存関係をインストールする {#2-install-dependencies}

```bash
npm install -D @astrojs/cloudflare void
```

### 3. `astro.config.mjs` を設定する {#3-configure-astro-config-mjs}

```js
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import { voidPlugin } from 'void';

export default defineConfig({
  adapter: cloudflare({ configPath: './.void-wrangler.jsonc' }),
  vite: { plugins: [voidPlugin()] },
});
```

### 4. `void.config.ts` を作成する {#4-create-void-config-ts}

Void は、開発時とデプロイ時に、この設定を Cloudflare アダプター用に使用します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  cloudflare: {
    name: 'my-app',
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_als'],
  },
});
```

Astro で `void/*` のランタイムヘルパー（たとえば `void/db`、`void/kv`）を使用するには、`nodejs_als` が必要です。

### 5. デプロイする {#5-deploy}

```bash
void auth login
void deploy
```

## Void の機能を使用する {#using-void-features}

[Void プラットフォームの機能](../../guide/app-types.md#void-apps)の多くは、Astro 6 以上で `nodejs_als` を使用している場合、ローカル開発と本番環境の両方で Astro と連携して動作します。

Void が管理する認証は、フレームワークモードではまだサポートされていません。当面は、Better Auth の公式の Astro インテグレーションを直接使用してください。

ランタイムバインディングにアクセスするページは、プリレンダリングをオプトアウトする必要があります。

```astro
---
export const prerender = false;
// now Astro.locals.runtime is available
---
```

### データベース {#database}

API ルートとサーバーサイドのコードで `void/db` を使用します。

```ts
import { users } from '@schema';
import type { APIRoute } from 'astro';
import { db } from 'void/db';

export const GET: APIRoute = async () => {
  const rows = await db.select().from(users);
  return Response.json(rows);
};
```

### その他のリソース {#other-resources}

[KV](../../guide/kv.md)、[オブジェクトストレージ](../../guide/storage.md)、[AI](../../guide/ai.md) は、Void アプリと同じインポートでサーバーサイドのコードから使用できます。[cron ジョブ](../../guide/jobs.md)は `crons/` に、[キューコンシューマー](../../guide/queues.md)は `queues/` に追加します。

### 環境変数 {#environment-variables}

`env.ts` で変数を宣言し、`import { env } from "void/env"` で読み取ります。ローカルの値、本番環境のシークレット、公開される `VITE_*` の値については、[環境変数](../../guide/env-vars.md)を参照してください。

Void は、Astro プロジェクトであっても、クライアントに公開されるスキーマキーには常に `VITE_*` を使用します。Astro 独自の `PUBLIC_*` の規約は、`import.meta.env` への直接アクセスには引き続き適用されますが、`void/env` のサーバーとクライアントの境界は変わりません。

`void/env` は、環境変数へのアクセスにおいて、[`astro:env`](https://docs.astro.build/en/guides/environment-variables/) と `Astro.locals.runtime.env` に代わるものです。生のバインディング（D1、KV、R2 など）に直接アクセスする必要がある場合は、`Astro.locals.runtime.env` を引き続き使用してください。

## バインディングに直接アクセスする {#accessing-bindings-directly}

バインディングには `Astro.locals.runtime.env` からアクセスします（開発と本番の両方で動作します）。

```ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const { DB } = locals.runtime.env;
  const { results } = await DB.prepare('SELECT * FROM users').all();
  return Response.json(results);
};
```

`.astro` ページでは（`prerender = false` を設定するのを忘れないでください）:

```astro
---
export const prerender = false;
const { DB } = Astro.locals.runtime.env;
const { results } = await DB.prepare("SELECT * FROM users").all();
---
```
