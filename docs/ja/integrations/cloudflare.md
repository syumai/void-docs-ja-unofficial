---
outline: deep
---

# Cloudflare {#cloudflare}

Void は Cloudflare Workers 上で動作します。アプリが使用するリソースを検出し、バインディングを作成して、お使いのアカウントにデプロイします。

## バインディング {#bindings}

Void のルートとミドルウェアでは、`c.env` を使用します。

```ts
// routes/api/users.ts
import { defineHandler } from 'void';

export const GET = defineHandler(async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users').all();
  return c.json({ users: results });
});
```

TanStack Start と React Router では、`cloudflare:workers` からバインディングをインポートできます。

```ts
import { env } from 'cloudflare:workers';

const { results } = await env.DB.prepare('SELECT * FROM users').all();
```

その他のフレームワークは、それぞれ独自のバインディングへのアクセス方法を使用します。[フレームワークのセットアップガイド](./frameworks/overview.md)に従ってください。

### TypeScript のセットアップ {#typescript-setup}

TypeScript の型に `void/env` を追加します。

```json
{
  "compilerOptions": {
    "types": ["void/env"]
  }
}
```

これにより、バインディングの型と Workers ランタイムの型が提供されます。

### 利用可能なバインディング {#available-bindings}

| バインディング     | リソース        | アプリでの使用方法                    |
| ------------------ | --------------- | ------------------------------------- |
| `DB`               | D1              | `c.env.DB` または `void/db`           |
| `KV`               | KV              | `c.env.KV` または `void/kv`           |
| `STORAGE`          | R2              | `c.env.STORAGE` または `void/storage` |
| `AI`               | Workers AI      | `c.env.AI` または `void/ai`           |
| `QUEUE_*`          | Queues          | `defineQueue()` または `void/queues`  |
| ファイル名から導出 | Durable Objects | `durable-objects/` 内のモジュール     |

推論されたバインディングを有効化、無効化、または名前変更する必要がある場合は、[バインディングの設定](../reference/resource-inference.md#explicit-binding-overrides)を使用します。

## Cloudflare の設定 {#cloudflare-configuration}

Worker の設定は `void.config.ts` で定義します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  worker: {
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_compat'],
  },
  cloudflare: {
    name: 'my-app',
    services: [{ binding: 'API', service: 'my-api-worker' }],
  },
});
```

バインディングの配列、リソース ID、ルート、サービスバインディングは `cloudflare` の下に記述します。Void は設定済みのバインディングを維持し、不足している推論されたリソースを追加します。互換性に関する設定と変数では、`worker` フィールドが優先されます。[設定](../reference/config.md)を参照してください。

Void がリソース ID や Durable Object のマイグレーションを記録した場合は、`void.lock.json` をコミットしてください。生成された Cloudflare の設定は Git に含めないでください。アダプターの設定パスを必要とするフレームワークでは `.void-wrangler.jsonc` を使用します。必要なオプションは、各フレームワークのセットアップガイドに記載されています。

環境変数は `env.ts` で宣言し、ローカルの値は `.env` に記述し、本番のサーバー側の値は `void secret put` で設定します。[環境変数](../guide/env-vars.md)を参照してください。

## 自分の Cloudflare アカウントにデプロイする {#deploy-to-your-own-cloudflare-account}

`void init` の際に Cloudflare を選択してから、デプロイします。

```sh
void deploy
```

Void はブラウザーを開いてサインインし、複数のアカウントがある場合は使用するアカウントを尋ねます。ブラウザーが開かない場合は、リンクにアクセスして、ターミナルに表示されたコードを確認してください。

後からデプロイをセットアップするには、`void connect --platform cloudflare` を実行します。1 回のデプロイだけ Cloudflare を選択するには、次を実行します。

```sh
void deploy --platform cloudflare
```

セッションを管理するには、`void cloudflare login`、`status`、`logout` を使用します。

### 既存の Worker をデプロイする {#deploy-an-existing-worker}

Cloudflare に直接デプロイされている既存の Void アプリでは、ルートの `wrangler.jsonc` または `wrangler.json` を残したまま、次を実行します。

```sh
void deploy
```

デプロイ先が選択されていない場合、Void は既存の Worker をリンクするかどうかを尋ねます。承諾すると、サインインしてデプロイします。Void は設定を `void.config.ts` と `void.lock.json` に移行し、バインディング、変数、シークレット、ルート、スケジュールを保持します。両方のファイルをコミットしてください。

最初のデプロイは、既存のアプリに集中してください。リソース、認証、マイグレーション、その他のランタイム機能は、リンク後に追加します。Worker に、より新しい非アクティブなアップロードがある場合は、再試行する前に Cloudflare でそれをアクティブ化するか削除してください。

準備状況のチェックには、既存の[バージョンメタデータバインディング](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)か、[バージョン URL](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)へのアクセスのどちらかが必要です。どちらも利用できない場合、Void はアクティブ化の前に停止します。

プリレンダリングされたページには、新しい ISR キャッシュが必要になることがあります。Void は有効にするかどうかを尋ね、その選択を `routing.isr` として保存します。それらのページをリクエストごとにレンダリングする場合は、`false` を選択します。CI では、デプロイの前にこの選択を設定しておいてください。既存のキャッシュは ID を維持します。

リンク時にバインディングが不足していると報告された場合は、既存の Worker のバインディング名とリソース ID を、`cloudflare` と `inference.bindings` に指定します。再試行するときは `.void/cloudflare-link.json` を残しておいてください。

後からダッシュボードで管理されているトリガーや可視性を変更する前に、現在の `routes`、`workers_dev`、`preview_urls` を設定に追加してください。リンクする前に、`wrangler.toml` を JSON/JSONC に変換してください。名前付き環境には、別々の Void プロジェクト設定が必要です。

### デプロイ中に行われること {#what-happens-during-deploy}

Void は、不足しているリソースを作成し、アプリをビルドし、シークレットとマイグレーションを確認して、Worker をアップロードし、準備状況を検証して、トラフィックとトリガーを更新します。リソース ID は `void.lock.json` に保存されます。

ビルドや検証に失敗すると、プロビジョニング済みのリソースがアカウントに残ることがあります。最初のデプロイは一度に 1 台のマシンから実行し、他のマシンや CI からデプロイする前に、ロックファイルをコミットしてください。

メールを使用するアプリには、`void.config.ts` の `email.from` が必要です。Void はビルドの前にドメインのセットアップを確認し、変更する前に確認を求めます。[メール](../guide/email/domains.md#your-own-cloudflare-account)を参照してください。

### CI からのデプロイ {#deploying-from-ci}

必要に応じて、次の CI シークレットと変数を設定します。

| 名前                                             | 必要になる場合                                                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`                           | 必須。Workers Scripts: Edit、バインドされたリソースへの読み取りアクセス、Void がプロビジョニングする製品への編集アクセス。 |
| `CLOUDFLARE_ACCOUNT_ID`                          | トークンが複数のアカウントにアクセスできる場合。                                                                           |
| `DATABASE_URL`                                   | PostgreSQL と MySQL のプロビジョニングとマイグレーション。                                                                 |
| `CLOUDFLARE_WORKERS_SUBDOMAIN`                   | Worker にバージョンのプレビュー URL がない場合。`my-team` または `my-team.workers.dev` を使用します。                      |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access が準備状況確認用の URL を保護している場合。                                                              |

