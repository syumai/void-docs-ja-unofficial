---
outline: deep
---

# MySQL

[Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) を通じて MySQL データベースに接続し、Drizzle でテーブルを定義してクエリを実行します。Void は接続を設定し、デプロイ時にマイグレーションを適用します。

## 設定 {#configure}

`void.config.ts` でダイアレクトを設定します。

```json
{
  "database": "mysql"
}
```

ローカル開発用に直接接続を追加します。

```dotenv
DATABASE_URL=mysql://user:password@host:3306/app
```

Void は開発サーバーと `void db` コマンドのために `.env` を読み込みます。本番環境では、Worker は推論された `HYPERDRIVE` バインディングを通じて接続します。

## スキーマを定義する {#define-a-schema}

```ts
// db/schema.ts
import { int, mysqlTable, text, timestamp } from 'void/schema-mysql';

export const messages = mysqlTable('messages', {
  id: int('id').autoincrement().primaryKey(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

プロジェクトが MySQL ダイアレクトを使用している場合、`void gen model` は MySQL 用のビルダーを自動的に生成します。

## マイグレーション {#migrations}

通常のワークフローを使用します。

```sh
void db generate
void db migrate
void deploy
```

Cloudflare への直接デプロイでは、`void deploy --platform cloudflare` を実行するシェルで本番用の `DATABASE_URL` をエクスポートしてください。Void はこれを使って Hyperdrive をプロビジョニングし、Worker をアップロードする前にチェックイン済みの未適用マイグレーションを適用します。この値は Worker の設定には書き込まれません。

データベースを変更するマイグレーションの実行は、同時に 1 つだけです。これは `void db migrate`、`void db reset`、`void db seed` がデータを読み込む前に行うリセット、`void deploy --platform cloudflare`、およびそのデータベースを使用するあらゆるプロジェクトの `void deploy` のいずれから実行された場合でも同様です。Better Auth のテーブル変更も同じ実行の中で行われます。他の実行はその完了を待機します。`DATABASE_URL` で接続するコマンドでは最大約 20 秒、Void プラットフォームへの `void deploy` では最大約 2 分待機し、その後、再試行を促すエラーで停止します。

### 失敗したマイグレーション {#failed-migrations}

各マイグレーションファイルはトランザクション内で実行されるため、データのみを変更するファイルが失敗した場合、データベースは変更されません。シャード化された PlanetScale データベースなど、シャード化された Vitess キースペースでは、あるシャードでコミットが失敗しても、すでにコミットされた他のシャードは元に戻りません。MySQL は `CREATE TABLE` や `ALTER TABLE` などのスキーマ変更を即座にコミットするため、スキーマ変更を含むファイルが途中で失敗すると、それ以前のステートメントは適用されたままになります。エラーには失敗したファイル名が示されます。

復旧するには、適用済みのステートメントを取り消し、ファイルを修正してから、もう一度 `void db migrate` または `void deploy` を実行します。

```sh
void db execute "DROP TABLE comments"
void db execute --remote "DROP TABLE comments" # デプロイ済みのデータベース
```

MySQL は `ADD COLUMN` や `CREATE INDEX` での `IF NOT EXISTS` を受け付けないため、再実行しても安全なステートメントにするよりも、ステートメントを取り消すほうが通常は簡単です。マイグレーションを小さくしておくと、取り消す内容が少なくなります。

## データベースコマンド {#database-commands}

`void db push`、`generate`、`migrate`、`status`、`reset`、`seed`、`execute`、`studio`、`export`、`rename-migrations`、`set-url` はすべて MySQL に対応しています。ローカルコマンドは `.env` の `DATABASE_URL` を使用します。`--remote` での実行と Studio は、リンクされた Void プロジェクトに保存されている暗号化済みの URL を使用します。
