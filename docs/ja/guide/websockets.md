---
outline: deep
---

# WebSockets {#websockets}

::: warning ⚠️ Void アプリ限定
型付き WebSocket ルートは、現在のところネイティブな Void アプリでのみ動作します。メタフレームワークモードではまだ利用できません。
:::

`.ws.ts` ルートを作成すると、サーバーと接続中のクライアントの間で型付きメッセージを送受信できます。各ルートインスタンスは、共有状態のために専用の Cloudflare Durable Object を持ちます。WebSocket ルートには Cloudflare ターゲットが必要です。

たとえば `/rooms/[id]` では、各チャットルームがそれぞれのインスタンスを持ちます。チャット、プレゼンス、共同編集ドキュメント、通知などに使用できます。

## ルートファイル {#route-files}

WebSocket ルートは、`routes/` に `.ws.ts` サフィックスを付けて作成します。

```text
routes/
  chat/[room].ws.ts
  notifications.ws.ts
```

ファイル名のルールは、通常のサーバールートと同じです。

- `index.ws.ts` は親のパスになります
- `[id].ws.ts` は `:id` になります
- `[...slug].ws.ts` はキャッチオールになります
- `(marketing)/chat.ws.ts` のようなルートグループは、URL では無視されます
- `chat.dev.ws.ts` / `chat.prod.ws.ts` は、ルートを 1 つの環境に限定します

環境サフィックスは `.ws` の**前**に付けます。`chat.ws.dev.ts` は認識されません。

## `defineRoom()` {#defineroom}

ルートによって識別される、ルームやドキュメントをクライアントが共有する場合は、`defineRoom()` を使用します。

```ts
// routes/chat/[room].ws.ts
import * as v from 'valibot';
import { defineRoom } from 'void/ws';

const ClientMessage = v.variant('type', [
  v.object({ type: v.literal('chat.message'), text: v.string() }),
]);

const ServerMessage = v.variant('type', [
  v.object({
    type: v.literal('chat.message'),
    id: v.string(),
    text: v.string(),
    userId: v.string(),
  }),
  v.object({ type: v.literal('chat.joined'), userId: v.string() }),
]);

export default defineRoom({
  messages: {
    client: ClientMessage,
    server: ServerMessage,
  },
  onBeforeConnect(ctx) {
    if (!ctx.user) {
      return new Response('Unauthorized', { status: 401 });
    }
  },
  async onConnect(ctx) {
    await ctx.room.broadcast({ type: 'chat.joined', userId: ctx.user!.id }, [ctx.connection.id]);
  },
  async onMessage(ctx, event) {
    await ctx.room.broadcast({
      type: 'chat.message',
      id: crypto.randomUUID(),
      text: event.text,
      userId: ctx.user!.id,
    });
  },
});
```

`defineRoom()` は、フックのコンテキストにルーム用のヘルパーを追加します。

- `ctx.room.broadcast(event, excludeIds?)`
- `ctx.room.getConnections()`
- `ctx.room.getConnection(id)`
- `ctx.connection.send(event)`
- `ctx.connection.close(code?, reason?)`
- `ctx.connection.setState(data)`

## `defineWebSocket()` {#definewebsocket}

共有ルームではなく、各接続を個別に処理する場合は、`defineWebSocket()` を使用します。

```ts
// routes/notifications.ws.ts
import * as v from 'valibot';
import { defineWebSocket } from 'void/ws';

export default defineWebSocket({
  messages: {
    client: v.object({ type: v.literal('notifications.ack'), id: v.string() }),
    server: v.object({ type: v.literal('notifications.item'), title: v.string() }),
  },
  onBeforeConnect(ctx) {
    if (!ctx.user) {
      return new Response('Unauthorized', { status: 401 });
    }
  },
  async onConnect(ctx) {
    await ctx.socket.send({ type: 'notifications.item', title: 'Connected' });
  },
});
```

## クライアント {#client}

クライアントでは、`void/ws` の `connect()` を使用します。

```ts
import { connect } from 'void/ws';

const socket = connect('/chat/:room', {
  params: { room: 'general' },
});

socket.on('message', (event) => {
  if (event.type === 'chat.message') {
    console.log(event.text);
  }
});

socket.send({ type: 'chat.message', text: 'hello' });
```

`connect()` は、相対 URL を現在のオリジンに対して解決し、`ws:` または `wss:` を自動的に使用します。また、ソケットが開くまでメッセージをバッファリングし、デフォルトで再接続します。

## 型付きメッセージ {#typed-messages}

クライアントとサーバーが送信するメッセージのスキーマを定義します。

- `messages.client` は、ブラウザーが送信できる内容を検証します
- `messages.server` は、サーバーが送信できる内容を検証します
- `onMessage()` は、パースおよび検証済みのクライアントイベントを受け取ります
- `ctx.room.broadcast()`、`ctx.connection.send()`、`ctx.socket.send()` は、`messages.server` から型付けされます
- `connect()` は、生成されたルートの型から、ルートパラメーター、送信するクライアントメッセージ、受信するサーバーメッセージを推論します

メッセージは JSON イベントです。生の文字列やバイナリのメッセージはサポートされていません。

## 認証 {#authentication}

Void の認証が有効な場合、すべての WebSocket フックは現在のユーザーを `ctx.user` として受け取ります。匿名の接続では `null` です。認証されていないクライアントを拒否するには、`onBeforeConnect` を使用します。

