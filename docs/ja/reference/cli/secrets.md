---
outline: deep
---

# シークレットと環境 {#secrets}

## `void secret list` {#void-secret-list}

```
void secret list [--project <name>]
```

保存済みのターゲットの本番シークレット名を一覧表示します。シークレットの値は表示されません。Cloudflare への直接のターゲットでは、`void.config.ts` に指定された Worker を照会します。`--project` はホスト型のみで使用できます。

## `void secret put` {#void-secret-put}

```
void secret put <name> [--project <name>]
void secret put <name=value> [--project <name>]
```

値の入力方法:

- インライン: `void secret put API_KEY=abcd`
- プロンプト(TTY): `void secret put API_KEY`(マスクされた入力)
- 標準入力: `echo -n "abcd" | void secret put API_KEY`

Cloudflare への直接のターゲットでは、値は暗号化された Worker シークレットとして保存されます。

## `void secret sync` {#void-secret-sync}

```
void secret sync <file> [--project <name>]
```

プロジェクトの外部に保存された dotenv ファイルから、本番のサーバー値をアップロードします。`env.ts` で宣言されたキーのみを含め、ローカル開発用の認証情報と公開用の `VITE_*` の値は含めないでください。

```sh
void secret sync /secure/path/production.env
```

ファイルに存在しない既存のリモートシークレットは維持されます。すべてのエントリは `env.ts` で宣言されたサーバーキーである必要があり、その値は検証を通過する必要があります。

## `void secret delete` {#void-secret-delete}

```
void secret delete <name> [--project <name>]
```

シークレットコマンドは、`.void/project.json` に保存されたプラットフォームを使用します。ホスト型のプロジェクトの解決順序はデプロイと同じです(`--project`、環境変数、リンクされたプロジェクト)。Cloudflare への直接のターゲットは `--project` を拒否し、固定されたルートの Cloudflare 設定を使用します。

ホスト型のプロジェクトでは、デプロイまたはロールバックの進行中にシークレットの書き込みや削除を行うと、再試行可能なコンフリクトが返されます。その操作が完了するまで待ってから再試行してください。拒否された操作では、保存されているシークレットは変更されません。

## 環境スキーマ {#env-schema}

### `void env check` {#void-env-check}

```
void env check [--remote]
```

`--remote` を付けない場合は、ローカル開発のために `.env` とシェルを検証します。`--remote` を付けた場合は、ビルドシェルのクライアント値とリモートのサーバーシークレット名を検証します。必須のキーが不足している場合や、読み取り可能な値が無効な場合は、ゼロ以外のステータスで終了します。

### `void env types` {#void-env-types}

```
void env types
```

`env.ts` から `.void/env.d.ts` を再生成します。通常は開発サーバーの起動時と HMR で自動的に行われます。新しくクローンした後や、開発以外のコンテキストで古くなった型を更新する場合に、このコマンドを使用してください。

::: tip デプロイ時の検証
`void deploy` は同じスキーマ検証を(リモートシークレットとともに)自動的に実行し、必須のキーが不足している場合はアップロードを拒否します。デプロイ時に `env check` を別途呼び出す必要はありません。
:::

完全なガイドについては[環境変数](../../guide/env-vars.md)を参照してください。
