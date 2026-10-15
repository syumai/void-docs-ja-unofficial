---
outline: deep
---

# コード生成 {#code-generation}

## `void gen model` {#void-gen-model}

```
void gen model <name> [columns...]
```

Drizzle のテーブル、一覧と作成のルート、ID で 1 行を取得するルートをスキャフォールドします。

```sh
void gen model posts title:string body:text published:boolean
```

次のものが作成されます。

- `db/schema/posts.ts`: `id`、`createdAt`、`updatedAt` と指定したカラムを持つテーブル
- `db/schema.ts` からのエクスポート
- `routes/api/posts/index.ts`: 一覧取得の `GET` と、バリデーション付きの挿入を行う `POST`
- `routes/api/posts/[id].ts`: `404` の処理を含む、ID による `GET`
- `.void/` 内の再生成された型と TypeScript 設定

生成されるルートは、`package.json` からバリデーションライブラリ（`valibot`、`zod`、`arktype`）を自動的に検出します。見つからない場合は、ライブラリの選択またはバリデーションのスキップを求められます。スキーマをローカルに適用するには `void db push` を、デプロイの前にマイグレーションを作成するには `void db generate` を実行してください。

カラムの形式は `name:type` または `name:type?`（nullable）です。型は `string`、`text`、`datetime`、`integer`、`boolean`、`real`、`blob` です。

モデル名は、小文字の英数字とアンダースコアで構成する必要があります（例: `posts`、`user_roles`）。既存のファイルが上書きされることはありません。

## `void gen migration` {#void-gen-migration}

```
void gen migration <name>
```

タイムスタンプのプレフィックス（`YYYYMMDDHHMMSS`）を持つ空のマイグレーションファイルを作成します。

```sh
void gen migration add_avatar_to_users
# → db/migrations/20260410161500_add_avatar_to_users.sql
```

古い数値のプレフィックス（`0001_`、`0002_`、...）を使用している既存のプロジェクトは、`void db rename-migrations` で名前を変更できます。

## `void gen route` {#void-gen-route}

```
void gen route <path> [--methods get,post,...]
```

`defineHandler` のエクスポートを持つルートファイルを作成します。デフォルトは GET です。

```sh
void gen route api/health
void gen route api/users --methods get,post,delete
```

`routes/<path>.ts` が作成され、各メソッドのハンドラーがエクスポートされます。サポートされているメソッドは `get`、`post`、`put`、`patch`、`delete` です。

## `void gen middleware` {#void-gen-middleware}

```
void gen middleware <name>
```

`defineMiddleware` をデフォルトエクスポートする、番号付きのミドルウェアファイルを作成します。

```sh
void gen middleware auth
# → middleware/01.auth.ts (or 02, 03, etc.)
```

プレフィックスは、既存のミドルウェアファイルから自動的に検出されます。

## `void gen ssr` {#void-gen-ssr}

```
void gen ssr [--react | --vue | --svelte | --solid]
```

お使いのフレームワーク向けに、SSR のエントリポイントと最小限の App コンポーネントをスキャフォールドします。

3 つのファイルが作成されます。

- `src/main.ssr.{tsx,ts}`: `defineRender` を持つサーバーエントリ
- `src/main.client.{tsx,ts}`: ハイドレーションを行うクライアントエントリ
- `src/App.{tsx,vue,svelte}`: 最小限のインタラクティブなコンポーネント

フラグを指定しない場合、フレームワークは `package.json` の依存関係から自動的に検出されます。

## `void gen cron` {#void-gen-cron}

```
void gen cron <name>
```

`defineScheduled` とプレースホルダーの cron 式を持つ cron ジョブのファイルを `crons/` に作成します。

```sh
void gen cron hourly-sync
```

## `void gen queue` {#void-gen-queue}

```
void gen queue <name>
```

`defineQueue`、`Message` 型、コメントアウトされたバッチオプションを持つキューコンシューマーのファイルを `queues/` に作成します。

```sh
void gen queue emails
```
