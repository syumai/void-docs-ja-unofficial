---
outline: deep
---

# リライト {#rewrites}

リライトは、ブラウザーのアドレスを変えずに、別の URL のルートを返します。たとえば、`/docs` で `/en/docs` を返せます。ブラウザーを宛先に移動させたい場合は、[リダイレクト](./redirects)を使用します。

リライトは [`void.config.ts`](../../reference/config) で定義します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  routing: {
    rewrites: {
      '/': '/en',
      '/docs': '/en/docs',
      '/docs/*': '/en/docs/:splat',
    },
  },
});
```

`/docs/getting-started` へのリクエストは `/en/docs/getting-started` を返します。`/ja/docs/getting-started` のような他のロケールは、それぞれのルートを維持します。

## ルール {#rules}

- ソースと宛先は `/` で始めます。宛先はアプリ内のパスである必要があります。
- `*` は `/` を含む任意の文字列に一致します。宛先で `:splat` を使うと、一致した部分を参照できます。
- 最初に一致したルールが優先されます。具体的なパターンは、包括的なパターンより前に置いてください。
- リライトは、静的アセットとアプリケーションルートより前に実行されます。

## ミドルウェアでのプログラムによるリライト {#programmatic-rewrites-in-middleware}

Cookie から選択したロケールなど、宛先がリクエストに依存する場合は `c.rewrite()` を使用します。

```ts
import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  if (c.req.path.match(/^\/(en|ja)(\/|$)/)) return next();

  const locale = detectLocale(c.req);
  return c.rewrite(`/${locale}${c.req.path}`);
});
```

`c.rewrite()` の結果を返してください。ミドルウェアは宛先でも再度実行されるため、ループを避けるために、すでにリライト済みのパスはスキップします。1 度だけ行いたい処理をスキップするには、`c.isRewritten()` を使用します。

```ts
if (c.isRewritten()) return next();
```

アクセスチェックが必要な宛先には、そのチェックを残してください。

`?` を含まない宛先は、受信したクエリ文字列を保持します。`c.rewrite('/search')` は `?q=...` を保持しますが、`c.rewrite('/search?q=all')` はクエリ文字列を置き換えます。

エディターは、[`RewriteDestination`](../../reference/api/rewrites.md#rewritedestination) 型を通じて既知のルートを候補として提示します。動的な文字列も使用できます。

### ランタイムのリライトは静的アセットに到達できない {#runtime-rewrites-cannot-reach-static-assets}

`c.rewrite()` の対象はアプリケーションルートです。`/hero.png` のようなアセットを別の URL で返すには、代わりに `routing.rewrites` または `_redirects` のルールを使用します。認識されるアセット拡張子へのミドルウェアリライトは、`VoidAssetRewriteError` をスローします。

## 元の URL へのアクセス {#original-url-access}

`c.originalUrl()` は、静的リライトまたはミドルウェアリライトの前にリクエストされた URL を返します。リライトが発生していない場合は `null` を返します。正規リンクやロケール検出に使用できます。

```ts
import { defineHandler } from 'void';

export default defineHandler((c) => {
  const original = c.originalUrl();
  return c.json({ pathname: original?.pathname ?? c.req.path });
});
```

## フォールバック {#fallbacks}

`routing.fallbacks` はリライトと同じパターンを使用しますが、一致するアセットもルートもない場合にのみ適用されます。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  routing: {
    fallbacks: { '/*': '/index.html' },
  },
});
```

フォールバックは、クライアントサイドルーターやデフォルトロケールの包括的な受け皿に使用します。Void ルートが意図的に返した `404` は、`404` のままです。サードパーティーのフレームワークでは、フォールバックによってフレームワークの `404` レスポンスを置き換えることもできます。

SPA アプリはすでに `/index.html` にフォールバックします。カスタムのフォールバックルールが先に実行され、一致しないパスは引き続き SPA シェルを使用します。`'/*': '/index.html'` を自分で追加する必要はありません。

## `_redirects` ファイル {#redirects-file}

Vite の `publicDir`(既定は `public/`)にルールを置くこともできます。

```text
# Fallback: only when no asset or route matches
/*         /index.html     200

# Rewrite: before assets and routes
/docs/*    /en/docs/:splat  200!
```

このファイルには [3xx リダイレクト](./redirects)も記述できます。`void.config.ts` のルールはファイルのルールより優先され、各グループ内では最初に一致したものが優先されます。

## クライアントナビゲーション {#client-navigation}

リライトはサーバー上で実行されます。Pages モードでは、クライアントサイドの `<Link href="/docs">` によるナビゲーションが、リライト後のルート `/en/docs` ではなく `/docs` のローダーデータを取得する場合があります。

宛先のローダーが異なる場合は、`<a href="/docs">` を使用してサーバーへの完全なリクエストを行ってください。URL を変更したい場合は、リダイレクトを使用します。

## リライトと ISR キャッシュキー {#isr-cache-keys-with-rewrites}

リライトされたキャッシュエントリーをクリアするには、`/en/docs/foo` のような宛先のパスをパージします。[キャッシュキーとリライト](./revalidation#cache-keys-and-rewrites)を参照してください。

## `X-Void-Routing` によるデバッグ {#debugging-with-x-void-routing}

開発中は、ブラウザーの Network タブで `X-Void-Routing` レスポンスヘッダーを確認できます。一致したルールと、そのルールが宣言された場所が表示されます。

```text
X-Void-Routing: rewrite[/docs/*] -> /en/docs/:splat (void.config.ts#routing.rewrites)
X-Void-Routing: c.rewrite -> /new-path (middleware)
X-Void-Routing: pass-through
```
