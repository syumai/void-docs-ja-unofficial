---
outline: deep
---

<script setup>
import LegacyDocRedirect from "../.vitepress/theme/LegacyDocRedirect.vue";
import links from "../.vitepress/redirects/reference-cli.json";
</script>

<LegacyDocRedirect page="reference/cli.md" :links="links" />

# CLI リファレンス {#cli}

`void` は、インストールした `void` パッケージに含まれるローカルのバイナリです。

このページはコマンドのリファレンスとして使用してください。初めてプロジェクトをセットアップする場合は、[クイックスタート](../guide/quickstart.md)から始め、コマンドの正確な動作やフラグが必要になったときにここへ戻ってください。

## コマンドグループ {#command-groups}

| コマンドグループ                           | リファレンス                                                 |
| ------------------------------------------ | ------------------------------------------------------------ |
| `init`, `prepare`, `info`, `migrate`       | [プロジェクトのセットアップ](./cli/setup.md)                 |
| `connect`, `auth`, `account`, `cloudflare` | [接続と認証](./cli/auth.md)                                  |
| `project`                                  | [プロジェクト、チーム、ログ、ロールバック](./cli/project.md) |
| `deploy`                                   | [デプロイ](./cli/deploy.md)                                  |
| `db`                                       | [データベース](./cli/database.md)                            |
| `gen`                                      | [コード生成](./cli/generate.md)                              |
| `secret`, `env`                            | [シークレットと環境](./cli/secrets.md)                       |
| `github`, `build`                          | [GitHub とビルド](./cli/github.md)                           |
| `domain`                                   | [カスタムドメイン](./cli/domains.md)                         |
| `email`                                    | [メール](./cli/email.md)                                     |
| `platform`                                 | [プラットフォームのインストールと管理](./cli/platform.md)    |

## チートシート {#cheat-sheet}

| コマンド                          | 目的                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `void deploy`                     | ビルドして、設定済みのプラットフォームにデプロイする                                |
| `void prepare`                    | Vite を起動せずに `.void` の成果物を生成する                                        |
| `void info [--json]`              | コードを移動する前に、永続リソースの名前を確認する                                  |
| `void gen model <name> [cols...]` | Drizzle のテーブルと API ルートの雛形を生成する                                     |
| `void gen route <path>`           | API ルートを作成する                                                                |
| `void db push`                    | マイグレーションファイルなしで、スキーマを直接適用する                              |
| `void db generate`                | スキーマの変更から SQL マイグレーションを生成する                                   |
| `void db status`                  | ローカル/リモートのマイグレーション状況を表示する                                   |
| `void db reset`                   | すべてのマイグレーションを削除して再適用する                                        |
| `void db seed`                    | ローカルデータベースをリセットしてシードを投入する                                  |
| `void db execute <sql>`           | データベースに対して SQL を実行する(デプロイ済みの場合は --remote)                  |
| `void db studio`                  | Drizzle Studio を開く(デプロイ済みの外部データベースの場合は --remote)              |
| `void secret put <name=value>`    | 本番シークレットを設定する                                                          |
| `void secret list`                | 本番シークレットを一覧表示する                                                      |
| `void secret sync <file>`         | dotenv ファイルからシークレットを一括アップロードする                               |
| `void env check [--remote]`       | env.ts のスキーマを検証する                                                         |
| `void env types`                  | env.ts から .void/env.d.ts を再生成する                                             |
| `void auth login`                 | プロジェクトに保存された接続先で認証する。または接続先を選択する                    |
| `void account login`              | Void プラットフォームで認証する                                                     |
| `void cloudflare login`           | Void 経由で Cloudflare に認証する                                                   |
| `void platform install`           | 会社用の Void プラットフォームを Cloudflare にインストールする                      |
| `void connect <url>`              | CLI を Void プラットフォームに接続する。ホスト名はデフォルトで HTTPS になる         |
| `void project link`               | ディレクトリをプロジェクトにリンクする                                              |
| `void project logs`               | デプロイ済みプロジェクトのランタイムログを表示する                                  |
| `void project requests`           | リクエスト単位のトラフィック(ステータス、メソッド、所要時間)を表示する              |
| `void project rollback`           | 以前のデプロイにロールバックする                                                    |
| `void project cancel`             | 進行中のデプロイをキャンセルする                                                    |
| `void project zero-trust`         | プロジェクトの Zero Trust 保護を確認または上書きする                                |
| `void project purge-cache`        | キャッシュされたページをすべてパージする(Void プラットフォーム)                     |
| `void build logs`                 | ビルドログをストリーミング、tail、またはダウンロードする                            |
| `void email status`               | 自分の Cloudflare アカウントでのメールの準備状況を表示する(`--platform cloudflare`) |
| `void email setup`                | デプロイせずに、自分の Cloudflare アカウントでメールをセットアップする              |
| `void email usage`                | 月間の受信者への送信試行数、受信数、クォータを表示する                              |
| `void email logs`                 | 最近のメール配信状況を表示する                                                      |
| `void email destinations`         | 確認済みの受信者アドレスを一覧表示する                                              |
| `void email allow <address>`      | 受信者を追加して、確認メールを送信する                                              |
| `void email disallow <address>`   | 許可リストから受信者を削除する                                                      |
| `void email domain`               | Cloudflare ゾーン上の自分のドメインでメールを送受信する                             |
| `void init`                       | 新規または既存のプロジェクトを、コーディングエージェントを含めてセットアップする    |
| `void migrate`                    | 従来の `void.json` とルートの Wrangler JSON/JSONC を `void.config.ts` に変換する    |

## バイナリの呼び出し {#binary-invocation}

ドキュメントでは簡潔さのため `void` と表記しています。パッケージスクリプトの外では、パッケージマネージャー経由で実行してください: `npx void`、`pnpm void`、`yarn void`、`bunx void`。

あるいは、`./node_modules/.bin` を `PATH` に追加すると、アプリのルートディレクトリにいるときに `void` を直接呼び出せます。

:::warning ⚠️ ローカルへのインストールを推奨
CLI とランタイムが同じバージョンを使うよう、プロジェクトに `void` をインストールしてください。
:::

## ヘルプ {#help}

```
void --help
void help
void help <command>
void help <group> <command>
void <command> --help
void <group> <command> --help
void <group> help <command>
```

コマンドの一覧は `void --help` で、特定のコマンドについては `void deploy --help` のように確認できます。ヘルプは、サインインやプロジェクトのセットアップなしで利用できます。

## 環境変数 {#environment-variables}

| 変数           | 目的                                                                                       | デフォルト |
| -------------- | ------------------------------------------------------------------------------------------ | ---------- |
| `VOID_TOKEN`   | 保存された設定の代わりに使用する認証トークンの上書き                                       | なし       |
| `VOID_PROJECT` | deploy、secret、domain、キャッシュパージの各コマンドで使うデフォルトのプロジェクトスラッグ | なし       |
