# 環境変数 {#environment-variables}

環境変数は `env.ts` で宣言し、`void/env` の `env` を通じて読み取ります。ローカルの値には `.env` を、本番のサーバー値には `void secret put` を使用します。

## スキーマを定義する {#define-the-schema}

プロジェクトルートに `env.ts` を作成します。

```ts
import { defineEnv, number, string, url } from 'void/env';

export default defineEnv({
  DATABASE_URL: url(),
  STRIPE_KEY: string(),
  PORT: number().default(3000),
  VITE_API_ORIGIN: url(),
});
```

アプリ内で型付きの `env` オブジェクトをインポートします。

```ts
import { env } from 'void/env';

const databaseUrl = env.DATABASE_URL;
```

組み込みのヘルパーは `string()`、`number()`、`boolean()`、`url()`、`email()`、`oneOf([...])`、`json<T>()` です。いずれも `.optional()` と `.default(value)` をサポートします。[Standard Schema](https://standardschema.dev/) 対応のバリデーターも直接使用できます。

デフォルト値はソースコード内の定数です。機密性のないフォールバック動作には適していますが、認証情報をデフォルト値に含めないでください。

## ローカル開発 {#local-development}

ローカルの値はルートの `.env` ファイル 1 つにまとめます。

```ini
DATABASE_URL=postgres://localhost/my-app
STRIPE_KEY=sk_test_example
VITE_API_ORIGIN=http://localhost:5173
```

引用符なしの値は、コメントの開始を表す `#` で終わります。`DATABASE_URL="postgres://user:p#ss@localhost/my-app"` のように、`#` を含む値は引用符で囲んでください。

`.env` は Git の管理対象から外してください。`.env.local`、`.env.production`、`.env.example`、Wrangler の `.dev.vars*` を含む他の dotenv ファイルはサポートされていません。

`__VOID_` で始まる名前は Void 用に予約されています。`.env` または `env.ts` がそのような名前を定義すると、Void はエラーで停止します。

ローカルのチェックはいつでも実行できます。

```sh
void env check
```

ローカルのデータベース、マイグレーション、認証、開発サーバーのツールはすべて同じ `.env` ファイルを読み込みます。シェルの値が優先されます。

## 本番のサーバー値 {#production-server-values}

クライアント用プレフィックスが付いていないスキーマのキーはすべてサーバー値です。リモートに設定します。

```sh
void secret put DATABASE_URL
void secret put STRIPE_KEY
```

一括アップロードするには、本番のサーバー値のみを含む dotenv 形式のファイルを用意します。

```sh
void secret sync production-secrets.txt
```

シークレットコマンドは、アップロード前に値を `env.ts` に照らして検証します。本番の値は暗号化され、Worker の起動時に再度検証されます。

クライアント用プレフィックスが付いたキーは、シークレットコマンドで拒否されます。ローカル開発用の認証情報と `VITE_*` の値は、本番のシークレットファイルに含めないでください。

`void deploy` は、必須のサーバーキーがすべてリモートに存在することを要求します。`.env` の値がアップロードされることはありません。

同じシークレットコマンドは、Cloudflare への直接デプロイでも使用できます。スキーマで宣言されたサーバー値は、平文の `vars` ではなく Worker のシークレットにする必要があります。

## クライアント値 {#client-values}

フレームワークが Vite の `envPrefix` をカスタマイズしている場合でも、`VITE_` で始まるキーはクライアント値です。

クライアント値はブラウザの JavaScript に埋め込まれるため、シークレットにはなりません。ビルド時のシェルから渡すか、スキーマのデフォルト値を使用してください。

```sh
VITE_API_ORIGIN=https://api.example.com void deploy
```

```ts
export default defineEnv({
  VITE_API_ORIGIN: url().default('https://api.example.com'),
});
```

ビルドでは `.env` のクライアント値は無視されます。これにより、開発者のローカルの値が知らないうちに本番の設定になることを防ぎます。

サーバーレンダリングでは、ブラウザと同じ公開ビルド値が使用されます。

## 検証とマスキング {#validation-and-redaction}

```sh
void env check           # ローカル開発用に .env とシェルを検証
void env check --remote  # ビルド時のクライアント値とリモートのサーバー名を検証
void env types           # .void/env.d.ts を再生成
```

不正な値の診断では、指定された値はデフォルトでマスクされます。`VOID_ENV_UNMASK=1` は、意図的なローカルデバッグの場合にのみ設定してください。マスキングが無効な場合、Void は通知を表示します。

## `env.ts` 内のインポート {#imports-inside-env-ts}

`env.ts` 内では、相対インポートまたはパッケージ名を使用してください。TypeScript のパスエイリアスや、Vite の変換を必要とするインポートはサポートされていません。
