---
outline: deep
---

# サーバールーティング {#server-routing}

`routes/` にファイルを作成するとエンドポイントを追加でき、サポートしたい HTTP メソッドごとにハンドラーをエクスポートします。Void は、ルーティングとミドルウェアに [Hono](https://hono.dev) を使用します。

## ルートファイル {#route-files}

`routes/**/*.ts` にルートハンドラーを作成します。各ファイルは、ファイルシステム上の位置に基づいて URL パスに対応付けられます。

<RoutesFileTree />

動的セグメントには角括弧を使用します。`[id]` はルートパラメーターに、`[...slug]` はキャッチオールになります。`_` で始まるファイルやディレクトリは無視されます。`(admin)` のように括弧で囲まれたディレクトリはルートグループです。URL を変えずにファイルを整理するのに役立ちます。

### 環境限定のルート {#environment-only-routes}

拡張子の前に `.dev` または `.prod` のサフィックスを付けると、ルートを一方の環境だけに含められます。

```
routes/
  api/health.ts        →  always
  api/debug.dev.ts     →  development only
  api/metrics.prod.ts  →  production only
```

`.dev` ルートは開発中のみ動作し、`.prod` ルートはビルド、デプロイ、本番プレビューで動作します。`.dev` ルートでのみ使用されるリソースは、本番用にはプロビジョニングされません。

サフィックスは `routes/` でのみ有効で、`pages/`、`middleware/`、`crons/`、`queues/` では有効ではありません。`void prepare` は両方の環境の型を生成します。

各ファイルは、特定のメソッドを処理するために、名前付きの HTTP メソッド定数をエクスポートします。

```ts
// routes/api/hello.ts  →  GET /api/hello
import { defineHandler } from 'void';

export const GET = defineHandler((c) => {
  return { message: 'Hello!', timestamp: Date.now() };
});
```

1 つのファイルから複数のメソッドをエクスポートできます。

```ts
import { users } from '@schema';
// routes/api/users/index.ts  →  GET + POST /api/users
import { defineHandler } from 'void';
import { db } from 'void/db';

export const GET = defineHandler(async () => {
  return await db.select().from(users);
});

export const POST = defineHandler(async (c) => {
  const body = await c.req.json();
  await db.insert(users).values({ name: body.name });
  return { created: true };
});
```

D1、PostgreSQL、MySQL を使ったクエリについては、[データベース](./database.md)を参照してください。

## `defineHandler` {#definehandler}

ハンドラーは、`c.env` に型付きの Cloudflare バインディングを持つ Hono の `Context` を受け取ります([Cloudflare](../integrations/cloudflare.md)を参照)。Hono の API(`c.json()`、`c.text()`、`c.header()` など)をすべて使用できます。

戻り値は自動的に変換されます。

- **object/array/number/boolean** → JSON レスポンス
- **`string`** → `text/html; charset=utf-8`
- **`null`/`undefined`** → `204 No Content`
- **`Response`** → そのまま返される

## バリデーション {#validation}

`defineHandler.withValidator()` は、`body`、`query`、`params` の入力バリデーションを追加します。推奨される方法は、[Drizzle スキーマ](./database.md#schema-derived-validators)からバリデーターを導出することです。これにより、バリデーションがデータベースと同期されます。

```ts
import { users, insertUserSchema } from '@schema';
// routes/api/users/index.ts
import { defineHandler } from 'void';
import { db } from 'void/db';

export const POST = defineHandler.withValidator({
  body: insertUserSchema,
})(async (c, { body }) => {
  const [created] = await db.insert(users).values(body).returning();
  return created;
});
```

カラムの絞り込みを伴う `createInsertSchema` のセットアップ方法については、[データベース: スキーマから導出されるバリデーター](./database.md#schema-derived-validators)を参照してください。

### 手動のバリデーター {#manual-validators}

データベースのテーブルに対応しないエンドポイントでは、[Standard Schema](https://standardschema.dev/) 互換の任意のライブラリー(Valibot、Zod、ArkType など)を使って、バリデーターを手書きできます。

```ts
import * as v from 'valibot';
import { defineHandler } from 'void';

export const POST = defineHandler.withValidator({
  body: v.object({
    query: v.pipe(v.string(), v.minLength(1)),
    limit: v.optional(v.pipe(v.number(), v.maxValue(100)), 10),
  }),
})(async (c, { body }) => {
  // body is typed as { query: string; limit: number }
  return search(body.query, body.limit);
});
```

### バリデーションエラー {#validation-errors}

バリデーションに失敗すると、構造化されたエラーの詳細とともに `400` レスポンスが返されます。

```json
{
  "error": "Validation failed",
  "issues": [
    {
      "slot": "body",
      "issues": [{ "message": "Invalid email", "path": "email" }]
    }
  ]
}
```

選択したバリデーターライブラリーをインストールしてください。Standard Schema の別個の依存関係は不要です。

バリデーターのスキーマは[型付き fetch クライアント](./typed-fetch.md)にも使われるため、`body`、`query`、`params` の型は呼び出し側で強制されます。

## ミドルウェア {#middleware}

Void は Hono のミドルウェアを使用します。`defineMiddleware()` は通常の `(c, next)` 関数に型を追加し、`defineHandler()` は Hono のミドルウェアも直接受け付けます。

```ts
import { defineMiddleware } from 'void';

export const addServerTiming = defineMiddleware(async (c, next) => {
  const start = performance.now();
  await next();
  c.header('Server-Timing', `app;dur=${Math.round(performance.now() - start)}`);
});
```

`hono/*` の組み込みミドルウェア、レスポンスヘルパー、サードパーティーの Hono エコシステムのパッケージは、すべて Void アプリで使用できます。アプリで `hono/*` からインポートする場合は、先にアプリに `hono` をインストールしてください。

```bash
npm install hono
```

```ts
import { cors } from 'hono/cors';

const allowDashboard = cors({ origin: 'https://app.example.com' });
```

ミドルウェアは、グローバルにも、ルートごとにも適用できます。

### グローバルミドルウェア {#global-middleware}

グローバルミドルウェアはすべてのリクエストで実行されます。ファイルを `middleware/` に置き、順序付けには数値のプレフィックスを使用します。

- `middleware/01.logger.ts`
- `middleware/02.auth.ts`

```ts
import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  console.log(c.req.method, c.req.path);
  await next();
});
```

一時的なサイトのゲートには `basicAuth()` を使用します。Void が予約している `/__void` エンドポイントは、デプロイや開発ツールのためにアクセス可能なままです。認証情報はコールバックを通じて読み取ります。

```ts
// env.ts
import { defineEnv, string } from 'void/env';

export default defineEnv({
  BASIC_AUTH_USERNAME: string(),
  BASIC_AUTH_PASSWORD: string(),
});
```

```ts
// middleware/01.basic-auth.ts
import { basicAuth } from 'void';
import { env } from 'void/env';

export default basicAuth({
  username: () => env.BASIC_AUTH_USERNAME,
  password: () => env.BASIC_AUTH_PASSWORD,
  realm: 'Preview',
});
```

`BASIC_AUTH_USERNAME` と `BASIC_AUTH_PASSWORD` は、開発用にはローカルの環境変数として、本番用にはデプロイ前にシークレットとして設定してください。

ヘルスチェックや公開 Webhook など、アプリ固有のバイパスが必要な場合は、`basicAuth()` を呼び出す前に、独自のミドルウェアでそのロジックを組み立ててください。

後続のハンドラーとデータを共有するには `c.set()` を使用します。`c.get()` で型付きのアクセスを行うには、`CloudContextVariables` を拡張します。[コンテキスト変数](./type-safety.md#context-variables)を参照してください。

### ルートごとのミドルウェア {#per-route-middleware}

最終的なルートハンドラーの前に、ミドルウェアを `defineHandler` に渡します。

```ts
defineHandler(middleware1, middleware2, handler);
```

ミドルウェアは順番に実行されます。それぞれが、ショートサーキット(`next()` を呼び出さずにレスポンスを返す)することも、後処理(`await next()` の後でレスポンスを変更する)することもできます。`defineMiddleware` でラップされた関数も、素の Hono の `MiddlewareHandler` 関数も受け付けます。

```ts
import { cors } from 'hono/cors';
// routes/api/stats.ts
import { defineHandler } from 'void';

export const GET = defineHandler(cors({ origin: 'https://app.example.com' }), (c) => ({
  stats: '...',
}));
```

ハンドラーの前に最大 5 つのミドルウェアを渡すことができ、各位置で完全な型推論が行われます。

その他の例については、[Hono 統合ガイド](../integrations/hono.md)を参照してください。
