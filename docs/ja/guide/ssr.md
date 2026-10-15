---
outline: deep
---

# カスタム SSR {#custom-ssr}

ルーター、データ読み込み、HTML シェル、ハイドレーションのコードを自分で選びたい場合は、カスタム SSR を使用します。これらを Void に任せたい場合は、[Pages Routing](./pages-routing/overview) を使用してください。

## アプリを作成する {#create-the-app}

ルートコンポーネントから始めます。この React の例では、リクエストパスに応じてページをレンダリングします。

```tsx
// src/App.tsx
export default function App({ url }: { url: string }) {
  return url === '/about' ? <main>About</main> : <main>Home</main>;
}
```

## 必須のエントリー {#required-entries}

次の 2 つのエントリーファイルを両方作成します。

- `src/main.ssr.ts` または `src/main.ssr.tsx`
- `src/main.client.ts` または `src/main.client.tsx`

サーバーエントリーとクライアントエントリーを 1 つずつ使用します。どちらも必須です。

## レンダー API {#render-api}

サーバーレンダラーを `defineRender()` でラップし、HTML レスポンスを返します。`assetTags.css` と `assetTags.preloads` は `<head>` に、`assetTags.body` は `</body>` の前に挿入します。

```tsx
// src/main.ssr.tsx
import { renderToString } from 'react-dom/server';
import { defineRender } from 'void';
import App from './App';

export default defineRender(async (c, assetTags) => {
  const url = new URL(c.req.raw.url);
  const html = renderToString(<App url={url.pathname} />);
  return new Response(
    `<!doctype html>
<html>
  <head>${assetTags.css}${assetTags.preloads}</head>
  <body>
    <div id="root">${html}</div>
    ${assetTags.body}
  </body>
</html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
});
```

同じシグネチャを持つ名前付きの `render(c, assetTags)` 関数をエクスポートすることもできます。型については [`defineRender`](../reference/api/handlers.md#definerender-handler) を参照してください。

## ブラウザでハイドレートする {#hydrate-in-the-browser}

クライアントエントリーでは、同じコンポーネントをハイドレートします。

```tsx
// src/main.client.tsx
import { hydrateRoot } from 'react-dom/client';
import App from './App';

hydrateRoot(document.getElementById('root')!, <App url={window.location.pathname} />);
```

## キャッシュ {#caching}

SSR ページの stale-while-revalidate キャッシュについては、[Revalidation](./edge/revalidation.md) を参照してください。

API ルートと静的ファイルは、カスタムレンダリングより先に処理されます。マッチしない API 以外のリクエストには `render(c, assetTags)` が使用されます。
