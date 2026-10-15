---
outline: deep
---

# 設定 {#config}

## 設定ファイルの形式 {#config-file-format}

アプリの設定には `void.config.ts` を使用します。入門的な説明については、[Void とは?](../guide/)から始めてください。

`void.config.ts` はプロジェクトのルートに置き、`void/config` から `defineConfig` をインポートします。すべてのフィールドは省略可能です。`void init`、`void deploy`、`void migrate` は、古い Void と Cloudflare の JSON 設定ファイルを変換でき、バックアップを `.void/config-migration/` に保存します。`void.config.ts` と、Void が作成した場合は `void.lock.json` をコミットしてください。これにはリソース ID とマイグレーション履歴が記録されます。

```ts
// void.config.ts
import { defineConfig } from 'void/config';

export default defineConfig({
  sourceDir: 'src',
  target: 'cloudflare',
  auth: { providers: ['email', 'github', 'google'] },
  routing: {
    revalidate: { '/': 60, '*': 30 },
    headers: {
      '/assets/*': ['Cache-Control: public, max-age=31536000, immutable'],
      '/*': ['X-Frame-Options: DENY', 'X-Content-Type-Options: nosniff'],
    },
  },
  inference: {
    bindings: { db: true, kv: false },
    appType: 'spa',
    outputDir: 'dist',
  },
  worker: {
    compatibility_date: '2025-12-01',
    compatibility_flags: ['nodejs_compat'],
  },
  cloudflare: {
    name: 'my-app',
    account_id: 'your-account-id',
  },
});
```

TypeScript によって、エディターでの補完とチェックが利用できます。Void は、実行時に計算された値を含め、実行時にも設定を再度検証します。

以下の短い JSON の断片は、`defineConfig({ ... })` の中に記述する個々のフィールドを示しています。

## フィールド {#fields}

### `sourceDir` {#sourcedir}

Void のソース規約を含むディレクトリです。プロジェクトルートからの相対パスで指定します。

省略した場合、Void はプロジェクトルートにある既存の規約を使用します。`pages/`、`routes/`、`middleware/`、`crons/`、`queues/`、`db/`、`auth.ts`、`env.ts` です。

設定した場合、これらの規約は、設定したディレクトリの下に移動します。

```json
{ "sourceDir": "src" }
```

この設定では、Void は `src/pages`、`src/routes`、`src/db/schema.ts`、`src/db/migrations`、`src/auth.ts`、`src/env.ts` を読み取ります。`void.config.ts`、`vite.config.ts`、`package.json`、`tsconfig.json`、`public/`、ローカル専用の `.env` といったプロジェクトのファイルは、プロジェクトルートに残ります。Void は両方の場所をスキャンしません。dev/build 中にソース規約が両方の場所に存在する場合は、有効なソースツリーが曖昧にならないよう、どちらか一方を削除してください。

### `ai` {#ai}

`ai.gateway` は、アプリが自分の Cloudflare アカウントで動作する場合に `ai.provider().fetch()` が使用する Cloudflare AI Gateway を指定します。`ai.run()`、`ai.stream()`、`ai.image()` は Workers AI バインディングを使用するため、ゲートウェイは不要です。Void プラットフォームでは、プラットフォームがゲートウェイを選択するため、この設定は無視されます。

```json
{ "ai": { "gateway": "my-gateway" } }
```

