---
outline: deep
---

# Server-Sent Events {#server-sent-events}

`void/sse` を使うと、ルートハンドラーからブラウザへイベントをストリーミングできます。Void はメッセージのフォーマット、キープアライブの送信、リクエスト終了時のストリームのクローズを行います。

SSE は、AI のトークン、進捗の更新、1 つのリクエストが生成するログに適しています。他のリクエストから接続中のクライアントにイベントを発行する必要がある場合は、[ライブイベントストリーム](./live.md)を参照してください。クライアントがイベントを再生できる必要がある場合は、イベントを自分で保存してください。

## サーバーストリーム {#server-streams}

ルートハンドラーから `eventStream()` を返します。

```ts
// routes/api/events.ts
import { defineHandler } from 'void';
import { eventStream } from 'void/sse';

export const GET = defineHandler((c) => {
  return eventStream(
    async (stream) => {
      await stream.comment('connected');
      await stream.send({
        event: 'ready',
        data: { now: Date.now() },
      });

      const timer = setInterval(() => {
        void stream.send({ event: 'tick', data: { now: Date.now() } }).catch(() => stream.close());
      }, 1000);

      await stream.closed;
      clearInterval(timer);
    },
    {
      signal: c.req.raw.signal,
    },
  );
});
```

`eventStream()` は、次のデフォルトヘッダーを持つ `Response` をただちに返します。

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

`start` コールバックが戻ると、ストリームはクローズされます。長時間続くストリームでは、戻る前に `stream.closed`、プロデューサーの Promise、またはアプリケーションのキャンセルシグナルを待機してください。

## イベントの送信 {#sending-events}

SSE メッセージには `send()` を、コメントには `comment()` を使用します。

```ts
await stream.send({
  id: 'evt_1',
  event: 'post.update',
  retry: 1000,
  data: { id: 'post_123', likes: 10 },
});

await stream.comment('still connected');
```

`data` には、文字列または JSON シリアライズ可能な値を指定できます。SSE はテキストのみです。

クローズ済みのストリームに書き込むと、`SseStreamClosedError` がスローされます。

すでにシリアライズ済みのペイロードをフォーマットするには、`formatSseText()` を使用します。

```ts
import { formatSseText } from 'void/sse';

const frame = formatSseText({
  event: 'post.update',
  data: JSON.stringify({ id: 'post_123', likes: 10 }),
});
```

## キープアライブ {#keepalives}

キープアライブは、デフォルトで 15 秒ごとに有効になっています。

```ts
return eventStream(start);
```

無効にしたり、間隔とコメントのテキストをカスタマイズしたりできます。

```ts
return eventStream(start, { keepAlive: false });

return eventStream(start, {
  keepAlive: { intervalMs: 5000, comment: 'ping' },
});
```

## Last Event ID {#last-event-id}

ブラウザは、`id` フィールドを持つイベントの後に再接続する際、`Last-Event-ID` を送信します。`getLastEventId()` を使うと、自分のストレージから再開できます。

```ts
import { getLastEventId } from 'void/sse';

export const GET = defineHandler((c) => {
  const lastId = getLastEventId(c.req.raw);
  return eventStream(async (stream) => {
    await stream.send({ id: nextId(lastId), data: await loadNextItem(lastId) });
  });
});
```

## クライアント {#client}

ブラウザ専用の `void/sse/client` サブパスから `connectEventStream()` を使用します。

```ts
import { connectEventStream } from 'void/sse/client';

const stream = connectEventStream<{
  ready: { now: number };
  tick: { now: number };
}>('/api/events', {
  withCredentials: true,
});

const offReady = stream.on('ready', (event) => {
  console.log(event.data.now);
});

stream.on('tick', (event) => {
  console.log(event.data.now);
});

offReady();
stream.close();
```

クライアントはネイティブの `EventSource` をラップしています。Cookie の認証情報と型付きのイベントハンドラーをサポートしますが、リクエストボディや任意のヘッダーはサポートしません。カスタムヘッダーが必要な場合は、Cookie 認証、署名付き URL、または fetch ベースのストリーミングルートを使用してください。

デフォルトでは JSON としてパースされます。JSON 以外のペイロードには、`parse: 'text'` を設定するか、カスタムパーサーを渡します。

```ts
const logs = connectEventStream('/api/logs', { parse: 'text' });

logs.on('line', (event) => {
  console.log(event.data);
});
```

## 認証 {#auth}

SSE ルートは通常のルートハンドラーなので、JSON ルートと同じ認証チェックを使用できます。

```ts
import { requireAuth } from 'void/auth';

export const GET = defineHandler(async (c) => {
  const user = await requireAuth(c);

  return eventStream(async (stream) => {
    await stream.send({ event: 'ready', data: { userId: user.id } });
    await stream.closed;
  });
});
```

共有トピックとサブスクリプションには、[ライブイベントストリーム](./live.md)を使用してください。双方向通信には、[WebSocket](./websockets.md)を使用してください。
