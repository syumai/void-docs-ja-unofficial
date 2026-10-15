---
outline: deep
---

# 再検証 (ISR) {#revalidation-isr}

再検証は、レンダリング済みのページをキャッシュし、バックグラウンドで更新します。キャッシュされたページが古くなっても、Worker が更新版をレンダリングしている間、訪問者はそのページを読み続けられます。これは [Incremental Static Regeneration (ISR)](https://vercel.com/docs/incremental-static-regeneration) と呼ばれることもあります。

再検証は、[Void SSR](../ssr.md)、[Pages モード](../pages-routing/overview)、または[サポートされている SSR フレームワーク](../../integrations/frameworks/overview.md)で使用できます。フレームワークアプリでは、Void はフレームワークのデータリクエストではなく、公開 HTML ドキュメントのレスポンスをキャッシュします。

ページごとの設定を維持したまま、アプリ全体で Void の ISR キャッシュを無効にするには、`void.config.ts` に `"routing": { "isr": false }` を設定します。これはページごとの revalidate と prerender のポリシーを上書きします。`isr` を `true` に戻すと、それらのポリシーが再び有効になります。`output: "static"` によるビルド時の HTML 生成には影響しません。

## 再検証を有効にする {#enabling-revalidation}

`void.config.ts` に、TTL を秒数で指定した `routing.revalidate` フィールドを追加します。

```json
{
  "routing": {
    "revalidate": 60
  }
}
```

`revalidate` を `0` に設定すると再検証が無効になります (通常の SSR と同等です)。

## パスごとの再検証 {#per-path-revalidation}

オブジェクトを使用して、URL パターンごとに異なる TTL を設定できます。

```json
{
  "routing": {
    "revalidate": {
      "/": 60,
      "/docs/*": 31536000,
      "/user/*": 0,
      "*": 30
    }
  }
}
```

ルールは順番に照合され、最初に一致したものが採用されます。`*` グロブは `/` を含む任意の文字に一致します。

特別な値:

- `31536000` (1 年): デプロイによって ISR キャッシュがクリアされるため、実質的に次のデプロイまでキャッシュされます
- `0`: キャッシュされず、常に Worker でレンダリングされます。そのパスでは通常の SSR と同等です

## ページごとの再検証 (Pages モード) {#per-page-revalidation-pages-mode}

[Pages モード](../pages-routing/overview)では、`.server.ts` ファイルから `revalidate` の値をエクスポートして、そのページのグローバル設定を上書きできます。

```ts
// pages/products/index.server.ts
export const revalidate = 120; // 2 分間キャッシュする

export const loader = defineHandler(async (c) => {
  // ...
});
```

ページごとの値は、`void.config.ts` のパターンより優先されます。

ページの `revalidate` エクスポートは、URL がそのページのパターンに一致する `routes/` のハンドラーにも適用されます。たとえば `pages/[...slug].server.ts` が `revalidate` をエクスポートしている場合、Void は `routes/now.ts` の `GET` レスポンスもキャッシュできます。Void は `/api` 以下のパスをキャッシュしません。ルートハンドラーのレスポンスをキャッシュから除外するには、そのレスポンスに `x-revalidate: 0` を設定します。[レスポンスごとの TTL の上書き](#per-response-ttl-override)を参照してください。

## 優先順位 {#precedence}

複数の設定元が revalidate の TTL を指定している場合は、最も具体的なものが優先されます。

1. `x-revalidate` レスポンスヘッダー (レスポンスごと)
2. `.server.ts` のエクスポート (ページごと、Pages モードのみ)
3. `void.config.ts` の `routing.revalidate` のパスパターンの一致
4. `void.config.ts` の `routing.revalidate` のグローバルな数値または `"*"` のフォールバック

## 再検証の仕組み {#how-revalidation-works}

最初のリクエストでページがレンダリングされ、キャッシュされます。キャッシュされたページが新鮮な間は、訪問者はそれをすぐに受け取ります。古くなると、Void はそれを返しつつ、バックグラウンドで更新版をレンダリングします。

キャッシュエントリがないリクエストは、ページのレンダリングが完了するまで待機します。

## レスポンスごとの TTL の上書き {#per-response-ttl-override}

ルートハンドラーは、`x-revalidate` レスポンスヘッダーを設定して、特定のレスポンスの TTL を上書きできます。

```ts
export const GET = defineHandler(async (c) => {
  // この特定のレスポンスはキャッシュしない
  c.header('x-revalidate', '0');

  return c.html('...');
});
```

- `x-revalidate: 0`: このレスポンスのキャッシュをスキップします
- `x-revalidate: 300`: デフォルトの代わりに 5 分間キャッシュします

キャッシュされるのは、完全な `200` レスポンスのみです。`Cache-Control: private`、`no-store`、`no-cache` のいずれか、または `Set-Cookie` ヘッダーを持つレスポンスは、そのリクエスト限りのプライベートなものとして扱われます。公開ページがこれらのヘッダーのいずれかを返し始めた場合、Void はキャッシュされたレスポンスを削除します。

`Vary: Accept-Language` や `Vary: Origin` のように、リクエストヘッダーによって変化するレスポンスは、ライブでレンダリングされます。`Vary: *` も共有キャッシュを無効にします。Void の `X-VoidPages` ヘッダーは、HTML と Pages の JSON が別々のキャッシュレスポンスを持つため、サポートされています。

## キャッシュのバイパス {#cache-bypass}

`Cookie`、`Authorization`、または Cloudflare Access の `Cf-Access-Jwt-Assertion` ヘッダーを持つリクエストは、ISR キャッシュを完全にバイパスし、常に Worker にディスパッチされます。認証済みのレスポンスは、Access 認証が Cookie を提供しない場合も含め、ユーザー間で共有されません。

## キャッシュキーとリライト {#cache-keys-and-rewrites}

ディスパッチのリライトでは、キャッシュキーに宛先と元のパス名の両方が含まれます。そのため、`/en/docs/foo` への直接のリクエストは、その宛先にリライトされた `/docs/foo` とは別のエントリを使用します。

クエリパラメーターはデフォルトで除外されます。特定のパラメーターごとに別々のキャッシュレスポンスを生成したい場合は、`routing.revalidateQueryAllowlist` を追加します。それ以外のクエリパラメーターを持つリクエストには、キャッシュされたページが返されます。まだ何もキャッシュされていない場合は、ライブでレンダリングされ、保存されません。そのため、ページが読み取るすべてのパラメーターを `routing.revalidateQueryAllowlist` に追加してください。ミドルウェアの `c.rewrite()` は ISR のルックアップの後に実行されるため、追加のキャッシュバリアントは作成されません。

宛先のパス名は `revalidate({ paths })` でパージします。`/en/docs/foo` をパージすると、直接のバリアントとリライトされたバリアントの両方がクリアされます。エントリは宛先のもとに保存されているため、`/docs/foo` だけをパージしてもクリアされません。

## オンデマンドの再検証 {#on-demand-revalidation}

ルートハンドラーから、ISR キャッシュのエントリをプログラムでパージできます。

```ts
import { revalidate } from 'void/isr';

export const POST = defineHandler(async (c) => {
  // ... データベースのコンテンツを更新 ...

  // 特定のページをパージする
  await revalidate({ paths: ['/', '/blog/hello-world'] });

  // またはキャッシュされたすべてのページをパージする
  await revalidate({ all: true });

  return c.json({ ok: true });
});
```
