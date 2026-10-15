---
outline: deep
---

# Cron ジョブ {#cron-jobs}

スケジュールされたジョブは `crons/` に置きます。各ファイルで cron 式とハンドラーを宣言すると、デプロイ時に Void がスケジュールを設定します。

## ジョブファイル {#job-files}

`crons/**/*.ts` にファイルを作成します(`.mts`、`.js`、`.mjs` もサポートされています)。

各ジョブファイルは次をエクスポートする必要があります。

- `export const cron = "<expression>"`(または式の配列)
- デフォルトのハンドラー(`defineScheduled` でラップすることを推奨します)

例:

```ts
// crons/hourly-heartbeat.ts
import { defineScheduled } from 'void';

export const cron = '0 * * * *';

export default defineScheduled(async (controller, env) => {
  await env.KV.put('jobs:last-heartbeat', controller.scheduledTime.toString());
});
```

### 複数のスケジュール {#multiple-schedules}

1 つのジョブファイルで cron 式の配列をエクスポートできます。

```ts
// crons/cleanup.ts
import { defineScheduled } from 'void';

export const cron = ['0 * * * *', '30 * * * *'];

export default defineScheduled(async (controller, env) => {
  // Runs at :00 and :30 every hour
});
```

## `defineScheduled` {#definescheduled}

ハンドラーを [`defineScheduled()`](../reference/api/handlers.md#definescheduled-handler) でラップすると、スケジュールイベント、環境、実行コンテキストに型が付きます。

同じ cron 式を共有するジョブは、1 回の呼び出しでそれぞれ 1 度ずつ実行されます。Void は一致するすべてのジョブの完了を待ち、失敗があれば報告します。`_` で始まるファイルとディレクトリは無視されます。

## ローカル開発 {#local-development}

ローカル開発では、スケジュールは自動的には発火しません。ジョブをテストするには、Void の開発用エンドポイントにリクエストを送信します。

```
POST /__void/scheduled
Content-Type: application/json
{ "cron": "<expression>", "scheduledTime": <unix_ms> }
```

`cron` には、ジョブがエクスポートしている式を指定します。呼び出しが成功すると `{ "ok": true }` が返されます。

このエンドポイントにはローカルの開発用トリガートークンが必要です。Void は開発サーバーの起動時に、現在のトークンを含んだ、貼り付けてすぐ使える curl コマンドを表示します。

```bash
curl -X POST http://localhost:5173/__void/scheduled \
  -H "Content-Type: application/json" \
  -H "x-void-dev-trigger: <printed-token>" \
  -d '{"cron":"0 * * * *","scheduledTime":'"$(date +%s000)"'}'
```

このエンドポイントは、ネイティブな Void アプリとサポートされているフレームワークで動作します。フレームワークのジョブはアダプターの開発ランタイムで実行され、そのランタイムが提供するバインディングを使用します。

## デプロイ時の動作 {#deployment-behavior}

ネイティブのスケジュールイベントには、手動の HTTP トークンは不要です。フレームワークのデプロイでは、`/__void/scheduled` への HTTP リクエストに一致する `x-void-internal` トークンが必要です。マネージドプラットフォームはそのプロキシトークンを提供するか、手動で呼び出す場合は `CRON_SECRET` を明示的に設定できます。トークンがない場合や一致しない場合は、ジョブを実行せずに `401` を返します。

Void プラットフォームでは、各プロジェクトで最大 100 種類の異なる cron 式と 1,000 件のスケジュールを使用できます(ジョブがエクスポートする各式が 1 件のスケジュールとして数えられます)。式を共有するジョブは、式の上限に対して 1 つとして数えられます。ご自身の Cloudflare アカウントにデプロイする場合は、代わりに Cloudflare の [Cron Trigger の制限](https://developers.cloudflare.com/workers/platform/limits/)が適用されます。
