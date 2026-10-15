---
outline: deep
---

# ハンドラーとミドルウェア {#handlers}

`"void"` または `"void/handler"` からインポートします。

## `defineHandler(handler)` {#definehandler-handler}

ルートハンドラー関数をラップします。ハンドラーは [`CloudContext`](./types.md#cloudcontext) を受け取り、プレーンな値を返す (自動的に Response に変換されます) か、Hono の `c.json()` / `c.text()` API を直接使用できます。

```ts
import { defineHandler } from 'void';

export const GET = defineHandler((c) => {
  return { message: 'hello' };
});
```

**シグネチャ:**

```ts
function defineHandler<R>(handler: (c: CloudContext) => R): TypedHandler<{}, R>;
```

## `defineHandler(middleware..., handler)` {#definehandler-middleware-handler}

最大 5 つのルートごとのミドルウェアと、最後のハンドラーを組み合わせます。ミドルウェアは、ハンドラーの前に順番に実行されます。

```ts
export const GET = defineHandler(authMiddleware, rateLimiter, (c) => {
  return { ok: true };
});
```

## `defineHandler.withValidator(validators)` {#definehandler-withvalidator-validators}

[Standard Schema](https://github.com/standard-schema/standard-schema) 互換の任意のライブラリ (zod、valibot、arktype など) を使用して、入力バリデーション付きのハンドラーを作成します。ハンドラーを受け取るカリー化された関数を返します。

検証済みの入力は、ハンドラーの第 2 引数として渡されます。

```ts
import * as v from 'valibot';
import { defineHandler } from 'void';

export const POST = defineHandler.withValidator({
  body: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
  }),
})((c, { body }) => {
  return { received: body.name };
});
```

**シグネチャ:**

```ts
function withValidator<V extends ValidatorSlots>(
  validators: V,
): <R>(handler: (c: CloudContext, input: HandlerInput<V>) => R) => TypedHandler<V, R>;
```

**型: `ValidatorSlots`**

```ts
interface ValidatorSlots {
  body?: StandardSchemaV1;
  query?: StandardSchemaV1;
  params?: StandardSchemaV1;
}
```

**型: `HandlerInput<V>`**

各バリデータースロットから推論される出力の型です。`body` と `query` を持つ `ValidatorSlots` の場合、入力オブジェクトは `{ body: ..., query: ... }` となり、型はスキーマの出力から推論されます。

## `defineMiddleware(handler)` {#definemiddleware-handler}

Hono ミドルウェアの型安全なラッパーです。

```ts
import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
});
```

**シグネチャ:**

```ts
function defineMiddleware(handler: MiddlewareHandler<CloudEnv>): MiddlewareHandler<CloudEnv>;
```

## `basicAuth(options)` {#basicauth-options}

一時的なサイトのゲートやリリース前の保護のための、組み込みの Basic 認証ミドルウェアです。`middleware/` から `void/env` の認証情報とともに使用するとアプリ全体を保護でき、`defineHandler()` に渡すと単一のルートを保護できます。

Void が予約している `/__void` エンドポイントは独自の認証を使用するため、Basic 認証の対象外です。

認証情報を `void/env` から取得する場合は、Void がランタイムの env をバインドした後にリクエストごとに解決されるよう、読み取りを関数でラップしてください。

`password` が空の値に解決された場合、リクエストはゲートを通過せず、サーバーエラーで失敗します。

ヘルスチェックや公開 Webhook など、アプリ固有のバイパスが必要な場合は、`basicAuth()` を呼び出す前に、そのロジックを独自のミドルウェアに組み込んでください。

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

**シグネチャ:**

```ts
function basicAuth(options: {
  username: string | (() => string);
  password: string | (() => string);
  realm?: string | (() => string);
  message?: string | (() => string);
}): MiddlewareHandler<CloudEnv>;
```

## `defineScheduled(handler)` {#definescheduled-handler}

Cloudflare の [Scheduled ハンドラー](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)を、型推論付きでラップします。

```ts
import { defineScheduled } from 'void';

export default defineScheduled(async (controller, env, ctx) => {
  const { results } = await env.DB.prepare('SELECT * FROM stale').all();
  // ...
});
```

**シグネチャ:**

```ts
function defineScheduled(
  handler: (
    controller: ScheduledController,
    env: CloudEnv['Bindings'],
    ctx: ExecutionContext,
  ) => unknown | Promise<unknown>,
): ScheduledFn;
```

## `defineQueue<T>(handler)` {#definequeue-t-handler}

[キュー](../../guide/queues.md)のコンシューマーハンドラーを、型付きのメッセージ本体でラップします。ジェネリクスの `<T>` はメッセージ本体の型を定義し、その型は `send()` 呼び出し用の型付き `queues` プロキシに引き継がれます。

```ts
import { defineQueue } from 'void';

export default defineQueue<{ to: string; subject: string }>(async (batch, env) => {
  for (const msg of batch.messages) {
    console.log(`Send to ${msg.body.to}: ${msg.body.subject}`);
  }
});
```

**シグネチャ:**

```ts
function defineQueue<T>(
  handler: (batch: QueueBatch<T>, env: CloudEnv['Bindings']) => void | Promise<void>,
): TypedQueueHandler<T>;
```

## `defineRender(handler)` {#definerender-handler}

SSR のレンダーエントリーをラップします。第 2 引数は、クライアントのスクリプトとスタイルを挿入するための、あらかじめ生成された `<head>` と `<body>` のアセットタグを提供します。

```ts
import { defineRender } from "void";
import { renderToString } from "react-dom/server";

export default defineRender((c, assetTags) => {
  const html = renderToString(<App />);
  return c.html(`<!DOCTYPE html>
    <html><head>${assetTags.css}${assetTags.preloads}</head>
    <body><div id="root">${html}</div>${assetTags.body}</body></html>`);
});
```

**シグネチャ:**

```ts
function defineRender(
  handler: (c: CloudContext, assetTags: RenderAssetTags) => Response | Promise<Response>,
): RenderFn;
```

**型: `RenderAssetTags`**

```ts
interface RenderAssetTags {
  css: string; // <head> 用のスタイルシートのリンク
  preloads: string; // <head> 用の modulepreload と開発用クライアントのタグ
  body: string; // </body> の前に置くスクリプトタグ
}
```

## `defineHead<P>(handler)` {#definehead-p-handler}

`.server.ts` ファイルのページの `head()` エクスポート向けの、型安全なラッパーです。第 1 引数には [`CloudContext`](./types.md#cloudcontext) の型を、第 2 引数にはジェネリクスによる props の型を提供します。

```ts
import { defineHandler, defineHead } from 'void';
import type { InferProps } from 'void';

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const post = await getPost(c.req.param('slug'));
  return { post };
});

export const head = defineHead<Props>((c, props) => {
  return {
    title: props.post.title,
    meta: [
      { name: 'description', content: props.post.excerpt },
      { property: 'og:title', content: props.post.title },
    ],
  };
});
```

**シグネチャ:**

```ts
function defineHead<P = Record<string, unknown>>(
  handler: (c: CloudContext, props: P) => HeadDescriptor | undefined,
): (c: CloudContext, props: P) => HeadDescriptor | undefined;
```
