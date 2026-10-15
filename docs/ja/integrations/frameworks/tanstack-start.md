---
outline: deep
---

# TanStack Start {#tanstack-start}

[TanStack Start](https://tanstack.com/start/latest) の Vite プラグインと並べて `voidPlugin()` を追加すると、Void のデータベース、ストレージ、デプロイ機能を利用できます。別途 Cloudflare アダプターは必要ありません。

## セットアップ {#setup}

### 1. 新しいプロジェクトを作成する {#_1-create-a-new-project}

```bash
npm create @tanstack/start@latest my-app
cd my-app
```

### 2. 依存関係をインストールする {#_2-install-dependencies}

```bash
npm install -D void
```

### 3. `vite.config.ts` を設定する {#_3-configure-vite-config-ts}

```ts
import { tanstackStart } from '@tanstack/react-start/plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [
    voidPlugin(), // must come before the framework plugin
    tanstackStart(),
    react(),
  ],
});
```

### 4. デプロイする {#_4-deploy}

```bash
void auth login
void deploy
```

## Void の機能を使う {#using-void-features}

[Void プラットフォームの機能](../../guide/app-types.md#void-apps)のほとんどは TanStack Start で動作します。サーバー関数で使用できます。

Void が管理する認証は、フレームワークモードではまだサポートされていません。当面は Better Auth の公式 TanStack Start インテグレーションを直接使用してください。

### データベース {#database}

```tsx
import { users } from '@schema';
import { createServerFn } from '@tanstack/react-start';
import { db } from 'void/db';

const getUsers = createServerFn().handler(async () => {
  return db.select().from(users);
});
```

### その他のリソース {#other-resources}

[KV](../../guide/kv.md)、[オブジェクトストレージ](../../guide/storage.md)、[AI](../../guide/ai.md) は、Void アプリと同じインポートでサーバーサイドのコードから使用できます。[cron ジョブ](../../guide/jobs.md)は `crons/` に、[キューコンシューマー](../../guide/queues.md)は `queues/` に追加します。

### 環境変数 {#environment-variables}

変数は `env.ts` で宣言し、`import { env } from "void/env"` で読み取ります。ローカルの値、本番用のシークレット、公開用の `VITE_*` の値については[環境変数](../../guide/env-vars.md)を参照してください。

## バインディングに直接アクセスする {#accessing-bindings-directly}

`cloudflare:workers` モジュールを通じて、Cloudflare バインディングにアクセスすることもできます。

```tsx
import { env } from 'cloudflare:workers';

const { results } = await env.DB.prepare('SELECT * FROM users').all();
```