別のオリジンからの接続は、そのオリジンが認証の `trustedOrigins` に含まれていない限り、匿名として扱われます。`onBeforeConnect` で `ctx.request` から独自の Cookie を読み取る場合は、その `Origin` ヘッダーを自分で確認してください。

`ctx.user` はソケットの接続時に解決され、その接続の間は、ユーザーがその後サインアウトしたりセッションが失効したりしても変わりません。BAN やロールの変更を反映する必要がある操作では、`onMessage` で独自のレコードを再確認し、ルームでは `ctx.connection.close()`、`defineWebSocket()` では `ctx.socket.close()` で接続を閉じてください。

## フック {#hooks}

`defineRoom()` と `defineWebSocket()` はどちらも、次をサポートしています。

- `onBeforeConnect(ctx)`: `Response` を返すと、アップグレードを拒否します
- `onConnect(ctx)`: ソケットが受け入れられた後に実行されます
- `onMessage(ctx, event)`: 検証済みのクライアントイベントを受け取ります
- `onClose(ctx, details)`: `{ code, reason, wasClean }` を受け取ります
- `onRequest(ctx)`: 同じパスへの通常の HTTP リクエストを処理します

Void は WebSocket のクローズハンドシェイクを自動的に完了します。アプリケーションのクリーンアップには `onClose` を使用してください。このフックでソケットを再度閉じる必要はありません。

すべてのフックは、次を持つコンテキストを受け取ります。

- `ctx.id`: ルートインスタンスの決定的な ID
- `ctx.params`: マッチしたルートパラメーター
- `ctx.user`: 解決された認証ユーザー、または `null`
- `ctx.request`: `onBeforeConnect`、`onConnect`、`onRequest` では HTTP リクエストです。`onMessage` と `onClose` では、ヘッダー、Cookie、クエリのないプレースホルダーです。リクエストのデータを保持するには、`onConnect` で、ルームでは `ctx.connection.setState()`、`defineWebSocket()` では `ctx.socket.setState()` を使って保存します。後で `ctx.connection.state` または `ctx.socket.state` から読み取ります。
- `ctx.env`
- `ctx.storage`

ルートに `onRequest()` が定義されていない場合、WebSocket 以外のリクエストには `426 Upgrade Required` が返されます。

## 状態を維持したままルートを移動する {#move-a-route-while-keeping-its-state}

デプロイ済みのルートを移動する前に、`void info` を実行します。`routes/chat/[room].ws.ts` の場合、出力には次が含まれます。

```text
To preserve this resource when moving its code, add this to 'defineRoom':
  name: "chat-room",
```

表示された名前を、既存の定義に追加します。

```ts
export default defineRoom({
  name: 'chat-room',
  messages: { client: ClientMessage, server: ServerMessage },
  // Keep your existing hooks.
});
```

ファイルを `routes/rooms/[room].ws.ts` に移動し、クライアントが `/rooms/:room` に接続するよう更新して、通常どおりデプロイします。パラメーター名と値は同じままにしてください。ルーム `general` は、引き続き既存のストレージを使用します。Worker クラス、バインディング、マイグレーション履歴は、Cloudflare と Void プラットフォームのどちらのデプロイでも変わりません。

`defineRoom()` と `defineWebSocket()` はどちらも、省略可能な `name` を受け付けます。静的な文字列を、インラインまたはローカルの `const` で使用してください。各ルートは、それぞれ別の Worker クラスを生成する必要があります。名前を変更すると、別のリソースが選択されます。すでにルートを移動した場合、`void info` は `void.lock.json` に記録された、一致しない識別子も表示します。提案された名前を採用する前に、元のリソースを特定してください。特定できない場合は、元のソースを復元し、そこで名前を確認してください。

### ルートパラメーターの名前を変更する {#rename-a-route-parameter}

デフォルトでは、インスタンスキーにパラメーター名が含まれます。`room: 'general'` の `/chat/:room` は `room=general` を使用し、パラメーターのないルートは `default` を使用します。複数のパラメーターは、ルートの順序で連結されます。たとえば `team=acme&room=general` です。複数のパラメーターを持つルートで、値に `&` が含まれる場合、ルームを分離したまま保つために、キーにはバージョン付きのエンコーディングが使用されます。

`[room]` を `[id]` にも名前変更する場合は、古いキーを明示的に維持してください。

```ts
// routes/rooms/[id].ws.ts
export default defineRoom({
  name: 'chat-room',
  key: ({ params }) => `room=${params.id}`,
  messages: { client: ClientMessage, server: ServerMessage },
  // Keep your existing hooks.
});
```

クライアントは、`params: { id: 'general' }` で `/rooms/:id` に接続するようになります。キーは `room=general` のままなので、ストレージと `ctx.id` は変わりません。`params.id` だけを返すと、別のインスタンスが選択されます。

`key` は、どちらの WebSocket ヘルパーでも省略可能です。同じパラメーターに対して、同期的かつ一貫して文字列を返す必要があります。複数のパラメーターを移行する場合は、古いキー全体を維持してください。デプロイ後は、このコールバックを変更しないでください。

## 制約 {#constraints}

各ソケットは、1 つのルートインスタンスに接続します。ルームを切り替えるには、現在の接続を閉じて、別の接続を開きます。複数のトピックへの発行については、[ライブイベントストリーム](./live.md)を参照してください。

## デプロイ {#deployment}

WebSocket ルートは、Cloudflare と Void プラットフォームのデプロイで動作します。Void がバインディングやマイグレーションを追加した場合は、`void.lock.json` をコミットしてください。デプロイ済みのマイグレーションステップを削除したり、並べ替えたりしないでください。
