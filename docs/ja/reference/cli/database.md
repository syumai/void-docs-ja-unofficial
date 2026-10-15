---
outline: deep
---

# データベース {#database}

## `void db push` {#void-db-push}

マイグレーションファイルを作成せずに、Drizzle スキーマを開発用データベースへ直接適用します。D1 ではローカルのデータベースが更新され、PostgreSQL と MySQL では `.env` の `DATABASE_URL` が使用されます。

プロトタイピング中の素早いスキーマの試行錯誤に使用します。デプロイする前に、`void db generate` でマイグレーションファイルを生成して確認してください。

## `void db generate` {#void-db-generate}

スキーマの変更から SQL マイグレーションファイルを生成します。

スキーマを最新の Drizzle スナップショットと比較し、マイグレーションを `db/migrations/` の下に書き込みます。アプリケーションのスキーマがなくても、Void が管理する認証テーブルと、構成済みの認証プラグインが含まれます。デプロイの前に、生成されたファイルを確認してコミットしてください。

SQLite では、Void はマイグレーション履歴が新しいデータベースに適用できることを検査します。この検査で生成が失敗した場合、以前の SQL、スナップショット、ジャーナルが復元されます。既存のマイグレーションが失敗する場合は、まずその未適用のマイグレーションを修復してください。生成を再実行してもスナップショットが比較されるだけで、既存の SQL は修復されません。この検査は、マイグレーションが既存のデータを保持するかどうかを検証するものではありません。テーブルの再構築や外部キーのアクションは、慎重に確認してください。

## `void db status` {#void-db-status}

マイグレーションのステータスを表示します。ローカルで適用済みまたは保留中のマイグレーションを表示したうえで、保存されたデプロイターゲットを使ってリモートのステータスを表示します。Void プロジェクトではホスト型 API、直接 Cloudflare の SQLite プロジェクトでは固定された D1 データベースとその構成済みのマイグレーションテーブル、直接 Cloudflare の PostgreSQL/MySQL プロジェクトではシェルの `DATABASE_URL` が使われます。リモートの認証情報やサービスが利用できない場合でも、ローカルのステータスは表示されます。ローカルの PostgreSQL または MySQL データベースを読み取れない場合、ローカルのステータスは `unknown` と表示されます。リモートのステータスも取得できない場合、コマンドは失敗します。

## `void db reset` {#void-db-reset}

```
void db reset [--yes]
```

開発用データベースを削除し、すべてのマイグレーションを再適用します。D1 ではローカルのデータベースがリセットされます。PostgreSQL では、`.env` の `DATABASE_URL` のデータベースにある `public` スキーマのテーブル、ビュー、シーケンス、カスタム型を削除し、インストール済みの拡張機能は保持します。別のスキーマのテーブル、ビュー、関数がそれらのビュー、シーケンス、型のいずれかを使用している場合、リセットは何も削除する前に停止し、それらのオブジェクトを一覧表示します。MySQL では、そのデータベースのすべてのテーブルとビューが削除されます。

その `DATABASE_URL` が `localhost` 以外のホストを指している場合、Void はデータベース名を示し、テーブルを削除する前に確認します。スクリプトや CI でプロンプトをスキップするには、`--yes` を渡します。ターミナルがない場合、`--yes` が設定されていなければコマンドは停止します。`.env` がデプロイと同じ URL を使っている場合（たとえば `void db connect` の後）、リセットによってデプロイ済みのテーブルが削除されます。

## `void db seed` {#void-db-seed}

```
void db seed [--file <path>] [--yes]
```

ローカルのデータベースをリセットし、すべてのマイグレーションを再適用してから、シードファイルを実行します。リセットは、プロンプトと `--yes` を含め、`void db reset` と同様に動作します。

`--file` を省略した場合、Void は次の順序でデフォルトのシードファイルを探します: `db/seed.ts`、`db/seed.mts`、`db/seed.js`、`db/seed.mjs`、`db/seed.sql`。

デフォルトのシードファイルが複数存在する場合、CLI は停止し、`--file <path>` を指定するよう求めます。

プログラムによるシードモジュールは、デフォルトの関数、または名前付きの `seed` 関数のいずれかをエクスポートする必要があります。

## `void db execute` {#void-db-execute}

```
void db execute <sql>
void db execute --file <path>
void db execute --remote <sql>
```

データベースに対してアドホックな SQL を実行します。SQL はインラインで指定するか、ファイルから指定します。SELECT クエリの結果は整形されたテーブルとして表示され、それ以外のステートメントは何も表示せずに実行されます。

デフォルトではローカルのデータベースが対象です。`--remote` を渡すと、`.void/project.json` で選択されたデプロイ済みのデータベースに対して実行します。

- **Void プラットフォームの D1 プロジェクト**: 認証トークンを使って、選択したプラットフォームの登録済みプロキシ経由でクエリをルーティングします。
- **直接 Cloudflare の D1 プロジェクト**: `void.config.ts` または `void.lock.json` から固定された D1 バインディングに対して Cloudflare を呼び出します。
- **ホスト型の PostgreSQL および MySQL プロジェクト**: プラットフォームから保存済みの接続文字列を取得し、直接接続します。
- **直接 Cloudflare の PostgreSQL および MySQL プロジェクト**: 現在のシェルの `DATABASE_URL` を使用します。Cloudflare は Hyperdrive からパスワードを返せません。

