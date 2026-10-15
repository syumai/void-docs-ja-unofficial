---
outline: deep
---

# 静的アセットのキャッシュ {#static-assets-caching}

Void は、静的アセットを Cloudflare のエッジネットワークにキャッシュします。ハッシュ付きのビルドファイルはデプロイをまたいで再利用でき、それ以外のファイルにはデプロイに紐づくキャッシュキーが使われます。

## ハッシュ付きアセット {#hashed-assets}

Vite の `build.assetsDir`（デフォルトは `assets/`）内のファイルは、`assets/app-Ab3xK9.js` のように、ファイル名にコンテンツハッシュが付いて生成されます。これらのファイルは、内容が変わるたびにファイル名も変わるためイミュータブルであり、積極的にキャッシュされます。

```
Cache-Control: public, max-age=31536000, immutable
```

ブラウザとエッジは、これらのファイルを 1 年間キャッシュし、デプロイをまたいで再利用できます。

Vite の設定で `build.assetsDir` をカスタマイズしている場合、Void はそれを自動的に検出し、設定されたディレクトリにイミュータブルの最適化を適用します。

```ts
// vite.config.ts
export default defineConfig({
  build: {
    assetsDir: 'static', // ハッシュ付きアセットは dist/client/static/ に出力されます
  },
});
```

`build.assetsDir` を `""` に設定した場合、つまりハッシュ付きファイルがルートに置かれる場合は、ディレクトリによってハッシュ付きファイルとそうでないファイルを区別する方法がないため、この最適化は行われません。

サポートされているメタフレームワークは、それぞれ独自のアセットディレクトリを自動的に使用します。

### Cloudflare へのネイティブデプロイ {#native-cloudflare-deployments}

`void deploy --platform cloudflare` では、コンテンツのフィンガープリントを持つ生成済みの JavaScript バンドルに、イミュータブルのキャッシュが適用されます。`public/` からコピーされたファイルや、ファイル名が固定されたカスタムのビルド出力は、アセットディレクトリにある場合でも通常の再検証が行われます。CSS やその他のアセットには、Cloudflare のデフォルト、または設定した `Cache-Control` が使われます。

その他のファイルのキャッシュポリシーを選ぶには、[カスタムヘッダー](./headers)を使います。イミュータブルのキャッシュは、内容が変わるたびに変わる URL にのみ適用してください。

## ハッシュなしのアセット {#non-hashed-assets}

`index.html` や `favicon.ico` などのその他の静的ファイルは、次のデプロイまでキャッシュされます。手動でパージする必要はありません。

```
Cache-Control: public, s-maxage=31536000, max-age=0, must-revalidate
```

ブラウザは、これらのファイルをリクエストのたびに再検証します。

**キャッシュされるもの:**

- SPA や静的サイトなど、非 SSR プロジェクトのすべての `GET` リクエスト
- SSR プロジェクトでの、ファイル拡張子（`.ico`、`.png`、`.css` など）を持つ GET リクエスト

**キャッシュされないもの:**

- `/api/*` ルート（常に Worker に到達します）
- SSR でレンダリングされるページ（SSR プロジェクトでの、ファイル拡張子のないパス）
- GET 以外のリクエスト
- `Cookie`、`Authorization`、または `Cf-Access-Jwt-Assertion` の認証情報を含むリクエスト
- 完全な `200` 以外のレスポンス

### キャッシュを無効にする {#opting-out}

Worker が、静的に見える URL（たとえば `/avatar.jpg` で動的に生成される画像）で動的なコンテンツを配信する場合は、レスポンスヘッダーに `Cache-Control: private` または `Cache-Control: no-store` を設定することで、キャッシュを防げます。`Cache-Control` に `private`、`no-store`、`no-cache` のいずれかが含まれているレスポンス、または `Set-Cookie` ヘッダーを持つレスポンスは、エッジキャッシュをバイパスします。

## ETag と 304 Not Modified {#etags-and-304-not-modified}

静的アセットには `ETag` ヘッダーが含まれます。ブラウザが変更のないファイルを再検証すると、Void はファイルを再ダウンロードさせずに `304 Not Modified` を返します。設定は不要です。

## カスタムヘッダー {#custom-headers}

[カスタムヘッダー](./headers)を使って、任意の静的アセットのパスに対して、キャッシュヘッダーを上書きしたり、独自のヘッダーを追加したりできます。

## ナビゲーションとミドルウェア {#navigation-and-middleware}

Void は、アプリケーションコードが先にリクエストを処理する必要がない限り、静的ファイルを直接配信します。API リクエストは Worker に到達します。ミドルウェア、`/api` 以外のルート、Pages、または SSR を持つアプリは、フォールバックの HTML を配信する前にアプリケーションコードを実行します。

SPA では、一致しない HTML ナビゲーションに `index.html` を配信するため、クライアントサイドルーティングが機能します。`404.html` ページを持つ静的サイトでは、[`routing.notFound`](../../reference/config.md#routing-notfound) を設定します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  routing: { notFound: '404-page' },
});
```

`single-page-application`、`404-page`、`none` のいずれかを選択します。これらの設定は、どのリクエストがミドルウェアや API ハンドラーに到達するかを保持します。意図的な API の `404` レスポンスは、ステータスとボディがそのまま維持されます。

SvelteKit、Nuxt、Analog、Astro は独自のエラーページを処理し、`routing.notFound` を無視します。TanStack Start、React Router、vinext を Cloudflare に直接デプロイする場合は、フレームワークの Cloudflare 設定を通じて、アセットバインディング、ディレクトリ、ルーティングポリシーを設定してください。

## API ルートと SSR ページ {#api-routes-and-ssr-pages}

API レスポンスと SSR ページは、静的アセットとしてはキャッシュされません。公開されたレンダリング済みのページをキャッシュするには、[再検証](./revalidation)を使います。
