---
outline: deep
---

<script setup>
const items = [
  { name: "routes/", description: "API エンドポイント（ファイルベースルーティング）", link: "#routes" },
  { name: "pages/", description: "フルスタックのサーバーレンダリングページ", link: "#pages" },
  { name: "middleware/", description: "グローバルなリクエストミドルウェア", link: "#middleware" },
  { name: "db/", description: "Drizzle スキーマと SQL マイグレーション", link: "#db" },
  { name: "crons/", description: "スケジュールされた cron ジョブ", link: "#crons" },
  { name: "queues/", description: "非同期のキューコンシューマー", link: "#queues" },
  { name: "email/", description: "受信メールのハンドラー", link: "#email" },
  { name: "durable-objects/", description: "Durable State モジュール", link: "#durable-objects" },
  { name: "src/", description: "共有のアプリケーションコード", link: "#src" },
  { name: "public/", description: "静的アセット（そのまま配信）", link: "#public" },
  { name: ".void/", description: "自動生成（gitignore 対象）", link: "#void" },
  { name: "vite.config.ts", description: "voidPlugin() を含む Vite の設定", link: "#config-files" },
  { name: "void.config.ts", description: "Void プロジェクトの設定（省略可）", link: "#config-files" },
  { name: ".env", description: "ローカルの環境値", link: "#config-files" },
  { name: "env.ts", description: "環境スキーマ", link: "#config-files" },
  { name: "package.json" },
  { name: "tsconfig.json" },
];

const middlewareItems = [
  {
    name: "middleware/",
    children: [
      { name: "01.logger.ts", description: "最初に実行" },
      { name: "02.auth.ts", description: "2 番目に実行" },
    ],
  },
];

const dbItems = [
  {
    name: "db/",
    children: [
      { name: "schema.ts", description: "Drizzle スキーマ（信頼できる唯一の情報源）" },
      { name: "schema/", description: "省略可: 複数のファイルに分割" },
      {
        name: "migrations/",
        children: [
          { name: "20260410161500_*.sql" },
          { name: "20260410161501_*.sql" },
        ],
      },
    ],
  },
];

</script>

# プロジェクト構成 {#project-structure}

## 概要 {#overview}

Void アプリは、ファイルベースの規約を使用して、ルート、ページ、ミドルウェアなどを定義します。すべてのディレクトリは省略可能なので、アプリが実際に使用するものだけを用意すれば十分です。

<FileTree :items="items" />

## `routes/` {#routes}

[Hono](https://hono.dev) 上に構築された、ファイルベースの HTTP API エンドポイントです。各ファイルは、名前付きの HTTP メソッドハンドラーをエクスポートします。

<RoutesFileTree />

- **名前付きエクスポート**: `export const GET = defineHandler(...)`、`export const POST = ...`
- **動的セグメント**: `[id]` は `:id` ルートパラメーターになります
- **キャッチオール**: `[...slug]` は残りのパスにマッチします
- **ルートグループ**: `(admin)/` は、URL パスに影響を与えずにファイルを整理します
- **`_` で始まるファイル**は無視されます
- **環境サフィックス**: `debug.dev.ts` は開発時のみ、`metrics.prod.ts` は本番時のみビルドされます

詳しいガイドは、[サーバールーティング](/ja/guide/server-routing)を参照してください。

## `pages/` {#pages}

データの読み込みを同じ場所に置く、フルスタックのサーバーレンダリングページです。Vue、React、Svelte、Solid のアダプターで利用できます。

<PagesFileTree />

- **`.server.ts` ファイル**は、`GET` のデータ用の `loader` と、ミューテーション用の `action` をエクスポートし、同じ名前のページコンポーネントと組になります
- **レイアウト**は自動的にネストされ、ナビゲーションをまたいで維持されます
- **Markdown** ページは、フロントマターとともにサポートされます

詳しいガイドは、[Pages ルーティング](/ja/guide/pages-routing/overview)を参照してください。

## `middleware/` {#middleware}

すべてのリクエストで実行される、グローバルなミドルウェアです。数値のプレフィックスで、実行順序を制御します。

<FileTree :items="middlewareItems" default-expanded />

各ファイルは、`defineMiddleware()` ハンドラーをデフォルトエクスポートします。ミドルウェアを使用して、すべてのルートから利用できる共有コンテキスト（認証、ロギング、レート制限など）を設定します。

## `db/` {#db}

D1、PostgreSQL、MySQL 向けの、[Drizzle スキーマ](/ja/guide/database#schema-definition)と SQL マイグレーションです。

<FileTree :items="dbItems" default-expanded />

- `db/schema.ts`: Drizzle のテーブル定義で、DB の型の信頼できる唯一の情報源です
- `db/schema/`: 省略可能です。テーブルを別々のファイルに分割し、`db/schema.ts` から再エクスポートします
- `db/migrations/`: 生成された SQL マイグレーションファイルで、デプロイ時に順番に適用されます

スキーマは `void gen model` で生成するか、手で記述します。マイグレーションは `void db generate` で生成します。

## `crons/` {#crons}

[スケジュールされたジョブ](/ja/guide/jobs)です。各ファイルは、`cron` 式と、デフォルトエクスポートの `defineScheduled()` ハンドラーをエクスポートします。

## `queues/` {#queues}

[キューコンシューマー](/ja/guide/queues)です。各ファイルは、`defineQueue()` ハンドラーをデフォルトエクスポートします。

## `email/` {#email}

[受信メールのハンドラー](../guide/email/receiving.md#inbound)です。ファイル名が受信者を選択し、`_default.ts` はその他のアドレスを処理します。

## `durable-objects/` {#durable-objects}

[Durable State](/ja/guide/durable-state) モジュールです。各ファイルは、`defineDurableState()` の定義をデフォルトエクスポートします。

## `src/` {#src}

コンポーネント、ユーティリティ、型などの共有アプリケーションコードです。このディレクトリには特別な規約がないため、自由に整理できます。

## `public/` {#public}

ルートパスでそのまま配信される静的アセットです。ここにあるファイルは、Vite によって処理されません。

## `.void/` {#void}

生成された型とローカル開発の状態です（gitignore 対象）。型を作成するには `void prepare` を実行するか、`vite dev` や `vite build` に更新させます。

## 設定ファイル {#config-files}

| ファイル         | 目的                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts` | Vite の設定です。`voidPlugin()` を含める必要があります。                                                                                                                                 |
| `void.config.ts` | [ルーティング](/ja/reference/config#routing)、[推論](/ja/reference/config#inference)、[Worker の設定](/ja/reference/config#worker)のための、省略可能な Void の設定です                   |
| `tsconfig.json`  | TypeScript の設定です。自動生成された型を使用するには `.void/tsconfig.json` を継承してください。既存の設定がすでに `extends` を使用している場合は、`void init --tsconfig` を実行します。 |
| `.env`           | ローカル開発専用の値です（gitignore 対象で、デプロイされません）                                                                                                                         |
| `env.ts`         | チェックインされる環境変数の名前、型、デフォルト値、必須かどうか                                                                                                                         |

ローカル、本番環境のシークレット、クライアントビルドの動作については、[環境変数](/ja/guide/env-vars)を参照してください。
