---
outline: deep
---

# エッジプリレンダリング {#edge-prerendering}

デプロイ時にページをプリレンダリングし、最初の訪問者にキャッシュ済みの HTML を返します。

- [Markdown ページ](../pages-routing/markdown.md)は自動的にプリレンダリングされます。
- コンパニオンローダーを持たず、動的パラメーターもない[アイランドページ](../pages-routing/islands)も自動的にプリレンダリングされます。

## 静的ページ(パラメーターなし) {#static-pages-no-params}

コンパニオンの `.server.ts` ファイルから `prerender = true` をエクスポートします。

```ts
// pages/about.server.ts
export const prerender = true;
```

動的パラメーターを持たないページでは `getPrerenderPaths()` は不要です。

## 動的ページ(パラメーターあり) {#dynamic-pages-with-params}

URL パラメーターを持つページでは、プリレンダリングするパラメーターの組み合わせを指定するために、`getPrerenderPaths()` もエクスポートします。

```ts
// pages/blog/[slug].server.ts
export const prerender = true;

export async function getPrerenderPaths() {
  // URL パターンに一致するパラメーターのオブジェクトを返す
  return [{ slug: 'hello-world' }, { slug: 'getting-started' }];
}
```

## カスタム SSR {#custom-ssr}

カスタム SSR モード(`src/main.ssr.ts`)では、トップレベルで `getPrerenderPaths()` をエクスポートします。ファイルベースルーティングがないため、完全なパス文字列を返します。

```ts
// src/main.ssr.ts
export const prerender = true;

export async function getPrerenderPaths() {
  return ['/', '/about', '/blog/hello-world'];
}
```

## 再検証との関係 {#relationship-to-revalidation}

`void.config.ts` で `routing.isr: false` を設定すると、ISR とこのエッジプリレンダリング動作(ページごとのエクスポートを含む)が無効になります。`output: "static"` によるビルド時の HTML 生成は無効になりません。

プリレンダリングされたページの再検証 TTL は、既定で 1 年です。デプロイすると ISR キャッシュはクリアされます。

ページごとに TTL を上書きできます。

```ts
// pages/about.server.ts
export const prerender = true;
export const revalidate = 3600;
```

次のデプロイより前にキャッシュ済みページの有効期限が切れた場合、次のリクエストは新しいレンダリングの完了を待ちます。

## 動作の詳細 {#behavior-details}

- プリレンダリングは、新しいバージョンにトラフィックが振り分けられる前に、デプロイごとに 1 回実行されます。プリレンダリングされたページはエッジにキャッシュされます。
- 再検証 TTL が正の値であるパスだけがプリレンダリングされます(TTL が `0` の場合はスキップされます)。
- プリレンダリングの失敗はログに記録されますが、デプロイをブロックすることはありません。ページは通常どおり、最初のリクエスト時にレンダリングされます。
