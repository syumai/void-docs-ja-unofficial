---
outline: deep
---

# Hono {#hono}

Void のハンドラーは [Hono](https://hono.dev) 上で動作します。Void は内部で Hono に依存していますが、アプリが `hono/*` から直接インポートする場合は、先にアプリの依存関係に `hono` を追加してください。

```bash
npm install hono
```

アプリに `hono` をインストールすれば、組み込みのミドルウェアやヘルパー、サードパーティの Hono パッケージを直接使用できます。

## 組み込みミドルウェア {#built-in-middleware}

Hono の組み込みミドルウェアは、グローバルなミドルウェアファイルまたはルートごとに使用できます。

```ts
import { cors } from 'hono/cors';
// middleware/01.cors.ts
import { defineMiddleware } from 'void';

export default defineMiddleware(cors({ origin: 'https://example.com' }));
```

```ts
import { cache } from 'hono/cache';
// routes/api/products.ts (per-route cache)
import { defineHandler } from 'void';
import { listProducts } from '../../lib/products';

export const GET = defineHandler(
  cache({ cacheName: 'products', cacheControl: 'max-age=3600' }),
  async () => ({ products: await listProducts() }),
);
```

::: warning
`cache()` は URL ごとに 1 つのレスポンスを保存し、すべての訪問者に返します。`Authorization` ヘッダーを持つリクエストはスキップしますが、Cookie は考慮しません。全員に同じレスポンスを返すルートでのみ使用し、サインイン中のユーザーを読み取るルートでは決して使用しないでください。ページをキャッシュするには、Cookie を持つリクエストをスキップする[再検証](../guide/edge/revalidation.md)を使用してください。
:::

```ts
import { bearerAuth } from 'hono/bearer-auth';
// routes/api/webhooks/stripe.ts (per-route usage)
import { defineHandler } from 'void';

export const POST = defineHandler(bearerAuth({ token: 'webhook-secret' }), async (c) => {
  const body = await c.req.json();
  return { received: true };
});
```

## レスポンスヘルパー {#response-helpers}

Hono のコンテキストヘルパーは、すべてのハンドラーで `c` から利用できます。

```ts
import { stream } from 'hono/streaming';
// routes/api/download.ts
import { defineHandler } from 'void';

export const GET = defineHandler((c) => {
  return stream(c, async (stream) => {
    await stream.write('chunk 1');
    await stream.write('chunk 2');
  });
});
```

```ts
// routes/api/data.ts
import { defineHandler } from 'void';

export const GET = defineHandler((c) => {
  c.header('X-Custom', 'value');
  c.status(201);
  return c.json({ created: true });
});
```

## サードパーティミドルウェア {#third-party-middleware}

`hono/*` や `@hono/*` のパッケージはどれも使用できます。アプリにパッケージをインストールして、直接使用します。

```ts
import { rateLimiter } from 'hono-rate-limiter';
// middleware/01.rate-limit.ts
import { defineMiddleware } from 'void';

export default defineMiddleware(rateLimiter({ windowMs: 60_000, limit: 100 }));
```

## ユーティリティ {#utilities}

Hono のスタンドアロンのヘルパーは、どこでも使用できます。

```ts
import { HTTPException } from 'hono/http-exception';

// 型付きの HTTP エラーをスローする
throw new HTTPException(404, { message: 'User not found' });
```

組み込みミドルウェアの完全な一覧は、[Hono のドキュメント](https://hono.dev/docs/middleware/builtin)を参照してください。
