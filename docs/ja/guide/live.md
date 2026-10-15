---
outline: deep
---

# ライブイベントストリーム {#live-event-streams}

`void/live` を使うと、ブラウザは 1 本の SSE 接続で複数のトピックを購読できます。ルート、スケジュールジョブ、キューコンシューマーからイベントを発行すると、Void が Durable Objects を使って接続中の購読者に配信します。

たとえば、ページで投稿とそのコメントの更新を購読し、ユーザーのナビゲーションに合わせて購読を切り替えられます。AI のレスポンスのように、単一のリクエストがストリーム全体を生成する場合は、[`void/sse`](./sse.md) で十分です。

## ストリームを定義する {#define-a-stream}

サーバー専用モジュールでストリームを定義します。

```ts
// src/live.ts
import { defineLiveStream } from 'void/live';

export const live = defineLiveStream({
  id: 'app',
  allowAnonymousControl: true,
});
```

この例では、サインインしていない訪問者も受け付けます。`onSubscribe` がない場合、どの接続でも任意のトピックを購読できるため、非公開データを発行する前に[認可](#authorization)を確認してください。

Void は、[スキャン対象のファイル](../reference/resource-inference.md#scanned-directories)が `void/live` をインポートしている場合にライブストリームを有効にします。そのため、このモジュールは `src/` などスキャン対象のディレクトリに置いてください。`lib/` のようなスキャン対象外のディレクトリに置きたい場合は、そのディレクトリを [`inference.scanDirs`](../reference/resource-inference.md#custom-scan-directories) に追加し、引き続き使うデフォルトのディレクトリも併せて列挙してください。`scanDirs` はデフォルトの値を置き換えるためです。

通常のルートから公開します。

```ts
// routes/live.ts
import { defineHandler } from 'void';
import { live } from '../src/live';

export const GET = defineHandler((c) => live.connect(c));
export const POST = defineHandler((c) => live.control(c));
```

`GET` は SSE 接続を開きます。`POST` は、その接続に対する購読と購読解除の制御操作を受け付けます。

## ブラウザから購読する {#subscribe-from-the-browser}

`void/live/client` のブラウザ向けヘルパーを使います。

```ts
import { connectLiveStream } from 'void/live/client';

const stream = connectLiveStream('/live', {
  withCredentials: true,
  retryDelay: 1_000,
  onError(error) {
    console.error(error);
  },
});

const unsubscribePost = await stream.subscribe({
  id: 'post-card',
  topic: 'post:12',
  onEvent(event) {
    if (event.type === 'updated') {
      console.log(event.data);
    }
  },
});

const unsubscribeComments = await stream.subscribe({
  id: 'comments',
  topic: 'comment:2323',
});

await unsubscribeComments();
await unsubscribePost();
stream.close();
```

購読 ID は接続ごとにスコープされます。同じ ID を再利用すると、その購読が置き換えられます。再接続後、ヘルパーは有効な購読を復元し、それぞれの最新の `eventId` を `lastEventId` として送信します。

## 発行する {#publish}

Void のランタイム env を利用できるサーバー側コードであれば、どこからでも発行できます。

```ts
import { live } from '../src/live';

await live.publish(
  'post:12',
  { title: 'Updated title' },
  { type: 'updated', eventId: 'post-12-v8' },
);
```

トピック名と JSON ペイロードは自由に決められます。Void は `type` と `eventId` をイベントエンベロープに含めますが、解釈も保存もしません。ネイティブの SSE の `id` フィールドは使用しません。

アクティブなリクエストやランタイムのコンテキストの外にいる場合は、env を明示的に渡します。

```ts
await live.withEnv(env).publish('post:12', { title: 'Updated title' });
```

## 認可 {#authorization}

接続の購読を変更できるのは、その接続の所有者だけです。上の例は匿名の接続を許可しています。認証付きのストリームでは、デフォルトで現在の Void ユーザーが使われます。

所有者が決めるのは、接続の購読を誰が変更できるかであり、その接続がどのトピックを読み取れるかではありません。

認証付きのストリームでは、`connect()` と `control()` に同じ所有者キーを渡します。

```ts
return live.connect(c, { owner: `user:${session.userId}` });
return live.control(c, { owner: `user:${session.userId}` });
```

すべてのルートで同じ方法で所有者を導出したい場合は、`identifyConnection` で一度だけ定義します。

```ts
export const live = defineLiveStream({
  id: 'app',
  async identifyConnection(ctx) {
    const session = await getSession(ctx.request);
    return session ? `user:${session.userId}` : null;
  },
});
```

`identifyConnection` が `null` または `undefined` を返した場合、Void は現在の認証済みユーザーにフォールバックし、そのユーザーが文字列の `id` を持っていれば `user:${user.id}` を使います。どちらの方法でも所有者が得られず、`allowAnonymousControl` も設定されていない場合、リクエストは `403` で拒否されます。

`onSubscribe` がない場合、所有者チェックを通過した接続(サインイン済みのユーザー、または `allowAnonymousControl` が設定されている場合は任意の訪問者)は、任意のトピックを購読でき、そのトピックに発行されたすべてを受け取ります。トピック名は簡単に推測できます。各トピックを誰が読み取れるかは `onSubscribe` で決めてください。購読を拒否するには `Response` を返し、許可するには何も返しません。

```ts
export const live = defineLiveStream({
  id: 'app',
  async onSubscribe(ctx) {
    const post = /^post:(.+)$/.exec(ctx.topic);
    if (post && (await canReadPost(ctx.env, ctx.user, post[1]))) return;
    const inbox = /^user:(.+):inbox$/.exec(ctx.topic);
    if (inbox && ctx.owner === `user:${inbox[1]}`) return;
    return new Response('Forbidden', { status: 403 });
  },
});
```

## 制限 {#limits}

`void/live` は、小規模から中規模のファンアウトを想定して設計されています。デフォルトでは、ストリームには次の制限があります。

- ブラウザ接続ごとに有効な購読は `256` 件
- トピックごとに有効な購読は `256` 件
- 制御リクエストごとに購読または購読解除の操作は `100` 件
- 接続ごとにキューに入れられるイベントは `100` 件
- エンコード後のイベントエンベロープごとに `64 KiB`

アプリが使うトピック名の数にかかわらず、有効な各トピックは最大 256 件の購読をサポートします。たとえば `post:${postId}` を使うと、投稿ごとに独立した購読者数の上限が適用されます。タブを 2 つ開いているユーザーは 2 件として数えられることがあります。

ストリームごとに制限を下げることができます。

```ts
export const live = defineLiveStream({
  id: 'app',
  limits: {
    maxSubscriptionsPerTopic: 64,
  },
});
```

`maxSubscriptionsPerTopic` は `256` を超えて引き上げることはできません。より大規模なブロードキャストでは、購読者をアプリケーション側のトピックに分割するか、専用のリアルタイムシステムを使用してください。

## 配信セマンティクス {#delivery-semantics}

イベントはトピック内で順序が保たれ、最大 1 回だけ配信されます。デプロイ、ロールバック、再起動、再接続によってライブの状態が失われることがあり、クライアントがイベントを取りこぼす可能性があります。生の HTTP クライアントは、再接続後に再購読する必要があります。

リプレイが必要な場合は、イベントをアプリケーション側で保存し、`eventId` と `lastEventId` を使って再開してください。Void はイベントを保存せず、クライアントの状態も管理しません。
