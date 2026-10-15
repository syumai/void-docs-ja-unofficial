---
outline: deep
---

# Node.js、Bun、Deno {#node-js-bun-and-deno}

`void.config.ts` の `target` を設定すると、Node.js、Bun、Deno 向けにビルドできます。生成されたサーバーは、自分のマシン、コンテナー、またはホスティングプロバイダー上で実行できます。

```json
{ "target": "node" }
```

## はじめに {#getting-started}

### 1. ターゲットを設定する {#1-configure-the-target}

```json
// void.config.ts
{ "target": "node" }
```

### 2. サーバーの依存関係をインストールする(Node.js のみ) {#2-install-the-server-dependency-node-js-only}

Node.js では、追加の依存関係として `@hono/node-server` が必要です。Bun と Deno は、組み込みの HTTP サーバーを使用します。

```bash
npm install @hono/node-server
```

### 3. 開発する {#3-develop}

```bash
npx vite dev
```

開発サーバーは、ルートやページを編集するとそれらをリロードします。

### 4. ビルドして実行する {#4-build-and-run}

```bash
npx vite build
node dist/ssr/index.js
```

Bun の場合:

```bash
bunx vite build
bun dist/ssr/index.js
```

Deno の場合:

```bash
deno run -A npm:vite build
deno run -A dist/ssr/index.js
```

これらのコマンドは、アプリのディレクトリから実行してください。サーバーは、`PORT`(環境変数)または既定の `3000` で待ち受けます。

`dist/ssr` と `dist/client` は一緒にデプロイしてください。

## ビルド出力 {#build-output}

ビルドは 2 つのエントリーポイントを生成します。

```
dist/
  ssr/
    app.js       ← Hono app with static asset middleware (default export)
    index.js     ← imports app.js and starts the HTTP server
  client/        ← static assets (pages mode only)
    .vite/manifest.json
    assets/
      ...
```

- **`app.js`:** Hono アプリのインスタンスをエクスポートします。プログラムからの組み込み、テスト、カスタムサーバーのセットアップに使用します。
- **`index.js`:** `app.js` をインポートしてサーバーを起動します。本番ではこれを実行します。

`vite preview` も、ビルドしたアプリをローカルで提供するために `app.js` を使用します。

`void` に依存するインストール済みパッケージは、`dist/ssr` にバンドルされます。それらの依存関係のいずれかがネイティブアドオンを使用していたり、自身のコードの隣にあるファイルを読み込んだりする場合は、その依存関係を、パッケージが使用するバージョンでアプリの `dependencies` に追加してください。そうすると、ビルドはそれを Node に任せます。

## 動作するもの {#what-works}

次の Void の機能は、すべてのターゲットで同じように動作します。

- [ファイルベースルーティング](../guide/server-routing.md)(`routes/`、`middleware/`)
- SSR(React、Vue、Svelte、Solid)を備えた [Pages モード](../guide/pages-routing/overview.md)
- [型付き fetch クライアント](../guide/typed-fetch.md)(`void/client`)
- [カスタムヘッダー](../guide/edge/headers.md)(`routing.headers`)
- [リダイレクト](../guide/edge/redirects.md)(`routing.redirects`)
- [静的サイト生成](../guide/ssg.md)
- 本番ビルドをローカルでテストするための [Vite preview](https://vite.dev/guide/cli#vite-preview)

## 異なる点 {#what-s-different}

### 環境変数 {#environment-variables}

サーバーの値はホストの環境を通じて提供し、Node.js または Bun では `process.env`、Deno では `Deno.env.get()` で読み取ります。`void/env` のスキーマとシークレットのワークフローには、Cloudflare が必要です。

ブラウザーのコードには、Vite の `import.meta.env.VITE_*` の値を使用します。これらはビルド時に埋め込まれるため、シークレットを含めてはいけません。

### Cloudflare バインディングがない {#no-cloudflare-bindings}

次のインポートは、Cloudflare 以外のターゲットでは**利用できず**、コンパイル時エラーになります。

| インポート     | CF の機能                  |
| -------------- | -------------------------- |
| `void/db`      | D1(SQL データベース)       |
| `void/kv`      | KV(キーバリューストレージ) |
| `void/storage` | R2(Blob ストレージ)        |
| `void/auth`    | Void 管理の Better Auth    |
| `void/ai`      | Workers AI                 |
| `void/sandbox` | Cloudflare Sandboxes       |
| `void/env`     | 型付き環境変数スキーマ     |

データベースやストレージが必要な場合は、外部のプロバイダーを使用し、標準的な Node.js ライブラリーで接続してください。

WebSocket ルートファイル(`*.ws.ts`)には Cloudflare が必要です。別途ホストされている WebSocket サーバーに接続するために、`void/ws` のブラウザークライアントを使用することはできます。

### cron ジョブのランタイムがない {#no-cron-job-runtime}

`crons/` で[cron ジョブ](../guide/jobs.md)を定義することはでき、バンドルにコンパイルされますが、それらを呼び出す組み込みのスケジューラーはありません。Cloudflare では、Workers Cron Triggers が `scheduled` ハンドラーを自動的に呼び出します。Node.js では、エクスポートされたハンドラーを起動するために、外部のスケジューラー(`node-cron`、systemd タイマー、ホスティングプラットフォームの cron など)が必要です。

### 受信メールがない {#no-inbound-email}

[受信メールハンドラー](../guide/email/receiving.md#inbound)と `sendEmail` には Cloudflare が必要です。他のターゲットでは、外部のメールプロバイダーを使用してください。

### プリレンダリングがない {#no-prerendering}

[エッジプリレンダリング](../guide/edge/prerendering.md)には Cloudflare が必要です。ビルド時の[静的生成](../guide/ssg.md)は、すべてのターゲットで利用できます。

### `void deploy` がない {#no-void-deploy}

`void deploy` は、Cloudflare と Void プラットフォームへのデプロイを扱います。Node.js、Bun、Deno では、`vite build` を実行し、ホスティングプロバイダーのワークフローで `dist/` をデプロイしてください。

### 無視される設定フィールド {#ignored-config-fields}

Void は、他のターゲットで次の Cloudflare 固有の `void.config.ts` フィールドについて警告を表示し、無視します。

- `inference.bindings`: Cloudflare バインディングの設定
- `remote`: リモートバインディングのプロキシ
- `worker`: Cloudflare 固有の設定
- `routing.revalidate`: エッジキャッシュ。Cloudflare のみ

`void/auth`、`void/client`、`auth.ts` を通じて認証を有効にした場合、Cloudflare 以外のターゲットでは Void はビルドを失敗させます。Node/Bun/Deno のデプロイでは、Better Auth を直接使用してください。

## プログラムからの使用 {#programmatic-usage}

`app.js` は Hono アプリをエクスポートするため、カスタムサーバーにインポートできます。

```ts
import app from './dist/ssr/app.js';

// Use with any Node.js HTTP framework
const response = await app.fetch(new Request('http://localhost/api/hello'));
console.log(await response.json()); // { message: "Hello from Node.js!" }
```

これは、テスト、Express/Fastify への組み込み、`fetch` ハンドラーを受け付けるサーバーレス環境での実行に便利です。
