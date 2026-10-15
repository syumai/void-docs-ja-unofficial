---
outline: deep
---

# PostgreSQL {#postgresql}

[Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) を通じて PostgreSQL データベースに接続し、D1 と同じ Drizzle のスキーマとクエリのワークフローを使います。

## Hyperdrive とは？ {#what-is-hyperdrive}

Hyperdrive は、Worker と PostgreSQL の間で接続をプールします。リクエストのたびに新しい TCP と TLS の接続を開く代わりに、既存の接続を再利用します。

Void は、接続文字列から Hyperdrive の設定をプロビジョニングできます。Cloudflare への直接デプロイでは、初回のプロビジョニングに API トークンも必要です。[Cloudflare ガイド](../../integrations/cloudflare.md#databases-and-secrets)を参照してください。

## 設定 {#configuration}

### 1. データベースを設定する {#1-set-the-database}

`void.config.ts` に次を追加します。

```json
{
  "database": "pg"
}
```

### 2. 接続文字列を追加する {#2-add-your-connection-string}

ローカル開発では、`.env` に `DATABASE_URL` を追加します。

```
DATABASE_URL=postgresql://user:password@host:5432/mydb?sslmode=require
```

これにより、ローカルの Vite 開発中は Postgres データベースに直接接続します。

### 3. デプロイする {#3-deploy}

Void プラットフォームでは、必要に応じてデプロイ時に接続文字列の入力を求められます。`void db set-url` で設定することもできます。Cloudflare への直接デプロイでは、本番用の `DATABASE_URL` をシェルでエクスポートしてください。

Void は、接続文字列をプロジェクトの設定に保存せずに Hyperdrive をプロビジョニングします。`postgres://` と `postgresql://` のどちらの URL もサポートされ、`?sslmode=require` のようなプロバイダー固有のクエリ文字列も使えます。

Void が作成する Hyperdrive は、Cloudflare のデフォルトである `require` モードの TLS で接続します。Hyperdrive は、接続文字列の `sslmode=verify-ca`、`sslmode=verify-full`、`sslrootcert` の設定を使用しません。Cloudflare への直接デプロイで、Hyperdrive に特定の認証局に対してデータベースを検証させるには、[その証明書を指定して Cloudflare 上で Hyperdrive を作成](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/)し、その ID を [`cloudflare.hyperdrive`](../../integrations/cloudflare.md#databases-and-secrets) に追加します。

## スキーマ定義 {#schema-definition}

スキーマヘルパーは `void/schema-pg` からインポートします。

```ts
// db/schema.ts
import { pgTable, serial, text, timestamp, boolean } from 'void/schema-pg';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

`database` が `"pg"` に設定されている場合、`void gen model` は PostgreSQL に適したコードを生成します。

## マイグレーション {#migrations}

マイグレーションのワークフローは D1 と同じです。

```bash
# スキーマの変更からマイグレーションファイルを生成
void db generate

# 未適用のマイグレーションをローカルに適用
void db migrate

# マイグレーションの状態を確認
void db status
```

主な違いは、PostgreSQL が**トランザクショナル DDL** をサポートしている点です。各マイグレーションは `BEGIN` と `COMMIT` で囲まれるため、失敗した場合はマイグレーション全体がロールバックされ、データベースが中途半端に更新された状態になることはありません。

`void deploy` は、新しいバージョンを公開する前に未適用のマイグレーションを適用します。[デプロイ](../deployment.md)を参照してください。

## 接続文字列の更新 {#updating-the-connection-string}

リンクされた Void プロジェクトの接続を更新するには、たとえばデータベースを別のホストに移した場合など、次を実行します。

```bash
void db set-url
```

新しい接続文字列の入力を求められ、Hyperdrive の設定が更新されます。