メールを使う場合は、ローカルで `void email setup --platform cloudflare` を実行して `void.lock.json` をコミットし、CI では `--require-email` を渡します。トークンには Email Routing Edit と Email Sending Edit も必要です。

#### Cloudflare Access {#cloudflare-access}

Access で保護された Worker にローカルからデプロイする場合は、有効期間の短いユーザーセッションを使用できます。

```sh
export CF_ACCESS_TOKEN="$(cloudflared access token --app=https://<worker>.<account>.workers.dev)"
```

Void は準備状況のチェックに Access の認証情報を使用しますが、保存はしません。チェックが拒否された場合、デプロイは失敗します。その場合、最初のデプロイのブートストラップが、すでに Access の背後でアクティブになっていることがあります。

### データベースとシークレット {#databases-and-secrets}

PostgreSQL と MySQL では、デプロイのプロセスに `DATABASE_URL` を渡します。Void はこれを Hyperdrive とマイグレーションに使用し、設定には書き込みません。MySQL のスキーマ変更は、エラーの前に一部だけ適用されることがあります。[失敗した MySQL マイグレーション](../guide/database/mysql.md#failed-migrations)を参照してください。

Hyperdrive の作成には、Hyperdrive の編集権限を持つ API トークンが必要です。代わりに Cloudflare で作成し、その ID を `cloudflare.hyperdrive` に追加することもできます。既存のバインディングは、ブラウザーログインでも動作します。

スキーマの変更をデプロイする前に、`void db generate` を実行してマイグレーションをコミットしてください。これには Better Auth のテーブルも含まれます。カスタムの D1 マイグレーションのディレクトリ、テーブル、パターンもサポートされています。適用するファイルが検証済みの履歴と異なる場合、デプロイは停止します。

本番のサーバー側の値は `void secret put <NAME>` で設定します。Void は既存のリモートシークレットを維持し、認証アプリで必要な場合は `BETTER_AUTH_SECRET` を作成します。ローカルの `.env` の値は決してデプロイされません。

### 準備状況とロールバック {#readiness-and-rollback}

Void は通常、アップロードしたバージョンにトラフィックを送る前に検証します。準備状況の確認やトリガーの更新に失敗した場合は、前のデプロイを復元します。Void でデプロイする前に、Cloudflare で進行中の段階的なロールアウトを完了またはキャンセルしてください。

Cloudflare がステージングできない既存の Durable Object Worker では、変更内容を確認してから次を使用します。

```sh
void deploy --platform cloudflare --atomic
```

すべてのデプロイでこれを使用するには、`deploy: { cloudflare: { mode: 'atomic' } }` を設定します。アトミックなデプロイでは、準備状況の確認より先に、新しいバージョンにトラフィックを送ります。Durable Object のクラスマイグレーションは、そのマイグレーションの境界を越えてロールバックできません。

新しい Worker では、準備状況を確認する前に、最初のアクティブなデプロイが必要になることがあります。ステージングされたアップロードが失敗した場合は、同じチェックアウトから再試行できるように、`.void/cloudflare-candidate.json` を残しておいてください。

バージョンの確認や復元は、次のコマンドで行います。

```sh
void project status
void project rollback [version]
```

Void は、コードとともに記録されたトリガーも復元します。完全なトリガーのスナップショットがないバージョンでは、現在のルートとスケジュールが維持されます。ロールバックでは、データベースのマイグレーションは元に戻りません。

#### 対象範囲と制限事項 {#scope-and-limitations}

Void は、ネイティブアプリ、静的サイト、SPA、サポートされている SSG、および TanStack Start、React Router、SvelteKit、Nuxt、Analog、Astro の Cloudflare ビルドをデプロイします。vinext のアダプターは実験的です。

- ネイティブアプリは Void のルーティングルールをサポートします。直接デプロイ先のフレームワークアプリでは、リダイレクト、リライト、フォールバック、ヘッダーを、フレームワークまたは Worker を通じて設定する必要があります。
- `--skip-build` は、既存の静的な出力に対して使用できます。Worker アプリでは、新しいビルドが必要です。
- 名前付きの Cloudflare 環境はサポートされていません。ターゲットごとに、別々の Void プロジェクト設定を使用してください。
- Sandbox には Workers Paid と Docker が必要です。プランとトークンの権限については、[Sandbox の要件](../guide/sandboxes.md#deployment)を参照してください。
- 任意の宛先へのメール送信には Workers Paid が必要です。検証済みの宛先への送信と受信メールは、Workers Free で動作します。[メール](../guide/email/domains.md#your-own-cloudflare-account)を参照してください。
- Node.js、Bun、Deno は[独自のデプロイ方法](./nodejs-bun-deno.md)を使用します。

Durable Object のマイグレーション履歴は `void.lock.json` にコミットしてください。デプロイ済みのステップを削除したり、並べ替えたりしないでください。

### デプロイしたアプリの管理 {#managing-the-deployed-app}

`void secret`、`void domain`、`void project status|list|logs|rollback`、およびリモートの `void db` コマンドは、選択したアカウントと Worker を使用します。ログはライブテールです。

カスタムドメインのコマンドは、ルートを即座に更新します。DNS や TLS の伝播中に最初のデプロイがタイムアウトした場合は、Cloudflare でドメインを確認し、`/__void/ready` に到達できるようになってから再試行してください。

`void project delete` は Cloudflare のリソースを削除しません。所有関係を確認し、Cloudflare で削除してください。

### ローカル開発 {#local-development}

ローカルの D1、KV、R2 のバインディングは、ローカルのデータを使用します。デプロイ時には、本番のリソース ID が使用されます。

Workers AI は Cloudflare に接続した後はリモートで実行されるため、開発中の呼び出しはお使いのアカウントの利用枠を消費します。開発とプレビューでのリモートバインディングには、`void cloudflare login` のセッション、または設定されている場合は `CLOUDFLARE_API_TOKEN` が使用されます。

### お使いの Cloudflare アカウントでの AI {#ai-self-host}

`ai.run()`、`ai.stream()`、`ai.image()` は、お使いの Workers AI バインディングを使用します。プロバイダーのモデルでは、AI Gateway を設定し、プロバイダーのキーを Worker シークレットとして保存します。

```ts
import { defineConfig } from 'void/config';

export default defineConfig({
  ai: { gateway: 'my-gateway' },
});
```

```sh
void secret put OPENAI_API_KEY
```

その後、`ai.provider('openai').fetch(...)` はそのゲートウェイとキーを使用します。例は [AI ガイド](../guide/ai.md)を参照してください。アカウントの使用状況は、[AI Gateway の分析](https://developers.cloudflare.com/ai-gateway/)で確認できます。

### お使いの Cloudflare アカウントでの ISR {#isr-self-host}

[再検証](../guide/edge/revalidation.md)は、グローバル、パスごと、またはページごとに設定します。Void はキャッシュを自動的にプロビジョニングします。

`revalidate()` は、共有ストレージと現在のデータセンターのエッジキャッシュを消去します。他のデータセンターは、キャッシュの有効期間が切れるまで、キャッシュされたレスポンスを返す場合があります。HTML をレンダリングしていないデータセンターでの Pages のデータリクエストは、その場で生成されます。

デプロイのたびに、キャッシュは新しい状態から始まります。
