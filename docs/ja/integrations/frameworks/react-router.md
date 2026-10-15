---
outline: deep
---

# React Router v7 {#react-router-v7}

[React Router v7](https://reactrouter.com/) の Vite プラグインと併せて `voidPlugin()` を追加すると、Void のデータベース、ストレージ、デプロイの機能を使用できます。別途 Cloudflare アダプターは必要ありません。

## セットアップ {#setup}

### 1. 新しいプロジェクトを作成する {#1-create-a-new-project}

```bash
npm create react-router@latest my-app
cd my-app
```

### 2. 依存関係をインストールする {#2-install-dependencies}

```bash
npm install -D void
```

### 3. `vite.config.ts` を設定する {#3-configure-vite-config-ts}

```ts
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [
    voidPlugin(), // must come before the framework plugin
    reactRouter(),
  ],
});
```

### 4. デプロイする {#4-deploy}

```bash
void auth login
void deploy
```

## Void の機能を使用する {#using-void-features}

[Void プラットフォームの機能](../../guide/app-types.md#void-apps)の多くは、React Router でも動作します。ローダーとアクションで使用します。

Void が管理する認証は、フレームワークモードではまだサポートされていません。当面は、Better Auth の公式の React Router インテグレーションを直接使用してください。

### データベース {#database}

```tsx
import { users } from '@schema';
import { db } from 'void/db';
import type { Route } from './+types/users';

export async function loader({}: Route.LoaderArgs) {
  return { users: await db.select().from(users) };
}
```

### その他のリソース {#other-resources}

[KV](../../guide/kv.md)、[オブジェクトストレージ](../../guide/storage.md)、[AI](../../guide/ai.md) は、Void アプリと同じインポートでサーバーサイドのコードから使用できます。[cron ジョブ](../../guide/jobs.md)は `crons/` に、[キューコンシューマー](../../guide/queues.md)は `queues/` に追加します。

### 環境変数 {#environment-variables}

`env.ts` で変数を宣言し、`import { env } from "void/env"` で読み取ります。ローカルの値、本番環境のシークレット、公開される `VITE_*` の値については、[環境変数](../../guide/env-vars.md)を参照してください。

サーバーシークレットは `.server.ts` のコンパニオンモジュールで読み取り、ローダーやアクションにインポートしてください。Void は、ブラウザーコンポーネントも含むルートファイルでのサーバーシークレットの読み取りを拒否します。

## バインディングに直接アクセスする {#accessing-bindings-directly}

`cloudflare:workers` モジュールを介して、Cloudflare のバインディングにアクセスすることもできます。

```tsx
import { env } from 'cloudflare:workers';

const { results } = await env.DB.prepare('SELECT * FROM users').all();
```
