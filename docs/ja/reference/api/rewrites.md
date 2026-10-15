---
outline: deep
---

# リライト {#rewrites}

URL リライトは、ブラウザーの URL を変えずに、別の内部パスでリクエストを再ディスパッチします。`c.rewrite()`、`c.originalUrl()`、`c.isRewritten()` は、Void ランタイムが渡すすべての Hono `Context` で利用できます。[`void.config.ts`](../config.md#routing) の静的な `routing.rewrites` / `routing.fallbacks` を含む全体像については、[リライトガイド](../../guide/edge/rewrites.md)を参照してください。

## `c.rewrite(destination)` {#c-rewrite-destination}

現在のリクエストを `destination` で再ディスパッチし、その結果の `Response` を返します。ブラウザーの URL は変わりません。これはサーバー側のホップです。`destination` にクエリ文字列がない場合、元のリクエストのクエリが保持されます。`destination` にクエリ文字列がある場合は、元のクエリを置き換えます。`destination` は `/` で始まる必要があります。既知の生成済みルートは [`RewriteDestination`](#rewritedestination) によって補完されますが、動的なパスのために任意の文字列も受け付けられます。

`c.redirect()` も内部の宛先ではリクエストのクエリパラメーターを保持しますが、置き換えではなくマージします。衝突した場合は宛先のパラメーターが優先され、リクエストにのみあるパラメーターは追加されます。

```ts
import { defineHandler } from 'void';

export const GET = defineHandler((c) => {
  const locale = c.req.header('accept-language')?.startsWith('de') ? 'de' : 'en';
  return c.rewrite(`/${locale}${new URL(c.req.url).pathname}`);
});
```

**シグネチャ:**

```ts
interface CloudContext {
  rewrite(destination: RewriteDestination): Promise<Response>;
}
```

**注意点:**

- `destination` は単一の `/` で始まり、内部パスを指している必要があります。外部 URL、プロトコル相対の宛先(`//host/...`)、パス絶対でないものは、すぐにスローされます。オリジン間の呼び出しには `fetch()` を使用してください。
- 最後のパスセグメントが既知の静的アセット拡張子(例: `/hero.png`、`/app.css`、`/data.json`)で終わる宛先は、再ディスパッチの前に `VoidAssetRewriteError`(`"void"` からエクスポートされます)をスローします。ランタイムのリライトはアセットに到達できません。静的な `routing.rewrites` ルールか、`_redirects` の `200!` エントリーを使用してください。`.html` は、`.html` のパスが正当なルートハンドラーである可能性があるため、このガードから意図的に除外されています。[リライト](../../guide/edge/rewrites.md#runtime-rewrites-cannot-reach-static-assets)を参照してください。
- ミドルウェアは、リライトのホップごとに再実行されます。副作用は [`c.isRewritten()`](#c-originalurl-c-isrewritten) でガードしてください。
- `Link` によるクライアントサイドの SPA ナビゲーションはサーバーのリライトをトリガーしません。完全な HTTP リクエストのみがトリガーします。
- リライトされた [ISR エントリー](../../guide/edge/revalidation.md#cache-keys-and-rewrites)をクリアするには、宛先のパスをパージします。

## `c.originalUrl()` / `c.isRewritten()` {#c-originalurl-c-isrewritten}

リライトの状態を調べるためのコンテキストメソッドです。`c.originalUrl()` は、リライト前の URL を `URL` オブジェクトとして返します。最初の、リライトされていないホップでは `null` を返します。`c.isRewritten()` は、再ディスパッチされたコンテキストでは `true`、元のコンテキストでは `false` を返します。静的リライトとミドルウェアリライトの両方で使用できます。

```ts
import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  if (!c.isRewritten()) {
    // Only log the user-visible request, not internal rewrite hops.
    console.log(`${c.req.method} ${c.req.path}`);
  }
  await next();
});
```

**シグネチャ:**

```ts
interface CloudContext {
  originalUrl(): URL | null;
  isRewritten(): boolean;
}
```

## `RewriteDestination` {#rewritedestination}

```ts
import type { RewriteDestination } from 'void/routes';
```

既知のルートパターンをエディターで候補として提示しつつ、動的な文字列も受け付けます。次の箇所で使用されます。

- [`c.rewrite()`](#c-rewrite-destination) のパラメーターの型。
- [`void.config.ts`](../config.md#routing) の `routing.rewrites` と `routing.fallbacks` における `destination` エントリーの型。

[`RouteMap`](./types.md#routemap) と同様に、`RewriteDestination` は仮想モジュール `void/routes` にあり、ルートが変更されるたびに更新されます。