TTY で実行している場合、破壊的なステートメント（`DELETE`、`UPDATE`、`DROP` など）では、クエリをデプロイ済みのデータベースに送信する前に確認が求められます。TTY ではない環境（CI）では、このプロンプトはスキップされます。

## `void db migrate` {#void-db-migrate}

```
void db migrate [--remote]
```

リセットせずに、保留中のマイグレーションをローカルのデータベースに適用します。`void db reset` とは異なり、既存のデータは保持され、まだ適用されていないマイグレーションだけが実行されます。

保存されたターゲットに保留中のマイグレーションを適用するには、`--remote` を渡します。ホスト型のプロジェクトには、Void のログインとリンクが必要です。直接 Cloudflare の D1 プロジェクトでは、バインディングに構成されたマイグレーションのディレクトリ、テーブル、パターンが使用されます。D1 バインディングには `migrations_dir` を設定する必要があります。直接 PostgreSQL および MySQL のプロジェクトでは、シェルの `DATABASE_URL` が使用されます。

## `void db studio` {#void-db-studio}

```
void db studio [--remote]
```

データベースに対して [Drizzle Studio](https://orm.drizzle.team/docs/drizzle-kit-studio) を開きます。データの閲覧と編集ができる Web ベースの GUI を起動します。

デフォルトではローカルのデータベースが対象です。`--remote` を渡すと、デプロイ済みのデータベースに対して Studio を開きます。

- **ホスト型の PostgreSQL および MySQL プロジェクト**: プラットフォームから保存済みの接続文字列を取得し、それに対して Studio を開きます。URL がまだ保存されていない場合は、先に `void db set-url` を実行してください。
- **直接 Cloudflare の PostgreSQL および MySQL プロジェクト**: 現在のシェルの `DATABASE_URL` を使用します。
- **D1 プロジェクト**: リモートの Studio は利用できません。デプロイ済みの D1 データベースにクエリするには、`void db execute --remote` を使用してください。

## `void db rename-migrations` {#void-db-rename-migrations}

既存のマイグレーションを、古い数値のプレフィックス形式（`0001_name.sql`）からタイムスタンプベースの形式（`20260410161500_name.sql`）に名前変更します。ローカルのトラッキングテーブルを更新し、リンクされたプロジェクトでログインしている場合はリモートのレコードも更新します。Void にデプロイするプロジェクトは、先に `void project link` でリンクしておく必要があります。そうでない場合、コマンドは変更を加えずに停止します。

直接 Cloudflare へのデプロイはサポートされていません。Void はデプロイ済みのデータベースのレコードの名前を変更できないため、コマンドは変更を加えずに停止します。既存の名前はそのまま維持してください。新しいマイグレーションはタイムスタンプを使用し、それらの後に実行されます。

## `void db connect` {#void-db-connect}

既存の PostgreSQL/MySQL データベースに接続するか、アダプター経由でプロビジョニングします。

```sh
void db connect 'postgresql://user:password@host/database'
NEON_API_KEY=... void db connect --provider neon --name my-app
void db connect --provider @acme/void-db-provider --region region-id
```

このコマンドは `DATABASE_URL` を `.env` に保存します。リンクされた Void プロジェクトで認証済みの場合は、暗号化されたデプロイ用 URL も更新します。この同期をスキップするには `--local-only` を渡します。`neon` は組み込みです。その他のアダプターは、プロジェクトの依存関係、または `void/database-provider` から `DatabaseProviderAdapter` をエクスポートするローカルモジュールです。

プロバイダーが作成した認証情報が表示されることはありません。直接 Cloudflare へのデプロイでは、デプロイを実行するシェルまたは CI 環境に、同じ URL を保護された `DATABASE_URL` として設定してください。

## `void db set-url` {#void-db-set-url}

デプロイ用の PostgreSQL または MySQL の接続文字列を更新します。`"database": "pg"` または `"database": "mysql"` のプロジェクトで使用できます。

接続文字列の入力を求め、それをプラットフォーム API に送信して Hyperdrive の構成を作成または更新します。

## `void db export` {#void-db-export}

```
void db export [--output <path>] [--no-data] [--no-schema] [--table <name>]
```

ローカルのデータベースを SQL としてダンプします。デフォルトでは標準出力に出力され（パイプ可能）、`--output` を指定するとファイルに出力されます。

データのエクスポートでは、SQLite の AUTOINCREMENT と、PostgreSQL の SERIAL および identity のカウンターが保持されます。これには、削除された行によって消費された ID も含まれます。SQLite のスキーマのエクスポートには、インデックス、ビュー、トリガーが含まれます。PostgreSQL のスキーマのエクスポートでは、カラム型、生成カラム、identity の定義、シリアルシーケンス、制約、インデックスが保持されます。`--no-schema` はカウンターの値を既存のスキーマに復元し、`--no-data` はカウンターをスキーマで定義された開始値から始めます。

ビュー、トリガー、カスタム型、関数、独立したシーケンスを持つ PostgreSQL のスキーマでは、完全なバックアップに `pg_dump` を使用してください。`void db export` は、スキーマのダンプを書き込む前に、これらのオブジェクトを報告します。

| フラグ            | 目的                                      |
| ----------------- | ----------------------------------------- |
| `--output <path>` | 標準出力の代わりにファイルへ書き込む      |
| `--no-data`       | スキーマのみ（INSERT ステートメントなし） |
| `--no-schema`     | データのみ（CREATE TABLE なし）           |
| `--table <name>`  | 単一のテーブルをエクスポートする          |