[Cloudflare アカウントでの AI](../integrations/cloudflare.md#ai-self-host) を参照してください。

### `auth` {#auth}

Better Auth の高レベルな設定です。

`auth.providers` を使って、Void がデフォルトで有効にする組み込みの認証プロバイダーを選択します。メール/パスワード認証を使う場合は `"email"` を含めます。ソーシャルプロバイダーは、`AUTH_<PROVIDER>_CLIENT_ID` と `AUTH_<PROVIDER>_CLIENT_SECRET` から認証情報を読み取ります。`cognito` には、ドメイン、リージョン、ユーザープール ID も必要です。`AUTH_COGNITO_DOMAIN`、`AUTH_COGNITO_REGION`、`AUTH_COGNITO_USER_POOL_ID` を設定するか、`auth.ts` で設定してください。

```json
{
  "auth": {
    "providers": ["email", "github", "google", "discord"]
  }
}
```

`auth` を省略していても、インポートによって認証が有効になっている場合、Void はメール/パスワードのみを有効にします。プロバイダー固有のオプション、スコープ、プラグイン、カスタムの OAuth フローには、ルートの `auth.ts` で `defineAuth(...)` を使用します。

`auth.providers` でサポートされる値:

- `email`
- `apple`
- `atlassian`
- `cognito`
- `discord`
- `dropbox`
- `facebook`
- `figma`
- `github`
- `gitlab`
- `google`
- `huggingface`
- `kakao`
- `kick`
- `line`
- `linear`
- `linkedin`
- `microsoft`
- `naver`
- `notion`
- `paybin`
- `paypal`
- `polar`
- `railway`
- `reddit`
- `roblox`
- `salesforce`
- `slack`
- `spotify`
- `tiktok`
- `twitch`
- `twitter`
- `vercel`
- `vk`
- `zoom`

### `database` {#database}

データベースのバックエンドです。D1/SQLite(デフォルト)の場合は省略します。Hyperdrive 経由の外部データベースを使う場合は、`"pg"` または `"mysql"` を設定します。

```json
{
  "database": "pg"
}
```

| 値        | 説明                                                       |
| --------- | ---------------------------------------------------------- |
| _(省略)_  | D1 (SQLite)。Void が完全に管理し、追加の設定は不要         |
| `"pg"`    | Hyperdrive 経由の PostgreSQL。データベースは自分で用意する |
| `"mysql"` | Hyperdrive 経由の MySQL。データベースは自分で用意する      |

外部データベースを使用する場合:

- ローカル開発用に、`.env` に `DATABASE_URL` を追加します
- スキーマのヘルパーは `void/schema-pg` または `void/schema-mysql` からインポートします
- `void/db` は、本番では Hyperdrive 経由で、ローカルでは直接接続します
- `void gen model` は、そのダイアレクトに適したテーブルとカラムのビルダーを生成します

### `email` {#email}

[メール連携](../guide/email.md)の設定です。

```json
{
  "email": {
    "from": "Acme <noreply@mail.acme.com>"
  }
}
```

| フィールド | 型       | 説明                                                                                                               |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `from`     | `string` | `sendEmail()` のデフォルトの送信元。1 つのアドレスで、表示名を付けることもできます(`Acme <noreply@mail.acme.com>`) |

開発中は、`email.from` がローカル受信箱でのデフォルトの送信元になります。Void プラットフォームでは、プロジェクトの共有送信元または登録済みのドメインを使用します。

Cloudflare への直接デプロイでは、このアドレスがメールドメインとデフォルトの送信元を決定します。自分のアカウント内のゾーンまたはサブドメインを使用してください。既存のメールプロバイダーの MX レコードは保持されます。`email.from` がない場合、Void は自動セットアップをスキップし、自分で記述した `cloudflare.send_email` バインディングと `cloudflare.addresses` を保持します。それらの準備状況は自分で確認してください。自動セットアップを検証できない場合、`--require-email` を指定していればデプロイは引き続き拒否されます。[メールのセットアップ](../guide/email/domains.md#your-own-cloudflare-account)を参照してください。

### `head` {#head}

Pages モードにおける、サイト全体の HTML `<head>` のデフォルトです。タイトルテンプレート、デフォルトの meta タグ、リンク、スクリプト、HTML/body の属性を設定します。ページごとの `head()` のエクスポートとミドルウェアのデフォルトは、これらの上にマージされ、優先順位は明確です: **ページ > ミドルウェア > 設定**。

| フィールド      | 型                       | 説明                                                                               |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `title`         | `string`                 | デフォルトのページタイトル(ページの `head()` で上書きされます)                     |
| `titleTemplate` | `string`                 | 解決されたタイトルをラップします。`%s` はページタイトルに置き換えられます。        |
| `meta`          | `Array<object>`          | デフォルトの `<meta>` タグ(`name`/`property` で重複排除され、ページが優先されます) |
| `link`          | `Array<object>`          | デフォルトの `<link>` タグ(連結されます: 設定、ミドルウェア、ページの順)           |
| `script`        | `Array<object>`          | デフォルトの `<script>` タグ(連結されます: 設定、ミドルウェア、ページの順)         |
| `htmlAttrs`     | `Record<string, string>` | `<html>` の属性(浅いマージで、ページが優先されます)                                |
| `bodyAttrs`     | `Record<string, string>` | `<body>` の属性(浅いマージで、ページが優先されます)                                |

```json
{
  "head": {
    "titleTemplate": "%s | My Site",
    "htmlAttrs": { "lang": "en" },
    "meta": [
      { "charset": "utf-8" },
      { "name": "viewport", "content": "width=device-width, initial-scale=1" }
    ],
    "link": [{ "rel": "icon", "href": "/favicon.svg" }]
  }
}
```

マージの詳細な動作、`HeadDescriptor` の形、ページごとの使い方については、[Head 管理](../guide/pages-routing/head)を参照してください。

### `output` {#output}

出力モードです。ページのデフォルトのレンダリング戦略を制御します。

| 値                     | デフォルトのプリレンダリング | ページごとの上書き               | プリレンダリングのタイミング       |
| ---------------------- | ---------------------------- | -------------------------------- | ---------------------------------- |
| `"server"`(デフォルト) | `false`                      | `export const prerender = true`  | デプロイ時(プラットフォームの ISR) |
| `"static"`             | `true`                       | `export const prerender = false` | ビルド時、またはデプロイのビルド後 |

`"static"` に設定すると、ページは `dist/client/` に HTML としてプリレンダリングされます。個々のページは `export const prerender = false` でオプトアウトできます。動的なページをプリレンダリングするには、`getPrerenderPaths()` が必要です。

省略した場合、または `"server"` に設定した場合、ページはリクエスト時にサーバーでレンダリングされます。個々のページは、`export const prerender = true` でデプロイ時のプリレンダリングにオプトインしたり、`export const ssr = false` でサーバーレンダリングされるコンポーネントの HTML をオプトアウトしたりできます。

```json
{ "output": "static" }
```

### `remote` {#remote}

ローカル開発中に、デプロイ済みの Void プロジェクトの D1、KV、R2 リソースを使用します。書き込みは実際のデータに影響します。[リモート開発](../guide/remote-dev.md)を参照してください。

```json
{ "remote": true }
```

**要件:**

- ログインしている必要があります(`void account login`)
- リンク済みのプロジェクトが必要です(`void project link`)
- D1(`DB`)、KV(`KV`)、R2(`STORAGE`)のバインディングにのみ影響します

`void.config.ts` を変更せずに、環境変数 `VOID_REMOTE=1` でリモートモードを有効にすることもできます。

```bash
VOID_REMOTE=1 pnpm dev
```

### `sandbox` {#sandbox}

Cloudflare Sandbox を有効にして設定します。`void/sandbox` からインポートすると、自動的に有効になります。

```json
{
  "sandbox": {
    "image": "./Dockerfile.sandbox",
    "platformImage": "registry.cloudflare.com/<account-id>/sandbox@sha256:<digest>",
    "instanceType": "standard-1"
  }
}
```

| フィールド          | 型       | デフォルト                 |
| ------------------- | -------- | -------------------------- |
| `binding`           | `string` | `SANDBOX`                  |
| `className`         | `string` | `SandboxV1`                |
| `containerName`     | `string` | `void-sandbox-v1`          |
| `image`             | `string` | 同梱の Node.js Dockerfile  |
| `imageBuildContext` | `string` | `image` のディレクトリ     |
| `platformImage`     | `string` | `cloudflare/debian-trixie` |
| `instanceType`      | `string` | `lite`                     |

サポートされるサイズは、`lite` と `standard-1` から `standard-4` です。ネイティブなデプロイでは、Docker で Dockerfile をビルドします。レジストリのイメージは、Cloudflare のマネージドレジストリからの、ダイジェストで固定された参照である必要があります。カスタムイメージには、対応する Sandbox SDK のヘルパーを含める必要があります。ローカルの Dockerfile を使う場合は、マネージドなプラットフォームにデプロイする際に `platformImage` を指定してください。イメージの設定とランタイムの例については、[Sandboxes](../guide/sandboxes.md)を参照してください。

Sandbox には、[Workers Paid](https://dash.cloudflare.com/?to=/:account/workers/plans) と Containers へのアクセスが必要です。マネージドなランタイムトークンには、Account / Containers: Edit と Account / Cloudchamber: Edit が必要です。[Sandbox のデプロイ](../guide/sandboxes.md#deployment)を参照してください。

### `target` {#target}

デプロイ先のランタイムです。デフォルトは `"cloudflare"` です。

| 値             | 説明                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `"cloudflare"` | Cloudflare Workers(デフォルト)。プラットフォームの全機能が利用できます |
| `"node"`       | Node.js。`@hono/node-server` を使用します                              |
| `"bun"`        | Bun。`Bun.serve()` を使用します                                        |
| `"deno"`       | Deno。`Deno.serve()` を使用します                                      |

Cloudflare 以外のターゲットでは、CF バインディングのインポート(`void/db`、`void/kv`、`void/auth`、`void/storage`、`void/ai`、`void/sandbox`、`void/env`)が無効になります。Cloudflare 以外のターゲットでこれらのいずれかをインポートすると、コンパイル時エラーになります。ファイルベースのルーティング、ミドルウェア、`void/client` は、通常どおり動作します。

Void が管理する WebSocket のルートファイル(`*.ws.ts`)は、Durable Objects にコンパイルされるため、Cloudflare 専用です。`void/ws` のサブパス自体は Cloudflare 以外のターゲットでもブロックされないため、ブラウザのような `WebSocket` ランタイムが利用できる環境では、クライアント側の `connect()` コードを引き続きバンドルできます。

```json
{ "target": "node" }
```

### `worker` {#worker}

厳選された Cloudflare Workers の設定です。`void init` は、ここに `compatibility_date` を固定します。`d1_databases`、`kv_namespaces`、`r2_buckets` などのバインディング配列は [`cloudflare`](#cloudflare) に記述します。そこでは、デプロイ中に Void がカスタム設定と解決済みの ID を保持します。

| フィールド            | 型         | 説明                              |
| --------------------- | ---------- | --------------------------------- |
| `compatibility_date`  | `string`   | Cloudflare Workers の互換性日付   |
| `compatibility_flags` | `string[]` | Cloudflare Workers の互換性フラグ |
| `vars`                | `object`   | プレーンテキストの Worker 変数    |
| `limits`              | `object`   | Worker のリソース制限の上書き     |

```json
{
  "worker": {
    "compatibility_date": "2025-12-01",
    "compatibility_flags": ["nodejs_compat"],
    "vars": {
      "PUBLIC_API_BASE": "https://api.example.com"
    }
  }
}
```

`worker.vars` の値は文字列である必要があります。ルートの `.env` の値は、ローカル開発中にのみ、これらを上書きします。本番ビルドは `.env` を読み込まず、`env.ts` でサーバーキーとして宣言されている `worker.vars` の名前があれば拒否します。本番のサーバー値には `void secret put` を使用してください。

マネージドなデプロイには、`worker.vars` がプレーンテキストのバインディングとして含まれます。同じ名前のリモートシークレットがある場合は、そちらが優先されます。代わりに設定した変数を使うには、そのリモートシークレットを削除して、再度デプロイしてください。シークレットの削除は、実行中の Worker に即座に反映されるため、この移行はメンテナンス時間帯に計画してください。

`worker.limits.cpu_ms` は、リクエストごとの CPU 時間の上限を、1 から 300000 ms の範囲で設定します。Void プラットフォームでは、上限がアカウントのプランを超えるとデプロイが失敗します。再試行する前に、`void.config.ts` で値を下げてください。一方、ロールバックでは、古い上限が現在のプランの上限に制限されます。直接デプロイでは、[Cloudflare が値を適用します](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)。Workers Free ではリクエストあたり最大 10 ms、Workers Paid では最大 300000 ms です。

```json
{
  "worker": {
    "limits": {
      "cpu_ms": 30000
    }
  }
}
```

### `cloudflare` {#cloudflare}

Cloudflare への直接のビルドとデプロイに使用する、完全な Cloudflare Worker の設定です。カスタムのバインディング、`name`、`account_id`、ルート、サービス、vars、マイグレーションなど、その他の Cloudflare のフィールドはここに記述します。Void は、これらのフィールドを、生成される Cloudflare のビルド設定にそのまま渡します。ここで編集した設定は、Void が以前に `void.lock.json` に記録した値よりも優先されます。

```ts
// defineConfig({ ... }) の内側
cloudflare: {
  name: 'my-app',
  d1_databases: [{ binding: 'ANALYTICS', database_name: 'analytics', database_id: '...' }],
  vars: { PUBLIC_API_BASE: 'https://api.example.com' },
},
```

Void は、ツール用に生成した Cloudflare 設定を書き出し、プロビジョニングされたリソースの ID と、追記専用のマイグレーション履歴を `void.lock.json` に記録します。ロックファイルが変更された場合はコミットしてください。ルートの `wrangler.jsonc` と `wrangler.json` は、`void init` または `void deploy` 時にマイグレーションされ、Void はバックアップのコピーを `.void/config-migration/` に保持します。

Void が以前に生成した値を削除したい場合は、`void.lock.json` の `resolved` オブジェクトから削除してください。Void は、次のコマンドで、生成された Cloudflare のファイルを更新します。継続的に使うカスタム設定は、`void.config.ts` の `cloudflare` に記述してください。

### `deploy.cloudflare.mode` {#deploy-cloudflare-mode}

Cloudflare への直接デプロイは、デフォルトで `staged` を使用します。Void は、新しい Worker に本番トラフィックを送る前に、その Worker を確認します。Cloudflare が既存の Durable Object の Worker をステージングできない場合は、保留中の Worker とデータベースの変更を確認したうえで、`atomic` を選択してください。

```ts
// defineConfig({ ... }) の内側
deploy: { cloudflare: { mode: 'atomic' } },
```

この選択は、以降の `void deploy` の実行に適用されます。アトミックなデプロイでは、Void が準備状況を確認する前に、新しい Worker にトラフィックが送られます。Durable Object のクラスのマイグレーションは、そのマイグレーションの境界をまたいでロールバックすることはできません。1 回のデプロイだけに適用したい場合は、代わりに `--atomic` を使用してください。`deploy` は Void の設定であり、Cloudflare の Worker 設定には渡されません。

### `routing` {#routing}

ヘッダー、リダイレクト、リライト、キャッシュに関する、ルーティングとエッジの設定です。

#### `routing.headers` {#routing-headers}

カスタムのレスポンスヘッダーです。キーは URL パターン、値は `"Name: value"` 形式の文字列の配列です。詳細は[カスタムヘッダー](../guide/edge/headers)を参照してください。

```json
{
  "routing": {
    "headers": {
      "/assets/*": ["Cache-Control: public, max-age=31536000, immutable"],
      "/*": ["X-Frame-Options: DENY", "X-Content-Type-Options: nosniff"]
    }
  }
}
```

#### `routing.redirects` {#routing-redirects}

URL のリダイレクトです。キーは元の URL パターン、値は宛先の文字列(デフォルトは 302)、または `to` と、省略可能な `status`(`301`、`302`、`303`、`307`、`308`)を持つオブジェクトです。詳細は[リダイレクト](../guide/edge/redirects)を参照してください。

```json
{
  "routing": {
    "redirects": {
      "/old": "/new",
      "/blog/*": { "to": "/posts/:splat", "status": 301 }
    }
  }
}
```

#### `routing.rewrites` {#routing-rewrites}

URL のリライトです。キーは元の URL パターン、値は宛先のパスです。ブラウザの URL を変更せずに、宛先のコンテンツを配信します。詳細は[リライト](../guide/edge/rewrites)を参照してください。

```json
{
  "routing": {
    "rewrites": {
      "/": "/en",
      "/docs/*": "/en/docs/:splat"
    }
  }
}
```

宛先には `RewriteDestination` の形を使います。これは、型付きのルートパターンに `string` を加えたもので、既知のルートはオートコンプリートされ、動的なパスも引き続き受け付けられます。[ミドルウェアでのプログラムによるリライト](../guide/edge/rewrites#programmatic-rewrites-in-middleware)を参照してください。

#### `routing.fallbacks` {#routing-fallbacks}

フォールバックのリライトです。`rewrites` と同じ形ですが、ルールが適用されるのは、静的アセットにもルートにも一致しなかった場合(つまり、そのままでは 404 になるリクエスト)のみです。実際のルートより優先させたくない、SPA シェルやデフォルトロケールのキャッチオールに便利です。詳細は[リライト → フォールバック](../guide/edge/rewrites#fallbacks)を参照してください。

```json
{
  "routing": {
    "fallbacks": {
      "/*": "/index.html"
    }
  }
}
```

#### `routing.isr` {#routing-isr}

Void の ISR キャッシュのブール値のスイッチです。省略した場合、または `true` の場合、Void は revalidate とプリレンダリングの設定からキャッシュを推論します。`false` に設定すると、ページごとのエクスポートも含め、アプリ全体で ISR とエッジのプリレンダリングが無効になります。

```json
{
  "routing": {
    "isr": false
  }
}
```

`output: "static"` によるビルド時の HTML 生成は影響を受けません。設定済みのキャッシュポリシーを再び有効にするには、`isr` を `true` に設定します。

#### `routing.revalidate` {#routing-revalidate}

ISR の再検証 TTL(秒)を、グローバルまたはパスごとに指定します。詳細は[再検証](../guide/edge/revalidation.md)を参照してください。

```json
{
  "routing": {
    "revalidate": {
      "/": 60,
      "/docs/*": 31536000,
      "*": 30
    }
  }
}
```

#### `routing.revalidateQueryAllowlist` {#routing-revalidatequeryallowlist}

ISR のキャッシュキーに残すクエリパラメーターです。キーは元の URL パターン、値は残すクエリパラメーター名です。列挙したパラメーターは、一致するパスへのすべてのリクエストでキャッシュキーの一部になり、それ以外のクエリパラメーターはキーから除外されます。省略した場合、キャッシュの無制限な拡散を避けるため、ISR のキャッシュキーはすべての受信クエリパラメーターを破棄します。

```json
{
  "routing": {
    "revalidateQueryAllowlist": {
      "/search": ["q"],
      "/products/*": ["variant", "currency"],
      "*": []
    }
  }
}
```

#### `routing.prerender` {#routing-prerender}

デプロイ時に静的 HTML としてプリレンダリングするパスです。各パスは `/` で始まる必要があります。詳細は[エッジでのプリレンダリング](../guide/edge/prerendering.md)を参照してください。

```json
{
  "routing": {
    "prerender": ["/", "/about", "/pricing"]
  }
}
```

#### `routing.notFound` {#routing-notfound}

アセットにも Worker のルートにも一致しなかったリクエストに、アセットレイヤーがどのように応答するかを上書きします。`"single-page-application"`、`"404-page"`、`"none"` のいずれかです。省略した場合、Void が推論します。[静的アセット](../guide/edge/static-assets.md#navigation-and-middleware)を参照してください。

```json
{
  "routing": {
    "notFound": "404-page"
  }
}
```

`404.html` を持つ生成された静的サイトには `"404-page"` を、クライアントルーターには `"single-page-application"` を、Worker 自身の 404 を維持するには `"none"` を使用します。API とミドルウェアのルーティングは変わりません。

SvelteKit、Nuxt、Analog、Astro は独自のエラーページを使用するため、この設定は無視されます。TanStack Start、React Router、vinext で Cloudflare に直接デプロイする場合は、フレームワークの Cloudflare 設定で、完全なアセットポリシーを設定してください。[静的アセット](../guide/edge/static-assets.md#navigation-and-middleware)を参照してください。

### `inference` {#inference}

ビルド時の推論に関する設定です。Void がアプリの種類、バインディング、ビルドプロセスをどのように検出するかが含まれます。

#### `inference.bindings` {#inference-bindings}

推論される Cloudflare バインディングを明示的に制御します。省略した場合、ソースファイルをスキャンしてバインディングの使用を検出することで、バインディングが[自動的に推論](./resource-inference.md)されます。明示的な値は、指定したバインディングを上書きします。省略したバインディングは、引き続き推論されます。認証とチェックイン済みのマイグレーションは、`db` が `false` であっても、引き続きデータベースを必要とします。

各バインディングは、`true`(デフォルトの名前を使用)、`false`(無効化)、または文字列(カスタムのバインディング名)を受け付けます。

```json
{ "inference": { "bindings": { "db": true, "kv": false, "storage": "MY_BUCKET", "ai": "MY_AI" } } }
```

| キー      | デフォルトのバインディング | 型            | カスタム名               |
| --------- | -------------------------- | ------------- | ------------------------ |
| `db`      | `DB`                       | `D1Database`  | `"db": "MY_DB"`          |
| `kv`      | `KV`                       | `KVNamespace` | `"kv": "MY_KV"`          |
| `storage` | `STORAGE`                  | `R2Bucket`    | `"storage": "MY_BUCKET"` |
| `ai`      | `AI`                       | `Ai`          | `"ai": "MY_AI"`          |
| `email`   | —                          | —             | ブール値のみ             |

カスタムのバインディング名は、開発時とデプロイ時の `void/db`、`void/kv`、`void/storage` で動作します。Cloudflare への直接デプロイでは、カスタムの AI の名前も `void/ai` で動作します。マネージドな Workers AI は、プラットフォームのプロキシを使用します。

`email` は、ブール値の機能スイッチです。`true` に設定すると、`void/email` からのインポートなしで[メール](../guide/email.md)と `void dev` の受信箱が有効になり、`false` に設定すると無効になります。Void プラットフォームでは、送信にプラットフォームのプロキシを使用します。Cloudflare への直接のセットアップでは、`SEND_EMAIL` バインディングが `void.lock.json` に記録されます。[`email.from`](#email) を参照してください。

#### `inference.build` {#inference-build}

ビルドコマンドを上書きします。独自の CLI を持つフレームワーク(Nuxt、Astro)や、カスタムのビルドスクリプトを持つ静的アプリに便利です。省略した場合、CLI は現在のアプリの種類に対して検出したデフォルトのビルドコマンドを使用します。これは、`"void"`(デフォルトは `vite build`)を含むすべてのアプリの種類に適用されます。

```json
{ "inference": { "build": "nuxt build --preset cloudflare-module" } }
```

コマンドは、プロジェクトルートからシェル経由で実行され、プロジェクト自身の `node_modules/.bin` が `PATH` に含まれるため、バイナリ名のみの指定や `&&` による連結も機能します。

```json
{ "inference": { "build": "vitepress build && vite build" } }
```

静的サイトジェネレーターと Void のバックエンドを一緒に提供する方法がこの連結です。[静的サイトにバックエンドを追加する](../guide/app-types.md#adding-a-backend-to-a-static-site)を参照してください。

#### `inference.scanDirs` {#inference-scandirs}

[バインディングの推論](./resource-inference.md)のためにスキャンするディレクトリを上書きします。パスはプロジェクトルートからの相対パスです。現在のモードのデフォルトのディレクトリを置き換えます。

```json
{ "inference": { "scanDirs": ["src", "lib", "workers"] } }
```

#### `inference.appType` {#inference-apptype}

アプリの種類です。省略した場合、最初のデプロイ時に自動検出されます。[サポートされるアプリの種類](../guide/app-types.md)を参照してください。

- `"void"`: Worker とアセット。API ルート、SSR、ジョブを含みます
- `"framework"`: TanStack Start、React Router、SvelteKit、Nuxt、Astro などのメタフレームワークのアプリ
- `"static"`: VitePress、プレーンな HTML、外部ツールによる、完全にレンダリングされた HTML ファイル。一致しないパスには `404.html` または 404 レスポンスが返されます。
- `"spa"`: SPA フォールバック付きの静的出力。ファイルではないパスは、クライアントサイドルーティングがそのまま機能するよう、`200` ステータスで `index.html` にフォールバックします。

#### `inference.outputDir` {#inference-outputdir}

静的デプロイの出力ディレクトリです。プロジェクトルートからの相対パスで指定します。`inference.appType` が `"spa"` または `"static"` の場合にのみ関係します。デフォルトは `"dist"` です。
