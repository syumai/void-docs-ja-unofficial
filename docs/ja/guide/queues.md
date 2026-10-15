---
outline: deep
---

# キュー {#queues}

キューを使用すると、メール送信やアップロードの処理などの作業を非同期で処理できます。`queues/` にコンシューマーを定義し、アプリから型付きのメッセージを送信します。

## キューを定義する {#defining-queues}

`queues/` にコンシューマーを作成します。TypeScript と JavaScript のファイル (`.ts`、`.mts`、`.js`、`.mjs`) がサポートされています。キュー名はパスによって決まります。`queues/emails.ts` は `emails` を、`queues/order/notifications.ts` は `order-notifications` を作成します。各キューには一意の名前が必要です。

結果として得られる名前は、Cloudflare のキュー命名規則に従う必要があります。1〜63 文字で、使用できるのは英字、数字、`-` のみで、先頭と末尾は英字または数字です。

[`defineQueue<T>`](../reference/api/handlers.md#definequeue-t-handler) でラップしたデフォルトのハンドラーをエクスポートします。`T` は、コンシューマーと `send()` の呼び出しの両方に対するメッセージ本体を定義します。

```ts
// queues/emails.ts
import { defineQueue } from 'void';

interface Message {
  to: string;
  subject: string;
}

export default defineQueue<Message>(async (batch, env) => {
  for (const msg of batch.messages) {
    console.log(`Send to ${msg.body.to}: ${msg.body.subject}`);
    msg.ack(); // 処理の成功を通知する
  }
});
```

`_` で始まるファイルやディレクトリは無視されます。

## メッセージを送信する {#sending-messages}

メッセージを送信するには、`void/queues` から型付きの `queues` プロキシをインポートします。各キューは、その名前に一致するプロパティとして利用でき、コンシューマーの `defineQueue<T>` のジェネリクスによる完全な型安全性が得られます。

```ts
// routes/api/orders.ts
import { defineHandler } from 'void';
import { queues } from 'void/queues';

export const POST = defineHandler(async (c) => {
  const order = await c.req.json();
  // 完全に型付けされています。本体は queues/emails.ts の
  // Message インターフェースに一致する必要があります
  await queues.emails.send({
    to: order.email,
    subject: 'Order confirmed',
  });
  return c.json({ ok: true });
});
```

## メッセージごとの確認応答 {#per-message-acknowledgment}

バッチ内の各メッセージには、[Cloudflare Queues API](https://developers.cloudflare.com/queues/configuration/consumer-concurrency/) と同じ `ack()` と `retry()` メソッドがあります。

```ts
export default defineQueue<Message>(async (batch, env) => {
  for (const msg of batch.messages) {
    try {
      await processMessage(msg.body);
      msg.ack(); // キューから削除する
    } catch {
      msg.retry({ delaySeconds: 30 }); // 30 秒後に再配信する
    }
  }
});
```

- `msg.ack()`: メッセージを確認応答し、キューから削除します
- `msg.retry(options?)`: メッセージを再試行します。必要に応じて `{ delaySeconds }` で遅延を指定できます
- `batch.ackAll()`: バッチ内のすべてのメッセージを確認応答します
- `batch.retryAll(options?)`: バッチ内のすべてのメッセージを再試行します

各メッセージについて、最初の呼び出しが優先されます。`retry()` の後の `ack()`、またはその逆の呼び出しは何も行いません。明示的な判断がないメッセージは、ハンドラーが成功すれば確認応答され、例外をスローすれば再試行されます。

各メッセージの `timestamp` フィールドは `Date` オブジェクトです。

## コンシューマーのオプション {#consumer-options}

名前付きの定数をエクスポートして、Cloudflare がコンシューマーにバッチを配信する方法を設定します。

```ts
// queues/emails.ts
import { defineQueue } from 'void';

interface Message {
  to: string;
  subject: string;
}

export const maxBatchSize = 50;
export const maxBatchTimeout = 10; // 秒
export const maxRetries = 5;
export const retryDelay = 30; // 秒

export default defineQueue<Message>(async (batch, env) => {
  for (const msg of batch.messages) {
    console.log(`Send to ${msg.body.to}: ${msg.body.subject}`);
  }
});
```

- `maxBatchSize`: 1 バッチあたりの最大メッセージ数 (デフォルトは `10`)
- `maxBatchTimeout`: 不完全なバッチを配信するまでに待機する最大秒数 (デフォルトは `5`)
- `maxRetries`: 配信を打ち切るまでの最大再試行回数 (デフォルトは `3`)
- `retryDelay`: 再試行の間隔の秒数 (デフォルトは `0`)

Void が管理するキューには、デッドレターキューは設定されません。再試行回数を使い切ったメッセージは、デッドレターキューがない場合、Cloudflare によって完全に削除されます。[Cloudflare のデッドレターキューのガイド](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)を参照してください。

Void は、デプロイ時にキューをプロビジョニングし、そのプロデューサーとコンシューマーを接続します。

## ローカル開発 {#local-development}

ネイティブの Void アプリでは、キューバインディングを通じてメッセージを送信すると、Miniflare 内でコンシューマーが自動的に呼び出されます。ローカルでの配信には、本番と同じハンドラーが使用されます。

Void が公開する開発用エンドポイントに POST して、バッチを手動でディスパッチすることもできます。

```
POST /__void/queue
Content-Type: application/json
{ "queue": "<queue-name>", "messages": [{ "id": "1", "timestamp": <unix_ms>, "body": <any>, "attempts": 1 }] }
```

このエンドポイントには、ローカルの開発用トリガートークンが必要です。Void は開発サーバーの起動時に、現在のトークンを含む、貼り付け可能な curl コマンドを表示します。

```bash
curl -X POST http://localhost:5173/__void/queue \
  -H "Content-Type: application/json" \
  -H "x-void-dev-trigger: <printed-token>" \
  -d '{"queue":"my-queue","messages":[{"id":"1","timestamp":'"$(date +%s000)"',"body":{"hello":"world"},"attempts":1}]}'
```

サポートされているメタフレームワークでは、`/__void/queue` を使用してコンシューマーを手動でテストできます。これは、フレームワークアダプターの開発ランタイム内で、そのアダプターのバインディングとともに実行されます。このモードでは、キューバインディングへの送信によってコンシューマーが自動的に呼び出されることはありません。
